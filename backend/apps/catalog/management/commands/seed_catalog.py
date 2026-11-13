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

        # 2. Create / Update Lead Developer: sachin@techmastersinnovations.in
        sachin_email = 'sachin@techmastersinnovations.in'
        sachin_user, _ = User.objects.get_or_create(
            email=sachin_email,
            defaults={
                'full_name': 'Sachin (Lead Creative Artisan)',
                'role': UserRole.DEV_ACTIVE,
                'is_staff': True,
                'is_superuser': False,
                'is_active': True,
            }
        )
        sachin_user.set_password(admin_pwd)
        sachin_user.role = UserRole.DEV_ACTIVE
        sachin_user.is_staff = True
        sachin_user.is_superuser = False
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
        self.stdout.write(self.style.SUCCESS(f"Configured Lead Developer: {sachin_email}"))

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

        # 4. Official catalog (₹399 / ₹499 / ₹599 price points) — see apps/catalog/catalog_data.py
        from apps.catalog.catalog_data import apply_catalog
        apply_catalog(Occasion, Package, Template, Addon)
        self.stdout.write(self.style.SUCCESS("Applied official celebration catalog."))

        # Paid add-ons are retired: every package is a flat ₹399 / ₹499 / ₹599 price.

        self.stdout.write(self.style.SUCCESS("Catalog, packages, and staff accounts seeded successfully!"))
