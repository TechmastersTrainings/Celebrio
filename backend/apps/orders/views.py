import os
import mimetypes
from decimal import Decimal
from urllib.parse import quote
from django.db import transaction
from django.utils import timezone
from django.http import FileResponse, Http404
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Order, CustomerAsset, OrderStatus, Coupon, CouponUsage, CallbackRequest
from .serializers import (
    OrderCreateSerializer,
    OrderDetailSerializer,
    CustomerAssetSerializer,
    CouponSerializer,
    CallbackRequestSerializer,
)
from .ocr_service import CardOCRExtractor
from apps.tickets.models import TicketStatus, TicketStatusHistory
from apps.designs.models import DesignStatus, RevisionRequest
from apps.publishing.models import PublicationStatus
from apps.audit.services import log_activity
from apps.accounts.permissions import IsAdminUserRole, IsApprovedDeveloper

class OrderCreateView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save()
        return Response({
            'success': True,
            'data': {
                'order_reference': order.order_reference,
                'status': order.status,
                'ticket_id': str(order.ticket.id),
                'ticket_status': order.ticket.status,
                'customer_facing_status': order.ticket.customer_facing_status,
                'base_amount_inr': str(order.base_amount_inr),
                'auto_discount_amount_inr': str(order.auto_discount_amount_inr),
                'coupon_discount_amount_inr': str(order.coupon_discount_amount_inr),
                'total_amount_inr': str(order.total_amount_inr),
                'you_save': str(order.auto_discount_amount_inr + order.coupon_discount_amount_inr),
                'quotation_snapshot': order.quotation_snapshot_json,
                'completeness_score': order.completeness_score,
                'message': f"Order created successfully! Your unique reference is {order.order_reference}."
            }
        }, status=status.HTTP_201_CREATED)

