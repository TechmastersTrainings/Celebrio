import uuid
from django.db import models
from django.utils import timezone

class Occasion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    icon_name = models.CharField(max_length=50, default='celebration')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'occasions'
        ordering = ['sort_order', 'display_name']

    def __str__(self):
        return self.display_name

class Package(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    occasion = models.ForeignKey(Occasion, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    base_price_inr = models.DecimalField(max_digits=10, decimal_places=2)
    features_json = models.JSONField(default=list, blank=True)
    included_revisions = models.PositiveIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'packages'
        ordering = ['base_price_inr']

    def __str__(self):
        return f"{self.name} - ₹{self.base_price_inr} ({self.occasion.display_name})"

class Addon(models.Model):
    ADDON_TYPES = [
        ('VIDEO', 'Video Invitation'),
        ('REVISION', 'Additional Revision'),
        ('RUSH_DELIVERY', 'Expedited Delivery'),
        ('HOSTING_EXT', 'Extended Hosting'),
        ('CUSTOM_AUDIO', 'Custom Audio Track'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    price_inr = models.DecimalField(max_digits=10, decimal_places=2)
    addon_type = models.CharField(max_length=50, choices=ADDON_TYPES, default='VIDEO')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'addons'

    def __str__(self):
        return f"{self.name} (+₹{self.price_inr})"

class Template(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    occasion = models.ForeignKey(Occasion, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    preview_image_url = models.URLField(max_length=500, blank=True, null=True)
    theme_config_json = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'templates'

    def __str__(self):
        return f"Template: {self.name} ({self.occasion.display_name})"

