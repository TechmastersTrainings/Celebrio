from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole
from apps.audit.services import log_activity

from . import services
from .models import City, Country, Locality, State, Venue, VenueCategory, VenueType, VerificationStatus
from .serializers import (
    AdminLocalitySerializer,
    AdminVenueSerializer,
    CitySerializer,
    CountrySerializer,
    LocalitySerializer,
    StateSerializer,
)


def ok(data, code=status.HTTP_200_OK):
    return Response({'success': True, 'data': data}, status=code)


def err(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'error': message if isinstance(message, dict) else {'message': message}}, status=code)


def _int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _audit(request, action, record_id, new_value=None, remarks=''):
    log_activity(
        actor=request.user,
        actor_role=request.user.role,
        action=action,
        module='VENUES',
        record_id=str(record_id),
        new_value=new_value or {},
        remarks=remarks,
        ip_address=request.META.get('REMOTE_ADDR'),
        status='SUCCESS',
    )


# --------------------------------------------------------------------------- #
# Public (customer form) endpoints
# --------------------------------------------------------------------------- #
class VenueOptionsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return ok({
            'venue_types': [{'value': c.value, 'label': c.label} for c in VenueType],
            'venue_categories': [{'value': c.value, 'label': c.label} for c in VenueCategory],
            'external_provider_enabled': services.external_provider_enabled(),
        })


class CountryListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Country.objects.filter(is_active=True)
        return ok(CountrySerializer(qs, many=True).data)


class StateListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = State.objects.filter(is_active=True)
        if _int(request.query_params.get('country')):
            qs = qs.filter(country_id=_int(request.query_params['country']))
        return ok(StateSerializer(qs, many=True).data)


class CityListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = City.objects.filter(is_active=True).select_related('state')
        if _int(request.query_params.get('state')):
            qs = qs.filter(state_id=_int(request.query_params['state']))
        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(name__icontains=q)
        return ok(CitySerializer(qs[:200], many=True).data)


class LocalityListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        city_id = _int(request.query_params.get('city'))
        if not city_id:
            return err('city is required.')
        qs = Locality.objects.filter(city_id=city_id, is_active=True)
        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(name__icontains=q)
        return ok(LocalitySerializer(qs[:300], many=True).data)


class NearbyLocalitiesView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, locality_id):
        locality = Locality.objects.filter(id=locality_id, is_active=True).first()
        if not locality:
            return err('Locality not found.', status.HTTP_404_NOT_FOUND)
        try:
            radius = float(request.query_params.get('radius_km') or services.DEFAULT_RADIUS_KM)
        except ValueError:
            radius = services.DEFAULT_RADIUS_KM
        near = services.nearby_localities(locality, min(radius, services.MAX_RADIUS_KM))
        return ok({
            'locality': {'id': locality.id, 'name': locality.name, 'has_coordinates': locality.has_coordinates},
            'nearby': [{'id': l.id, 'name': l.name, 'distance_km': d, 'basis': b} for l, d, b in near],
        })


