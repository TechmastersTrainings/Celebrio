from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.catalog.catalog_data import CATALOG, PRICE_POINTS
from apps.catalog.models import Package


class CatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_all_occasions_published_with_flat_price_points(self):
        data = self.client.get('/api/v1/catalog/occasions/').json()
        slugs = [o['slug'] for o in data]
        for s in ['house-warming', 'baby-shower', 'religious-cultural', 'digital-invitation-websites',
                  'digital-invitation-cards', 'animated-invitation-videos']:
            self.assertIn(s, slugs)
        self.assertEqual(len(data), len(CATALOG))
        prices = {float(p['base_price_inr']) for o in data for p in o['packages']}
        self.assertTrue(prices <= set(PRICE_POINTS), prices)

    def test_no_paid_addons_offered(self):
        self.assertEqual(self.client.get('/api/v1/catalog/addons/').json(), [])

    def test_admin_cannot_set_off_grid_price(self):
        admin = User.objects.create(email='adm.cat@example.com', full_name='Adm', role=UserRole.SUPER_ADMIN, is_superuser=True)
        self.client.force_authenticate(admin)
        pkg = Package.objects.get(code='PKG_MARRIAGE_PREMIUM')
        bad = self.client.patch(f'/api/v1/catalog/packages/{pkg.id}/', {'base_price_inr': '999.00'}, format='json')
        self.assertEqual(bad.status_code, 400)
        ok = self.client.patch(f'/api/v1/catalog/packages/{pkg.id}/', {'base_price_inr': '499.00'}, format='json')
        self.assertEqual(ok.status_code, 200, ok.content)
