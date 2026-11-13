from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import DeveloperProfile, User, UserRole
from apps.catalog.models import Occasion, Package
from apps.tickets.models import Ticket


class TicketStatusUpdateTests(TestCase):
    def setUp(self):
        occasion = Occasion.objects.first() or Occasion.objects.create(slug='bday-s', display_name='Birthday S', is_active=True)
        package = Package.objects.filter(occasion=occasion).first() or Package.objects.create(
            occasion=occasion, name='Basic', code='PKG_S', base_price_inr=999, is_active=True)
        res = APIClient().post('/api/v1/orders/', {
            'customer_name': 'Status Test', 'customer_mobile': '9000000012',
            'occasion_id': str(occasion.id), 'package_id': str(package.id),
            'events': [{'event_title': 'Main', 'event_date': '2026-12-18', 'start_time': '10:30:00', 'venue_name': 'Hall'}],
        }, format='json')
        self.assertIn(res.status_code, (200, 201), res.content)
        self.ticket = Ticket.objects.get(order__order_reference=res.json()['data']['order_reference'])

        self.dev = User.objects.create(email='dev.status@example.com', full_name='Dev Status', role=UserRole.DEV_ACTIVE)
        DeveloperProfile.objects.create(user=self.dev, approval_status='APPROVED_ACTIVE', max_active_tickets=3)
        self.client = APIClient()
        self.client.force_authenticate(self.dev)
        claim = self.client.post(f'/api/v1/workspace/tickets/{self.ticket.id}/claim/')
        self.assertEqual(claim.status_code, 200, claim.content)
        self.ticket.refresh_from_db()

    def patch(self, **data):
        return self.client.patch(f'/api/v1/tickets/{self.ticket.id}/status/', data, format='json')

    def test_developer_can_start_work(self):
        res = self.patch(status='WORK_IN_PROGRESS', work_notes='Starting')
        self.assertEqual(res.status_code, 200, res.content)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, 'WORK_IN_PROGRESS')

    def test_hold_without_status_change(self):
        res = self.patch(is_on_hold=True, hold_reason='Customer Clarification Required', work_notes='Waiting')
        self.assertEqual(res.status_code, 200, res.content)
        self.ticket.refresh_from_db()
        self.assertTrue(self.ticket.is_on_hold)

    def test_unchanged_status_with_priority_is_allowed(self):
        res = self.patch(status=self.ticket.status, priority='HIGH')
        self.assertEqual(res.status_code, 200, res.content)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.priority, 'HIGH')

    def test_developer_cannot_close_before_payment(self):
        self.patch(status='WORK_IN_PROGRESS')
        res = self.patch(status='CLOSED', work_notes='Done')
        self.assertEqual(res.status_code, 400)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, 'WORK_IN_PROGRESS')
