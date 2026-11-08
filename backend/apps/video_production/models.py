import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.orders.models import Order

class VideoTaskStatus(models.TextChoices):
    QUEUED = 'QUEUED', 'Queued'
    ASSIGNED = 'ASSIGNED', 'Assigned to Specialist'
    IN_RENDER = 'IN_RENDER', 'In Render'
    PREVIEW_READY = 'PREVIEW_READY', 'Preview Ready'
    REVISION_REQUESTED = 'REVISION_REQUESTED', 'Revision Requested'
    APPROVED = 'APPROVED', 'Approved by Customer'
    COMPLETED = 'COMPLETED', 'Completed & Delivered'

class VideoTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='video_task')
    assigned_specialist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_video_tasks'
    )
    status = models.CharField(
        max_length=30,
        choices=VideoTaskStatus.choices,
        default=VideoTaskStatus.QUEUED,
        db_index=True
    )
    storyboard_json = models.JSONField(default=dict, blank=True)
    preview_video_url = models.URLField(max_length=500, blank=True, null=True)
    final_video_url = models.URLField(max_length=500, blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=60)
    resolution = models.CharField(max_length=20, default='1080p')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'video_tasks'
        ordering = ['created_at']

    def __str__(self):
        return f"Video Task for {self.order.order_reference} [{self.status}]"

