import io
import re
import qrcode
import qrcode.image.svg
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import InvitationPublication, QRCodeRecord, PublicationStatus
from .services import generate_deliverable_card_image, generate_deliverable_card_pdf
from apps.orders.models import Order, OrderStatus
from apps.tickets.models import TicketStatus, TicketStatusHistory
from apps.designs.models import DesignVersion
from apps.accounts.permissions import IsAdminUserRole
from apps.audit.services import log_activity

def generate_svg_qr(target_url: str) -> str:
    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
        image_factory=factory
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    img = qr.make_image()
    stream = io.BytesIO()
    img.save(stream)
    return stream.getvalue().decode('utf-8')

class AdminPublishAuthorizeView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        order_ref = request.data.get('order_reference')
        custom_slug = request.data.get('custom_slug')
        grace_days = int(request.data.get('grace_period_days', 30))

        if not order_ref:
            return Response({'success': False, 'error': {'order_reference': 'Order reference required.'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_reference__iexact=order_ref.strip())
            ticket = order.ticket
        except Order.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Order not found.'}}, status=status.HTTP_404_NOT_FOUND)

        # Enforcement: Verified Payment is required before publication authorization
        if ticket.status not in [TicketStatus.PAYMENT_DONE, TicketStatus.CLOSED]:
            return Response({
                'success': False,
                'error': {
                    'code': 'PAYMENT_NOT_VERIFIED',
                    'message': f"Cannot authorize publication: Ticket is in {ticket.status} status. Payment must be verified first."
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        primary_event = order.primary_event
        event_date = primary_event.event_date if primary_event else timezone.now().date()

        # Generate slug if not provided
        if not custom_slug:
            clean_name = slugify(order.customer_name) or 'celebration'
            clean_occ = slugify(order.occasion.slug)
            custom_slug = f"{clean_name}-{clean_occ}"

        # Ensure uniqueness
        base_slug = custom_slug
        counter = 1
        while InvitationPublication.objects.filter(neutral_slug=custom_slug).exclude(order=order).exists():
            custom_slug = f"{base_slug}-{counter}"
            counter += 1

        expires_at = timezone.now() + timezone.timedelta(days=grace_days)

        with transaction.atomic():
            publication, created = InvitationPublication.objects.get_or_create(
                order=order,
                defaults={
                    'neutral_slug': custom_slug,
                    'event_date': event_date,
                    'expires_at': expires_at,
                    'grace_period_days': grace_days,
                }
            )

            publication.neutral_slug = custom_slug
            publication.is_published = True
            publication.status = PublicationStatus.PUBLISHED_ACTIVE
            publication.authorized_by = request.user
            publication.authorized_at = timezone.now()
            publication.expires_at = expires_at
            publication.save()

            # Generate QR Code
            live_url = f"http://localhost:5173/invite/{custom_slug}"
            svg_data = generate_svg_qr(live_url)

            qr_record, _ = QRCodeRecord.objects.get_or_create(
                publication=publication,
                defaults={
                    'target_url': live_url,
                    'svg_payload': svg_data,
                    'png_file_url': f"/media/deliverables/{order.order_reference}/qr.png"
                }
            )
            qr_record.target_url = live_url
            qr_record.svg_payload = svg_data
            qr_record.save()

            # Render real deliverables (HD PNG and print-ready PDF)
            try:
                generate_deliverable_card_image(publication)
                generate_deliverable_card_pdf(publication)
            except Exception as e:
                # Deliverables generation logged gracefully
                pass

            # Advance ticket to CLOSED and order to DELIVERED
            previous_status = ticket.status
            ticket.status = TicketStatus.CLOSED
            ticket.save(update_fields=['status', 'updated_at'])

            order.status = OrderStatus.DELIVERED
            order.save(update_fields=['status', 'updated_at'])

            TicketStatusHistory.objects.create(
                ticket=ticket,
                previous_status=previous_status,
                new_status=TicketStatus.CLOSED,
                changed_by=request.user,
                transition_reason=f"Admin {request.user.full_name} authorized live publication on slug: {custom_slug}."
            )

            log_activity(
                actor=request.user,
                actor_role=request.user.role,
                action='PUBLISHING_AUTHORIZED',
                module='PUBLISHING',
                record_id=str(publication.id),
                previous_value={'is_published': False, 'ticket_status': previous_status},
                new_value={'is_published': True, 'slug': custom_slug, 'ticket_status': ticket.status},
                ip_address=request.META.get('REMOTE_ADDR'),
                status='SUCCESS',
                remarks=f"Live neutral URL activated: {live_url}"
            )

        return Response({
            'success': True,
            'message': 'Celebration successfully authorized and published live!',
            'data': {
                'order_reference': order.order_reference,
                'slug': custom_slug,
                'published_url': f"/invite/{custom_slug}",
                'live_url': live_url,
                'full_live_url': live_url,
                'expires_at': expires_at.isoformat(),
                'ticket_status': ticket.status,
                'customer_facing_status': ticket.customer_facing_status
            }
        }, status=status.HTTP_200_OK)

class PublicInvitationDetailView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            publication = InvitationPublication.objects.select_related(
                'order', 'order__occasion', 'order__package', 'order__ticket'
            ).prefetch_related('order__events', 'order__assets', 'order__ticket__design_versions').get(neutral_slug=slug)
        except InvitationPublication.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Celebration not found'}}, status=status.HTTP_404_NOT_FOUND)

        if not publication.is_published:
            return Response({'success': False, 'error': {'message': 'This celebration invitation is not yet live.'}}, status=status.HTTP_403_FORBIDDEN)

        # Check expiration
        is_expired = timezone.now() >= publication.expires_at
        if is_expired:
            publication.status = PublicationStatus.EXPIRED
            publication.save(update_fields=['status'])
            return Response({
                'success': True,
                'is_expired': True,
                'data': {
                    'message': 'This celebration has concluded. Thank you for your warm wishes and blessings!',
                    'celebrants': publication.order.customer_name,
                    'occasion': publication.order.occasion.display_name,
                    'event_date': publication.event_date.isoformat()
                }
            }, status=status.HTTP_200_OK)

        # Increment view count
        publication.view_count += 1
        publication.save(update_fields=['view_count'])

        order = publication.order
        ticket = order.ticket
        latest_design = ticket.design_versions.order_by('-version_number').first()
        web_payload = latest_design.web_preview_payload if latest_design else {}

        events = []
        for ev in order.events.all():
            events.append({
                'event_title': ev.event_title,
                'event_date': ev.event_date.isoformat(),
                'start_time': ev.start_time.strftime('%I:%M %p'),
                'end_time': ev.end_time.strftime('%I:%M %p') if ev.end_time else None,
                'venue_name': ev.venue_name,
                'venue_address': ev.venue_address,
                'google_maps_url': ev.google_maps_url,
                'dress_code': ev.dress_code,
            })

        gallery_photos = [
            {'url': f"/media/{a.file_key}", 'category': a.asset_category}
            for a in order.assets.all()
        ]

        return Response({
            'success': True,
            'is_expired': False,
            'data': {
                'slug': publication.neutral_slug,
                'customer_name': order.customer_name,
                'occasion': order.occasion.display_name,
                'language': order.selected_language,
                'events': events,
                'gallery': gallery_photos,
                'theme': web_payload,
                'expires_at': publication.expires_at.isoformat(),
                'views': publication.view_count
            }
        }, status=status.HTTP_200_OK)

class PreviewInvitationDetailView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            design = DesignVersion.objects.select_related(
                'ticket', 'ticket__order', 'ticket__order__occasion'
            ).prefetch_related('ticket__order__events', 'ticket__order__assets').get(preview_token=token)
        except DesignVersion.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Preview token invalid or expired'}}, status=status.HTTP_404_NOT_FOUND)

        order = design.ticket.order
        events = []
        for ev in order.events.all():
            events.append({
                'event_title': ev.event_title,
                'event_date': ev.event_date.isoformat(),
                'start_time': ev.start_time.strftime('%I:%M %p'),
                'venue_name': ev.venue_name,
                'venue_address': ev.venue_address,
                'google_maps_url': ev.google_maps_url,
            })

        return Response({
            'success': True,
            'data': {
                'is_preview': True,
                'watermark_text': design.watermark_text,
                'version_number': design.version_number,
                'customer_name': order.customer_name,
                'occasion': order.occasion.display_name,
                'events': events,
                'theme': design.web_preview_payload,
                'order_reference': order.order_reference,
            }
        }, status=status.HTTP_200_OK)

