from decimal import Decimal
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderEvent, CustomerAsset, OrderStatus, Coupon, CouponUsage, CallbackRequest, generate_order_reference
from apps.catalog.models import Occasion, Package
from apps.tickets.models import Ticket, TicketStatus, TicketStatusHistory
from apps.video_production.models import VideoTask, VideoTaskStatus
from apps.audit.services import log_activity
from apps.locations.services import resolve_event_venue

class OrderEventSerializer(serializers.ModelSerializer):
    venue_address = serializers.CharField(required=False, allow_blank=True, default='')
    venue_name = serializers.CharField(required=False, allow_blank=True, default='Celebration Venue')
    google_maps_url = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=500)

    # Venue selection inputs (write-only; resolved server-side by locations.services)
    venue_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    external_place_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True, max_length=255)
    city_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    locality_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    venue_latitude = serializers.FloatField(required=False, allow_null=True, write_only=True)
    venue_longitude = serializers.FloatField(required=False, allow_null=True, write_only=True)
    venue_type = serializers.ChoiceField(
        choices=['', 'HOME', 'FUNCTION_HALL'],
        required=False, allow_blank=True, default='',
    )
    venue_source = serializers.ChoiceField(
        choices=['', 'VERIFIED_DIRECTORY', 'EXTERNAL_PROVIDER', 'CUSTOMER_PROVIDED'],
        required=False, allow_blank=True, default='',
    )

    # Read-only presentation helpers for Admin / Developer portals
    venue_reference = serializers.SerializerMethodField()
    venue_type_label = serializers.SerializerMethodField()
    venue_source_label = serializers.SerializerMethodField()

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
            'venue_type',
            'venue_type_label',
            'venue_source',
            'venue_source_label',
            'venue_city',
            'venue_locality',
            'venue_contact_phone',
            'venue_snapshot_json',
            'venue_reference',
            'venue_id',
            'external_place_id',
            'city_id',
            'locality_id',
            'venue_latitude',
            'venue_longitude',
        ]
        read_only_fields = ['venue_snapshot_json']
        extra_kwargs = {
            'venue_address': {'required': False, 'allow_blank': True},
            'dress_code': {'required': False, 'allow_blank': True},
            'end_time': {'required': False, 'allow_null': True},
            'venue_city': {'required': False, 'allow_blank': True},
            'venue_locality': {'required': False, 'allow_blank': True},
            'venue_contact_phone': {'required': False, 'allow_blank': True},
        }

    def validate_google_maps_url(self, value):
        value = (value or '').strip()
        if value and not value.lower().startswith(('http://', 'https://')):
            value = f"https://{value}"
        return value or None

    def get_venue_reference(self, obj):
        return str(obj.venue_id) if obj.venue_id else None

    def get_venue_type_label(self, obj):
        from apps.locations.models import VenueType
        return dict(VenueType.choices).get(obj.venue_type) if obj.venue_type else None

    def get_venue_source_label(self, obj):
        return obj.get_venue_source_display() if obj.venue_source else None

class CustomerAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    readable_size = serializers.SerializerMethodField()
    uploaded_by = serializers.SerializerMethodField()
    extension = serializers.SerializerMethodField()

    class Meta:
        model = CustomerAsset
        fields = [
            'id',
            'file_name',
            'file_key',
            'file_type',
            'file_size_bytes',
            'readable_size',
            'asset_category',
            'uploaded_at',
            'uploaded_by',
            'extension',
            'url',
            'download_url',
        ]
        read_only_fields = ['id', 'uploaded_at', 'url', 'download_url']

    def get_url(self, obj):
        return f"/api/v1/orders/assets/{obj.id}/preview/"

    def get_download_url(self, obj):
        return f"/api/v1/orders/assets/{obj.id}/download/"

    def get_readable_size(self, obj):
        bytes_val = obj.file_size_bytes or 0
        if bytes_val >= 1024 * 1024:
            return f"{bytes_val / (1024 * 1024):.1f} MB"
        if bytes_val >= 1024:
            return f"{bytes_val / 1024:.0f} KB"
        return f"{bytes_val} B"

    def get_uploaded_by(self, obj):
        return "Customer"

    def get_extension(self, obj):
        if obj.file_name and '.' in obj.file_name:
            return obj.file_name.rsplit('.', 1)[-1].upper()
        return "FILE"

