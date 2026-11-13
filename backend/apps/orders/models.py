import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.catalog.models import Occasion, Package

class OrderStatus(models.TextChoices):
    SUBMITTED = 'SUBMITTED', 'Submitted'
    REQUIREMENTS_CONFIRMED = 'REQUIREMENTS_CONFIRMED', 'Requirements Confirmed'
    IN_PRODUCTION = 'IN_PRODUCTION', 'In Production'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'

def generate_order_reference():
    year = timezone.now().year
    count = Order.objects.filter(order_reference__startswith=f"TC-{year}-").count() + 1
    return f"TC-{year}-{count:05d}"

class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage Discount (%)'),
        ('FIXED', 'Fixed Amount (₹)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='PERCENTAGE')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=12.00)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_usage_limit = models.IntegerField(null=True, blank=True)
    current_usage_count = models.IntegerField(default=0)
    per_customer_limit = models.IntegerField(default=1)
    can_combine_with_auto_discount = models.BooleanField(default=False)
    is_system_default_offer = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coupons'
        ordering = ['-created_at']

    def __str__(self):
        suffix = '%' if self.discount_type == 'PERCENTAGE' else ' INR'
        return f"{self.code} - {self.discount_value}{suffix} (Active: {self.is_active})"

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_reference = models.CharField(max_length=30, unique=True, db_index=True)
    customer_name = models.CharField(max_length=150)
    customer_mobile = models.CharField(max_length=20, db_index=True)
    customer_email = models.EmailField(blank=True, null=True)
    occasion = models.ForeignKey(Occasion, on_delete=models.PROTECT, related_name='orders')
    package = models.ForeignKey(Package, on_delete=models.PROTECT, related_name='orders')
    selected_language = models.CharField(max_length=50, default='English')
    status = models.CharField(
        max_length=35,
        choices=OrderStatus.choices,
        default=OrderStatus.SUBMITTED,
        db_index=True
    )

    # Quotation & Discount Architecture
    base_amount_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    auto_discount_amount_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon_discount_amount_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    applied_coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_orders'
    )
    quotation_snapshot_json = models.JSONField(default=dict, blank=True)

    # Physical Card & OCR Workflow
    has_physical_card = models.BooleanField(default=False)
    physical_card_notes = models.TextField(blank=True, null=True)
    ocr_extracted_text = models.TextField(blank=True, null=True)
    ocr_data_json = models.JSONField(default=dict, blank=True)

    # Dynamic Occasion Requirements & Missing Information Governance
    occasion_requirements_json = models.JSONField(default=dict, blank=True)
    missing_fields_json = models.JSONField(default=list, blank=True)
    is_information_confirmed = models.BooleanField(default=False)
    is_ready_for_production = models.BooleanField(default=False)
    completeness_score = models.IntegerField(default=50)

    special_instructions = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_reference} - {self.customer_name} ({self.occasion.display_name})"

    @property
    def primary_event(self):
        return self.events.order_by('event_date', 'start_time').first()

class CouponUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='coupon_usages')
    customer_mobile = models.CharField(max_length=20)
    discount_amount_inr = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'coupon_usages'
        ordering = ['-created_at']

class CallbackRequest(models.Model):
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('PENDING', 'Pending'),
        ('CONTACTED', 'Contacted'),
        ('FOLLOWUP_REQUIRED', 'Follow-up Required'),
        ('RESOLVED', 'Resolved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_name = models.CharField(max_length=150)
    customer_mobile = models.CharField(max_length=20, db_index=True)
    preferred_callback_time = models.CharField(max_length=100, default='As soon as possible')
    assistance_required = models.TextField()
    order_reference = models.CharField(max_length=30, blank=True, null=True, db_index=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REQUESTED', db_index=True)
    assigned_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_callbacks'
    )
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'callback_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Callback: {self.customer_name} ({self.customer_mobile}) [{self.status}]"

class OrderEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='events')
    event_title = models.CharField(max_length=150)
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    venue_name = models.CharField(max_length=200)
    venue_address = models.TextField()
    google_maps_url = models.URLField(max_length=500, blank=True, null=True)
    dress_code = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'order_events'
        ordering = ['event_date', 'start_time']

    def __str__(self):
        return f"{self.event_title} on {self.event_date} ({self.order.order_reference})"

class CustomerAsset(models.Model):
    CATEGORY_CHOICES = [
        ('COUPLE_PHOTO', 'Couple / Host Photo'),
        ('FAMILY_PHOTO', 'Family Photo'),
        ('PHYSICAL_CARD_FRONT', 'Physical Card Front'),
        ('PHYSICAL_CARD_BACK', 'Physical Card Back'),
        ('PHYSICAL_CARD_INSERT', 'Physical Card Insert'),
        ('BACKGROUND_AUDIO', 'Background Audio Track'),
        ('LOGO_ASSET', 'Logo or Crest'),
        ('OTHER', 'Other Celebration Asset'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='assets')
    file_key = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size_bytes = models.BigIntegerField(default=0)
    asset_category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='COUPLE_PHOTO')
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'customer_assets'

    def __str__(self):
        return f"{self.file_name} ({self.asset_category}) - {self.order.order_reference}"
