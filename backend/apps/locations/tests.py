from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.catalog.models import Occasion, Package
from apps.orders.models import Order, OrderEvent

from .models import City, Locality, Venue, VerificationStatus


class VenueSearchTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Seed migration provides India > Karnataka > Bidar and its localities.
        cls.bidar = City.objects.get(name='Bidar')
        cls.gumpa = Locality.objects.get(city=cls.bidar, name='Gumpa')
        cls.shahganj = Locality.objects.get(city=cls.bidar, name='Shahganj')
        cls.mailoor = Locality.objects.get(city=cls.bidar, name='Mailoor')

        def mk(name, loc, category='FUNCTION_HALL', status=VerificationStatus.VERIFIED, active=True, **kw):
            return Venue.objects.create(
                name=name, category=category, city=cls.bidar, locality=loc,
                full_address=f'{name}, {loc.name}, Bidar', verification_status=status,
                is_active=active, last_verified_at=timezone.now(), **kw,
            )

        cls.salam = mk('Salam Function Hall', cls.shahganj)
        cls.sai = mk('Sai Convention Centre', cls.gumpa)
        cls.reva = mk('Revathi Banquet', cls.mailoor, category='RESTAURANT_BANQUET')
        cls.pending = mk('Sapphire Hall', cls.gumpa, status=VerificationStatus.PENDING)
        cls.inactive = mk('Samrat Palace', cls.gumpa, active=False)

    def setUp(self):
        self.client = APIClient()

    def search(self, **params):
        params.setdefault('city', self.bidar.id)
        res = self.client.get('/api/v1/locations/venues/search/', params)
        self.assertEqual(res.status_code, 200, res.content)
        return res.json()['data']

    def names(self, data):
        return [r['name'] for r in data['results']]

    def test_cascade_endpoints(self):
        countries = self.client.get('/api/v1/locations/countries/').json()['data']
        self.assertIn('India', [c['name'] for c in countries])
        locs = self.client.get('/api/v1/locations/localities/', {'city': self.bidar.id}).json()['data']
        self.assertTrue({'Gumpa', 'Shahganj', 'Mailoor', 'Old City'} <= {l['name'] for l in locs})

    def test_prefix_updates_as_user_types(self):
        s = self.names(self.search(q='S', scope='city'))
        self.assertIn('Salam Function Hall', s)
        self.assertIn('Sai Convention Centre', s)
        self.assertEqual(self.names(self.search(q='Salam', scope='city')), ['Salam Function Hall'])

    def test_case_insensitive_and_substring(self):
        self.assertIn('Salam Function Hall', self.names(self.search(q='sALAm', scope='city')))
        self.assertIn('Sai Convention Centre', self.names(self.search(q='vention', scope='city')))

    def test_partial_word_prefix(self):
        self.assertIn('Revathi Banquet', self.names(self.search(q='Reva', scope='city')))

    def test_spelling_tolerance(self):
        self.assertIn('Salam Function Hall', self.names(self.search(q='Slaam', scope='city')))

    def test_search_by_locality_and_category(self):
        self.assertIn('Salam Function Hall', self.names(self.search(q='Shahg', scope='city')))
        self.assertIn('Revathi Banquet', self.names(self.search(q='banquet', scope='city')))

    def test_never_returns_unverified_or_inactive(self):
        all_names = self.names(self.search(q='', scope='city'))
        self.assertNotIn('Sapphire Hall', all_names)
        self.assertNotIn('Samrat Palace', all_names)

    def test_locality_scope_and_counts(self):
        data = self.search(q='Sala', locality=self.gumpa.id)
        self.assertEqual(data['results'], [])
        self.assertEqual(data['counts']['city'], 1)
        # No curated/coordinate data → other localities offered, labelled honestly
        self.assertEqual(data['locality_suggestion_kind'], 'SAME_CITY')
        sug = {s['name']: s for s in data['locality_suggestions']}
        self.assertEqual(sug['Shahganj']['match_count'], 1)
        self.assertIsNone(sug['Shahganj']['distance_km'])

    def test_curated_nearby_fallback(self):
        self.gumpa.nearby_localities.add(self.shahganj)
        data = self.search(q='Sala', locality=self.gumpa.id, scope='nearby')
        self.assertEqual(self.names(data), ['Salam Function Hall'])
        self.assertEqual(data['results'][0]['locality'], 'Shahganj')
        self.assertEqual(data['locality_suggestion_kind'], 'NEARBY')
        # Mailoor is not curated as nearby, so not in nearby scope
        self.assertNotIn('Revathi Banquet', self.names(self.search(q='Reva', locality=self.gumpa.id, scope='nearby')))

    def test_distance_only_with_real_coordinates(self):
        data = self.search(q='Salam', scope='city', locality=self.gumpa.id)
        self.assertIsNone(data['results'][0]['distance_km'])
        Locality.objects.filter(id=self.gumpa.id).update(latitude=Decimal('17.900000'), longitude=Decimal('77.500000'))
        Venue.objects.filter(id=self.salam.id).update(latitude=Decimal('17.910000'), longitude=Decimal('77.510000'))
        data = self.search(q='Salam', scope='city', locality=self.gumpa.id)
        self.assertAlmostEqual(data['results'][0]['distance_km'], 1.5, delta=0.2)
        # Radius-based nearby: Salam within 3 km of Gumpa
        self.assertIn('Salam Function Hall', self.names(self.search(q='Salam', locality=self.gumpa.id, scope='nearby', radius_km=3)))


class OrderVenueSnapshotTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bidar = City.objects.get(name='Bidar')
        cls.gumpa = Locality.objects.get(city=cls.bidar, name='Gumpa')
        cls.occasion = Occasion.objects.create(slug='birthday-t', display_name='Birthday T', is_active=True) \
            if not Occasion.objects.exists() else Occasion.objects.first()
        cls.package = Package.objects.filter(occasion=cls.occasion).first() or Package.objects.create(
            occasion=cls.occasion, name='Basic', code='PKG_T', base_price_inr=999, is_active=True)
        cls.venue = Venue.objects.create(
            name='Salam Function Hall', category='FUNCTION_HALL', city=cls.bidar, locality=cls.gumpa,
            full_address='Main Road, Gumpa, Bidar', verification_status=VerificationStatus.VERIFIED,
            contact_phone='9999999999', contact_verified=False,
        )

    def submit(self, event):
        base = {'event_title': 'Main', 'event_date': '2026-12-18', 'start_time': '10:30:00'}
        base.update(event)
        res = APIClient().post('/api/v1/orders/', {
            'customer_name': 'Test', 'customer_mobile': '9000000000',
            'occasion_id': str(self.occasion.id), 'package_id': str(self.package.id),
            'events': [base],
        }, format='json')
        self.assertIn(res.status_code, (200, 201), res.content)
        return OrderEvent.objects.filter(order__order_reference=res.json()['data']['order_reference']).get()

    def test_directory_venue_snapshot_is_authoritative(self):
        ev = self.submit({'venue_id': str(self.venue.id), 'venue_name': 'SPOOFED', 'venue_type': 'FUNCTION_HALL',
                          'city_id': self.bidar.id, 'locality_id': self.gumpa.id})
        self.assertEqual(ev.venue_id, self.venue.id)
        self.assertEqual(ev.venue_source, 'VERIFIED_DIRECTORY')
        self.assertEqual(ev.venue_name, 'Salam Function Hall')
        self.assertEqual(ev.venue_snapshot_json['locality'], 'Gumpa')
        self.assertIsNone(ev.venue_snapshot_json['contact_phone'])  # unverified contact never copied
        # Directory edits later don't change the order snapshot
        Venue.objects.filter(id=self.venue.id).update(name='Renamed Hall')
        ev.refresh_from_db()
        self.assertEqual(ev.venue_snapshot_json['name'], 'Salam Function Hall')

    def test_manual_venue_is_customer_provided_and_queued(self):
        ev = self.submit({'venue_source': 'CUSTOMER_PROVIDED', 'venue_type': 'OUTDOOR', 'venue_name': 'Green Farm Lawn',
                          'venue_address': 'Near X', 'city_id': self.bidar.id, 'locality_id': self.gumpa.id,
                          'google_maps_url': 'maps.app.goo.gl/abc'})
        self.assertEqual(ev.venue_source, 'CUSTOMER_PROVIDED')
        self.assertEqual(ev.venue_locality, 'Gumpa')
        self.assertEqual(ev.google_maps_url, 'https://maps.app.goo.gl/abc')
        self.assertEqual(ev.venue.verification_status, VerificationStatus.PENDING)
        # Pending venue is not searchable by customers
        data = APIClient().get('/api/v1/locations/venues/search/', {'city': self.bidar.id, 'q': 'Green', 'scope': 'city'}).json()['data']
        self.assertEqual(data['results'], [])

    def test_home_venue_not_added_to_directory(self):
        # A stale locality label (e.g. copied from another ceremony's venue) must not win over the selected area.
        ev = self.submit({'venue_type': 'HOME', 'venue_source': 'CUSTOMER_PROVIDED', 'venue_name': 'Our Residence',
                          'venue_locality': 'Shahganj',
                          'venue_address': 'H.No 4-12, Gumpa', 'city_id': self.bidar.id, 'locality_id': self.gumpa.id})
        self.assertEqual(ev.venue_locality, 'Gumpa')
        self.assertEqual(ev.venue_type, 'HOME')
        self.assertIsNone(ev.venue)
        self.assertEqual(ev.venue_snapshot_json['city'], 'Bidar')

    def test_unverified_venue_id_cannot_masquerade_as_verified(self):
        Venue.objects.filter(id=self.venue.id).update(verification_status=VerificationStatus.PENDING)
        ev = self.submit({'venue_id': str(self.venue.id), 'venue_name': 'Salam Function Hall', 'venue_type': 'FUNCTION_HALL'})
        self.assertEqual(ev.venue_source, 'CUSTOMER_PROVIDED')

    def test_legacy_payload_still_works(self):
        ev = self.submit({'venue_name': 'Old Style Hall', 'venue_address': 'Bidar'})
        self.assertEqual(ev.venue_name, 'Old Style Hall')
        self.assertEqual(Order.objects.count(), 1)
