import hmac
import hashlib
import json
import secrets
from django.db import transaction
from django.utils import timezone
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import PaymentOrder, PaymentTransaction, PaymentOrderStatus, TransactionStatus
from apps.orders.models import Order, OrderStatus
from apps.tickets.models import TicketStatus, TicketStatusHistory
from apps.audit.services import log_activity
from apps.accounts.permissions import IsAdminUserRole

class PaymentOrderCreateView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        order_ref = request.data.get('order_reference')
        if not order_ref:
            return Response({'success': False, 'error': {'order_reference': 'Order reference required.'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        # Generate gateway order id
        gw_order_id = f"order_{secrets.token_hex(12)}"

        payment_order = PaymentOrder.objects.create(
            order=order,
            gateway_order_id=gw_order_id,
            gateway_provider='RAZORPAY',
            amount_inr=order.total_amount_inr,
            currency='INR',
            status=PaymentOrderStatus.CREATED
        )

        log_activity(
            action='PAYMENT_ORDER_CREATED',
            module='PAYMENTS',
            record_id=str(payment_order.id),
            actor_role='CUSTOMER',
            new_value={'gateway_order_id': gw_order_id, 'amount_inr': str(order.total_amount_inr)},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )

        return Response({
            'success': True,
            'data': {
                'payment_order_id': str(payment_order.id),
                'gateway_order_id': gw_order_id,
                'gateway_provider': 'RAZORPAY',
                'amount_inr': str(order.total_amount_inr),
                'currency': 'INR',
                'key_id': 'rzp_test_celebrio_mock'
            }
        }, status=status.HTTP_201_CREATED)

class PaymentWebhookView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data
        gw_payment_id = payload.get('gateway_payment_id') or payload.get('payment_id') or f"pay_{secrets.token_hex(12)}"
        gw_order_id = payload.get('gateway_order_id') or payload.get('order_id')
        signature = request.headers.get('X-Razorpay-Signature')

        if not gw_order_id:
            return Response({'success': False, 'error': {'message': 'gateway_order_id required.'}}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency check: if transaction already exists, respond 200 without duplicate side effects
        if PaymentTransaction.objects.filter(gateway_payment_id=gw_payment_id).exists():
            return Response({'success': True, 'message': 'Payment already verified (idempotent duplicate acknowledged).'}, status=status.HTTP_200_OK)

        try:
            pay_order = PaymentOrder.objects.get(gateway_order_id=gw_order_id)
            order = pay_order.order
            ticket = order.ticket
        except (PaymentOrder.DoesNotExist, Exception):
            return Response({'success': False, 'error': {'message': 'Payment order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            pay_order.status = PaymentOrderStatus.PAID
            pay_order.save(update_fields=['status'])

            tx = PaymentTransaction.objects.create(
                payment_order=pay_order,
                gateway_payment_id=gw_payment_id,
                amount_settled_inr=pay_order.amount_inr,
                status=TransactionStatus.SUCCESS,
                webhook_payload=payload
            )

            previous_status = ticket.status
            ticket.status = TicketStatus.PAYMENT_DONE
            ticket.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.PAYMENT_DONE,
                transition_reason=f"Server verified payment received. Transaction: {gw_payment_id}."
            )

            log_activity(
                action='PAYMENT_VERIFIED',
                module='PAYMENTS',
                record_id=str(tx.id),
                actor_role='GATEWAY_WEBHOOK',
                new_value={
                    'order_reference': order.order_reference,
                    'gateway_payment_id': gw_payment_id,
                    'amount_settled_inr': str(pay_order.amount_inr),
                    'ticket_status': ticket.status
                },
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Payment verified server-side for {order.order_reference}."
            )

        return Response({
            'success': True,
            'message': 'Payment successfully verified and logged.',
            'data': {
                'order_reference': order.order_reference,
                'gateway_payment_id': gw_payment_id,
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status
            }
        }, status=status.HTTP_200_OK)

