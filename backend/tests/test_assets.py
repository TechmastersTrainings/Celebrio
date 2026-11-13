from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Occasion, Package

from apps.orders.models import CustomerAsset, StoredFile


class CustomerAssetStorageTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        occasion = Occasion.objects.first() or Occasion.objects.create(slug='bday-a', display_name='Birthday A', is_active=True)
        package = Package.objects.filter(occasion=occasion).first() or Package.objects.create(
            occasion=occasion, name='Basic', code='PKG_A', base_price_inr=999, is_active=True)
        res = self.client.post('/api/v1/orders/', {
            'customer_name': 'Asset Test', 'customer_mobile': '9000000011',
            'occasion_id': str(occasion.id), 'package_id': str(package.id),
            'events': [{'event_title': 'Main', 'event_date': '2026-12-18', 'start_time': '10:30:00', 'venue_name': 'Hall'}],
        }, format='json')
        self.assertIn(res.status_code, (200, 201), res.content)
        self.ref = res.json()['data']['order_reference']

    def upload(self, name, data):
        res = self.client.post(f'/api/v1/orders/{self.ref}/assets/', {
            'file': SimpleUploadedFile(name, data, content_type='image/jpeg'), 'asset_category': 'COUPLE_PHOTO',
        }, format='multipart')
        self.assertEqual(res.status_code, 201, res.content)
        return res.json()['data']['id']

    def download(self, asset_id):
        res = self.client.get(f'/api/v1/orders/assets/{asset_id}/download/')
        return res.status_code, b''.join(res.streaming_content) if res.status_code == 200 else b''

    def test_files_persist_in_database_and_same_names_do_not_overwrite(self):
        a = self.upload('image.jpg', b'first-photo-bytes')
        b = self.upload('image.jpg', b'second-photo-bytes')
        self.assertEqual(StoredFile.objects.count(), 2)
        self.assertEqual(self.download(a), (200, b'first-photo-bytes'))
        self.assertEqual(self.download(b), (200, b'second-photo-bytes'))

    def test_missing_file_is_reported_not_replaced_with_placeholder(self):
        a = self.upload('card.jpg', b'card')
        StoredFile.objects.all().delete()
        code, body = self.download(a)
        self.assertEqual(code, 404)
        self.assertTrue(CustomerAsset.objects.filter(id=a).exists())

    def test_upload_without_file_is_rejected(self):
        res = self.client.post(f'/api/v1/orders/{self.ref}/assets/', {'asset_category': 'COUPLE_PHOTO'}, format='multipart')
        self.assertEqual(res.status_code, 400)
