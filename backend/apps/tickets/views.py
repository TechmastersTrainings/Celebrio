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

        # Scoping check: Developers can only view their own assigned tickets, while Admins view all
        user = request.user
        if not user.is_admin_role and ticket.assigned_developer != user:
            return Response({'success': False, 'error': {'message': 'Access forbidden to unassigned ticket.'}}, status=status.HTTP_403_FORBIDDEN)

        serializer = TicketDetailSerializer(ticket)
        return Response({'success': True, 'data': serializer.data})

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

        new_status = request.data.get('status')
        reason = request.data.get('reason', '')

        if not new_status or new_status not in TicketStatus.values:
            return Response({'success': False, 'error': {'status': f'Invalid status. Permitted values: {TicketStatus.values}'}}, status=status.HTTP_400_BAD_REQUEST)

        # State transition validation
        permitted_transitions = {
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

        # Admin can override transitions
        if not user.is_admin_role:
            allowed = permitted_transitions.get(ticket.status, [])
            if new_status not in allowed:
                return Response({
                    'success': False,
                    'error': {'message': f"Illegal state transition from {ticket.status} to {new_status}. Permitted targets: {allowed}"}
                }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            previous_status = ticket.status
            ticket.status = new_status
            if new_status == TicketStatus.WORK_IN_PROGRESS and not ticket.wip_started_at:
                ticket.wip_started_at = timezone.now()
            ticket.save(update_fields=['status', 'wip_started_at', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=new_status,
                changed_by=user,
                transition_reason=reason or f"Status changed by {user.full_name} ({user.role})"
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
                remarks=reason
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

        note = TicketInternalNote.objects.create(
            ticket=ticket,
            author=user,
            note_text=note_text
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

