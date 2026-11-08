from django.db import models
from django.conf import settings
from django.utils import timezone

class CentralActivityLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    actor_role = models.CharField(max_length=50, default='SYSTEM')
    action = models.CharField(max_length=100, db_index=True)
    module = models.CharField(max_length=50, db_index=True)
    record_id = models.CharField(max_length=100, db_index=True)
    previous_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[('SUCCESS', 'SUCCESS'), ('FAILURE', 'FAILURE')],
        default='SUCCESS'
    )
    remarks = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'central_activity_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.action} by {self.actor_role} on {self.module}:{self.record_id} ({self.status})"

