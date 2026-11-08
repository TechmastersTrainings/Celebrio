from rest_framework import serializers
from .models import CentralActivityLog

class CentralActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = CentralActivityLog
        fields = [
            'id',
            'actor',
            'actor_name',
            'actor_role',
            'action',
            'module',
            'record_id',
            'previous_value',
            'new_value',
            'ip_address',
            'user_agent',
            'status',
            'remarks',
            'timestamp',
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return getattr(obj.actor, 'full_name', str(obj.actor))
        return obj.actor_role

