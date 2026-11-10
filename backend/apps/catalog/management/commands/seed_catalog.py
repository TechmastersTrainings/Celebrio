import os
import secrets
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserRole, ApprovalStatus, DeveloperProfile
from apps.catalog.models import Occasion, Package, Addon, Template

class Command(BaseCommand):
    help = 'Seeds initial catalog packages, occasions, add-ons, and initial staff accounts.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding TechMasters Digital Celebrations catalog and accounts...")

        admin_pwd = os.getenv('SEED_ADMIN_PASSWORD', 'Fri10Feb@2023')
        dev_pwd = os.getenv('SEED_DEV_PASSWORD', 'Fri10Feb@2023')

        # 1. Create Super Admin
        admin_email = os.getenv('SEED_ADMIN_EMAIL', 'techmastersinnovations@gmail.com')
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'full_name': 'TechMasters System Administrator',
                'role': UserRole.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin_user.set_password(admin_pwd)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created Super Admin: {admin_email}"))

        # 2. Occasions & Initial Proposed Packages
        catalog_seed = [
            {
                'slug': 'birthday',
                'name': 'Birthday Celebration',
                'desc': 'Celebrate milestone birthdays with vibrant, personalized digital invitations and memory highlights.',
                'sort': 1,
                'packages': [
                    {
                        'name': 'Birthday Basic',
                        'code': 'PKG_BIRTHDAY_BASIC',
                        'price': 299.00,
                        'features': ['Mobile-Friendly Web Invite', 'High-Res Digital Card (JPG/PNG)', 'Location Pin', 'Music Player'],
                        'revisions': 2,
                    },
                    {
                        'name': 'Birthday Grand Party',
                        'code': 'PKG_BIRTHDAY_GRAND',
                        'price': 499.00,
                        'features': ['Interactive Web App', 'Photo Gallery', 'Countdown Clock', 'RSVP Tracker', 'WhatsApp 1-Click Share'],
                        'revisions': 3,
                    }
                ]
            },
            {
                'slug': 'naming-ceremony',
                'name': 'Naming Ceremony (Namakarana)',
                'desc': 'Auspicious cradle and naming celebrations with ceremonial muhurtham and family blessings.',
                'sort': 2,
                'packages': [
                    {
                        'name': 'Naming Ceremony Classic',
                        'code': 'PKG_NAMING_CLASSIC',
                        'price': 399.00,
                        'features': ['Bespoke Baby Intro Page', 'Muhurtham Highlights', '2 Digital Cards', 'Dynamic Google Map'],
                        'revisions': 2,
                    }
                ]
            },
            {
                'slug': 'anniversary',
                'name': 'Wedding Anniversary',
                'desc': 'Honor decades of love, togetherness, and milestone silver or golden jubilees.',
                'sort': 3,
                'packages': [
                    {
                        'name': 'Anniversary Joy',
                        'code': 'PKG_ANNIVERSARY_JOY',
                        'price': 399.00,
                        'features': ['Couple Story Timeline', 'High-Res Digital Card', 'Music Player', 'RSVP Portal'],
                        'revisions': 2,
                    }
                ]
            },
            {
                'slug': 'engagement',
                'name': 'Engagement Ceremony',
                'desc': 'Mark the promise of a lifetime with graceful ring ceremony digital invites and schedules.',
                'sort': 4,
                'packages': [
                    {
                        'name': 'Engagement Elegance',
                        'code': 'PKG_ENGAGEMENT_ELEGANCE',
                        'price': 399.00,
                        'features': ['Ring Ceremony Visual Cards', 'Countdown to Big Day', 'Google Maps Link', 'Photo Showcase'],
                        'revisions': 2,
                    }
                ]
            },
            {
                'slug': 'marriage',
                'name': 'Marriage / Wedding',
                'desc': 'Grand Indian multi-day celebrations with full event schedules, ceremonies, dress codes, and directions.',
                'sort': 5,
                'packages': [
                    {
                        'name': 'Marriage Standard',
                        'code': 'PKG_MARRIAGE_STANDARD',
                        'price': 499.00,
                        'features': ['Responsive Single-Page Web Invite', 'Full Itinerary (Sangeet, Muhurtham, Reception)', 'Digital Card Suite', 'Google Maps'],
                        'revisions': 2,
                    },
                    {
                        'name': 'Premium Marriage Grand',
                        'code': 'PKG_MARRIAGE_PREMIUM',
                        'price': 999.00,
                        'features': ['Interactive Celebration Web App', 'Multi-day Event Itinerary with Dress Codes', 'Full Photo Gallery', 'Music Player', 'Live Countdown', 'Dynamic QR Code Pass', '1-Click WhatsApp Share'],
                        'revisions': 2,
                    }
                ]
            },
        ]

        for occ_data in catalog_seed:
            occ, _ = Occasion.objects.get_or_create(
                slug=occ_data['slug'],
                defaults={
                    'display_name': occ_data['name'],
                    'description': occ_data['desc'],
                    'sort_order': occ_data['sort'],
                    'is_active': True,
                }
            )

            for pkg_data in occ_data['packages']:
                Package.objects.get_or_create(
                    code=pkg_data['code'],
                    defaults={
                        'occasion': occ,
                        'name': pkg_data['name'],
                        'base_price_inr': pkg_data['price'],
                        'features_json': pkg_data['features'],
                        'included_revisions': pkg_data['revisions'],
                        'is_active': True,
                    }
                )

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
            Addon.objects.get_or_create(
                code=add_data['code'],
                defaults={
                    'name': add_data['name'],
                    'price_inr': add_data['price'],
                    'addon_type': add_data['type'],
                    'is_active': True
                }
            )

        self.stdout.write(self.style.SUCCESS("Catalog, seed packages, add-ons, and staff accounts seeded successfully!"))

