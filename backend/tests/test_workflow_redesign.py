from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.catalog.models import Occasion, Package
from apps.orders.models import Order, Coupon, CallbackRequest
from apps.accounts.models import User, UserRole

class WorkflowRedesignTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create occasion & package
        self.occasion = Occasion.objects.create(
            slug='wedding',
            display_name='Royal Wedding',
            description='Grand wedding celebrations',
            is_active=True
        )
        self.package = Package.objects.create(
            occasion=self.occasion,
            name='Royal Heritage',
            code='ROYAL_HERITAGE',
            base_price_inr=Decimal('999.00'),
            is_active=True
        )

        # Create default 12% offer
        self.default_coupon = Coupon.objects.create(
            code='AUTO12',
            description='Default 12% Celebration Offer',
            discount_type='PERCENTAGE',
            discount_value=Decimal('12.00'),
            is_active=True,
            is_public=True,
            is_system_default_offer=True
        )

        # Create public promo coupon
        self.promo_coupon = Coupon.objects.create(
            code='SAVE100',
            description='Save ₹100',
            discount_type='FIXED',
            discount_value=Decimal('100.00'),
            is_active=True,
            is_public=True,
            min_order_value=Decimal('500.00'),
            can_combine_with_auto_discount=True
        )

        # Create admin user
        self.admin = User.objects.create_user(
            email='admin@techmastersinnovations.in',
            password='TestPassword123!',
            full_name='System Admin',
            role=UserRole.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True
        )

    def test_public_coupons_list(self):
        url = reverse('public_coupons')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('default_offer', res.data['data'])
        self.assertEqual(res.data['data']['default_offer']['percentage'], 12)

    def test_coupon_validation_with_default_12_percent(self):
        url = reverse('coupon_validate')
        # Without coupon code: default 12% applies
        res = self.client.post(url, {'amount': '1000.00', 'coupon_code': ''}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['auto_discount_amount'], '120.00')
        self.assertEqual(res.data['data']['final_payable_amount'], '880.00')

        # With SAVE100 combined coupon
        res2 = self.client.post(url, {'amount': '1000.00', 'coupon_code': 'SAVE100'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['data']['auto_discount_amount'], '120.00')
        self.assertEqual(res2.data['data']['coupon_discount_amount'], '100.00')
        self.assertEqual(res2.data['data']['total_discount'], '220.00')
        self.assertEqual(res2.data['data']['final_payable_amount'], '780.00')

    def test_callback_request_creation(self):
        url = reverse('callback_create')
        payload = {
            'customer_name': 'Suresh Kumar',
            'customer_mobile': '9880768222',
            'preferred_callback_time': 'Evening 5 PM',
            'assistance_required': 'Need help filling wedding function details'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertTrue(CallbackRequest.objects.filter(customer_mobile='9880768222').exists())

    def test_ocr_extract_endpoint(self):
        url = reverse('order_ocr_extract')
        res = self.client.post(url, {'occasion_type': 'wedding'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('fields', res.data['data'])
        self.assertIn('completeness_score', res.data['data'])

    def test_order_creation_with_workflow_redesign(self):
        url = reverse('order_create')
        payload = {
            'customer_name': 'Rahul Deshmukh',
            'customer_mobile': '9916354338',
            'customer_email': 'rahul@example.com',
            'occasion_id': str(self.occasion.id),
            'package_id': str(self.package.id),
            'has_physical_card': True,
            'physical_card_notes': 'Card front and insert uploaded',
            'occasion_requirements_json': {
                'bride_name': 'Pooja Patil',
                'groom_name': 'Rahul Deshmukh',
                'wedding_date': '2026-12-18'
            },
            'coupon_code': 'SAVE100',
            'events': [
                {
                    'event_title': 'Muhurtham',
                    'event_date': '2026-12-18',
                    'start_time': '10:30',
                    'venue_name': 'Sri Krishna Palace',
                    'venue_address': 'Bidar, Karnataka'
                }
            ]
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])

        order = Order.objects.get(order_reference=res.data['data']['order_reference'])
        self.assertTrue(order.has_physical_card)
        self.assertEqual(order.applied_coupon, self.promo_coupon)
        # Base: 999, Auto 12%: 119.88, Coupon: 100 -> Total discount: 219.88, Payable: 779.12
        self.assertEqual(order.base_amount_inr, Decimal('999.00'))
        self.assertEqual(order.auto_discount_amount_inr, Decimal('119.88'))
        self.assertEqual(order.coupon_discount_amount_inr, Decimal('100.00'))
        self.assertEqual(order.total_amount_inr, Decimal('779.12'))
        self.assertIn('base_amount_inr', order.quotation_snapshot_json)