class VenueSearchView(views.APIView):
    """
    GET /locations/venues/search/?city=<id>&locality=<id>&q=<text>&scope=locality|nearby|city
        &radius_km=5&category=FUNCTION_HALL&limit=15
    Returns only verified, active directory venues (+ clearly-labelled external
    listings when a provider is configured server-side).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        p = request.query_params
        city = City.objects.filter(id=_int(p.get('city')), is_active=True).select_related('state').first()
        if not city:
            return err('A valid city is required.')
        locality = None
        if _int(p.get('locality')):
            locality = Locality.objects.filter(id=_int(p['locality']), city=city, is_active=True).first()
        scope = p.get('scope') if p.get('scope') in ('locality', 'nearby', 'city') else 'locality'
        q = (p.get('q') or '').strip()[:100]
        limit = max(1, min(_int(p.get('limit')) or 15, 50))
        data = services.search_venues(
            city=city, q=q, locality=locality, scope=scope,
            radius_km=p.get('radius_km') or services.DEFAULT_RADIUS_KM,
            category=p.get('category'), limit=limit,
        )
        data['external_provider_enabled'] = services.external_provider_enabled()
        data['external_results'] = []
        # Only hit the paid external provider when the directory is thin.
        if data['external_provider_enabled'] and len(q) >= 3 and len(data['results']) < 5:
            known = {r['name'].lower() for r in data['results']}
            data['external_results'] = [
                r for r in services.external_search(q, city, locality) if r['name'].lower() not in known
            ]
        return ok(data)


# --------------------------------------------------------------------------- #
# Admin venue directory management
# --------------------------------------------------------------------------- #
class AdminVenueListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        p = request.query_params
        qs = Venue.objects.select_related('city', 'locality', 'verified_by').all()
        if p.get('status') in VerificationStatus.values:
            qs = qs.filter(verification_status=p['status'])
        if p.get('active') in ('true', 'false'):
            qs = qs.filter(is_active=p['active'] == 'true')
        if _int(p.get('city')):
            qs = qs.filter(city_id=_int(p['city']))
        if _int(p.get('locality')):
            qs = qs.filter(locality_id=_int(p['locality']))
        if p.get('category') in VenueCategory.values:
            qs = qs.filter(category=p['category'])
        q = (p.get('q') or '').strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(full_address__icontains=q) | Q(locality__name__icontains=q))
        counts = dict(Venue.objects.values_list('verification_status').annotate(n=Count('id')))
        return ok({
            'venues': AdminVenueSerializer(qs.order_by('verification_status', 'name')[:500], many=True).data,
            'counts': {s: counts.get(s, 0) for s in VerificationStatus.values},
        })

    def post(self, request):
        serializer = AdminVenueSerializer(data=request.data)
        if not serializer.is_valid():
            return err(serializer.errors)
        mark_verified = bool(request.data.get('mark_verified'))
        extra = {'data_source': 'ADMIN'}
        if mark_verified:
            extra.update(verification_status=VerificationStatus.VERIFIED, last_verified_at=timezone.now(), verified_by=request.user)
        venue = serializer.save(**extra)
        _audit(request, 'VENUE_CREATED', venue.id, {'name': venue.name, 'status': venue.verification_status})
        return ok(AdminVenueSerializer(venue).data, status.HTTP_201_CREATED)


class AdminVenueDetailView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, venue_id):
        venue = Venue.objects.filter(id=venue_id).first()
        if not venue:
            return err('Venue not found.', status.HTTP_404_NOT_FOUND)
        serializer = AdminVenueSerializer(venue, data=request.data, partial=True)
        if not serializer.is_valid():
            return err(serializer.errors)
        venue = serializer.save()
        _audit(request, 'VENUE_UPDATED', venue.id, {k: str(v) for k, v in request.data.items()})
        return ok(AdminVenueSerializer(venue).data)

    def delete(self, request, venue_id):
        """Soft delete: venues referenced by orders must keep their history."""
        venue = Venue.objects.filter(id=venue_id).first()
        if not venue:
            return err('Venue not found.', status.HTTP_404_NOT_FOUND)
        venue.is_active = False
        venue.save(update_fields=['is_active', 'updated_at'])
        _audit(request, 'VENUE_DEACTIVATED', venue.id, {'name': venue.name})
        return ok(AdminVenueSerializer(venue).data)


class AdminVenueVerifyView(views.APIView):
    """POST {"decision": "VERIFY" | "REJECT" | "RESET", "notes": "..."}"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, venue_id):
        venue = Venue.objects.filter(id=venue_id).first()
        if not venue:
            return err('Venue not found.', status.HTTP_404_NOT_FOUND)
        decision = (request.data.get('decision') or 'VERIFY').upper()
        mapping = {'VERIFY': VerificationStatus.VERIFIED, 'REJECT': VerificationStatus.REJECTED, 'RESET': VerificationStatus.PENDING}
        if decision not in mapping:
            return err('decision must be VERIFY, REJECT or RESET.')
        venue.verification_status = mapping[decision]
        if decision == 'VERIFY':
            venue.last_verified_at = timezone.now()
            venue.verified_by = request.user
        notes = (request.data.get('notes') or '').strip()
        if notes:
            venue.admin_notes = notes
        venue.save()
        _audit(request, f'VENUE_{decision}', venue.id, {'name': venue.name, 'status': venue.verification_status}, notes)
        return ok(AdminVenueSerializer(venue).data)


class AdminLocalityListView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = Locality.objects.select_related('city').prefetch_related('nearby_localities')
        if _int(request.query_params.get('city')):
            qs = qs.filter(city_id=_int(request.query_params['city']))
        return ok(AdminLocalitySerializer(qs.order_by('city__name', 'name'), many=True).data)

    def post(self, request):
        serializer = AdminLocalitySerializer(data=request.data)
        if not serializer.is_valid():
            return err(serializer.errors)
        loc = serializer.save(data_source='ADMIN')
        _audit(request, 'LOCALITY_CREATED', loc.id, {'name': loc.name, 'city': loc.city.name})
        return ok(AdminLocalitySerializer(loc).data, status.HTTP_201_CREATED)


class AdminLocalityDetailView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, locality_id):
        loc = Locality.objects.filter(id=locality_id).first()
        if not loc:
            return err('Locality not found.', status.HTTP_404_NOT_FOUND)
        serializer = AdminLocalitySerializer(loc, data=request.data, partial=True)
        if not serializer.is_valid():
            return err(serializer.errors)
        loc = serializer.save()
        _audit(request, 'LOCALITY_UPDATED', loc.id, {k: str(v) for k, v in request.data.items()})
        return ok(AdminLocalitySerializer(loc).data)
