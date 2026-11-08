import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.orders.models import Order

class PaymentOrderStatus(models.TextChoices):
    CREATED = 'CREATED', 'Created'
    PAID = 'PAID', 'Paid'
    FAILED = 'FAILED', 'Failed'
    EXPIRED = 'EXPIRED', 'Expired'

class TransactionStatus(models.TextChoices):
    SUCCESS = 'SUCCESS', 'Success'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'

class PaymentOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='payment_orders')
    gateway_order_id = models.CharField(max_length=100, unique=True, db_index=True)
    gateway_provider = models.CharField(max_length=30, default='RAZORPAY')
    amount_inr = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(
        max_length=30,
        choices=PaymentOrderStatus.choices,
        default=PaymentOrderStatus.CREATED,
        db_index=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payment_orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.gateway_order_id} - ₹{self.amount_inr} ({self.status}) for {self.order.order_reference}"

class PaymentTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_order = models.ForeignKey(PaymentOrder, on_delete=models.CASCADE, related_name='transactions')
    gateway_payment_id = models.CharField(max_length=100, unique=True, db_index=True)
    amount_settled_inr = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=30,
        choices=TransactionStatus.choices,
        default=TransactionStatus.SUCCESS,
        db_index=True
    )
    webhook_payload = models.JSONField(default=dict, blank=True)
    verified_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-verified_at']

    def __str__(self):
        return f"Tx: {self.gateway_payment_id} - ₹{self.amount_settled_inr} ({self.status})"

class Refund(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(PaymentTransaction, on_delete=models.CASCADE, related_name='refunds')
    amount_inr = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'refunds'

    def __str__(self):
        return f"Refund ₹{self.amount_inr} on {self.transaction.gateway_payment_id}"

