from django.db import transaction
from django.utils import timezone
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.tickets.models import Ticket, TicketStatus, TicketStatusHistory
from apps.tickets.serializers import TicketListSerializer, TicketDetailSerializer, DesignVersionSummarySerializer
from apps.designs.models import DesignVersion, DesignStatus
from apps.video_production.models import VideoTask, VideoTaskStatus
from apps.assignments.services import claim_next_fifo_ticket, claim_specific_ticket
from apps.accounts.permissions import IsApprovedDeveloper, CanProduceVideoPermission
from apps.audit.services import log_activity

class WorkspaceAvailableTicketsView(views.APIView):
    permission_classes = [IsApprovedDeveloper]

    def get(self, request):
        unassigned_tickets = (
            Ticket.objects.select_related('order', 'order__occasion', 'order__package')
            .filter(
                status=TicketStatus.NEW_OPEN,
                assigned_developer__isnull=True,
                is_on_hold=False
            )
            .order_by('eligible_at')
        )
        serializer = TicketListSerializer(unassigned_tickets, many=True)
        return Response({'success': True, 'data': serializer.data})

class WorkspaceClaimFIFOTicketView(views.APIView):
    permission_classes = [IsApprovedDeveloper]

    def post(self, request):
        client_ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')
        
        ticket = claim_next_fifo_ticket(
            developer_user=request.user,
            client_ip=client_ip,
            user_agent=user_agent
        )

        return Response({
            'success': True,
            'data': {
                'id': str(ticket.id),
                'ticket_id': str(ticket.id),
                'ticket_number': ticket.ticket_number,
                'status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status,
                'assigned_at': ticket.assigned_at.isoformat() if ticket.assigned_at else None,
                'message': f"Ticket {ticket.ticket_number} successfully claimed via FIFO!"
            }
        }, status=status.HTTP_200_OK)

class WorkspaceClaimSpecificTicketView(views.APIView):
    permission_classes = [IsApprovedDeveloper]

    def post(self, request, ticket_id):
        client_ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')
        
        ticket = claim_specific_ticket(
            ticket_id=ticket_id,
            developer_user=request.user,
            client_ip=client_ip,
            user_agent=user_agent
        )

        return Response({
            'success': True,
            'data': {
                'id': str(ticket.id),
                'ticket_id': str(ticket.id),
                'ticket_number': ticket.ticket_number,
                'status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status,
                'assigned_at': ticket.assigned_at.isoformat() if ticket.assigned_at else None,
                'message': f"Ticket {ticket.ticket_number} assigned to you successfully!"
            }
        }, status=status.HTTP_200_OK)

class WorkspaceAssignedTicketsView(views.APIView):
    permission_classes = [IsApprovedDeveloper]

    def get(self, request):
        my_tickets = (
            Ticket.objects.select_related('order', 'order__occasion', 'order__package')
            .filter(assigned_developer=request.user)
            .exclude(status=TicketStatus.CLOSED)
            .order_by('-updated_at')
        )
        serializer = TicketListSerializer(my_tickets, many=True)
        return Response({'success': True, 'data': serializer.data})

class WorkspaceUploadDesignView(views.APIView):
    permission_classes = [IsApprovedDeveloper]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_admin_role and ticket.assigned_developer != request.user:
            return Response({'success': False, 'error': {'message': 'You can only upload designs for tickets assigned to you.'}}, status=status.HTTP_403_FORBIDDEN)

        template_id = request.data.get('template_id')
        web_payload = request.data.get('web_preview_payload', {})
        watermark = request.data.get('watermark_text', 'TECHMASTERS PREVIEW - NOT FINAL')

        with transaction.atomic():
            design = DesignVersion.create_next_version(
                ticket=ticket,
                creator=request.user,
                web_payload=web_payload
            )
            design.watermark_text = watermark
            design.status = DesignStatus.SHARED_WITH_CUSTOMER
            design.save()

            previous_status = ticket.status
            ticket.status = TicketStatus.AWAITING_CUSTOMER_RESPONSE
            ticket.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.AWAITING_CUSTOMER_RESPONSE,
                changed_by=request.user,
                transition_reason=f"Developer uploaded design version #{design.version_number}."
            )

            log_activity(
                actor=request.user,
                actor_role=request.user.role,
                action='DESIGN_PREVIEW_UPLOADED',
                module='DESIGNS',
                record_id=str(design.id),
                previous_value={'ticket_status': previous_status},
                new_value={'ticket_status': ticket.status, 'design_version': design.version_number, 'preview_token': design.preview_token},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Design version #{design.version_number} uploaded and dispatched for customer preview."
            )

        return Response({
            'success': True,
            'data': {
                'id': str(design.id),
                'version_number': design.version_number,
                'design_version': design.version_number,
                'preview_token': design.preview_token,
                'preview_url': f"/preview/{design.preview_token}",
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status,
                'message': f"Design version #{design.version_number} uploaded! Preview token generated."
            }
        }, status=status.HTTP_201_CREATED)

class WorkspaceVideoTasksView(views.APIView):
    permission_classes = [CanProduceVideoPermission]

    def get(self, request):
        tasks = VideoTask.objects.select_related('order', 'order__occasion', 'order__package').all().order_by('created_at')
        data = []
        for t in tasks:
            data.append({
                'id': str(t.id),
                'order_reference': t.order.order_reference,
                'customer_name': t.order.customer_name,
                'occasion': t.order.occasion.display_name,
                'status': t.status,
                'assigned_specialist': t.assigned_specialist.full_name if t.assigned_specialist else None,
                'duration_seconds': t.duration_seconds,
                'resolution': t.resolution,
                'created_at': t.created_at.isoformat()
            })
        return Response({'success': True, 'data': data})

class WorkspaceClaimVideoTaskView(views.APIView):
    permission_classes = [CanProduceVideoPermission]

    def post(self, request, task_id):
        try:
            task = VideoTask.objects.get(id=task_id)
        except VideoTask.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Video task not found'}}, status=status.HTTP_404_NOT_FOUND)

        if task.assigned_specialist and task.assigned_specialist != request.user:
            return Response({'success': False, 'error': {'message': 'Video task already claimed by another specialist.'}}, status=status.HTTP_409_CONFLICT)

        task.assigned_specialist = request.user
        task.status = VideoTaskStatus.ASSIGNED
        task.save(update_fields=['assigned_specialist', 'status', 'updated_at'])

        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='VIDEO_TASK_CLAIMED',
            module='VIDEO',
            record_id=str(task.id),
            new_value={'assigned_specialist': request.user.full_name, 'status': task.status},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )

        return Response({
            'success': True,
            'data': {
                'task_id': str(task.id),
                'order_reference': task.order.order_reference,
                'status': task.status,
                'message': 'Video task successfully claimed!'
            }
        }, status=status.HTTP_200_OK)

