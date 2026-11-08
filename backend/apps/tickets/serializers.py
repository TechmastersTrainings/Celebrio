from rest_framework import serializers
from .models import Ticket, TicketStatusHistory, TicketAssignmentHistory, TicketInternalNote
from apps.orders.serializers import OrderDetailSerializer
from apps.designs.models import DesignVersion, RevisionRequest

class TicketStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        model = TicketStatusHistory
        fields = [
            'id',
            'previous_status',
            'new_status',
            'changed_by_name',
            'transition_reason',
            'created_at',
        ]

class TicketAssignmentHistorySerializer(serializers.ModelSerializer):
    developer_name = serializers.CharField(source='developer.full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True)

    class Meta:
        model = TicketAssignmentHistory
        fields = [
            'id',
            'developer_name',
            'assigned_by_name',
            'assignment_type',
            'notes',
            'created_at',
        ]

class TicketInternalNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = TicketInternalNote
        fields = [
            'id',
            'author',
            'author_name',
            'note_text',
            'created_at',
        ]
        read_only_fields = ['id', 'author', 'author_name', 'created_at']

class DesignVersionSummarySerializer(serializers.ModelSerializer):
    revisions_count = serializers.SerializerMethodField()

    class Meta:
        model = DesignVersion
        fields = [
            'id',
            'version_number',
            'status',
            'preview_token',
            'web_preview_payload',
            'watermark_text',
            'created_at',
            'revisions_count',
        ]

    def get_revisions_count(self, obj):
        return obj.revisions.count()

class TicketListSerializer(serializers.ModelSerializer):
    order_reference = serializers.CharField(source='order.order_reference', read_only=True)
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)
    occasion_name = serializers.CharField(source='order.occasion.display_name', read_only=True)
    package_name = serializers.CharField(source='order.package.name', read_only=True)
    assigned_developer_name = serializers.CharField(source='assigned_developer.full_name', read_only=True)
    customer_facing_status = serializers.CharField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'ticket_number',
            'order_reference',
            'status',
            'priority',
            'customer_name',
            'occasion_name',
            'package_name',
            'assigned_developer',
            'assigned_developer_name',
            'customer_facing_status',
            'eligible_at',
            'assigned_at',
            'due_date',
            'is_on_hold',
            'created_at',
        ]

class TicketDetailSerializer(serializers.ModelSerializer):
    order = OrderDetailSerializer(read_only=True)
    status_history = TicketStatusHistorySerializer(many=True, read_only=True)
    assignment_history = TicketAssignmentHistorySerializer(many=True, read_only=True)
    internal_notes = TicketInternalNoteSerializer(many=True, read_only=True)
    design_versions = DesignVersionSummarySerializer(many=True, read_only=True)
    assigned_developer_name = serializers.CharField(source='assigned_developer.full_name', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'ticket_number',
            'status',
            'priority',
            'assigned_developer',
            'assigned_developer_name',
            'eligible_at',
            'assigned_at',
            'wip_started_at',
            'due_date',
            'is_on_hold',
            'hold_reason',
            'customer_facing_status',
            'customer_facing_explanation',
            'order',
            'design_versions',
            'status_history',
            'assignment_history',
            'internal_notes',
            'created_at',
            'updated_at',
        ]

