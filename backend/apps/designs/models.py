import uuid
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.tickets.models import Ticket
from apps.catalog.models import Template

class DesignStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    INTERNAL_REVIEW = 'INTERNAL_REVIEW', 'Internal Review'
    SHARED_WITH_CUSTOMER = 'SHARED_WITH_CUSTOMER', 'Shared with Customer'
    REVISED = 'REVISED', 'Revised'
    APPROVED_BY_CUSTOMER = 'APPROVED_BY_CUSTOMER', 'Approved by Customer'

class DesignVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='design_versions')
    version_number = models.PositiveIntegerField(default=1)
    template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, blank=True)
    preview_token = models.CharField(max_length=64, unique=True, db_index=True)
    web_preview_payload = models.JSONField(default=dict, blank=True)
    watermark_text = models.CharField(max_length=150, default='TECHMASTERS PREVIEW - NOT FINAL')
    status = models.CharField(
        max_length=30,
        choices=DesignStatus.choices,
        default=DesignStatus.DRAFT,
        db_index=True
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'design_versions'
        ordering = ['ticket', '-version_number']

    def __str__(self):
        return f"{self.ticket.ticket_number} - v{self.version_number} [{self.status}]"

    @classmethod
    def create_next_version(cls, ticket, creator, template=None, web_payload=None):
        latest = ticket.design_versions.order_by('-version_number').first()
        next_ver = (latest.version_number + 1) if latest else 1
        token = secrets.token_urlsafe(32)
        return cls.objects.create(
            ticket=ticket,
            version_number=next_ver,
            template=template,
            preview_token=token,
            web_preview_payload=web_payload or {},
            created_by=creator,
            status=DesignStatus.DRAFT
        )

class RevisionRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    design_version = models.ForeignKey(DesignVersion, on_delete=models.CASCADE, related_name='revisions')
    round_number = models.PositiveIntegerField()
    is_billable = models.BooleanField(default=False)
    customer_feedback = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'revision_requests'
        ordering = ['round_number']

    def __str__(self):
        return f"Revision #{self.round_number} on {self.design_version.ticket.ticket_number} (Billable: {self.is_billable})"

