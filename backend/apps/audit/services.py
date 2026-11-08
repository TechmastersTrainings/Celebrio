import json
from django.utils import timezone
from .models import CentralActivityLog

def log_activity(
    action: str,
    module: str,
    record_id: str,
    actor=None,
    actor_role: str = 'SYSTEM',
    previous_value: dict = None,
    new_value: dict = None,
    ip_address: str = None,
    user_agent: str = None,
    status: str = 'SUCCESS',
    remarks: str = None
) -> CentralActivityLog:
    """
    Central helper to record an immutable audit log entry.
    Ordinary users cannot update or delete this record.
    """
    if actor and hasattr(actor, 'role') and (not actor_role or actor_role == 'SYSTEM'):
        actor_role = actor.role

    return CentralActivityLog.objects.create(
        actor=actor if (actor and getattr(actor, 'is_authenticated', False)) else None,
        actor_role=actor_role or 'ANONYMOUS',
        action=action,
        module=module,
        record_id=str(record_id),
        previous_value=previous_value or {},
        new_value=new_value or {},
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else None,
        status=status,
        remarks=remarks,
        timestamp=timezone.now()
    )

