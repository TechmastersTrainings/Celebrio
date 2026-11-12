import os
import mimetypes
from urllib.parse import quote
from django.db import transaction
from django.utils import timezone
from django.http import FileResponse, Http404
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Order, CustomerAsset, OrderStatus
from .serializers import OrderCreateSerializer, OrderDetailSerializer, CustomerAssetSerializer
from apps.tickets.models import TicketStatus, TicketStatusHistory
from apps.designs.models import DesignStatus, RevisionRequest
from apps.publishing.models import PublicationStatus
from apps.audit.services import log_activity
from apps.accounts.permissions import IsVerifiedCustomerOwnerOrStaff

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
                'total_amount_inr': str(order.total_amount_inr),
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
            order = Order.objects.select_related('occasion', 'package', 'ticket').prefetch_related('events', 'assets', 'ticket__design_versions').get(order_reference__iexact=ref.strip())
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderDetailSerializer(order)
        return Response({'success': True, 'data': serializer.data})

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
    """
    Dedicated endpoint for authenticated / authorized downloading and in-app streaming
    of customer order attachments (photographs, audio tracks, PDFs, documents).
    Supports ?preview=1 for inline viewing (images, PDFs, media) or as attachment download.
    """
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

        # Locate file stream
        file_obj = None
        if default_storage.exists(file_key):
            file_obj = default_storage.open(file_key, 'rb')
        else:
            alt_path = os.path.join(settings.MEDIA_ROOT, file_key)
            if os.path.exists(alt_path):
                file_obj = open(alt_path, 'rb')

        # If file is not yet on storage, generate on-the-fly placeholder or return clear error
        if not file_obj:
            # If it's an image request, generate placeholder SVG/JPEG so the UI doesn't crash
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

        # Count total previous revisions
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

