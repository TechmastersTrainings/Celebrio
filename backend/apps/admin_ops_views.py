import secrets
from decimal import Decimal
from django.db import transaction, models
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import views, status, generics
from rest_framework.response import Response

from apps.accounts.models import User, UserRole, ApprovalStatus, DeveloperProfile
from apps.accounts.permissions import IsAdminUserRole
from apps.orders.models import Order, OrderStatus
from apps.tickets.models import Ticket, TicketStatus, TicketStatusHistory, TicketInternalNote
from apps.tickets.serializers import TicketListSerializer, TicketDetailSerializer
from apps.payments.models import PaymentOrder, PaymentOrderStatus, PaymentTransaction, TransactionStatus
from apps.video_production.models import VideoTask
from apps.audit.models import CentralActivityLog
from apps.audit.serializers import CentralActivityLogSerializer
from apps.audit.services import log_activity
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
        active_devs = User.objects.filter(
            role__in=[UserRole.DEV_ACTIVE, UserRole.DEV_VIDEO],
            developer_profile__approval_status=ApprovalStatus.APPROVED_ACTIVE
        ).count()

        # Total Users count
        total_users = User.objects.count()

        # Video production workload
        video_queue_count = VideoTask.objects.exclude(status='COMPLETED').count()

        # Financial reconciliation
        total_revenue = PaymentTransaction.objects.filter(status='SUCCESS').aggregate(total=Sum('amount_settled_inr'))['total'] or Decimal('0.00')

        return Response({
            'success': True,
            'data': {
                'total_orders': total_orders,
                'total_users': total_users,
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

# =============================================================================
# 1. USER MANAGEMENT VIEWS
# =============================================================================
class AdminUsersListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        users = User.objects.all().order_by('-created_at')
        role_filter = request.query_params.get('role')
        if role_filter:
            users = users.filter(role=role_filter)

        search_query = request.query_params.get('search', '').strip()
        if search_query:
            users = users.filter(
                models.Q(full_name__icontains=search_query) |
                models.Q(email__icontains=search_query) |
                models.Q(phone_number__icontains=search_query)
            )

        data = []
        for u in users:
            profile = getattr(u, 'developer_profile', None)
            data.append({
                'id': str(u.id),
                'email': u.email,
                'phone_number': u.phone_number,
                'full_name': u.full_name,
                'role': u.role,
                'role_display': u.get_role_display(),
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'is_superuser': u.is_superuser,
                'created_at': u.created_at.isoformat() if u.created_at else None,
                'developer_profile': {
                    'approval_status': profile.approval_status,
                    'max_active_tickets': profile.max_active_tickets,
                    'can_produce_video': profile.can_produce_video,
                    'skills': profile.skills,
                } if profile else None
            })

        return Response({'success': True, 'data': data})

class AdminUserActionView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'User not found'}}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get('role')
        is_active = request.data.get('is_active')
        full_name = request.data.get('full_name')
        new_password = request.data.get('password')
        max_active_tickets = request.data.get('max_active_tickets')
        can_produce_video = request.data.get('can_produce_video')

        with transaction.atomic():
            if role and role in UserRole.values:
                target_user.role = role
                if role in [UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN]:
                    target_user.is_staff = True
                    if role == UserRole.SUPER_ADMIN:
                        target_user.is_superuser = True
                elif role in [UserRole.DEV_ACTIVE, UserRole.DEV_VIDEO]:
                    target_user.is_staff = False
                    profile, _ = DeveloperProfile.objects.get_or_create(user=target_user)
                    profile.approval_status = ApprovalStatus.APPROVED_ACTIVE
                    profile.save()

            if is_active is not None:
                target_user.is_active = bool(is_active)

            if full_name:
                target_user.full_name = full_name.strip()

            if new_password:
                target_user.set_password(new_password)

            target_user.save()

            # Developer specific attributes
            if hasattr(target_user, 'developer_profile'):
                profile = target_user.developer_profile
                if max_active_tickets is not None:
                    profile.max_active_tickets = int(max_active_tickets)
                if can_produce_video is not None:
                    profile.can_produce_video = bool(can_produce_video)
                profile.save()

            log_activity(
                actor=request.user,
                actor_role=request.user.role,
                action='ADMIN_USER_UPDATED',
                module='ACCOUNTS',
                record_id=str(target_user.id),
                new_value={'email': target_user.email, 'role': target_user.role, 'is_active': target_user.is_active},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Admin {request.user.full_name} updated user {target_user.email}."
            )

        return Response({
            'success': True,
            'message': f"User {target_user.email or target_user.full_name} updated successfully."
        })

    def delete(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'User not found'}}, status=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id:
            return Response({'success': False, 'error': {'message': 'You cannot delete your own active administrator account.'}}, status=status.HTTP_400_BAD_REQUEST)

        email = target_user.email or target_user.full_name
        target_user.delete()

        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='ADMIN_USER_DELETED',
            module='ACCOUNTS',
            record_id=str(user_id),
            previous_value={'email': email},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS',
            remarks=f"Admin {request.user.full_name} deleted user {email}."
        )

        return Response({'success': True, 'message': f"User {email} deleted successfully."})

