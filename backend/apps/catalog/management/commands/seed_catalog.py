import os
import uuid
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserRole, ApprovalStatus, DeveloperProfile
from apps.catalog.models import Occasion, Package, Addon, Template

class Command(BaseCommand):
    help = 'Seeds initial catalog packages, occasions, add-ons, and initial staff accounts.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding TechMasters Digital Celebrations catalog and accounts...")

        admin_pwd = os.getenv('SEED_ADMIN_PASSWORD', 'Fri10Feb@2023')
        dev_pwd = os.getenv('SEED_DEV_PASSWORD', 'Fri10Feb@2023')

        # 1. Create / Update Super Admin 1: techmastersinnovations@gmail.com
        admin_email = os.getenv('SEED_ADMIN_EMAIL', 'techmastersinnovations@gmail.com').strip().lower()
        admin_user, _ = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'full_name': 'TechMasters System Administrator',
                'role': UserRole.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin_user.set_password(admin_pwd)
        admin_user.role = UserRole.SUPER_ADMIN
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.save()

        admin_prof, _ = DeveloperProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                'approval_status': ApprovalStatus.APPROVED_ACTIVE,
                'can_produce_video': True,
                'max_active_tickets': 10,
                'skills': ['Administration', 'Supervision', 'UI/UX'],
            }
        )
        admin_prof.approval_status = ApprovalStatus.APPROVED_ACTIVE
        admin_prof.can_produce_video = True
        admin_prof.save()
        self.stdout.write(self.style.SUCCESS(f"Configured Admin: {admin_email}"))

        # 2. Create / Update Super Admin & Lead Developer: sachin@techmastersinnovations.in
        sachin_email = 'sachin@techmastersinnovations.in'
        sachin_user, _ = User.objects.get_or_create(
            email=sachin_email,
            defaults={
                'full_name': 'Sachin (Lead Creative Developer & Admin)',
                'role': UserRole.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        sachin_user.set_password(admin_pwd)
        sachin_user.role = UserRole.SUPER_ADMIN
        sachin_user.is_staff = True
        sachin_user.is_superuser = True
        sachin_user.is_active = True
        sachin_user.save()

        sachin_prof, _ = DeveloperProfile.objects.get_or_create(
            user=sachin_user,
            defaults={
                'approval_status': ApprovalStatus.APPROVED_ACTIVE,
                'can_produce_video': True,
                'max_active_tickets': 10,
                'skills': ['UI/UX', 'Invitations', 'Motion Graphics', 'Typography'],
            }
        )
        sachin_prof.approval_status = ApprovalStatus.APPROVED_ACTIVE
        sachin_prof.can_produce_video = True
        sachin_prof.save()
        self.stdout.write(self.style.SUCCESS(f"Configured Lead Developer/Admin: {sachin_email}"))

        # 3. Create / Update Standard Developer: developer@techmastersinnovations.in
        dev_email = 'developer@techmastersinnovations.in'
        dev_user, _ = User.objects.get_or_create(
            email=dev_email,
            defaults={
                'full_name': 'TechMasters Creative Developer',
                'role': UserRole.DEV_ACTIVE,
                'is_staff': True,
                'is_superuser': False,
                'is_active': True,
            }
        )
        dev_user.set_password(dev_pwd)
        dev_user.role = UserRole.DEV_ACTIVE
        dev_user.is_staff = True
        dev_user.is_active = True
        dev_user.save()

        dev_prof, _ = DeveloperProfile.objects.get_or_create(
            user=dev_user,
            defaults={
                'approval_status': ApprovalStatus.APPROVED_ACTIVE,
                'can_produce_video': True,
                'max_active_tickets': 5,
                'skills': ['Digital Design', 'Audio Mixing', '300 DPI Cards'],
            }
        )
        dev_prof.approval_status = ApprovalStatus.APPROVED_ACTIVE
        dev_prof.save()
        self.stdout.write(self.style.SUCCESS(f"Configured Developer: {dev_email}"))

        # 4. Occasions & Packages with Deterministic UUIDs
        catalog_seed = [
            {
                'id': 'a1000000-0000-0000-0000-000000000001',
                'slug': 'marriage',
                'name': 'Marriage & Wedding Reception',
                'desc': 'Grand multi-day Indian wedding celebrations with complete itineraries, Muhurtham timings, venue directions, and family blessings.',
                'sort': 1,
                'packages': [
                    {
                        'id': 'b1000000-0000-0000-0000-000000000001',
                        'name': 'Marriage Classic Web & Card Suite',
                        'code': 'PKG_MARRIAGE_STANDARD',
                        'price': 499.00,
                        'features': [
                            'Responsive Celebration Web Invitation',
                            '300 DPI High-Resolution Card (JPG & PDF)',
                            'Complete Itinerary (Sangeet, Muhurtham & Reception)',
                            'Interactive Google Maps GPS Navigation',
                            'WhatsApp 1-Click Share Pass',
                            '90-Day Cloud Hosting Included',
                        ],
                        'revisions': 2,
                    },
                    {
                        'id': 'b1000000-0000-0000-0000-000000000002',
                        'name': 'Royal Heritage Grand Wedding Suite',
                        'code': 'PKG_MARRIAGE_PREMIUM',
                        'price': 999.00,
                        'features': [
                            'Full Interactive Celebration Web App',
                            'Multi-Day Schedule with Traditional Attire & Dress Codes',
                            'High-Res Photo Showcase & Memory Gallery',
                            'Custom Background Music Player',
                            'Live Countdown Timer Clock',
                            'Guest RSVP Headcount & Best Wishes Board',
                            'Dynamic QR Code Event Pass',
                            'WhatsApp 1-Click VIP Invite Share',
                            '180-Day Extended Cloud Hosting',
                        ],
                        'revisions': 3,
                    }
                ]
            },
            {
                'id': 'a1000000-0000-0000-0000-000000000002',
                'slug': 'naming-ceremony',
                'name': 'Naming Ceremony (Namakarana)',
                'desc': 'Auspicious cradle, naming, and barasala celebrations welcoming your little one with family blessings.',
                'sort': 2,
                'packages': [
                    {
                        'id': 'b1000000-0000-0000-0000-000000000003',
                        'name': 'Namakarana Blessing Suite',
                        'code': 'PKG_NAMING_CLASSIC',
                        'price': 399.00,
                        'features': [
                            'Bespoke Baby Reveal Web Invite',
                            'Auspicious Muhurtham & Cradle Ceremony Timings',
                            '300 DPI High-Resolution Digital Invitation Card',
                            'Interactive Google Maps GPS Navigation',
                            'WhatsApp Instant Family Share',
                            '90-Day Cloud Hosting Included',
                        ],
                        'revisions': 2,
                    },
                    {
                        'id': 'b1000000-0000-0000-0000-000000000004',
                        'name': 'Royal Cradle Celebration Suite',
                        'code': 'PKG_NAMING_GRAND',
                        'price': 699.00,
                        'features': [
                            'Interactive Baby Reveal Web App',
                            'Parent & Grandparent Blessings Section',
                            'Baby Photo Gallery & Milestone Highlights',
                            'Lullaby / Devotional Music Player',
                            'Live Event Countdown Clock',
                            'Guest RSVP & Blessings Guestbook',
                            '120-Day Cloud Hosting Included',
                        ],
                        'revisions': 3,
                    }
                ]
            },
            {
                'id': 'a1000000-0000-0000-0000-000000000003',
                'slug': 'birthday',
                'name': 'Birthday Celebration',
                'desc': 'Vibrant, joyful birthday invitations for milestone 1st birthdays, sweet sixteens, and jubilee celebrations.',
                'sort': 3,
                'packages': [
                    {
                        'id': 'b1000000-0000-0000-0000-000000000005',
                        'name': 'Birthday Party Essential',
                        'code': 'PKG_BIRTHDAY_BASIC',
                        'price': 299.00,
                        'features': [
                            'Mobile-Friendly Digital Invitation Card',
                            'Party Theme Styling & Vibrant Typography',
                            'Venue Location Pin & Directions',
                            'Party Timing & Cake Cutting Schedule',
                            'WhatsApp 1-Click Group Share',
                            '60-Day Cloud Hosting Included',
                        ],
                        'revisions': 2,
                    },
                    {
                        'id': 'b1000000-0000-0000-0000-000000000006',
                        'name': 'Birthday Grand Fiesta Suite',
                        'code': 'PKG_BIRTHDAY_GRAND',
                        'price': 499.00,
                        'features': [
                            'Interactive Party Web App',
                            'Photo Memories Carousel Gallery',
                            'Party Countdown Clock',
                            'RSVP Headcount & Diet Preferences Tracker',
                            'Upbeat Party Music Player',
                            'Print-Ready 300 DPI Card Suite',
                            '90-Day Cloud Hosting Included',
                        ],
                        'revisions': 3,
                    }
                ]
            },
            {
                'id': 'a1000000-0000-0000-0000-000000000004',
                'slug': 'engagement',
                'name': 'Engagement Ceremony (Nischitartha)',
                'desc': 'Mark the promise of a lifetime with graceful ring ceremony digital invites, family introductions, and muhurtham details.',
                'sort': 4,
                'packages': [
                    {
                        'id': 'b1000000-0000-0000-0000-000000000007',
                        'name': 'Engagement Elegance Suite',
                        'code': 'PKG_ENGAGEMENT_ELEGANCE',
                        'price': 399.00,
                        'features': [
                            'Graceful Ring Ceremony Web Invite',
                            'Couple Introduction & Love Story Note',
                            'Auspicious Muhurtham & Ring Exchange Schedule',
                            'Google Maps GPS Directions',
                            '300 DPI High-Resolution Card (JPG & PDF)',
                            '90-Day Cloud Hosting Included',
                        ],
                        'revisions': 2,
                    }
                ]
            },
            {
                'id': 'a1000000-0000-0000-0000-000000000005',
                'slug': 'anniversary',
                'name': 'Wedding Anniversary',
                'desc': 'Honor decades of love, togetherness, and milestone silver or golden jubilees with timeless elegance.',
                'sort': 5,
                'packages': [
                    {
                        'id': 'b1000000-0000-0000-0000-000000000008',
                        'name': 'Anniversary Jubilee Suite',
                        'code': 'PKG_ANNIVERSARY_JOY',
                        'price': 399.00,
                        'features': [
                            'Milestone Anniversary Web Invitation',
                            'Decades of Memories Couple Photo Gallery',
                            'Celebration Dinner & Reception Program',
                            '300 DPI Print-Ready Card (JPG & PDF)',
                            'Romantic Instrumental Background Music',
                            '90-Day Cloud Hosting Included',
                        ],
                        'revisions': 2,
                    }
                ]
            },
        ]

        for occ_data in catalog_seed:
            occ = Occasion.objects.filter(slug=occ_data['slug']).first()
            if not occ:
                occ = Occasion.objects.create(
                    id=uuid.UUID(occ_data['id']),
                    slug=occ_data['slug'],
                    display_name=occ_data['name'],
                    description=occ_data['desc'],
                    sort_order=occ_data['sort'],
                    is_active=True,
                )
            else:
                occ.display_name = occ_data['name']
                occ.description = occ_data['desc']
                occ.sort_order = occ_data['sort']
                occ.is_active = True
                occ.save()

            for pkg_data in occ_data['packages']:
                pkg = Package.objects.filter(code=pkg_data['code']).first()
                if not pkg:
                    pkg = Package.objects.create(
                        id=uuid.UUID(pkg_data['id']),
                        occasion=occ,
                        name=pkg_data['name'],
                        code=pkg_data['code'],
                        base_price_inr=pkg_data['price'],
                        features_json=pkg_data['features'],
                        included_revisions=pkg_data['revisions'],
                        is_active=True,
                    )
                else:
                    pkg.occasion = occ
                    pkg.name = pkg_data['name']
                    pkg.base_price_inr = pkg_data['price']
                    pkg.features_json = pkg_data['features']
                    pkg.included_revisions = pkg_data['revisions']
                    pkg.is_active = True
                    pkg.save()

            # Create default template
            Template.objects.get_or_create(
                code=f"TPL_{occ.slug.upper().replace('-', '_')}_DEFAULT",
                defaults={
                    'occasion': occ,
                    'name': f"Classic Royal {occ.display_name}",
                    'theme_config_json': {
                        'primary_color': '#7C182A',
                        'accent_color': '#CFA043',
                        'font_heading': 'Cinzel',
                        'font_body': 'Inter'
                    },
                    'is_active': True
                }
            )

        # 5. Create Configurable Add-ons
        addons_seed = [
            {'name': 'Basic Animated Video Invitation (30s)', 'code': 'ADDON_VIDEO_BASIC', 'price': 299.00, 'type': 'VIDEO'},
            {'name': 'Premium Animated Video Invitation (60s)', 'code': 'ADDON_VIDEO_PREMIUM', 'price': 499.00, 'type': 'VIDEO'},
            {'name': 'Cinematic Motion Graphics Video (90s+)', 'code': 'ADDON_VIDEO_CINEMATIC', 'price': 999.00, 'type': 'VIDEO'},
            {'name': 'Additional Revision Round', 'code': 'ADDON_EXTRA_REVISION', 'price': 99.00, 'type': 'REVISION'},
            {'name': 'Expedited Rush Delivery (< 12 Hours)', 'code': 'ADDON_RUSH_DELIVERY', 'price': 299.00, 'type': 'RUSH_DELIVERY'},
        ]

        for add_data in addons_seed:
            addon = Addon.objects.filter(code=add_data['code']).first()
            if not addon:
                addon = Addon.objects.create(
                    name=add_data['name'],
                    code=add_data['code'],
                    price_inr=add_data['price'],
                    addon_type=add_data['type'],
                    is_active=True,
                )
            else:
                addon.name = add_data['name']
                addon.price_inr = add_data['price']
                addon.addon_type = add_data['type']
                addon.is_active = True
                addon.save()

        self.stdout.write(self.style.SUCCESS("Catalog, seed packages, add-ons, and staff accounts seeded successfully!"))
