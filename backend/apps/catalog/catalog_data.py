"""
Official TechMasters celebration catalog — the single source of truth.

Every package is priced at one of three flat price points: ₹399, ₹499 or ₹599.
There are no paid add-ons. Deliverables include the formats guests actually
share today: Instagram Story (1080×1920), Instagram Post (1080×1080),
Instagram Reels (9:16) for videos, and WhatsApp-ready links.

Used by the catalog data migrations and the `seed_catalog` command.
The frontend's offline fallback (frontend/src/data/defaultCatalog.ts) is
generated from this file by scripts/export_catalog.py.
"""

PRICE_POINTS = (399, 499, 599)

INSTAGRAM_CARD = 'Instagram Story (1080×1920) & Post (1080×1080) Versions'
WHATSAPP_SHARE = 'WhatsApp-Ready Share Link & Image'
PRINT_CARD = '300 DPI Print-Ready Card (JPG & PDF)'

CATALOG = [
    {
        'id': 'a1000000-0000-0000-0000-000000000001',
        'slug': 'marriage',
        'name': 'Marriage & Wedding Reception',
        'icon': 'heart',
        'desc': 'Grand multi-day Indian wedding celebrations with complete itineraries, Muhurtham timings, venue directions, and family blessings.',
        'sort': 1,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000001',
                'name': 'Marriage Classic Web & Card Suite',
                'code': 'PKG_MARRIAGE_STANDARD',
                'price': 499,
                'revisions': 2,
                'features': [
                    'Responsive Celebration Web Invitation',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    'Complete Itinerary (Sangeet, Muhurtham & Reception)',
                    'Interactive Google Maps GPS Navigation',
                    WHATSAPP_SHARE,
                    '90-Day Cloud Hosting Included',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000002',
                'name': 'Royal Heritage Grand Wedding Suite',
                'code': 'PKG_MARRIAGE_PREMIUM',
                'price': 599,
                'revisions': 3,
                'features': [
                    'Full Interactive Celebration Web App',
                    'Multi-Day Schedule with Traditional Attire & Dress Codes',
                    'High-Res Photo Showcase & Memory Gallery',
                    'Custom Background Music Player',
                    'Live Countdown Timer Clock',
                    'Guest RSVP Headcount & Best Wishes Board',
                    'Dynamic QR Code Event Pass',
                    INSTAGRAM_CARD,
                    WHATSAPP_SHARE,
                    '180-Day Extended Cloud Hosting',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000002',
        'slug': 'naming-ceremony',
        'name': 'Naming Ceremony (Namakarana)',
        'icon': 'gift',
        'desc': 'Auspicious cradle, naming, and barasala celebrations welcoming your little one with family blessings.',
        'sort': 2,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000003',
                'name': 'Namakarana Blessing Suite',
                'code': 'PKG_NAMING_CLASSIC',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Bespoke Baby Reveal Web Invite',
                    'Auspicious Muhurtham & Cradle Ceremony Timings',
                    '300 DPI High-Resolution Digital Invitation Card',
                    INSTAGRAM_CARD,
                    'Interactive Google Maps GPS Navigation',
                    WHATSAPP_SHARE,
                    '90-Day Cloud Hosting Included',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000004',
                'name': 'Royal Cradle Celebration Suite',
                'code': 'PKG_NAMING_GRAND',
                'price': 599,
                'revisions': 3,
                'features': [
                    'Interactive Baby Reveal Web App',
                    'Parent & Grandparent Blessings Section',
                    'Baby Photo Gallery & Milestone Highlights',
                    'Lullaby / Devotional Music Player',
                    'Live Event Countdown Clock',
                    'Guest RSVP & Blessings Guestbook',
                    INSTAGRAM_CARD,
                    '120-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000003',
        'slug': 'birthday',
        'name': 'Birthday Celebration',
        'icon': 'cake',
        'desc': 'Vibrant, joyful birthday invitations for milestone 1st birthdays, sweet sixteens, and jubilee celebrations.',
        'sort': 3,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000005',
                'name': 'Birthday Party Essential',
                'code': 'PKG_BIRTHDAY_BASIC',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Mobile-Friendly Digital Invitation Card',
                    'Party Theme Styling & Vibrant Typography',
                    INSTAGRAM_CARD,
                    'Venue Location Pin & Directions',
                    'Party Timing & Cake Cutting Schedule',
                    WHATSAPP_SHARE,
                    '60-Day Cloud Hosting Included',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000006',
                'name': 'Birthday Grand Fiesta Suite',
                'code': 'PKG_BIRTHDAY_GRAND',
                'price': 499,
                'revisions': 3,
                'features': [
                    'Interactive Party Web App',
                    'Photo Memories Carousel Gallery',
                    'Party Countdown Clock',
                    'RSVP Headcount & Diet Preferences Tracker',
                    'Upbeat Party Music Player',
                    'Print-Ready 300 DPI Card Suite',
                    INSTAGRAM_CARD,
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000004',
        'slug': 'engagement',
        'name': 'Engagement Ceremony (Nischitartha)',
        'icon': 'ring',
        'desc': 'Mark the promise of a lifetime with graceful ring ceremony digital invites, family introductions, and muhurtham details.',
        'sort': 4,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000007',
                'name': 'Engagement Elegance Suite',
                'code': 'PKG_ENGAGEMENT_ELEGANCE',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Graceful Ring Ceremony Web Invite',
                    'Couple Introduction & Love Story Note',
                    'Auspicious Muhurtham & Ring Exchange Schedule',
                    'Google Maps GPS Directions',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000005',
        'slug': 'anniversary',
        'name': 'Wedding Anniversary',
        'icon': 'calendar',
        'desc': 'Honor decades of love, togetherness, and milestone silver or golden jubilees with timeless elegance.',
        'sort': 5,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000008',
                'name': 'Anniversary Jubilee Suite',
                'code': 'PKG_ANNIVERSARY_JOY',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Milestone Anniversary Web Invitation',
                    'Decades of Memories Couple Photo Gallery',
                    'Celebration Dinner & Reception Program',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    'Romantic Instrumental Background Music',
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000006',
        'slug': 'house-warming',
        'name': 'House Warming (Griha Pravesha)',
        'icon': 'home',
        'desc': 'Invite family and friends to bless your new home with Griha Pravesha muhurtham, pooja timings, and easy directions to your doorstep.',
        'sort': 6,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000009',
                'name': 'Griha Pravesha Classic Suite',
                'code': 'PKG_HOUSEWARMING_CLASSIC',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Griha Pravesha Digital Invitation Card',
                    'Muhurtham, Pooja & Homam Timings',
                    'New Home Location Pin & Directions',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    WHATSAPP_SHARE,
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000010',
                'name': 'Griha Pravesha Web Suite',
                'code': 'PKG_HOUSEWARMING_WEB',
                'price': 499,
                'revisions': 3,
                'features': [
                    'Griha Pravesha Invitation Website',
                    'Muhurtham, Pooja & Lunch Programme',
                    'New Home Photo Showcase',
                    'Google Maps GPS Navigation to Your New Home',
                    'Guest RSVP Headcount',
                    INSTAGRAM_CARD,
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000007',
        'slug': 'baby-shower',
        'name': 'Baby Shower (Seemantha / Godh Bharai)',
        'icon': 'baby',
        'desc': 'Celebrate the mother-to-be with graceful Seemantha, Godh Bharai, or baby shower invitations shared with the whole family.',
        'sort': 7,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000011',
                'name': 'Baby Shower Blossom Suite',
                'code': 'PKG_BABYSHOWER_CLASSIC',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Baby Shower Digital Invitation Card',
                    'Ceremony & Muhurtham Timings',
                    'Venue Location Pin & Directions',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    WHATSAPP_SHARE,
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000012',
                'name': 'Baby Shower Web Suite',
                'code': 'PKG_BABYSHOWER_WEB',
                'price': 499,
                'revisions': 3,
                'features': [
                    'Baby Shower Invitation Website',
                    'Parents-to-Be Photo Gallery',
                    'Ceremony Programme & Countdown Clock',
                    'Guest RSVP & Blessings Guestbook',
                    'Google Maps GPS Navigation',
                    INSTAGRAM_CARD,
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000008',
        'slug': 'religious-cultural',
        'name': 'Religious & Cultural Celebrations',
        'icon': 'flame',
        'desc': 'Poojas, festivals, jatres, utsavs, and community celebrations — invitations that carry the devotion and culture of the occasion.',
        'sort': 8,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000013',
                'name': 'Utsav Devotional Card Suite',
                'code': 'PKG_RELIGIOUS_CLASSIC',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Devotional Digital Invitation Card',
                    'Pooja, Aarti & Prasad Timings',
                    'Venue / Temple Location & Directions',
                    PRINT_CARD,
                    INSTAGRAM_CARD,
                    WHATSAPP_SHARE,
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000014',
                'name': 'Utsav Celebration Web Suite',
                'code': 'PKG_RELIGIOUS_WEB',
                'price': 499,
                'revisions': 3,
                'features': [
                    'Festival / Utsav Invitation Website',
                    'Multi-Day Programme & Ritual Schedule',
                    'Organisers & Committee Section',
                    'Devotional Music Player',
                    'Google Maps GPS Navigation',
                    INSTAGRAM_CARD,
                    '90-Day Cloud Hosting Included',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000009',
        'slug': 'digital-invitation-websites',
        'name': 'Digital Invitation Websites',
        'icon': 'monitor',
        'desc': 'A personalised invitation website for any celebration — one link guests open on any phone, with schedule, maps, RSVP, and photos.',
        'sort': 9,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000015',
                'name': 'Invitation Website Essential',
                'code': 'PKG_WEBSITE_ESSENTIAL',
                'price': 499,
                'revisions': 2,
                'features': [
                    'Personalised Single-Page Invitation Website',
                    'Event Schedule & Venue Details',
                    'Google Maps GPS Navigation',
                    'Live Countdown Clock',
                    'Guest RSVP Headcount',
                    WHATSAPP_SHARE,
                    '90-Day Cloud Hosting Included',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000016',
                'name': 'Invitation Website Premium',
                'code': 'PKG_WEBSITE_PREMIUM',
                'price': 599,
                'revisions': 3,
                'features': [
                    'Multi-Section Invitation Website',
                    'Photo Gallery & Story Section',
                    'Background Music Player',
                    'Multi-Event Schedule with Maps for Each Venue',
                    'Guest RSVP & Wishes Board',
                    'Dynamic QR Code for Printed Cards',
                    INSTAGRAM_CARD,
                    '180-Day Extended Cloud Hosting',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000010',
        'slug': 'digital-invitation-cards',
        'name': 'Digital Invitation Cards',
        'icon': 'image',
        'desc': 'Beautifully designed invitation cards sized for WhatsApp, Instagram Stories and Posts, and high-resolution printing.',
        'sort': 10,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000017',
                'name': 'Digital Card Essential',
                'code': 'PKG_CARD_ESSENTIAL',
                'price': 399,
                'revisions': 2,
                'features': [
                    'Custom-Designed Invitation Card',
                    INSTAGRAM_CARD,
                    'WhatsApp-Optimised Image',
                    PRINT_CARD,
                    'Regional Language Typography',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000018',
                'name': 'Digital Card Set (Multi-Event)',
                'code': 'PKG_CARD_SET',
                'price': 499,
                'revisions': 3,
                'features': [
                    'Matching Card Set for Up to 3 Events',
                    INSTAGRAM_CARD + ' for Every Card',
                    'WhatsApp-Optimised Images',
                    PRINT_CARD,
                    'QR Code to Google Maps Location',
                ],
            },
        ],
    },
    {
        'id': 'a1000000-0000-0000-0000-000000000011',
        'slug': 'animated-invitation-videos',
        'name': 'Animated Invitation Videos',
        'icon': 'video',
        'desc': 'Animated invitation videos in vertical 9:16 format — ready for Instagram Reels, Stories, and WhatsApp Status.',
        'sort': 11,
        'packages': [
            {
                'id': 'b1000000-0000-0000-0000-000000000019',
                'name': 'Reel Invitation (30 sec)',
                'code': 'PKG_VIDEO_REEL_30',
                'price': 499,
                'revisions': 2,
                'features': [
                    '30-Second Animated Invitation Video',
                    'Vertical 9:16 Full HD for Instagram Reels & Stories',
                    'WhatsApp Status-Ready MP4',
                    'Motion Typography with Names, Date & Venue',
                    'Background Music Track',
                ],
            },
            {
                'id': 'b1000000-0000-0000-0000-000000000020',
                'name': 'Reel Invitation with Photos (60 sec)',
                'code': 'PKG_VIDEO_REEL_60',
                'price': 599,
                'revisions': 3,
                'features': [
                    '60-Second Animated Invitation Video',
                    'Your Family Photos in the Video',
                    'Vertical 9:16 Full HD for Instagram Reels & Stories',
                    'Square 1:1 Version for Instagram Feed',
                    'WhatsApp Status-Ready MP4',
                    'Background Music Track',
                ],
            },
        ],
    },
]


def apply_catalog(Occasion, Package, Template, Addon=None):
    """Create or update the catalog. Model classes are passed in so this works in migrations."""
    import uuid

    for occ_data in CATALOG:
        occ = Occasion.objects.filter(slug=occ_data['slug']).first()
        fields = {
            'display_name': occ_data['name'],
            'description': occ_data['desc'],
            'sort_order': occ_data['sort'],
            'icon_name': occ_data['icon'],
            'is_active': True,
        }
        if occ is None:
            occ = Occasion.objects.create(id=uuid.UUID(occ_data['id']), slug=occ_data['slug'], **fields)
        else:
            for k, v in fields.items():
                setattr(occ, k, v)
            occ.save()

        for p in occ_data['packages']:
            assert p['price'] in PRICE_POINTS, f"{p['code']} price {p['price']} not in {PRICE_POINTS}"
            pkg_fields = {
                'occasion': occ,
                'name': p['name'],
                'base_price_inr': p['price'],
                'features_json': p['features'],
                'included_revisions': p['revisions'],
                'is_active': True,
            }
            pkg = Package.objects.filter(code=p['code']).first()
            if pkg is None:
                Package.objects.create(id=uuid.UUID(p['id']), code=p['code'], **pkg_fields)
            else:
                for k, v in pkg_fields.items():
                    setattr(pkg, k, v)
                pkg.save()

        Template.objects.get_or_create(
            code=f"TPL_{occ.slug.upper().replace('-', '_')}_DEFAULT",
            defaults={
                'occasion': occ,
                'name': f"Classic Royal {occ.display_name}",
                'theme_config_json': {
                    'primary_color': '#7C182A',
                    'accent_color': '#CFA043',
                    'font_heading': 'Cinzel',
                    'font_body': 'Inter',
                },
                'is_active': True,
            },
        )

    # Only the catalog above is sold: retire any other package and all paid add-ons.
    codes = [p['code'] for o in CATALOG for p in o['packages']]
    Package.objects.exclude(code__in=codes).update(is_active=False)
    if Addon is not None:
        Addon.objects.update(is_active=False)
