from django.db import transaction, OperationalError
import time
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from apps.tickets.models import Ticket, TicketStatus, TicketAssignmentHistory, TicketStatusHistory
from apps.accounts.models import UserRole, ApprovalStatus
from apps.audit.services import log_activity

def claim_next_fifo_ticket(developer_user, client_ip=None, user_agent=None) -> Ticket:
    """
    Atomically claims the single oldest eligible ticket in the FIFO queue for the requesting developer.
    Enforces developer approval, active workload quotas, and concurrency-safe row-level locking.
    """
    # 1. Enforce developer account status
    if not developer_user.is_authenticated:
        raise ValidationError("Authentication required to claim tickets.")

    if not developer_user.is_approved_developer:
        raise ValidationError("Only approved active developers can claim tickets. Account is pending or suspended.")

    # 2. Enforce active workload quota
    profile = getattr(developer_user, 'developer_profile', None)
    max_quota = getattr(profile, 'max_active_tickets', 3) if profile else 3

    active_statuses = [
        TicketStatus.ASSIGNED,
        TicketStatus.WORK_IN_PROGRESS,
        TicketStatus.INTERNAL_REVIEW
    ]

    current_active_count = Ticket.objects.filter(
        assigned_developer=developer_user,
        status__in=active_statuses
    ).count()

    if current_active_count >= max_quota:
        raise ValidationError(
            f"Active workload quota reached ({current_active_count}/{max_quota}). "
            "Please progress or complete your current assigned tickets before claiming new work."
        )

    # 3. Concurrency-safe atomic transaction with retry for lock contention
    max_retries = 8
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                ticket_qs = (
                    Ticket.objects.select_for_update(skip_locked=True)
                    .filter(
                        status=TicketStatus.NEW_OPEN,
                        assigned_developer__isnull=True,
                        is_on_hold=False
                    )
                    .order_by('eligible_at')
                )

                ticket = ticket_qs.first()

                if not ticket:
                    raise NotFound("No eligible unassigned tickets currently available in the queue.")

                previous_status = ticket.status

                # Update ticket state
                ticket.assigned_developer = developer_user
                ticket.status = TicketStatus.ASSIGNED
                ticket.assigned_at = timezone.now()
                ticket.save(update_fields=['assigned_developer', 'status', 'assigned_at', 'updated_at'])

                # Record assignment history
                TicketAssignmentHistory.objects.create(
                    ticket=ticket,
                    developer=developer_user,
                    assigned_by=developer_user,
                    assignment_type='FIFO_SELF_CLAIM',
                    notes=f"Self-claimed via FIFO queue. Active load at claim: {current_active_count + 1}/{max_quota}."
                )

                # Record status transition history
                TicketStatusHistory.objects.create(
                    ticket=ticket,
                    previous_status=previous_status,
                    new_status=TicketStatus.ASSIGNED,
                    changed_by=developer_user,
                    transition_reason="Self-claimed from FIFO queue."
                )

                # Central immutable activity log
                log_activity(
                    actor=developer_user,
                    actor_role=developer_user.role,
                    action='TICKET_CLAIMED_FIFO',
                    module='ASSIGNMENTS',
                    record_id=str(ticket.id),
                    previous_value={'status': previous_status, 'assigned_developer': None},
                    new_value={'status': ticket.status, 'assigned_developer': str(developer_user.id)},
                    ip_address=client_ip,
                    user_agent=user_agent,
                    status='SUCCESS',
                    remarks=f"Ticket {ticket.ticket_number} claimed via FIFO."
                )

                return ticket
        except OperationalError:
            if attempt < max_retries - 1:
                time.sleep(0.05 * (2 ** attempt))
                continue
            raise NotFound("No eligible unassigned tickets currently available in the queue.")

def admin_assign_ticket(ticket: Ticket, developer_user, admin_user, reason: str = None, client_ip=None, user_agent=None) -> Ticket:
    """
    Administrative manual assignment or reassignment of any ticket.
    """
    if not admin_user.is_admin_role:
        raise ValidationError("Administrative permissions required to manually assign tickets.")

    with transaction.atomic():
        previous_status = ticket.status
        previous_dev = ticket.assigned_developer

        assignment_type = 'ADMIN_REASSIGN' if previous_dev else 'ADMIN_MANUAL_ASSIGN'

        ticket.assigned_developer = developer_user
        ticket.status = TicketStatus.ASSIGNED
        ticket.assigned_at = timezone.now()
        ticket.save(update_fields=['assigned_developer', 'status', 'assigned_at', 'updated_at'])

        TicketAssignmentHistory.objects.create(
            ticket=ticket,
            developer=developer_user,
            assigned_by=admin_user,
            assignment_type=assignment_type,
            notes=reason or f"Manually assigned by Administrator {admin_user.full_name}."
        )

        TicketStatusHistory.objects.create(
            ticket=ticket,
            previous_status=previous_status,
            new_status=TicketStatus.ASSIGNED,
            changed_by=admin_user,
            transition_reason=reason or "Manual Admin assignment."
        )

        log_activity(
            actor=admin_user,
            actor_role=admin_user.role,
            action='TICKET_ASSIGNED_MANUAL',
            module='ASSIGNMENTS',
            record_id=str(ticket.id),
            previous_value={'assigned_developer': str(previous_dev.id) if previous_dev else None, 'status': previous_status},
            new_value={'assigned_developer': str(developer_user.id), 'status': ticket.status},
            ip_address=client_ip,
            user_agent=user_agent,
            status='SUCCESS',
            remarks=reason or "Admin manual assignment override."
        )

        return ticket

def admin_release_ticket(ticket: Ticket, admin_user, reason: str = None, client_ip=None, user_agent=None) -> Ticket:
    """
    Releases a claimed ticket back to the public FIFO queue.
    Preserves original `eligible_at` timestamp so the ticket maintains its position.
    """
    if not admin_user.is_admin_role:
        raise ValidationError("Administrative permissions required.")

    with transaction.atomic():
        previous_dev = ticket.assigned_developer
        previous_status = ticket.status

        ticket.assigned_developer = None
        ticket.status = TicketStatus.NEW_OPEN
        ticket.assigned_at = None
        ticket.save(update_fields=['assigned_developer', 'status', 'assigned_at', 'updated_at'])

        TicketAssignmentHistory.objects.create(
            ticket=ticket,
            developer=previous_dev or admin_user,
            assigned_by=admin_user,
            assignment_type='RELEASED_TO_QUEUE',
            notes=reason or "Released back to queue by Admin."
        )

        TicketStatusHistory.objects.create(
            ticket=ticket,
            previous_status=previous_status,
            new_status=TicketStatus.NEW_OPEN,
            changed_by=admin_user,
            transition_reason=reason or "Released back to queue by Admin."
        )

        log_activity(
            actor=admin_user,
            actor_role=admin_user.role,
            action='TICKET_RELEASED_TO_QUEUE',
            module='ASSIGNMENTS',
            record_id=str(ticket.id),
            previous_value={'assigned_developer': str(previous_dev.id) if previous_dev else None, 'status': previous_status},
            new_value={'assigned_developer': None, 'status': TicketStatus.NEW_OPEN},
            ip_address=client_ip,
            user_agent=user_agent,
            status='SUCCESS',
            remarks=reason
        )

        return ticket

