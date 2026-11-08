from django.db.models import Count, Sum
from rest_framework import views, status, generics
from rest_framework.response import Response

from apps.accounts.models import User, UserRole, ApprovalStatus
from apps.accounts.permissions import IsAdminUserRole
from apps.tickets.models import Ticket, TicketStatus
from apps.tickets.serializers import TicketListSerializer, TicketDetailSerializer
from apps.payments.models import PaymentOrder, PaymentOrderStatus, PaymentTransaction
from apps.video_production.models import VideoTask
from apps.audit.models import CentralActivityLog
from apps.audit.serializers import CentralActivityLogSerializer
from apps.assignments.services import admin_assign_ticket, admin_release_ticket

class AdminDashboardMetricsView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        status_counts = Ticket.objects.values('status').annotate(total=Count('id'))
        count_dict = {item['status']: item['total'] for item in status_counts}

        total_orders = Ticket.objects.count()
        unassigned_count = count_dict.get(TicketStatus.NEW_OPEN, 0)
        assigned_count = count_dict.get(TicketStatus.ASSIGNED, 0)
        wip_count = count_dict.get(TicketStatus.WORK_IN_PROGRESS, 0)
        awaiting_customer_count = count_dict.get(TicketStatus.AWAITING_CUSTOMER_RESPONSE, 0)
        awaiting_payment_count = count_dict.get(TicketStatus.AWAITING_PAYMENT, 0)
        payment_done_count = count_dict.get(TicketStatus.PAYMENT_DONE, 0)
        closed_count = count_dict.get(TicketStatus.CLOSED, 0)
        on_hold_count = count_dict.get(TicketStatus.ON_HOLD, 0)
        cancelled_count = count_dict.get(TicketStatus.CANCELLED, 0)

        # Developer accounts telemetry
        pending_devs = User.objects.filter(role=UserRole.DEV_PENDING).count()
        active_devs = User.objects.filter(role__in=[UserRole.DEV_ACTIVE, UserRole.DEV_VIDEO], developer_profile__approval_status=ApprovalStatus.APPROVED_ACTIVE).count()

        # Video production workload
        video_queue_count = VideoTask.objects.exclude(status='COMPLETED').count()

        # Financial reconciliation
        total_revenue = PaymentTransaction.objects.filter(status='SUCCESS').aggregate(total=Sum('amount_settled_inr'))['total'] or 0.00

        return Response({
            'success': True,
            'data': {
                'total_orders': total_orders,
                'unassigned_fifo_queue': unassigned_count,
                'assigned_tickets': assigned_count,
                'work_in_progress': wip_count,
                'awaiting_customer_response': awaiting_customer_count,
                'awaiting_payment': awaiting_payment_count,
                'payment_done': payment_done_count,
                'closed_tickets': closed_count,
                'on_hold_tickets': on_hold_count,
                'cancelled_orders': cancelled_count,
                'pending_developer_approvals': pending_devs,
                'active_developers': active_devs,
                'video_production_tasks': video_queue_count,
                'total_revenue_inr': str(total_revenue)
            }
        })

class AdminTicketListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = Ticket.objects.select_related('order', 'order__occasion', 'order__package', 'assigned_developer').all().order_by('-created_at')

        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        occasion_param = request.query_params.get('occasion')
        if occasion_param:
            qs = qs.filter(order__occasion__slug=occasion_param)

        dev_param = request.query_params.get('developer_id')
        if dev_param:
            qs = qs.filter(assigned_developer_id=dev_param)

        serializer = TicketListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

class AdminTicketReassignView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        developer_id = request.data.get('developer_id')
        reason = request.data.get('reason', 'Admin reassignment')

        if not developer_id:
            return Response({'success': False, 'error': {'developer_id': 'Target developer ID required'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_dev = User.objects.get(id=developer_id)
        except User.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Target developer user not found'}}, status=status.HTTP_404_NOT_FOUND)

        updated_ticket = admin_assign_ticket(
            ticket=ticket,
            developer_user=target_dev,
            admin_user=request.user,
            reason=reason,
            client_ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        return Response({
            'success': True,
            'message': f"Ticket {ticket.ticket_number} successfully reassigned to {target_dev.full_name}."
        })

class AdminTicketReleaseView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Admin released ticket back to queue')

        released_ticket = admin_release_ticket(
            ticket=ticket,
            admin_user=request.user,
            reason=reason,
            client_ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        return Response({
            'success': True,
            'message': f"Ticket {ticket.ticket_number} released back to available FIFO queue."
        })

class AdminAuditLogsListView(generics.ListAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = CentralActivityLogSerializer

    def get_queryset(self):
        qs = CentralActivityLog.objects.select_related('actor').all()
        module = self.request.query_params.get('module')
        if module:
            qs = qs.filter(module=module)

        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs[:100]

