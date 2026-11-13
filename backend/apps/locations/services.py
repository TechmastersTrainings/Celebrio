"""
Venue search, nearby-locality resolution and order venue snapshots.

Search is done in Python over the (small, per-city) verified directory so we can
offer prefix, substring, locality, category and spelling-tolerant matching
without depending on database-specific extensions (works on SQLite and Postgres).
"""
import json
import logging
import math
import os
import re
import urllib.request
from difflib import SequenceMatcher

from django.core.cache import cache
from django.utils import timezone

from .models import (
    City,
    Locality,
    Venue,
    VenueCategory,
    VenueDataSource,
    VenueType,
    VerificationStatus,
)

logger = logging.getLogger(__name__)

MAX_CANDIDATES = 3000
DEFAULT_RADIUS_KM = 5.0
MAX_RADIUS_KM = 50.0


# --------------------------------------------------------------------------- #
# Geometry
# --------------------------------------------------------------------------- #
def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in km. Returns None unless all four values are real."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    lat1, lon1, lat2, lon2 = map(float, (lat1, lon1, lat2, lon2))
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 2)


def nearby_localities(locality, radius_km=DEFAULT_RADIUS_KM):
    """
    Genuinely nearby localities: admin-curated neighbours plus any locality in the
    same city whose real coordinates fall within ``radius_km``.

    Returns a list of (Locality, distance_km | None, reason) ordered by distance.
    """
    found = {}
    for loc in locality.nearby_localities.filter(is_active=True):
        found[loc.id] = (loc, haversine_km(locality.latitude, locality.longitude, loc.latitude, loc.longitude), 'CURATED')

    if locality.has_coordinates:
        others = Locality.objects.filter(city=locality.city, is_active=True).exclude(id=locality.id)
        for loc in others:
            if loc.id in found:
                continue
            d = haversine_km(locality.latitude, locality.longitude, loc.latitude, loc.longitude)
            if d is not None and d <= radius_km:
                found[loc.id] = (loc, d, 'COORDINATES')

    return sorted(found.values(), key=lambda t: (t[1] is None, t[1] or 0, t[0].name))


# --------------------------------------------------------------------------- #
# Text matching
# --------------------------------------------------------------------------- #
_WORD_RE = re.compile(r"[a-z0-9]+")
CATEGORY_LABELS = {c.value: c.label.lower() for c in VenueCategory}
# Common words customers type for each category
CATEGORY_KEYWORDS = {
    VenueCategory.FUNCTION_HALL: ['function', 'hall', 'convention', 'kalyana', 'kalyan', 'mantapa', 'mantap',
                                  'mandapam', 'palace', 'mahal', 'garden', 'banquet', 'community'],
}


def _norm(s):
    return ' '.join(_WORD_RE.findall((s or '').lower()))


def _fuzzy(a, b):
    return SequenceMatcher(None, a, b).ratio()


def score_venue(venue, q, preferred_category=None):
    """
    Relevance score (0 = no match). Tiers:
      100 exact name · 90 name prefix · 80 word prefix · 65 substring ·
      55 locality match · 45 category match · 25-40 spelling-tolerant match.
    """
    name = _norm(venue.name)
    words = name.split()
    loc = _norm(venue.locality.name) if venue.locality_id else ''
    q = _norm(q)
    if not q:
        score = 10.0
    elif name == q:
        score = 100.0
    elif name.startswith(q):
        score = 90.0
    elif any(w.startswith(q) for w in words):
        score = 80.0
    elif q in name:
        score = 65.0
    elif loc and (loc.startswith(q) or q in loc):
        score = 55.0
    elif q in CATEGORY_LABELS.get(venue.category, '') or any(
        k.startswith(q) for k in CATEGORY_KEYWORDS.get(venue.category, [])
    ):
        score = 45.0
    else:
        score = 0.0
        if len(q) >= 3:
            # Spelling tolerance: compare against each word and against the same-length name prefix.
            q_words = q.split()
            best = 0.0
            for qw in q_words:
                for w in words:
                    best = max(best, _fuzzy(qw, w[: max(len(qw), 1) + 1]), _fuzzy(qw, w))
            best = max(best, _fuzzy(q, name[: len(q)]))
            if best >= 0.72:
                score = 25.0 + (best - 0.72) / 0.28 * 15.0

    if score and preferred_category and venue.category == preferred_category:
        score += 5.0
    return score