# =============================================================================
# 2. TICKET MANAGEMENT VIEWS
# =============================================================================
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

class AdminTicketStatusUpdateView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        reason = request.data.get('reason', 'Admin status update')
        work_notes = request.data.get('work_notes', '')

        if not new_status or new_status not in TicketStatus.values:
            return Response({
                'success': False,
                'error': {'message': f"Invalid status. Allowed values: {TicketStatus.values}"}
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            previous_status = ticket.status
            ticket.status = new_status

            if new_status == TicketStatus.WORK_IN_PROGRESS and not ticket.wip_started_at:
                ticket.wip_started_at = timezone.now()

            ticket.save(update_fields=['status', 'wip_started_at', 'updated_at'])

            # Synchronize Order status
            if new_status == TicketStatus.WORK_IN_PROGRESS and ticket.order.status != OrderStatus.IN_PRODUCTION:
                ticket.order.status = OrderStatus.IN_PRODUCTION
                ticket.order.save(update_fields=['status', 'updated_at'])
            elif new_status == TicketStatus.CLOSED and ticket.order.status != OrderStatus.DELIVERED:
                ticket.order.status = OrderStatus.DELIVERED
                ticket.order.save(update_fields=['status', 'updated_at'])

            if work_notes.strip():
                TicketInternalNote.objects.create(
                    ticket=ticket,
                    author=request.user,
                    note_text=f"[ADMIN OVERRIDE: {new_status}] {work_notes.strip()}"
                )

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=new_status,
                changed_by=request.user,
                transition_reason=f"Admin override: {reason}"
            )

            log_activity(
                actor=request.user,
                actor_role=request.user.role,
                action='ADMIN_TICKET_STATUS_OVERRIDE',
                module='TICKETS',
                record_id=str(ticket.id),
                previous_value={'status': previous_status},
                new_value={'status': ticket.status, 'reason': reason},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Admin moved ticket {ticket.ticket_number} to {new_status}."
            )

        return Response({
            'success': True,
            'message': f"Ticket {ticket.ticket_number} status updated to {new_status}.",
            'data': {
                'ticket_id': str(ticket.id),
                'ticket_number': ticket.ticket_number,
                'status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status
            }
        })

    def delete(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Ticket not found'}}, status=status.HTTP_404_NOT_FOUND)

        ticket_num = ticket.ticket_number
        order = ticket.order

        with transaction.atomic():
            ticket.delete()
            if order:
                for pay_order in order.payment_orders.all():
                    pay_order.transactions.all().delete()
                order.payment_orders.all().delete()
                if hasattr(order, 'publication'):
                    if hasattr(order.publication, 'qr_code'):
                        order.publication.qr_code.delete()
                    order.publication.delete()
                order.delete()

            log_activity(
                actor=request.user,
                actor_role=request.user.role,
                action='ADMIN_TICKET_DELETED',
                module='TICKETS',
                record_id=str(ticket_id),
                previous_value={'ticket_number': ticket_num},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Admin deleted ticket {ticket_num} and associated order."
            )

        return Response({'success': True, 'message': f"Ticket {ticket_num} and associated order deleted successfully."})

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

# =============================================================================
# 3. PAYMENT MANAGEMENT VIEWS
# =============================================================================
class AdminPaymentsListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        payments = PaymentOrder.objects.select_related('order', 'order__occasion', 'order__package').all().order_by('-created_at')

        status_param = request.query_params.get('status')
        if status_param:
            payments = payments.filter(status=status_param)

        data = []
        for p in payments:
            latest_tx = p.transactions.filter(status='SUCCESS').first()
            data.append({
                'id': str(p.id),
                'order_reference': p.order.order_reference,
                'customer_name': p.order.customer_name,
                'customer_email': p.order.customer_email,
                'customer_phone': p.order.customer_phone,
                'occasion': p.order.occasion.display_name if p.order.occasion else None,
                'package_name': p.order.package.name if p.order.package else None,
                'amount_inr': str(p.amount_inr),
                'status': p.status,
                'gateway_provider': p.gateway_provider,
                'gateway_order_id': p.gateway_order_id,
                'gateway_payment_id': latest_tx.gateway_payment_id if latest_tx else None,
                'ticket_status': p.order.ticket.status if hasattr(p.order, 'ticket') else None,
                'created_at': p.created_at.isoformat(),
            })

        return Response({'success': True, 'data': data})

class AdminPaymentMarkPaidView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        order_ref = request.data.get('order_reference')
        notes = request.data.get('notes', 'Admin marked as paid manually')
        payment_method = request.data.get('payment_method', 'MANUAL_ADMIN_OVERRIDE')

        if not order_ref:
            return Response({'success': False, 'error': {'message': 'Order reference required.'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
            ticket = order.ticket
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            gw_order_id = f"manual_{secrets.token_hex(8)}"
            gw_payment_id = f"admin_pay_{secrets.token_hex(8)}"

            pay_order, _ = PaymentOrder.objects.get_or_create(
                order=order,
                defaults={
                    'gateway_order_id': gw_order_id,
                    'gateway_provider': payment_method,
                    'amount_inr': order.total_amount_inr,
                    'currency': 'INR',
                    'status': PaymentOrderStatus.PAID
                }
            )
            pay_order.status = PaymentOrderStatus.PAID
            pay_order.save(update_fields=['status'])

            tx = PaymentTransaction.objects.create(
                payment_order=pay_order,
                gateway_payment_id=gw_payment_id,
                amount_settled_inr=pay_order.amount_inr,
                status=TransactionStatus.SUCCESS,
                webhook_payload={'method': payment_method, 'notes': notes, 'marked_by': request.user.email}
            )

            previous_status = ticket.status
            ticket.status = TicketStatus.PAYMENT_DONE
            ticket.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.PAYMENT_DONE,
                changed_by=request.user,
                transition_reason=f"Admin {request.user.full_name} manually verified payment: {notes}."
            )

            log_activity(
                action='PAYMENT_MANUAL_VERIFIED',
                module='PAYMENTS',
                record_id=str(tx.id),
                actor_role=request.user.role,
                new_value={
                    'order_reference': order.order_reference,
                    'amount_inr': str(pay_order.amount_inr),
                    'method': payment_method,
                    'ticket_status': ticket.status
                },
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Admin manually marked payment verified for {order.order_reference}."
            )

        return Response({
            'success': True,
            'message': f"Payment for {order.order_reference} marked as PAID. Ticket moved to PAYMENT_DONE.",
            'data': {
                'order_reference': order.order_reference,
                'amount_settled_inr': str(pay_order.amount_inr),
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status
            }
        })

# =============================================================================
# 4. REVENUE & PROFIT AND LOSS (P&L) ANALYTICS VIEWS
# =============================================================================
class AdminFinancialAnalyticsView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        dev_payout_pct = Decimal(str(request.query_params.get('dev_payout_pct', '35.0')))
        gateway_fee_pct = Decimal(str(request.query_params.get('gateway_fee_pct', '2.0')))
        fixed_overhead = Decimal(str(request.query_params.get('fixed_overhead', '1500.0')))
        per_order_infra_cost = Decimal('50.0') # Cloud storage + SMS

        # 1. Total Gross Revenue
        successful_txs = PaymentTransaction.objects.filter(status='SUCCESS').select_related('payment_order', 'payment_order__order', 'payment_order__order__occasion', 'payment_order__order__package')
        
        gross_revenue = successful_txs.aggregate(total=Sum('amount_settled_inr'))['total'] or Decimal('0.00')
        paid_orders_count = successful_txs.count()

        aov = (gross_revenue / paid_orders_count) if paid_orders_count > 0 else Decimal('0.00')

        # 2. Revenue breakdown by Occasion
        occasion_breakdown = {}
        package_breakdown = {}
        recent_tx_list = []

        for tx in successful_txs.order_by('-verified_at')[:20]:
            order = tx.payment_order.order
            occ_name = order.occasion.display_name if order.occasion else 'Other'
            pkg_name = order.package.name if order.package else 'Custom'

            occasion_breakdown[occ_name] = occasion_breakdown.get(occ_name, Decimal('0.00')) + tx.amount_settled_inr
            package_breakdown[pkg_name] = package_breakdown.get(pkg_name, Decimal('0.00')) + tx.amount_settled_inr

            recent_tx_list.append({
                'id': str(tx.id),
                'gateway_payment_id': tx.gateway_payment_id,
                'order_reference': order.order_reference,
                'customer_name': order.customer_name,
                'occasion': occ_name,
                'amount_inr': str(tx.amount_settled_inr),
                'verified_at': tx.verified_at.isoformat()
            })

        # 3. Profit & Loss Computations
        estimated_dev_payout = (gross_revenue * dev_payout_pct) / Decimal('100.0')
        estimated_gateway_fees = (gross_revenue * gateway_fee_pct) / Decimal('100.0')
        estimated_variable_infra = Decimal(paid_orders_count) * per_order_infra_cost

        total_cogs = estimated_dev_payout + estimated_gateway_fees + estimated_variable_infra
        gross_profit = gross_revenue - total_cogs
        net_profit = gross_profit - fixed_overhead
        net_profit_margin_pct = ((net_profit / gross_revenue) * Decimal('100.0')) if gross_revenue > 0 else Decimal('0.0')

        return Response({
            'success': True,
            'data': {
                'revenue': {
                    'gross_revenue_inr': str(round(gross_revenue, 2)),
                    'paid_orders_count': paid_orders_count,
                    'average_order_value_inr': str(round(aov, 2)),
                    'by_occasion': [{'occasion': k, 'amount_inr': str(round(v, 2))} for k, v in occasion_breakdown.items()],
                    'by_package': [{'package': k, 'amount_inr': str(round(v, 2))} for k, v in package_breakdown.items()],
                    'recent_transactions': recent_tx_list
                },
                'profit_and_loss': {
                    'gross_revenue_inr': str(round(gross_revenue, 2)),
                    'cogs': {
                        'developer_payouts_inr': str(round(estimated_dev_payout, 2)),
                        'dev_payout_pct': str(dev_payout_pct),
                        'gateway_processing_fees_inr': str(round(estimated_gateway_fees, 2)),
                        'gateway_fee_pct': str(gateway_fee_pct),
                        'cloud_and_sms_delivery_inr': str(round(estimated_variable_infra, 2)),
                        'total_cogs_inr': str(round(total_cogs, 2))
                    },
                    'gross_profit_inr': str(round(gross_profit, 2)),
                    'opex': {
                        'fixed_server_and_maintenance_inr': str(round(fixed_overhead, 2)),
                    },
                    'net_profit_inr': str(round(net_profit, 2)),
                    'net_profit_margin_pct': str(round(net_profit_margin_pct, 1))
                }
            }
        })

# =============================================================================
# 5. AUDIT LOGS VIEW
# =============================================================================
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
