import uuid
from django.db import models
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
    # Find count of orders created this year
    count = Order.objects.filter(order_reference__startswith=f"TC-{year}-").count() + 1
    return f"TC-{year}-{count:05d}"

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
    total_amount_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
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

