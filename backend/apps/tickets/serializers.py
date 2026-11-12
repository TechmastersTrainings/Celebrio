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
    is_customer_visible = serializers.SerializerMethodField()
    note_type = serializers.SerializerMethodField()
    clean_note_text = serializers.SerializerMethodField()

    class Meta:
        model = TicketInternalNote
        fields = [
            'id',
            'author',
            'author_name',
            'note_text',
            'clean_note_text',
            'note_type',
            'is_customer_visible',
            'created_at',
        ]
        read_only_fields = ['id', 'author', 'author_name', 'created_at']

    def get_is_customer_visible(self, obj):
        return obj.note_text.startswith('[CUSTOMER UPDATE]')

    def get_note_type(self, obj):
        if obj.note_text.startswith('[CUSTOMER UPDATE]'):
            return 'CUSTOMER_UPDATE'
        return 'WORK_NOTE'

    def get_clean_note_text(self, obj):
        text = obj.note_text
        if text.startswith('[CUSTOMER UPDATE]'):
            return text[len('[CUSTOMER UPDATE]'):].strip()
        if text.startswith('[WORK NOTE]'):
            return text[len('[WORK NOTE]'):].strip()
        return text

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
    customer_mobile = serializers.CharField(source='order.customer_mobile', read_only=True)
    customer_email = serializers.CharField(source='order.customer_email', read_only=True)
    occasion_name = serializers.CharField(source='order.occasion.display_name', read_only=True)
    occasion_slug = serializers.CharField(source='order.occasion.slug', read_only=True)
    package_name = serializers.CharField(source='order.package.name', read_only=True)
    invitation_type = serializers.CharField(source='order.package.name', read_only=True)
    assigned_developer_name = serializers.CharField(source='assigned_developer.full_name', read_only=True)
    customer_facing_status = serializers.CharField(read_only=True)
    event_date = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    assigned_team = serializers.SerializerMethodField()
    assets_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'ticket_number',
            'order_reference',
            'status',
            'priority',
            'customer_name',
            'customer_mobile',
            'customer_email',
            'occasion_name',
            'occasion_slug',
            'package_name',
            'invitation_type',
            'assigned_developer',
            'assigned_developer_name',
            'assigned_team',
            'customer_facing_status',
            'eligible_at',
            'assigned_at',
            'event_date',
            'due_date',
            'is_on_hold',
            'hold_reason',
            'short_description',
            'assets_count',
            'created_at',
        ]

    def get_event_date(self, obj):
        if hasattr(obj, 'order') and obj.order:
            event = obj.order.primary_event
            if event and event.event_date:
                return event.event_date.isoformat()
        return None

    def get_short_description(self, obj):
        if hasattr(obj, 'order') and obj.order:
            if obj.order.special_instructions:
                return obj.order.special_instructions[:90]
            return f"{obj.order.occasion.display_name} digital invitation suite"
        return "Digital celebration order"

    def get_assigned_team(self, obj):
        if obj.assigned_developer and getattr(obj.assigned_developer, 'can_produce_video', False):
            return "Video Specialist Engineering"
        return "Creative Artisan Engineering"

    def get_assets_count(self, obj):
        if hasattr(obj, 'order') and obj.order:
            return obj.order.assets.count()
        return 0

class TicketDetailSerializer(serializers.ModelSerializer):
    order = OrderDetailSerializer(read_only=True)
    status_history = TicketStatusHistorySerializer(many=True, read_only=True)
    assignment_history = TicketAssignmentHistorySerializer(many=True, read_only=True)
    internal_notes = TicketInternalNoteSerializer(many=True, read_only=True)
    design_versions = DesignVersionSummarySerializer(many=True, read_only=True)
    assigned_developer_name = serializers.CharField(source='assigned_developer.full_name', read_only=True)
    assigned_developer_email = serializers.CharField(source='assigned_developer.email', read_only=True)
    assigned_team = serializers.SerializerMethodField()
    assignment_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'ticket_number',
            'status',
            'priority',
            'assigned_developer',
            'assigned_developer_name',
            'assigned_developer_email',
            'assigned_team',
            'assignment_count',
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

    def get_assigned_team(self, obj):
        if obj.assigned_developer and getattr(obj.assigned_developer, 'can_produce_video', False):
            return "Video Specialist Engineering"
        return "Creative Artisan Engineering"

    def get_assignment_count(self, obj):
        return obj.assignment_history.count()

