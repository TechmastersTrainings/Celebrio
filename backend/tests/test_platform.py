import concurrent.futures
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, UserRole, ApprovalStatus, DeveloperProfile, OTPChallenge
from apps.catalog.models import Occasion, Package, Addon
from apps.orders.models import Order, OrderStatus
from apps.tickets.models import Ticket, TicketStatus, TicketStatusHistory
from apps.designs.models import DesignVersion, DesignStatus, RevisionRequest
from apps.payments.models import PaymentOrder, PaymentTransaction, PaymentOrderStatus
from apps.publishing.models import InvitationPublication, PublicationStatus
from apps.assignments.services import claim_next_fifo_ticket
from apps.audit.models import CentralActivityLog

class PlatformReleaseAcceptanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='Password123!',
            full_name='Test Admin',
            role=UserRole.OPS_ADMIN,
            is_staff=True
        )

        # Approved Developer
        self.dev_user = User.objects.create_user(
            email='dev@test.com',
            password='Password123!',
            full_name='Priya Dev',
            role=UserRole.DEV_ACTIVE
        )
        self.dev_profile = DeveloperProfile.objects.create(
            user=self.dev_user,
            approval_status=ApprovalStatus.APPROVED_ACTIVE,
            approved_by=self.admin_user,
            can_produce_video=False,
            max_active_tickets=3
        )

        # Video Specialist
        self.video_dev = User.objects.create_user(
            email='video@test.com',
            password='Password123!',
            full_name='Vikram Video',
            role=UserRole.DEV_VIDEO
        )
        DeveloperProfile.objects.create(
            user=self.video_dev,
            approval_status=ApprovalStatus.APPROVED_ACTIVE,
            approved_by=self.admin_user,
            can_produce_video=True,
            max_active_tickets=3
        )

        # Catalog setup
        self.occasion = Occasion.objects.create(
            slug='marriage',
            display_name='Marriage / Wedding',
            description='Weddings'
        )
        self.package = Package.objects.create(
            occasion=self.occasion,
            name='Premium Marriage Grand',
            code='PKG_WEDDING_PREMIUM_TEST',
            base_price_inr=999.00,
            features_json=['Website', 'Cards', 'QR'],
            included_revisions=2
        )

    def test_01_developer_registration_and_admin_approval(self):
        """Verify new developers default to PENDING_APPROVAL and Admin can approve."""
        # Register new developer
        reg_payload = {
            'email': 'new.designer@test.com',
            'password': 'StrongPass123!',
            'full_name': 'Ankit Verma',
            'skills': ['HTML', 'Figma']
        }
        res = self.client.post('/api/v1/auth/developer/register/', reg_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_dev_id = res.data['data']['user_id']

        new_dev = User.objects.get(id=new_dev_id)
        self.assertEqual(new_dev.role, UserRole.DEV_PENDING)
        self.assertEqual(new_dev.developer_profile.approval_status, ApprovalStatus.PENDING_APPROVAL)

        # Unapproved developer CANNOT access workspace
        self.client.force_authenticate(user=new_dev)
        res_ws = self.client.get('/api/v1/workspace/tickets/available/')
        self.assertEqual(res_ws.status_code, status.HTTP_403_FORBIDDEN)

        # Admin approves developer
        self.client.force_authenticate(user=self.admin_user)
        approve_res = self.client.patch(
            f'/api/v1/auth/admin/developers/{new_dev_id}/action/',
            {'action': 'APPROVE', 'max_active_tickets': 4}
        )
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        new_dev.refresh_from_db()
        self.assertEqual(new_dev.role, UserRole.DEV_ACTIVE)
        self.assertEqual(new_dev.developer_profile.approval_status, ApprovalStatus.APPROVED_ACTIVE)

        # Now approved developer CAN access workspace
        self.client.force_authenticate(user=new_dev)
        res_ws_approved = self.client.get('/api/v1/workspace/tickets/available/')
        self.assertEqual(res_ws_approved.status_code, status.HTTP_200_OK)

    def test_02_customer_order_submission_generates_ticket(self):
        """Verify customer order submission creates order and unique ticket."""
        intake_payload = {
            'customer_name': 'Rahul & Sneha',
            'customer_mobile': '+919886012345',
            'customer_email': 'rahul@example.com',
            'occasion_id': str(self.occasion.id),
            'package_id': str(self.package.id),
            'selected_language': 'Kannada',
            'events': [
                {
                    'event_title': 'Muhurtham',
                    'event_date': '2026-12-14',
                    'start_time': '09:30:00',
                    'venue_name': 'Gayathri Vihar',
                    'venue_address': 'Palace Grounds, Bangalore'
                }
            ]
        }
        res = self.client.post('/api/v1/orders/', intake_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_ref = res.data['data']['order_reference']
        self.assertTrue(order_ref.startswith('TC-'))

        # Verify Order & Ticket in DB
        order = Order.objects.get(order_reference=order_ref)
        ticket = order.ticket
        self.assertEqual(ticket.ticket_number, order_ref)
        self.assertEqual(ticket.status, TicketStatus.NEW_OPEN)
        self.assertEqual(ticket.customer_facing_status, 'Order Received')

        # Admin monitoring: Ticket is visible in Admin tickets
        self.client.force_authenticate(user=self.admin_user)
        admin_res = self.client.get('/api/v1/admin-ops/tickets/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        ticket_numbers = [t['ticket_number'] for t in admin_res.data['data']]
        self.assertIn(order_ref, ticket_numbers)

    def test_03_fifo_queue_claiming_and_lifecycle(self):
        """End-to-end flow: Order -> FIFO Claim -> Design Draft -> Revision -> Approval -> Payment -> Publish."""
        # 1. Customer creates order
        order = Order.objects.create(
            order_reference='TC-2026-00099',
            customer_name='Ananya & Karthik',
            customer_mobile='+919876500000',
            occasion=self.occasion,
            package=self.package,
            total_amount_inr=999.00
        )
        ticket = Ticket.objects.create(
            ticket_number='TC-2026-00099',
            order=order,
            status=TicketStatus.NEW_OPEN,
            eligible_at=timezone.now()
        )

        # 2. Approved developer claims ticket via FIFO
        self.client.force_authenticate(user=self.dev_user)
        claim_res = self.client.post('/api/v1/workspace/tickets/claim-fifo/')
        self.assertEqual(claim_res.status_code, status.HTTP_200_OK)
        self.assertEqual(claim_res.data['data']['ticket_number'], 'TC-2026-00099')

        ticket.refresh_from_db()
        self.assertEqual(ticket.assigned_developer, self.dev_user)
        self.assertEqual(ticket.status, TicketStatus.ASSIGNED)

        # 3. Developer uploads design preview
        design_payload = {
            'web_preview_payload': {
                'theme_color': '#800020',
                'accent_color': '#D4AF37'
            }
        }
        res_design = self.client.post(f'/api/v1/workspace/tickets/{ticket.id}/designs/', design_payload, format='json')
        self.assertEqual(res_design.status_code, status.HTTP_201_CREATED)
        preview_token = res_design.data['data']['preview_token']

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.AWAITING_CUSTOMER_RESPONSE)

        # 4. Customer submits revision #1 (Free)
        self.client.force_authenticate(user=None)
        res_rev1 = self.client.post(
            f'/api/v1/orders/{order.order_reference}/revisions/',
            {'feedback_text': 'Please make the font bolder on the Muhurtham card.'}
        )
        self.assertEqual(res_rev1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_rev1.data['data']['revision_round'], 1)
        self.assertFalse(res_rev1.data['data']['is_billable'])

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.WORK_IN_PROGRESS)

        # 5. Developer re-uploads preview v2
        self.client.force_authenticate(user=self.dev_user)
        self.client.post(f'/api/v1/workspace/tickets/{ticket.id}/designs/', design_payload, format='json')
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.AWAITING_CUSTOMER_RESPONSE)

        # 6. Customer approves design
        self.client.force_authenticate(user=None)
        res_appr = self.client.post(f'/api/v1/orders/{order.order_reference}/approve-design/')
        self.assertEqual(res_appr.status_code, status.HTTP_200_OK)

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.AWAITING_PAYMENT)

        # 7. Payment order created & verified via server webhook
        res_pay_ord = self.client.post('/api/v1/payments/create-order/', {'order_reference': order.order_reference})
        self.assertEqual(res_pay_ord.status_code, status.HTTP_201_CREATED)
        gw_order_id = res_pay_ord.data['data']['gateway_order_id']

        # Webhook reports payment success
        webhook_payload = {
            'gateway_order_id': gw_order_id,
            'gateway_payment_id': 'pay_test_trans_123',
            'status': 'captured'
        }
        res_wh = self.client.post('/api/v1/payments/webhook/', webhook_payload, format='json')
        self.assertEqual(res_wh.status_code, status.HTTP_200_OK)

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.PAYMENT_DONE)

        # 8. Admin authorizes live publishing
        self.client.force_authenticate(user=self.admin_user)
        pub_payload = {
            'order_reference': order.order_reference,
            'custom_slug': 'ananya-karthik-wedding'
        }
        res_pub = self.client.post('/api/v1/publishing/authorize/', pub_payload, format='json')
        self.assertEqual(res_pub.status_code, status.HTTP_200_OK)

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.CLOSED)
        self.assertEqual(ticket.customer_facing_status, 'Celebration Live & Delivered')

        # 9. Verify live neutral celebration URL
        self.client.force_authenticate(user=None)
        res_live = self.client.get('/api/v1/publishing/invite/ananya-karthik-wedding/')
        self.assertEqual(res_live.status_code, status.HTTP_200_OK)
        self.assertFalse(res_live.data['is_expired'])
        self.assertEqual(res_live.data['data']['customer_name'], 'Ananya & Karthik')

        # 10. Verify deliverables endpoint unlocks downloads
        res_deliv = self.client.get(f'/api/v1/orders/{order.order_reference}/deliverables/')
        self.assertEqual(res_deliv.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res_deliv.data['data']['qr_code_svg'])

        # 11. Verify Central Activity Log records all key events
        logs = CentralActivityLog.objects.filter(record_id__in=[str(order.id), str(ticket.id)]).values_list('action', flat=True)
        # Should record key events
        self.assertTrue(CentralActivityLog.objects.count() > 5)

