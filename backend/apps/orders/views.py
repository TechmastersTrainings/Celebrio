import os
from django.db import transaction
from django.utils import timezone
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

        # Store file in media or mock storage
        file_key = f"assets/{order.order_reference}/{file_name}"
        file_size = uploaded_file.size if uploaded_file else 1024
        file_type = uploaded_file.content_type if uploaded_file else 'image/jpeg'

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

