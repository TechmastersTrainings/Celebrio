import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.conf import settings

def generate_deliverable_card_image(publication) -> str:
    """
    Renders a high-resolution 1200x1800 digital invitation card using Pillow.
    Includes couple/celebrant names, ceremonial dates, venue, and embedded QR code.
    Returns relative media URL.
    """
    order = publication.order
    deliverables_dir = Path(settings.MEDIA_ROOT) / 'deliverables' / order.order_reference
    deliverables_dir.mkdir(parents=True, exist_ok=True)
    img_path = deliverables_dir / 'card.png'

    # Dimensions
    width, height = 1200, 1800
    card = Image.new('RGB', (width, height), color='#FFFDF9')
    draw = ImageDraw.Draw(card)

    # Decorative Border
    border_color = '#CFA043' # Gold
    primary_color = '#7C182A' # Royal Maroon
    text_color = '#1A1D24'

    draw.rectangle([40, 40, width - 40, height - 40], outline=border_color, width=4)
    draw.rectangle([55, 55, width - 55, height - 55], outline=primary_color, width=2)

    # Header / Occasion
    draw.text((width // 2, 140), "✨ TECHMASTERS CELEBRATIONS ✨", fill=border_color, anchor="mm")
    draw.text((width // 2, 220), order.occasion.display_name.upper(), fill=border_color, anchor="mm")

    # Celebrants Name
    draw.text((width // 2, 340), order.customer_name, fill=primary_color, anchor="mm")

    # Decorative Divider
    draw.line([(width // 2 - 150, 420), (width // 2 + 150, 420)], fill=border_color, width=3)

    # Sub-text
    invitation_line = "Cordially request your warm presence and blessings to celebrate our joyful occasion."
    draw.text((width // 2, 480), invitation_line, fill=text_color, anchor="mm")

    # Ceremonial Schedule
    y_offset = 600
    for ev in order.events.all()[:3]:
        draw.text((width // 2, y_offset), f"✦ {ev.event_title} ✦", fill=primary_color, anchor="mm")
        y_offset += 45
        draw.text((width // 2, y_offset), f"Date: {ev.event_date}  |  Time: {ev.start_time.strftime('%I:%M %p')}", fill=text_color, anchor="mm")
        y_offset += 40
        draw.text((width // 2, y_offset), f"Venue: {ev.venue_name}", fill='#4A5568', anchor="mm")
        y_offset += 35
        draw.text((width // 2, y_offset), f"{ev.venue_address}", fill='#718096', anchor="mm")
        y_offset += 70

    # Dynamic QR Code Embed
    live_url = f"{settings.FRONTEND_APP_URL}/invite/{publication.neutral_slug}"
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(live_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=primary_color, back_color="white").convert('RGB')
    qr_w, qr_h = qr_img.size

    # Paste QR in bottom center
    card.paste(qr_img, ((width - qr_w) // 2, 1380))
    draw.text((width // 2, 1620), "Scan QR to Open Live Interactive Website & Navigation Map", fill=border_color, anchor="mm")
    draw.text((width // 2, 1670), live_url, fill='#718096', anchor="mm")

    card.save(img_path, format='PNG', quality=95)
    return f"/media/deliverables/{order.order_reference}/card.png"

def generate_deliverable_card_pdf(publication) -> str:
    """
    Renders a print-ready vector PDF invitation card using ReportLab.
    Returns relative media URL.
    """
    order = publication.order
    deliverables_dir = Path(settings.MEDIA_ROOT) / 'deliverables' / order.order_reference
    deliverables_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = deliverables_dir / 'card.pdf'

    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    page_w, page_h = letter

    # Decorative Border
    c.setStrokeColorRGB(0.81, 0.63, 0.26) # Gold
    c.setLineWidth(3)
    c.rect(30, 30, page_w - 60, page_h - 60)

    c.setStrokeColorRGB(0.49, 0.09, 0.16) # Maroon
    c.setLineWidth(1)
    c.rect(40, 40, page_w - 80, page_h - 80)

    # Header
    c.setFont("Helvetica-Bold", 12)
    c.setFillColorRGB(0.81, 0.63, 0.26)
    c.drawCentredString(page_w / 2, page_h - 90, "TECHMASTERS DIGITAL CELEBRATIONS")

    c.setFont("Helvetica", 14)
    c.drawCentredString(page_w / 2, page_h - 120, order.occasion.display_name.upper())

    # Names
    c.setFont("Times-Bold", 26)
    c.setFillColorRGB(0.49, 0.09, 0.16)
    c.drawCentredString(page_w / 2, page_h - 170, order.customer_name)

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawCentredString(page_w / 2, page_h - 210, "Request the pleasure of your company on this auspicious celebration.")

    # Events
    y = page_h - 270
    for ev in order.events.all():
        c.setFont("Helvetica-Bold", 13)
        c.setFillColorRGB(0.49, 0.09, 0.16)
        c.drawCentredString(page_w / 2, y, ev.event_title)
        y -= 20

        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.1, 0.1, 0.1)
        c.drawCentredString(page_w / 2, y, f"Date: {ev.event_date}   |   Time: {ev.start_time.strftime('%I:%M %p')}")
        y -= 18

        c.drawCentredString(page_w / 2, y, f"Venue: {ev.venue_name}")
        y -= 16

        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.3, 0.3, 0.3)
        c.drawCentredString(page_w / 2, y, ev.venue_address)
        y -= 35

    # Footer
    live_url = f"{settings.FRONTEND_APP_URL}/invite/{publication.neutral_slug}"
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0.81, 0.63, 0.26)
    c.drawCentredString(page_w / 2, 90, f"Access Live Invitation & RSVP: {live_url}")

    c.save()
    return f"/media/deliverables/{order.order_reference}/card.pdf"