# --------------------------------------------------------------------------- #
# Serialisation for search results
# --------------------------------------------------------------------------- #
def venue_result(venue, origin=None, selected_locality_id=None):
    distance = None
    if origin is not None and venue.has_coordinates:
        distance = haversine_km(origin[0], origin[1], venue.latitude, venue.longitude)
    return {
        'id': str(venue.id),
        'name': venue.name,
        'category': venue.category,
        'category_label': venue.get_category_display(),
        'city': venue.city.name,
        'city_id': venue.city_id,
        'locality': venue.locality.name if venue.locality_id else None,
        'locality_id': venue.locality_id,
        'full_address': venue.full_address,
        'google_maps_url': venue.google_maps_url or None,
        # Only expose contact details an admin has verified.
        'contact_phone': venue.contact_phone if venue.contact_verified else None,
        'latitude': float(venue.latitude) if venue.latitude is not None else None,
        'longitude': float(venue.longitude) if venue.longitude is not None else None,
        'distance_km': distance,
        'is_in_selected_locality': bool(selected_locality_id and venue.locality_id == selected_locality_id),
        'verification_status': venue.verification_status,
        'is_verified': venue.verification_status == VerificationStatus.VERIFIED,
        'source': 'VERIFIED_DIRECTORY',
        'last_verified_at': venue.last_verified_at.isoformat() if venue.last_verified_at else None,
    }


# --------------------------------------------------------------------------- #
# Main search
# --------------------------------------------------------------------------- #
def search_venues(*, city, q='', locality=None, scope='locality', radius_km=DEFAULT_RADIUS_KM,
                  category=None, limit=15):
    """
    scope:
      * ``locality`` – only the selected locality
      * ``nearby``   – selected locality + genuinely nearby localities (curated / within radius)
      * ``city``     – the whole city
    Always returns match counts for the broader scopes so the UI can offer to expand.
    """
    radius_km = max(0.5, min(float(radius_km or DEFAULT_RADIUS_KM), MAX_RADIUS_KM))
    if category not in VenueCategory.values:
        category = None

    candidates = list(
        Venue.objects.filter(city=city, is_active=True, verification_status=VerificationStatus.VERIFIED)
        .select_related('locality', 'city')[:MAX_CANDIDATES]
    )

    scored = []
    for v in candidates:
        s = score_venue(v, q, category)
        if s > 0:
            scored.append((s, v))

    origin = None
    if locality is not None and locality.has_coordinates:
        origin = (locality.latitude, locality.longitude)
    elif city.latitude is not None and city.longitude is not None and locality is None:
        origin = (city.latitude, city.longitude)

    near = nearby_localities(locality, radius_km) if locality else []
    near_ids = {loc.id for loc, _, _ in near}

    def in_nearby(v):
        if locality is None:
            return True
        if v.locality_id == locality.id or v.locality_id in near_ids:
            return True
        if origin is not None and v.has_coordinates:
            d = haversine_km(origin[0], origin[1], v.latitude, v.longitude)
            return d is not None and d <= radius_km
        return False

    in_locality = [(s, v) for s, v in scored if locality is not None and v.locality_id == locality.id]
    in_near = [(s, v) for s, v in scored if in_nearby(v)]

    if locality is None or scope == 'city':
        chosen = scored
    elif scope == 'nearby':
        chosen = in_near
    else:
        chosen = in_locality

    def sort_key(item):
        s, v = item
        same = 0 if (locality is not None and v.locality_id == locality.id) else 1
        d = haversine_km(origin[0], origin[1], v.latitude, v.longitude) if (origin and v.has_coordinates) else None
        return (same, -s, d if d is not None else 1e9, v.name.lower())

    chosen.sort(key=sort_key)
    results = [venue_result(v, origin, locality.id if locality else None) for _, v in chosen[:limit]]

    # Locality suggestions for the "nothing here" fallback.
    if near:
        suggestions = [
            {'id': loc.id, 'name': loc.name, 'distance_km': d, 'basis': basis}
            for loc, d, basis in near
        ]
        suggestion_kind = 'NEARBY'
    elif locality is not None:
        # No curated/coordinate data: offer the other localities in the city, labelled honestly.
        suggestions = [
            {'id': loc.id, 'name': loc.name, 'distance_km': None, 'basis': 'SAME_CITY'}
            for loc in Locality.objects.filter(city=city, is_active=True).exclude(id=locality.id)[:20]
        ]
        suggestion_kind = 'SAME_CITY'
    else:
        suggestions, suggestion_kind = [], None

    # Count matches per other locality so suggestions can show "3 matches".
    per_loc = {}
    for _, v in scored:
        if v.locality_id:
            per_loc[v.locality_id] = per_loc.get(v.locality_id, 0) + 1
    for sug in suggestions:
        sug['match_count'] = per_loc.get(sug['id'], 0)

    return {
        'query': q,
        'scope': scope if locality is not None else 'city',
        'radius_km': radius_km,
        'city': {'id': city.id, 'name': city.name},
        'locality': {'id': locality.id, 'name': locality.name, 'has_coordinates': locality.has_coordinates} if locality else None,
        'results': results,
        'counts': {
            'locality': len(in_locality),
            'nearby': len(in_near),
            'city': len(scored),
        },
        'locality_suggestions': suggestions,
        'locality_suggestion_kind': suggestion_kind,
        'distance_available': origin is not None,
    }


