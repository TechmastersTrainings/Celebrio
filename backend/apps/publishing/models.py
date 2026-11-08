import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.orders.models import Order

class PublicationStatus(models.TextChoices):
    UNPUBLISHED = 'UNPUBLISHED', 'Unpublished'
    AUTHORIZATION_PENDING = 'AUTHORIZATION_PENDING', 'Authorization Pending'
    PUBLISHED_ACTIVE = 'PUBLISHED_ACTIVE', 'Published Active'
    EXPIRED = 'EXPIRED', 'Expired'
    ARCHIVED = 'ARCHIVED', 'Archived'

class InvitationPublication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='publication')
    neutral_slug = models.SlugField(max_length=100, unique=True, db_index=True)
    is_published = models.BooleanField(default=False, db_index=True)
    authorized_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='authorized_publications'
    )
    authorized_at = models.DateTimeField(null=True, blank=True)
    event_date = models.DateField()
    expires_at = models.DateTimeField(db_index=True)
    grace_period_days = models.PositiveIntegerField(default=30)
    status = models.CharField(
        max_length=30,
        choices=PublicationStatus.choices,
        default=PublicationStatus.UNPUBLISHED,
        db_index=True
    )
    view_count = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'invitation_publications'

    def __str__(self):
        return f"{self.neutral_slug} [{self.status}] (Order: {self.order.order_reference})"

    @property
    def is_currently_live(self):
        return self.is_published and self.status == PublicationStatus.PUBLISHED_ACTIVE and timezone.now() < self.expires_at

class QRCodeRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publication = models.OneToOneField(InvitationPublication, on_delete=models.CASCADE, related_name='qr_code')
    target_url = models.URLField(max_length=500)
    svg_payload = models.TextField()
    png_file_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'qr_codes'

    def __str__(self):
        return f"QR for {self.publication.neutral_slug}"

