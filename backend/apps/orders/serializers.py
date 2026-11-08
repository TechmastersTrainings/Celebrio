from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderEvent, CustomerAsset, OrderStatus, generate_order_reference
from apps.catalog.models import Occasion, Package
from apps.tickets.models import Ticket, TicketStatus, TicketStatusHistory
from apps.video_production.models import VideoTask, VideoTaskStatus
from apps.audit.services import log_activity

class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = [
            'id',
            'event_title',
            'event_date',
            'start_time',
            'end_time',
            'venue_name',
            'venue_address',
            'google_maps_url',
            'dress_code',
        ]

class CustomerAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAsset
        fields = [
            'id',
            'file_name',
            'file_key',
            'file_type',
            'file_size_bytes',
            'asset_category',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_at']

class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    customer_mobile = serializers.CharField(max_length=20)
    customer_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    occasion_id = serializers.UUIDField()
    package_id = serializers.UUIDField()
    selected_language = serializers.CharField(max_length=50, default='English')
    special_instructions = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    include_video = serializers.BooleanField(default=False)
    events = OrderEventSerializer(many=True, required=False, default=list)

    def validate(self, attrs):
        try:
            attrs['occasion'] = Occasion.objects.get(id=attrs['occasion_id'], is_active=True)
        except Occasion.DoesNotExist:
            raise serializers.ValidationError({'occasion_id': 'Invalid or inactive celebration occasion.'})

        try:
            attrs['package'] = Package.objects.get(id=attrs['package_id'], occasion=attrs['occasion'], is_active=True)
        except Package.DoesNotExist:
            raise serializers.ValidationError({'package_id': 'Invalid package for selected occasion.'})

        return attrs

    def create(self, validated_data):
        events_data = validated_data.pop('events', [])
        include_video = validated_data.pop('include_video', False)
        occasion = validated_data.pop('occasion')
        package = validated_data.pop('package')
        validated_data.pop('occasion_id')
        validated_data.pop('package_id')

        with transaction.atomic():
            order_ref = generate_order_reference()
            total_amount = package.base_price_inr
            if include_video:
                total_amount += 299  # Baseline configurable add-on seed

            order = Order.objects.create(
                order_reference=order_ref,
                occasion=occasion,
                package=package,
                total_amount_inr=total_amount,
                **validated_data
            )

            # Create events
            for ev_data in events_data:
                OrderEvent.objects.create(order=order, **ev_data)

            # Create corresponding ServiceNow-style ticket
            ticket = Ticket.objects.create(
                ticket_number=order_ref,
                order=order,
                status=TicketStatus.NEW_OPEN,
                eligible_at=timezone.now()
            )

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status='CREATED',
                new_status=TicketStatus.NEW_OPEN,
                transition_reason="Order submitted and entered into available queue."
            )

            # Create video task if video requested
            if include_video or 'video' in package.name.lower():
                VideoTask.objects.create(
                    order=order,
                    status=VideoTaskStatus.QUEUED
                )

            # Central Activity Log
            log_activity(
                action='ORDER_CREATED',
                module='ORDERS',
                record_id=str(order.id),
                actor_role='ANON_GUEST',
                new_value={
                    'order_reference': order.order_reference,
                    'customer_name': order.customer_name,
                    'package': package.name,
                    'total_amount_inr': str(order.total_amount_inr)
                },
                status='SUCCESS',
                remarks=f"Order {order_ref} submitted via customer portal intake wizard."
            )

            return order

class OrderDetailSerializer(serializers.ModelSerializer):
    events = OrderEventSerializer(many=True, read_only=True)
    assets = CustomerAssetSerializer(many=True, read_only=True)
    occasion_name = serializers.CharField(source='occasion.display_name', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    ticket_status = serializers.CharField(source='ticket.status', read_only=True)
    customer_facing_status = serializers.CharField(source='ticket.customer_facing_status', read_only=True)
    customer_facing_explanation = serializers.CharField(source='ticket.customer_facing_explanation', read_only=True)
    has_active_preview = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    published_url = serializers.SerializerMethodField()
    is_published = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_reference',
            'customer_name',
            'customer_mobile',
            'customer_email',
            'occasion_name',
            'package_name',
            'selected_language',
            'status',
            'total_amount_inr',
            'special_instructions',
            'events',
            'assets',
            'ticket_status',
            'customer_facing_status',
            'customer_facing_explanation',
            'has_active_preview',
            'preview_url',
            'published_url',
            'is_published',
            'created_at',
        ]

    def get_has_active_preview(self, obj):
        ticket = getattr(obj, 'ticket', None)
        if ticket:
            latest = ticket.design_versions.order_by('-version_number').first()
            return latest is not None
        return False

    def get_preview_url(self, obj):
        ticket = getattr(obj, 'ticket', None)
        if ticket:
            latest = ticket.design_versions.order_by('-version_number').first()
            if latest:
                return f"/preview/{latest.preview_token}"
        return None

    def get_published_url(self, obj):
        publication = getattr(obj, 'publication', None)
        if publication and publication.is_published:
            return f"/invite/{publication.neutral_slug}"
        return None

    def get_is_published(self, obj):
        publication = getattr(obj, 'publication', None)
        return bool(publication and publication.is_published)