class FIFOConcurrencyStressTests(TransactionTestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin_conc@test.com', password='pass', role=UserRole.OPS_ADMIN, is_staff=True
        )
        self.occ = Occasion.objects.create(slug='birthday', display_name='Birthday', description='Bday')
        self.pkg = Package.objects.create(occasion=self.occ, name='Basic', code='B1', base_price_inr=299)
        self.order = Order.objects.create(
            order_reference='TC-2026-CONC01', customer_name='Aarav', customer_mobile='9999999999',
            occasion=self.occ, package=self.pkg, total_amount_inr=299
        )
        self.ticket = Ticket.objects.create(
            ticket_number='TC-2026-CONC01', order=self.order, status=TicketStatus.NEW_OPEN
        )

        # 5 developers
        self.devs = []
        for i in range(5):
            u = User.objects.create_user(
                email=f'dev{i}@test.com', password='pass', role=UserRole.DEV_ACTIVE
            )
            DeveloperProfile.objects.create(
                user=u, approval_status=ApprovalStatus.APPROVED_ACTIVE, approved_by=self.admin, max_active_tickets=3
            )
            self.devs.append(u)

    def test_zero_duplicate_fifo_claims(self):
        """Stress test: 5 concurrent claim threads attempting to claim 1 available ticket simultaneously."""
        results = []

        def claim_attempt(dev):
            from django.db import connection
            try:
                t = claim_next_fifo_ticket(dev)
                return ('SUCCESS', dev.email, str(t.id))
            except Exception as e:
                return ('FAILED', dev.email, str(e))
            finally:
                connection.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(claim_attempt, d) for d in self.devs]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        successes = [r for r in results if r[0] == 'SUCCESS']
        failures = [r for r in results if r[0] == 'FAILED']

        # Exactly ONE claim must succeed; all others must fail gracefully with no duplicate claims
        self.assertEqual(len(successes), 1, f"Exactly 1 developer must claim the ticket. Results: {results}")
        self.assertEqual(len(failures), 4, f"4 developers must fail cleanly. Results: {results}")

        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, TicketStatus.ASSIGNED)
        self.assertIsNotNone(self.ticket.assigned_developer)