class CouponSerializer(serializers.ModelSerializer):
    usage_count = serializers.IntegerField(source='current_usage_count', read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id',
            'code',
            'description',
            'discount_type',
            'discount_value',
            'start_date',
            'end_date',
            'is_active',
            'is_public',
            'min_order_value',
            'max_discount_amount',
            'total_usage_limit',
            'current_usage_count',
            'usage_count',
            'per_customer_limit',
            'can_combine_with_auto_discount',
            'is_system_default_offer',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'current_usage_count', 'created_at', 'updated_at']

class CallbackRequestSerializer(serializers.ModelSerializer):
    assigned_staff_name = serializers.CharField(source='assigned_staff.full_name', read_only=True)

    class Meta:
        model = CallbackRequest
        fields = [
            'id',
            'customer_name',
            'customer_mobile',
            'preferred_callback_time',
            'assistance_required',
            'order_reference',
            'status',
            'assigned_staff',
            'assigned_staff_name',
            'admin_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    customer_mobile = serializers.CharField(max_length=20)
    customer_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    occasion_id = serializers.CharField()
    package_id = serializers.CharField()
    selected_language = serializers.CharField(max_length=50, default='English')
    special_instructions = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    include_video = serializers.BooleanField(default=False)
    events = OrderEventSerializer(many=True, required=False, default=list)

    # Physical Card & Dynamic Schemas
    has_physical_card = serializers.BooleanField(default=False)
    physical_card_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ocr_extracted_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ocr_data_json = serializers.JSONField(required=False, default=dict)
    occasion_requirements_json = serializers.JSONField(required=False, default=dict)
    missing_fields_json = serializers.JSONField(required=False, default=list)
    is_information_confirmed = serializers.BooleanField(default=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        occ_val = str(attrs['occasion_id']).strip()
        pkg_val = str(attrs['package_id']).strip()

        # Find occasion by UUID or slug
        occasion = None
        try:
            import uuid
            occ_uuid = uuid.UUID(occ_val)
            occasion = Occasion.objects.filter(id=occ_uuid, is_active=True).first()
        except (ValueError, AttributeError):
            pass

        if not occasion:
            occasion = Occasion.objects.filter(slug=occ_val, is_active=True).first()
        if not occasion:
            occasion = Occasion.objects.filter(display_name__icontains=occ_val, is_active=True).first()
        if not occasion:
            occasion = Occasion.objects.filter(is_active=True).first()

        if not occasion:
            raise serializers.ValidationError({'occasion_id': 'Invalid or inactive celebration occasion.'})
        attrs['occasion'] = occasion

        # Find package by UUID or code or name
        package = None
        try:
            import uuid
            pkg_uuid = uuid.UUID(pkg_val)
            package = Package.objects.filter(id=pkg_uuid, occasion=occasion, is_active=True).first()
        except (ValueError, AttributeError):
            pass

        if not package:
            package = Package.objects.filter(code=pkg_val, occasion=occasion, is_active=True).first()
        if not package:
            package = Package.objects.filter(name__icontains=pkg_val, occasion=occasion, is_active=True).first()
        if not package:
            package = Package.objects.filter(occasion=occasion, is_active=True).first()

        if not package:
            raise serializers.ValidationError({'package_id': 'Invalid package for selected occasion.'})
        attrs['package'] = package

        return attrs

    def create(self, validated_data):
        events_data = validated_data.pop('events', [])
        include_video = validated_data.pop('include_video', False)
        coupon_code = validated_data.pop('coupon_code', None)
        occasion = validated_data.pop('occasion')
        package = validated_data.pop('package')
        validated_data.pop('occasion_id')
        validated_data.pop('package_id')

        with transaction.atomic():
            order_ref = generate_order_reference()

            # Base amount calculation
            base_amount = Decimal(str(package.base_price_inr))
            if include_video:
                base_amount += Decimal('299.00')

            # 1. Automatic Default 12% Discount Calculation
            auto_offer = Coupon.objects.filter(is_system_default_offer=True, is_active=True).first()
            auto_rate = Decimal(str(auto_offer.discount_value / 100)) if auto_offer else Decimal('0.12')
            auto_discount_amount = round(base_amount * auto_rate, 2)

            # 2. Coupon Validation & Application
            applied_coupon = None
            coupon_discount_amount = Decimal('0.00')

            if coupon_code and coupon_code.strip():
                clean_code = coupon_code.strip().upper()
                coupon = Coupon.objects.filter(code__iexact=clean_code, is_active=True).first()
                if coupon:
                    # Check dates
                    now = timezone.now()
                    valid_date = coupon.start_date <= now and (coupon.end_date is None or coupon.end_date >= now)
                    # Check min order value
                    valid_min = base_amount >= coupon.min_order_value
                    # Check usage limits
                    valid_limit = coupon.total_usage_limit is None or coupon.current_usage_count < coupon.total_usage_limit

                    if valid_date and valid_min and valid_limit:
                        applied_coupon = coupon
                        if coupon.discount_type == 'PERCENTAGE':
                            disc = base_amount * Decimal(str(coupon.discount_value / 100))
                            if coupon.max_discount_amount:
                                disc = min(disc, Decimal(str(coupon.max_discount_amount)))
                            coupon_discount_amount = round(disc, 2)
                        else:
                            coupon_discount_amount = min(Decimal(str(coupon.discount_value)), base_amount)

            # 3. Discount Stacking Governance
            total_discount = auto_discount_amount
            if applied_coupon:
                if applied_coupon.can_combine_with_auto_discount:
                    total_discount = auto_discount_amount + coupon_discount_amount
                else:
                    # If coupon provides greater savings than default 12%, apply coupon
                    if coupon_discount_amount > auto_discount_amount:
                        total_discount = coupon_discount_amount
                        auto_discount_amount = Decimal('0.00')
                    else:
                        coupon_discount_amount = Decimal('0.00')

            total_discount = min(total_discount, base_amount)
            final_payable = max(Decimal('0.00'), base_amount - total_discount)

            # 4. Completeness Score Calculation
            missing_fields = validated_data.get('missing_fields_json', [])
            has_card = validated_data.get('has_physical_card', False)
            events_count = len(events_data)
            score = 50
            if has_card:
                score += 20
            if events_count > 0:
                score += 15
            if len(missing_fields) == 0:
                score += 15
            else:
                score -= min(30, len(missing_fields) * 5)
            score = max(10, min(100, score))

            # 5. Build Quotation Snapshot
            quotation_snapshot = {
                'base_amount_inr': str(base_amount),
                'package_name': package.name,
                'include_video': include_video,
                'auto_discount_amount_inr': str(auto_discount_amount),
                'auto_discount_percentage': '12.00',
                'applied_coupon_code': applied_coupon.code if applied_coupon else None,
                'coupon_discount_amount_inr': str(coupon_discount_amount),
                'total_discount_amount_inr': str(total_discount),
                'you_save_inr': str(total_discount),
                'final_payable_amount_inr': str(final_payable),
                'calculated_at': timezone.now().isoformat(),
            }

            order = Order.objects.create(
                order_reference=order_ref,
                occasion=occasion,
                package=package,
                base_amount_inr=base_amount,
                auto_discount_amount_inr=auto_discount_amount,
                coupon_discount_amount_inr=coupon_discount_amount,
                total_amount_inr=final_payable,
                applied_coupon=applied_coupon,
                quotation_snapshot_json=quotation_snapshot,
                completeness_score=score,
                **validated_data
            )

            # Record Coupon Usage if coupon applied
            if applied_coupon and coupon_discount_amount > 0:
                applied_coupon.current_usage_count += 1
                applied_coupon.save(update_fields=['current_usage_count'])
                CouponUsage.objects.create(
                    coupon=applied_coupon,
                    order=order,
                    customer_mobile=order.customer_mobile,
                    discount_amount_inr=coupon_discount_amount
                )

            # Create events
            for ev_data in events_data:
                OrderEvent.objects.create(order=order, **resolve_event_venue(dict(ev_data)))

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
                transition_reason="Order submitted via customer intake wizard. Ready for review."
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
                    'base_amount_inr': str(base_amount),
                    'total_amount_inr': str(order.total_amount_inr),
                    'you_save': str(total_discount),
                    'has_physical_card': order.has_physical_card,
                    'completeness_score': order.completeness_score,
                },
                status='SUCCESS',
                remarks=f"Order {order_ref} submitted. Base: ₹{base_amount}, Discount: ₹{total_discount}, Payable: ₹{final_payable}"
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
    applied_coupon_code = serializers.CharField(source='applied_coupon.code', read_only=True, default=None)
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
            'base_amount_inr',
            'auto_discount_amount_inr',
            'coupon_discount_amount_inr',
            'total_amount_inr',
            'applied_coupon_code',
            'quotation_snapshot_json',
            'has_physical_card',
            'physical_card_notes',
            'ocr_extracted_text',
            'ocr_data_json',
            'occasion_requirements_json',
            'missing_fields_json',
            'is_information_confirmed',
            'is_ready_for_production',
            'completeness_score',
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
            'updated_at',
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
