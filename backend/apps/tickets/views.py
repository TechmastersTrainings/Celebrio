from django.db import transaction
from django.utils import timezone
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Ticket, TicketStatus, TicketStatusHistory, TicketInternalNote
from .serializers import TicketDetailSerializer, TicketInternalNoteSerializer
from apps.accounts.permissions import IsAdminUserRole, IsApprovedDeveloper
from apps.audit.services import log_activity

class TicketDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.select_related(
                'order', 'order__occasion', 'order__package', 'assigned_developer'
            ).prefetch_related(
                'order__events', 'order__assets', 'design_versions',
                'status_history', 'assignment_history', 'internal_notes'
            ).get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        # Scoping check: Admins can view all tickets; approved developers can view their assigned tickets, closed reference tickets, or unassigned queue tickets
        user = request.user
        if not user.is_admin_role:
            if ticket.status != TicketStatus.CLOSED:
                if ticket.assigned_developer and ticket.assigned_developer != user:
                    return Response({'success': False, 'error': {'message': 'Access forbidden to ticket assigned to another developer.'}}, status=status.HTTP_403_FORBIDDEN)
                if not ticket.assigned_developer and not user.is_approved_developer:
                    return Response({'success': False, 'error': {'message': 'Only approved developers can view queue tickets.'}}, status=status.HTTP_403_FORBIDDEN)

        serializer = TicketDetailSerializer(ticket)
        return Response({'success': True, 'data': serializer.data})

# Developer state machine (admins may override).
PERMITTED_TRANSITIONS = {
    TicketStatus.NEW_OPEN: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
    TicketStatus.ASSIGNED: [TicketStatus.WORK_IN_PROGRESS, TicketStatus.NEW_OPEN, TicketStatus.ON_HOLD],
    TicketStatus.WORK_IN_PROGRESS: [TicketStatus.INTERNAL_REVIEW, TicketStatus.AWAITING_CUSTOMER_RESPONSE, TicketStatus.ON_HOLD],
    TicketStatus.INTERNAL_REVIEW: [TicketStatus.WORK_IN_PROGRESS, TicketStatus.AWAITING_CUSTOMER_RESPONSE],
    TicketStatus.AWAITING_CUSTOMER_RESPONSE: [TicketStatus.WORK_IN_PROGRESS, TicketStatus.AWAITING_PAYMENT, TicketStatus.ON_HOLD],
    TicketStatus.AWAITING_PAYMENT: [TicketStatus.PAYMENT_DONE, TicketStatus.WORK_IN_PROGRESS],
    TicketStatus.PAYMENT_DONE: [TicketStatus.CLOSED],
    TicketStatus.CLOSED: [TicketStatus.REOPENED],
    TicketStatus.ON_HOLD: [TicketStatus.WORK_IN_PROGRESS, TicketStatus.CANCELLED],
    TicketStatus.REOPENED: [TicketStatus.WORK_IN_PROGRESS],
}


class TicketStatusUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not user.is_admin_role and ticket.assigned_developer != user:
            return Response({'success': False, 'error': {'message': 'You can only update tickets assigned to you.'}}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status') or None
        reason = request.data.get('reason', '')
        work_notes = request.data.get('work_notes', '') or reason

        if new_status == ticket.status:
            new_status = None  # unchanged state: treat as a field-only update (priority / hold)

        if not new_status and not any(k in request.data for k in ('priority', 'is_on_hold', 'hold_reason')):
            return Response({'success': False, 'error': {'message': 'Nothing to update.'}}, status=status.HTTP_400_BAD_REQUEST)

        # State transition validation
        update_fields = ['updated_at']
        if new_status:
            if new_status not in TicketStatus.values:
                return Response({'success': False, 'error': {'status': f'Invalid status. Permitted values: {TicketStatus.values}'}}, status=status.HTTP_400_BAD_REQUEST)

            # Resolution work notes mandatory for closure
            if new_status == TicketStatus.CLOSED and not work_notes.strip():
                return Response({
                    'success': False,
                    'error': {'message': 'Resolution work notes are required when delivering and closing an order.'}
                }, status=status.HTTP_400_BAD_REQUEST)

            # Admins can override transitions
            if not user.is_admin_role:
                allowed = PERMITTED_TRANSITIONS.get(ticket.status, [])
                if new_status not in allowed:
                    return Response({
                        'success': False,
                        'error': {'message': f"Illegal state transition from {ticket.status} to {new_status}. Permitted targets: {allowed}"}
                    }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            previous_status = ticket.status
            if new_status:
                ticket.status = new_status
                update_fields.append('status')
                if new_status == TicketStatus.WORK_IN_PROGRESS and not ticket.wip_started_at:
                    ticket.wip_started_at = timezone.now()
                    update_fields.append('wip_started_at')

            if 'priority' in request.data:
                p_val = request.data['priority']
                if p_val in ['LOW', 'NORMAL', 'HIGH', 'URGENT']:
                    ticket.priority = p_val
                    update_fields.append('priority')

            if 'is_on_hold' in request.data:
                ticket.is_on_hold = bool(request.data['is_on_hold'])
                update_fields.append('is_on_hold')

            if 'hold_reason' in request.data:
                ticket.hold_reason = request.data['hold_reason']
                update_fields.append('hold_reason')

            ticket.save(update_fields=list(set(update_fields)))

            # Synchronize Order Status
            if new_status == TicketStatus.WORK_IN_PROGRESS and ticket.order.status != 'IN_PRODUCTION':
                ticket.order.status = 'IN_PRODUCTION'
                ticket.order.save(update_fields=['status', 'updated_at'])
            elif new_status == TicketStatus.CLOSED and ticket.order.status != 'DELIVERED':
                ticket.order.status = 'DELIVERED'
                ticket.order.save(update_fields=['status', 'updated_at'])

            # Log note if work_notes provided
            if work_notes.strip():
                prefix = f"[{new_status}]" if new_status else "[UPDATE]"
                TicketInternalNote.objects.create(
                    ticket=ticket,
                    author=user,
                    note_text=f"{prefix} {work_notes.strip()}"
                )

            if new_status and previous_status != new_status:
                TicketStatusHistory.objects.create(
                    ticket=ticket,
                    previous_status=previous_status,
                    new_status=new_status,
                    changed_by=user,
                    transition_reason=work_notes or reason or f"Status changed to {new_status} by {user.full_name} ({user.role})"
                )

            log_activity(
                actor=user,
                actor_role=user.role,
                action='TICKET_STATUS_CHANGED',
                module='TICKETS',
                record_id=str(ticket.id),
                previous_value={'status': previous_status},
                new_value={'status': new_status},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=work_notes or reason
            )

        return Response({
            'success': True,
            'data': {
                'ticket_id': str(ticket.id),
                'ticket_number': ticket.ticket_number,
                'status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status
            }
        }, status=status.HTTP_200_OK)

class TicketInternalNoteCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not user.is_admin_role and ticket.assigned_developer != user:
            return Response({'success': False, 'error': {'message': 'Access forbidden.'}}, status=status.HTTP_403_FORBIDDEN)

        note_text = request.data.get('note_text', '').strip()
        if not note_text:
            return Response({'success': False, 'error': {'note_text': 'Note text is required.'}}, status=status.HTTP_400_BAD_REQUEST)

        note_type = request.data.get('note_type', 'WORK_NOTE')
        if note_type == 'CUSTOMER_UPDATE':
            if not note_text.startswith('[CUSTOMER UPDATE]'):
                final_text = f"[CUSTOMER UPDATE] {note_text}"
            else:
                final_text = note_text
        else:
            if not note_text.startswith('[WORK NOTE]'):
                final_text = f"[WORK NOTE] {note_text}"
            else:
                final_text = note_text

        note = TicketInternalNote.objects.create(
            ticket=ticket,
            author=user,
            note_text=final_text
        )

        log_activity(
            actor=user,
            actor_role=user.role,
            action='INTERNAL_NOTE_ADDED',
            module='TICKETS',
            record_id=str(ticket.id),
            new_value={'note_snippet': note_text[:100]},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )

        return Response({'success': True, 'data': TicketInternalNoteSerializer(note).data}, status=status.HTTP_201_CREATED)