# --------------------------------------------------------------------------- #
# Optional external places provider (server-side only; key never reaches the browser)
# --------------------------------------------------------------------------- #
def external_provider_enabled():
    return bool(os.getenv('GOOGLE_PLACES_API_KEY'))


def external_search(q, city, locality=None, limit=6):
    """
    Google Places (New) Text Search. Disabled unless GOOGLE_PLACES_API_KEY is set.
    Results are real listings but NOT verified by us; they are labelled as such.
    """
    key = os.getenv('GOOGLE_PLACES_API_KEY')
    q = (q or '').strip()
    if not key or len(q) < 3:
        return []

    area = ', '.join(p for p in [locality.name if locality else None, city.name, city.state.name] if p)
    text_query = f"{q} in {area}"
    cache_key = 'gplaces:' + re.sub(r'\W+', '_', text_query.lower())[:200]
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    body = {'textQuery': text_query, 'maxResultCount': limit, 'languageCode': 'en'}
    if locality is not None and locality.has_coordinates:
        body['locationBias'] = {'circle': {
            'center': {'latitude': float(locality.latitude), 'longitude': float(locality.longitude)},
            'radius': 10000.0,
        }}
    req = urllib.request.Request(
        'https://places.googleapis.com/v1/places:searchText',
        data=json.dumps(body).encode(),
        headers={
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.primaryTypeDisplayName',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            payload = json.loads(resp.read().decode())
    except Exception as exc:  # network / quota / auth – never break the form
        logger.warning('External places search failed: %s', exc)
        return []

    origin = (locality.latitude, locality.longitude) if (locality is not None and locality.has_coordinates) else None
    out = []
    for p in payload.get('places', [])[:limit]:
        loc = p.get('location') or {}
        lat, lng = loc.get('latitude'), loc.get('longitude')
        out.append({
            'id': f"ext:{p.get('id')}",
            'external_place_id': p.get('id'),
            'name': (p.get('displayName') or {}).get('text', ''),
            'category': None,
            'category_label': (p.get('primaryTypeDisplayName') or {}).get('text') or 'Listed place',
            'city': city.name,
            'city_id': city.id,
            'locality': None,
            'locality_id': None,
            'full_address': p.get('formattedAddress', ''),
            'google_maps_url': p.get('googleMapsUri'),
            'contact_phone': None,
            'latitude': lat,
            'longitude': lng,
            'distance_km': haversine_km(origin[0], origin[1], lat, lng) if origin else None,
            'is_in_selected_locality': False,
            'verification_status': 'UNVERIFIED',
            'is_verified': False,
            'source': 'EXTERNAL_PROVIDER',
            'last_verified_at': None,
        })
    cache.set(cache_key, out, 600)
    return out


# --------------------------------------------------------------------------- #
# Order integration
# --------------------------------------------------------------------------- #
VENUE_SOURCES = ('VERIFIED_DIRECTORY', 'EXTERNAL_PROVIDER', 'CUSTOMER_PROVIDED')


def _clean(s, n=None):
    s = (s or '').strip()
    return s[:n] if n else s


def resolve_event_venue(ev):
    """
    Normalise the venue part of an incoming order event (mutates and returns ``ev``).

    * A directory venue is re-read from the DB (the client cannot spoof its details)
      and a snapshot is stored so later directory edits don't change the order.
    * External-provider and manual venues keep the customer's submitted details,
      are marked as such, and are queued in the directory as PENDING for admin review.
    """
    venue_id = ev.pop('venue_id', None)
    external_place_id = _clean(ev.pop('external_place_id', ''), 255)
    city_id = ev.pop('city_id', None)
    locality_id = ev.pop('locality_id', None)
    latitude = ev.pop('venue_latitude', None)
    longitude = ev.pop('venue_longitude', None)

    venue_type = ev.get('venue_type') or ''
    source = ev.get('venue_source') or ''

    city = City.objects.filter(id=city_id).select_related('state__country').first() if city_id else None
    locality = Locality.objects.filter(id=locality_id).first() if locality_id else None
    if locality and not city:
        city = locality.city

    directory_venue = None
    if venue_id:
        directory_venue = Venue.objects.filter(
            id=venue_id, is_active=True, verification_status=VerificationStatus.VERIFIED
        ).select_related('city__state__country', 'locality').first()

    snapshot = {'captured_at': timezone.now().isoformat()}

    if directory_venue:
        v = directory_venue
        ev['venue'] = v
        ev['venue_source'] = 'VERIFIED_DIRECTORY'
        ev['venue_name'] = v.name
        ev['venue_address'] = v.full_address or ev.get('venue_address', '')
        ev['venue_city'] = v.city.name
        ev['venue_locality'] = v.locality.name if v.locality_id else ev.get('venue_locality', '')
        if v.google_maps_url:
            ev['google_maps_url'] = v.google_maps_url
        ev['venue_contact_phone'] = v.contact_phone if v.contact_verified else ev.get('venue_contact_phone', '')
        if not venue_type or venue_type == VenueType.HOME:
            ev['venue_type'] = v.category
        snapshot.update({
            'venue_id': str(v.id),
            'name': v.name,
            'category': v.category,
            'category_label': v.get_category_display(),
            'country': v.city.state.country.name,
            'state': v.city.state.name,
            'city': v.city.name,
            'locality': v.locality.name if v.locality_id else None,
            'full_address': v.full_address,
            'latitude': float(v.latitude) if v.latitude is not None else None,
            'longitude': float(v.longitude) if v.longitude is not None else None,
            'google_maps_url': v.google_maps_url or None,
            'contact_phone': v.contact_phone if v.contact_verified else None,
            'verification_status': v.verification_status,
            'last_verified_at': v.last_verified_at.isoformat() if v.last_verified_at else None,
        })
    else:
        if source not in ('EXTERNAL_PROVIDER', 'CUSTOMER_PROVIDED'):
            # Unknown/legacy/no-longer-verified directory id → treat as customer provided.
            source = 'CUSTOMER_PROVIDED' if (ev.get('venue_name') or venue_type) else ''
        if venue_type == VenueType.HOME and source:
            source = 'CUSTOMER_PROVIDED'
        ev['venue_source'] = source
        # For a home address the selected area is authoritative; for a manual commercial venue
        # keep what the customer typed and only fill blanks from the selected area.
        if city and (venue_type == VenueType.HOME or not ev.get('venue_city')):
            ev['venue_city'] = city.name
        if locality and (venue_type == VenueType.HOME or not ev.get('venue_locality')):
            ev['venue_locality'] = locality.name
        if source:
            snapshot.update({
                'name': ev.get('venue_name'),
                'venue_type': venue_type,
                'country': city.state.country.name if city else None,
                'state': city.state.name if city else None,
                'city': ev.get('venue_city'),
                'locality': ev.get('venue_locality'),
                'full_address': ev.get('venue_address'),
                'google_maps_url': ev.get('google_maps_url') or None,
                'contact_phone': ev.get('venue_contact_phone') or None,
                'external_place_id': external_place_id or None,
                'verification_status': 'UNVERIFIED',
            })
            ev['venue'] = _queue_for_review(ev, source, venue_type, city, locality, external_place_id, latitude, longitude)

    ev['venue_snapshot_json'] = snapshot if source or directory_venue else {}
    return ev


def _queue_for_review(ev, source, venue_type, city, locality, external_place_id, latitude, longitude):
    """Add a commercial venue the customer used to the directory as PENDING (never auto-verified)."""
    name = _clean(ev.get('venue_name'), 200)
    if not city or not name or venue_type == VenueType.HOME:
        return None
    category = VenueCategory.FUNCTION_HALL
    existing = None
    if external_place_id:
        existing = Venue.objects.filter(external_place_id=external_place_id).first()
    if not existing:
        existing = Venue.objects.filter(city=city, name__iexact=name).first()
    if existing:
        # Only link to an existing record if it is still pending/verified; never resurrect rejected ones.
        return existing if existing.verification_status != VerificationStatus.REJECTED else None
    try:
        lat = round(float(latitude), 6) if latitude is not None else None
        lng = round(float(longitude), 6) if longitude is not None else None
    except (TypeError, ValueError):
        lat = lng = None
    return Venue.objects.create(
        name=name,
        category=category,
        city=city,
        locality=locality,
        full_address=_clean(ev.get('venue_address')),
        latitude=lat if source == 'EXTERNAL_PROVIDER' else None,
        longitude=lng if source == 'EXTERNAL_PROVIDER' else None,
        google_maps_url=_clean(ev.get('google_maps_url'), 500),
        contact_phone=_clean(ev.get('venue_contact_phone'), 30),
        contact_verified=False,
        verification_status=VerificationStatus.PENDING,
        data_source=VenueDataSource.EXTERNAL_PROVIDER if source == 'EXTERNAL_PROVIDER' else VenueDataSource.CUSTOMER_PROVIDED,
        external_place_id=external_place_id,
        admin_notes='Submitted with a customer order; awaiting verification.',
    )