class OrderLookupView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ref = request.query_params.get('ref')
        if not ref:
            return Response({'success': False, 'error': {'message': 'Order reference parameter `ref` required.'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.select_related('occasion', 'package', 'ticket', 'applied_coupon').prefetch_related('events', 'assets', 'ticket__design_versions').get(order_reference__iexact=ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderDetailSerializer(order)
        return Response({'success': True, 'data': serializer.data})

class CardOCRExtractView(views.APIView):
    """
    Accepts physical card scans / photographs and extracts structured ceremony data.
    Identifies found vs missing fields with confidence scores.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = request.FILES.get('file') or request.FILES.get('card_file')
        occasion_type = request.data.get('occasion_type', 'wedding')
        filename = file_obj.name if file_obj else 'invitation_card.jpg'

        result = CardOCRExtractor.extract_from_file(
            file_obj=file_obj,
            filename=filename,
            occasion_type=occasion_type
        )

        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)

class PublicCouponsListView(views.APIView):
    """
    Returns active public offers and default celebration discounts for the website.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        from django.db.models import Q
        coupons = Coupon.objects.filter(is_active=True, is_public=True).filter(Q(end_date__isnull=True) | Q(end_date__gte=now))
        serializer = CouponSerializer(coupons, many=True)

        # Include default 12% offer explanation
        return Response({
            'success': True,
            'data': {
                'default_offer': {
                    'percentage': 12,
                    'title': 'Default 12% Celebration Offer',
                    'description': 'An automatic 12% savings benefit applied to every eligible digital celebration order without entering any code.'
                },
                'coupons': serializer.data
            }
        }, status=status.HTTP_200_OK)

class CouponValidateView(views.APIView):
    """
    Validates a coupon code against an order amount and returns real rupee savings.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('coupon_code', '').strip().upper()
        amount_val = request.data.get('amount', 0)

        try:
            base_amount = Decimal(str(amount_val))
        except Exception:
            base_amount = Decimal('0.00')

        # 1. Default 12% automatic offer calculation
        auto_offer = Coupon.objects.filter(is_system_default_offer=True, is_active=True).first()
        auto_rate = Decimal(str(auto_offer.discount_value / 100)) if auto_offer else Decimal('0.12')
        auto_discount = round(base_amount * auto_rate, 2)

        if not code:
            # Return baseline with only default 12% applied
            return Response({
                'success': True,
                'data': {
                    'is_valid': True,
                    'coupon_code': None,
                    'base_amount': str(base_amount),
                    'auto_discount_amount': str(auto_discount),
                    'coupon_discount_amount': '0.00',
                    'total_discount': str(auto_discount),
                    'you_save': str(auto_discount),
                    'final_payable_amount': str(max(Decimal('0.00'), base_amount - auto_discount)),
                    'message': f"Default 12% offer applied. You save ₹{auto_discount}."
                }
            })

        coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()
        if not coupon:
            return Response({
                'success': False,
                'error': {'message': f'Coupon code "{code}" is invalid or expired.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if coupon.end_date and coupon.end_date < now:
            return Response({
                'success': False,
                'error': {'message': f'Coupon code "{code}" expired on {coupon.end_date.strftime("%d %b %Y")}.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        if base_amount < coupon.min_order_value:
            return Response({
                'success': False,
                'error': {'message': f'Coupon requires a minimum order value of ₹{coupon.min_order_value}. Current order: ₹{base_amount}.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        if coupon.total_usage_limit and coupon.current_usage_count >= coupon.total_usage_limit:
            return Response({
                'success': False,
                'error': {'message': 'This coupon has reached its maximum total redemptions.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate coupon discount
        if coupon.discount_type == 'PERCENTAGE':
            disc = base_amount * Decimal(str(coupon.discount_value / 100))
            if coupon.max_discount_amount:
                disc = min(disc, Decimal(str(coupon.max_discount_amount)))
            coupon_discount = round(disc, 2)
        else:
            coupon_discount = min(Decimal(str(coupon.discount_value)), base_amount)

        # Stacking calculation
        if coupon.can_combine_with_auto_discount:
            total_discount = auto_discount + coupon_discount
            stacking_msg = f"Coupon {coupon.code} combined with default 12% offer."
        else:
            if coupon_discount > auto_discount:
                total_discount = coupon_discount
                auto_discount = Decimal('0.00')
                stacking_msg = f"Coupon {coupon.code} applied (savings of ₹{coupon_discount} exceed default offer)."
            else:
                total_discount = auto_discount
                coupon_discount = Decimal('0.00')
                stacking_msg = "Default 12% offer provides greater benefit and was maintained."

        total_discount = min(total_discount, base_amount)
        final_payable = max(Decimal('0.00'), base_amount - total_discount)

        return Response({
            'success': True,
            'data': {
                'is_valid': True,
                'coupon_code': coupon.code,
                'description': coupon.description,
                'base_amount': str(base_amount),
                'auto_discount_amount': str(auto_discount),
                'coupon_discount_amount': str(coupon_discount),
                'total_discount': str(total_discount),
                'you_save': str(total_discount),
                'final_payable_amount': str(final_payable),
                'can_combine': coupon.can_combine_with_auto_discount,
                'message': stacking_msg
            }
        }, status=status.HTTP_200_OK)

class AdminCouponListView(views.APIView):
    """
    Admin coupon management: list all coupons and create new coupons.
    """
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        coupons = Coupon.objects.all().order_by('-created_at')
        serializer = CouponSerializer(coupons, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        coupon = serializer.save()
        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='COUPON_CREATED',
            module='CATALOG',
            record_id=str(coupon.id),
            new_value={'code': coupon.code, 'discount_value': str(coupon.discount_value)},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )
        return Response({'success': True, 'data': CouponSerializer(coupon).data}, status=status.HTTP_201_CREATED)

class AdminCouponDetailView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, coupon_id):
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Coupon not found.'}}, status=status.HTTP_404_NOT_FOUND)

        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        coupon = serializer.save()
        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='COUPON_UPDATED',
            module='CATALOG',
            record_id=str(coupon.id),
            new_value={'code': coupon.code, 'is_active': coupon.is_active},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )
        return Response({'success': True, 'data': CouponSerializer(coupon).data})

    def delete(self, request, coupon_id):
        try:
            coupon = Coupon.objects.get(id=coupon_id)
        except Coupon.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Coupon not found.'}}, status=status.HTTP_404_NOT_FOUND)

        code = coupon.code
        coupon.delete()
        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='COUPON_DELETED',
            module='CATALOG',
            record_id=str(coupon_id),
            remarks=f"Coupon {code} deleted",
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )
        return Response({'success': True, 'data': {'message': f"Coupon {code} deleted."}})

class CallbackRequestCreateView(views.APIView):
    """
    Public endpoint for customer support callback requests.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CallbackRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        callback = serializer.save()
        log_activity(
            action='CALLBACK_REQUESTED',
            module='ORDERS',
            record_id=str(callback.id),
            actor_role='CUSTOMER',
            new_value={'customer_mobile': callback.customer_mobile, 'name': callback.customer_name},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS',
            remarks=f"Callback requested: {callback.customer_name} ({callback.customer_mobile})"
        )
        return Response({
            'success': True,
            'data': {
                'id': str(callback.id),
                'message': 'Callback request received! Our support team will contact you shortly.'
            }
        }, status=status.HTTP_201_CREATED)

class AdminCallbackListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        callbacks = CallbackRequest.objects.all().order_by('-created_at')
        serializer = CallbackRequestSerializer(callbacks, many=True)
        return Response({'success': True, 'data': serializer.data})

class AdminCallbackDetailView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, callback_id):
        try:
            callback = CallbackRequest.objects.get(id=callback_id)
        except CallbackRequest.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Callback request not found.'}}, status=status.HTTP_404_NOT_FOUND)

        serializer = CallbackRequestSerializer(callback, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        callback = serializer.save()
        log_activity(
            actor=request.user,
            actor_role=request.user.role,
            action='CALLBACK_STATUS_UPDATED',
            module='ORDERS',
            record_id=str(callback.id),
            new_value={'status': callback.status},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )
        return Response({'success': True, 'data': CallbackRequestSerializer(callback).data})

class AdminOrderMissingInfoUpdateView(views.APIView):
    """
    Allows Admin or Assigned Developer to update missing details, mark information confirmed,
    and authorize the order for production.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_ref):
        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        ticket = getattr(order, 'ticket', None)
        if not user.is_admin_role and (not ticket or ticket.assigned_developer != user):
            return Response({'success': False, 'error': {'message': 'Access forbidden.'}}, status=status.HTTP_403_FORBIDDEN)

        update_fields = []
        if 'occasion_requirements' in request.data:
            order.occasion_requirements_json = request.data['occasion_requirements']
            update_fields.append('occasion_requirements_json')

        if 'missing_fields' in request.data:
            order.missing_fields_json = request.data['missing_fields']
            update_fields.append('missing_fields_json')

        if 'is_information_confirmed' in request.data:
            order.is_information_confirmed = bool(request.data['is_information_confirmed'])
            update_fields.append('is_information_confirmed')

        if 'is_ready_for_production' in request.data:
            order.is_ready_for_production = bool(request.data['is_ready_for_production'])
            update_fields.append('is_ready_for_production')
            if order.is_ready_for_production and order.status == OrderStatus.SUBMITTED:
                order.status = OrderStatus.REQUIREMENTS_CONFIRMED
                update_fields.append('status')

        # Recalculate completeness
        missing_count = len(order.missing_fields_json or [])
        score = 80 if order.is_information_confirmed else 60
        if missing_count == 0:
            score = 100
        else:
            score = max(20, score - (missing_count * 5))
        order.completeness_score = score
        update_fields.append('completeness_score')

        order.save(update_fields=update_fields)

        log_activity(
            actor=user,
            actor_role=user.role,
            action='ORDER_REQUIREMENTS_UPDATED',
            module='ORDERS',
            record_id=str(order.id),
            new_value={'is_confirmed': order.is_information_confirmed, 'score': order.completeness_score},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS',
            remarks=f"Requirements updated for order {order.order_reference} by {user.full_name}."
        )

        return Response({
            'success': True,
            'data': OrderDetailSerializer(order).data
        })

class CustomerAssetUploadView(views.APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, order_ref):
        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        uploaded_file = request.FILES.get('file')
        category = request.data.get('asset_category', 'COUPLE_PHOTO')
        file_name = request.data.get('file_name', uploaded_file.name if uploaded_file else 'uploaded_file.jpg')

        # Store file in media storage
        file_key = f"assets/{order.order_reference}/{file_name}"
        file_size = uploaded_file.size if uploaded_file else 1024
        file_type = uploaded_file.content_type if uploaded_file else 'image/jpeg'

        if uploaded_file:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            if default_storage.exists(file_key):
                default_storage.delete(file_key)
            default_storage.save(file_key, ContentFile(uploaded_file.read()))

        asset = CustomerAsset.objects.create(
            order=order,
            file_key=file_key,
            file_name=file_name,
            file_type=file_type,
            file_size_bytes=file_size,
            asset_category=category
        )

        log_activity(
            action='ASSET_UPLOADED',
            module='ORDERS',
            record_id=str(order.id),
            actor_role='CUSTOMER',
            new_value={'file_name': file_name, 'category': category},
            ip_address=request.META.get('REMOTE_ADDR'),
            status='SUCCESS'
        )

        return Response({
            'success': True,
            'data': CustomerAssetSerializer(asset).data
        }, status=status.HTTP_201_CREATED)

class CustomerAssetDownloadView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, asset_id):
        try:
            asset = CustomerAsset.objects.select_related('order').get(id=asset_id)
        except CustomerAsset.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Attachment not found.'}}, status=status.HTTP_404_NOT_FOUND)

        is_preview = request.query_params.get('preview', '0') in ['1', 'true', 'True']
        file_key = asset.file_key

        from django.core.files.storage import default_storage
        from django.conf import settings

        file_obj = None
        if default_storage.exists(file_key):
            file_obj = default_storage.open(file_key, 'rb')
        else:
            alt_path = os.path.join(settings.MEDIA_ROOT, file_key)
            if os.path.exists(alt_path):
                file_obj = open(alt_path, 'rb')

        if not file_obj:
            if asset.file_type and asset.file_type.startswith('image/'):
                from django.http import HttpResponse
                svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
                    <rect width="600" height="400" fill="#0B1B3D"/>
                    <rect x="20" y="20" width="560" height="360" fill="none" stroke="#D4AF37" stroke-width="2"/>
                    <text x="300" y="180" font-family="sans-serif" font-size="20" fill="#E5C07B" text-anchor="middle" font-weight="bold">TECHMASTERS CUSTOMER ATTACHMENT</text>
                    <text x="300" y="220" font-family="sans-serif" font-size="16" fill="#FFFFFF" text-anchor="middle">{asset.file_name}</text>
                    <text x="300" y="250" font-family="sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">Category: {asset.asset_category} | Order: {asset.order.order_reference}</text>
                </svg>'''
                resp = HttpResponse(svg_content, content_type='image/svg+xml')
                safe_name = asset.file_name.encode('ascii', 'ignore').decode('ascii') or 'attachment'
                if not is_preview:
                    resp['Content-Disposition'] = f'attachment; filename="{safe_name}"'
                return resp
            return Response({
                'success': False,
                'error': {'message': f'Attachment file "{asset.file_name}" is not present on disk.'}
            }, status=status.HTTP_404_NOT_FOUND)

        content_type = asset.file_type or mimetypes.guess_type(asset.file_name)[0] or 'application/octet-stream'

        response = FileResponse(file_obj, content_type=content_type)
        safe_filename = asset.file_name.encode('ascii', 'ignore').decode('ascii') or 'download'
        encoded_filename = quote(asset.file_name)

        if is_preview:
            response['Content-Disposition'] = f'inline; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}'
        else:
            response['Content-Disposition'] = f'attachment; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}'

        response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length'
        return response

class CustomerDesignApproveView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, order_ref):
        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
            ticket = order.ticket
            latest_design = ticket.design_versions.order_by('-version_number').first()
        except (Order.DoesNotExist, Exception):
            return Response({'success': False, 'error': {'message': 'Order or design draft not found.'}}, status=status.HTTP_404_NOT_FOUND)

        if not latest_design:
            return Response({'success': False, 'error': {'message': 'No design version has been uploaded for this order yet.'}}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            previous_status = ticket.status
            latest_design.status = DesignStatus.APPROVED_BY_CUSTOMER
            latest_design.save(update_fields=['status'])

            ticket.status = TicketStatus.AWAITING_PAYMENT
            ticket.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.AWAITING_PAYMENT,
                transition_reason="Customer approved final design draft."
            )

            log_activity(
                action='DESIGN_APPROVED',
                module='DESIGNS',
                record_id=str(latest_design.id),
                actor_role='CUSTOMER',
                new_value={'ticket_status': ticket.status, 'design_version': latest_design.version_number},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks="Design approved by customer. Order advanced to Awaiting Payment."
            )

        return Response({
            'success': True,
            'data': {
                'message': 'Design approved successfully! Please proceed to payment to finalize and publish your celebration.',
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status,
                'total_amount_inr': str(order.total_amount_inr)
            }
        }, status=status.HTTP_200_OK)

class CustomerRevisionRequestView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, order_ref):
        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
            ticket = order.ticket
            latest_design = ticket.design_versions.order_by('-version_number').first()
        except (Order.DoesNotExist, Exception):
            return Response({'success': False, 'error': {'message': 'Order or draft not found.'}}, status=status.HTTP_404_NOT_FOUND)

        feedback_text = request.data.get('feedback_text', '').strip()
        if not feedback_text:
            return Response({'success': False, 'error': {'feedback_text': 'Revision feedback comments are required.'}}, status=status.HTTP_400_BAD_REQUEST)

        previous_revisions_count = RevisionRequest.objects.filter(design_version__ticket=ticket).count()
        current_round = previous_revisions_count + 1
        free_limit = order.package.included_revisions
        is_billable = current_round > free_limit

        with transaction.atomic():
            previous_status = ticket.status
            latest_design.status = DesignStatus.REVISED
            latest_design.save(update_fields=['status'])

            rev = RevisionRequest.objects.create(
                design_version=latest_design,
                round_number=current_round,
                is_billable=is_billable,
                customer_feedback=feedback_text
            )

            ticket.status = TicketStatus.WORK_IN_PROGRESS
            ticket.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.WORK_IN_PROGRESS,
                transition_reason=f"Customer requested revision round #{current_round}. Billable: {is_billable}."
            )

            log_activity(
                action='REVISION_REQUESTED',
                module='DESIGNS',
                record_id=str(rev.id),
                actor_role='CUSTOMER',
                new_value={'round_number': current_round, 'is_billable': is_billable, 'ticket_status': ticket.status},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Customer submitted revision #{current_round}."
            )

        return Response({
            'success': True,
            'data': {
                'revision_round': current_round,
                'is_billable': is_billable,
                'free_revisions_total': free_limit,
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status,
                'message': f"Revision round #{current_round} submitted to your designer." + (" (Additional revision fee applies)" if is_billable else " (Included in your package free revision quota)")
            }
        }, status=status.HTTP_200_OK)

class CustomerDeliverablesView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_ref):
        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        publication = getattr(order, 'publication', None)
        if not publication or not publication.is_published:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_YET_PUBLISHED',
                    'message': 'Your invitation is not yet published. Final publication occurs after verified payment and Admin authorization.'
                }
            }, status=status.HTTP_403_FORBIDDEN)

        qr = getattr(publication, 'qr_code', None)

        return Response({
            'success': True,
            'data': {
                'order_reference': order.order_reference,
                'neutral_url': f"/invite/{publication.neutral_slug}",
                'full_public_url': f"http://localhost:5173/invite/{publication.neutral_slug}",
                'qr_code_svg': qr.svg_payload if qr else None,
                'expires_at': publication.expires_at.isoformat(),
                'whatsapp_share_text': f"You're invited to celebrate {order.customer_name}'s {order.occasion.display_name}! View details & RSVP: http://localhost:5173/invite/{publication.neutral_slug}",
                'downloads': [
                    {'title': 'Digital Invitation Card (HD PNG)', 'format': 'PNG', 'url': f"/media/deliverables/{order.order_reference}/card.png"},
                    {'title': 'Print-Ready Multi-Slide Card (PDF)', 'format': 'PDF', 'url': f"/media/deliverables/{order.order_reference}/card.pdf"},
                    {'title': 'QR Code Pass (SVG)', 'format': 'SVG', 'url': f"/media/deliverables/{order.order_reference}/qr.svg"},
                ]
            }
        }, status=status.HTTP_200_OK)
