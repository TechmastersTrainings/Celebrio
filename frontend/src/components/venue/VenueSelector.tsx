import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Home,
  Building2,
  Hotel,
  UtensilsCrossed,
  Trees,
  MapPin,
  Search,
  ShieldCheck,
  PenLine,
  Navigation,
  Loader2,
  ExternalLink,
  RotateCcw,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import type {
  LocationOption,
  OrderEvent,
  VenueSearchResponse,
  VenueSearchResult,
  VenueTypeValue,
} from '../../types';
import { SearchableSelect } from './SearchableSelect';

/** Venue-related slice of an order event that this component reads and writes. */
export type VenueValue = Pick<
  OrderEvent,
  | 'venue_name'
  | 'venue_address'
  | 'google_maps_url'
  | 'venue_type'
  | 'venue_source'
  | 'venue_city'
  | 'venue_locality'
  | 'venue_contact_phone'
  | 'venue_id'
  | 'external_place_id'
  | 'country_id'
  | 'state_id'
  | 'city_id'
  | 'locality_id'
  | 'nearby_locality_id'
  | 'venue_latitude'
  | 'venue_longitude'
  | 'venue_is_verified'
  | 'venue_distance_km'
>;

interface VenueSelectorProps {
  value: VenueValue;
  onChange: (patch: Partial<VenueValue>) => void;
}

export const VENUE_TYPES: { value: VenueTypeValue; label: string; icon: React.ReactNode }[] = [
  { value: 'HOME', label: 'Home Sweet Home', icon: <Home size={15} /> },
  { value: 'FUNCTION_HALL', label: 'Function Hall / Convention Hall', icon: <Building2 size={15} /> },
  { value: 'HOTEL_RESORT', label: 'Hotel / Resort', icon: <Hotel size={15} /> },
  { value: 'RESTAURANT_BANQUET', label: 'Restaurant / Banquet', icon: <UtensilsCrossed size={15} /> },
  { value: 'OUTDOOR', label: 'Outdoor Venue', icon: <Trees size={15} /> },
  { value: 'OTHER', label: 'Other Venue', icon: <MapPin size={15} /> },
];

const COMMERCIAL_TYPES = VENUE_TYPES.filter((t) => t.value !== 'HOME');
const SEARCH_DEBOUNCE_MS = 250;
const RADIUS_OPTIONS = [2, 5, 10, 20];

type Scope = 'locality' | 'nearby' | 'city';

const CLEARED_SELECTION: Partial<VenueValue> = {
  venue_id: null,
  external_place_id: null,
  venue_source: '',
  venue_is_verified: false,
  venue_distance_km: null,
  venue_latitude: null,
  venue_longitude: null,
};

function highlight(text: string, q: string) {
  const query = q.trim();
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="vs-mark">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

const fmtKm = (d: number | null | undefined) => (d === null || d === undefined ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

export const VenueSelector: React.FC<VenueSelectorProps> = ({ value, onChange }) => {
  const uid = useId();
  const listId = `${uid}-venues`;

  // ---------------- Location cascade ----------------
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [localities, setLocalities] = useState<LocationOption[]>([]);
  const [nearby, setNearby] = useState<{ id: number; name: string; distance_km: number | null; basis: string }[]>([]);
  const [locLoading, setLocLoading] = useState<string | null>('countries');
  const [locError, setLocError] = useState(false);

  // Keep the latest value/onChange in refs so async loaders never patch stale state.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let alive = true;
    setLocLoading('countries');
    ApiService.getCountries()
      .then((list) => {
        if (!alive) return;
        setCountries(list);
        if (!valueRef.current.country_id && list.length === 1) onChangeRef.current({ country_id: list[0].id });
      })
      .catch(() => alive && setLocError(true))
      .finally(() => alive && setLocLoading(null));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!value.country_id) return setStates([]);
    let alive = true;
    setLocLoading('states');
    ApiService.getStates(value.country_id)
      .then((list) => {
        if (!alive) return;
        setStates(list);
        if (!valueRef.current.state_id && list.length === 1) onChangeRef.current({ state_id: list[0].id });
      })
      .catch(() => alive && setLocError(true))
      .finally(() => alive && setLocLoading(null));
    return () => {
      alive = false;
    };
  }, [value.country_id]);

  useEffect(() => {
    if (!value.state_id) return setCities([]);
    let alive = true;
    setLocLoading('cities');
    ApiService.getCities(value.state_id)
      .then((list) => {
        if (!alive) return;
        setCities(list);
        if (!valueRef.current.city_id && list.length === 1) onChangeRef.current({ city_id: list[0].id, venue_city: list[0].name });
      })
      .catch(() => alive && setLocError(true))
      .finally(() => alive && setLocLoading(null));
    return () => {
      alive = false;
    };
  }, [value.state_id]);

  useEffect(() => {
    if (!value.city_id) return setLocalities([]);
    let alive = true;
    setLocLoading('localities');
    ApiService.getLocalities(value.city_id)
      .then((list) => alive && setLocalities(list))
      .catch(() => alive && setLocError(true))
      .finally(() => alive && setLocLoading(null));
    return () => {
      alive = false;
    };
  }, [value.city_id]);

  useEffect(() => {
    if (!value.locality_id) return setNearby([]);
    let alive = true;
    ApiService.getNearbyLocalities(value.locality_id)
      .then((res) => alive && setNearby(res.nearby || []))
      .catch(() => alive && setNearby([]));
    return () => {
      alive = false;
    };
  }, [value.locality_id]);

  const cityName = cities.find((c) => c.id === value.city_id)?.name || value.venue_city || '';
  const localityName = value.locality_id
    ? localities.find((l) => l.id === value.locality_id)?.name || ''
    : value.venue_locality || '';
  const searchLocalityId = value.nearby_locality_id || value.locality_id || null;
  const searchLocalityName =
    localities.find((l) => l.id === searchLocalityId)?.name || (searchLocalityId === value.locality_id ? localityName : '');

  // "Nearby Area" options: genuinely nearby first; otherwise the rest of the city, labelled as such.
  const nearbyOptions = useMemo(() => {
    if (nearby.length > 0) {
      return nearby.map((n) => ({ id: n.id, name: n.name, hint: n.distance_km !== null ? fmtKm(n.distance_km)! : 'Nearby' }));
    }
    return localities.filter((l) => l.id !== value.locality_id).map((l) => ({ id: l.id, name: l.name, hint: `In ${cityName}` }));
  }, [nearby, localities, value.locality_id, cityName]);

  // ---------------- Venue mode ----------------
  const isHome = value.venue_type === 'HOME';
  const isManual = !isHome && value.venue_source === 'CUSTOMER_PROVIDED';
  const isSelected = !isHome && !isManual && Boolean(value.venue_id || value.external_place_id);
  const directoryUsable = !locError && Boolean(value.city_id);

  const selectType = (t: VenueTypeValue) => {
    if (t === value.venue_type) return;
    if (t === 'HOME') {
      onChange({
        ...CLEARED_SELECTION,
        venue_type: 'HOME',
        venue_source: 'CUSTOMER_PROVIDED',
        venue_name: 'Our Residence',
        venue_city: cityName,
        venue_locality: localityName,
        venue_address: '',
        google_maps_url: '',
        venue_contact_phone: '',
      });
    } else if (isHome) {
      onChange({ ...CLEARED_SELECTION, venue_type: t, venue_name: '', venue_address: '', google_maps_url: '', venue_city: cityName, venue_locality: localityName });
    } else {
      onChange({ venue_type: t });
    }
  };

  // ---------------- Autocomplete search ----------------
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>('locality');
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [data, setData] = useState<VenueSearchResponse | null>(null);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset scope when the area changes.
  useEffect(() => setScope(searchLocalityId ? 'locality' : 'city'), [searchLocalityId]);

  const category = value.venue_type && value.venue_type !== 'HOME' && value.venue_type !== 'OTHER' ? value.venue_type : undefined;

  useEffect(() => {
    if (!open || !value.city_id || isHome || isManual || isSelected) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setLoading(true);
      setSearchError(null);
      ApiService.searchVenues(
        {
          city: value.city_id!,
          locality: searchLocalityId,
          q: query.trim(),
          scope: searchLocalityId ? scope : 'city',
          radius_km: radius,
          category,
        },
        ctrl.signal,
      )
        .then((res) => {
          setData(res);
          setActive(0);
        })
        .catch((e) => {
          if (e?.name !== 'AbortError') setSearchError('Venue search is temporarily unavailable. You can still enter your venue manually.');
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [open, query, value.city_id, searchLocalityId, scope, radius, category, isHome, isManual, isSelected]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      // composedPath() is captured at dispatch time, so clicks on elements that a re-render
      // removes (e.g. a scope chip that disappears once clicked) still count as "inside".
      if (wrapRef.current && !e.composedPath().includes(wrapRef.current)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = data?.results || [];
  const external = data?.external_results || [];
  // Flat list for keyboard navigation; the final item is "enter manually".
  const items: (VenueSearchResult | 'manual')[] = [...results, ...external, 'manual'];

  const chooseResult = useCallback(
    (r: VenueSearchResult) => {
      const isDir = r.source === 'VERIFIED_DIRECTORY';
      onChange({
        venue_id: isDir ? r.id : null,
        external_place_id: isDir ? null : r.external_place_id || null,
        venue_source: isDir ? 'VERIFIED_DIRECTORY' : 'EXTERNAL_PROVIDER',
        venue_is_verified: isDir && r.is_verified,
        venue_name: r.name,
        venue_address: r.full_address,
        venue_locality: r.locality || localityName,
        venue_city: r.city || cityName,
        google_maps_url: r.google_maps_url || '',
        venue_contact_phone: r.contact_phone || '',
        venue_distance_km: r.distance_km,
        venue_latitude: r.latitude,
        venue_longitude: r.longitude,
        ...(r.category ? { venue_type: r.category as VenueTypeValue } : {}),
      });
      setOpen(false);
      setQuery('');
    },
    [onChange, localityName, cityName],
  );

  const startManual = () => {
    onChange({
      ...CLEARED_SELECTION,
      venue_source: 'CUSTOMER_PROVIDED',
      venue_name: query.trim() || value.venue_name || '',
      venue_type: value.venue_type || 'OTHER',
      // Pre-fill from the customer's selected area (not from a previously chosen venue).
      venue_city: cityName || value.venue_city || '',
      venue_locality: localityName || value.venue_locality || '',
    });
    setOpen(false);
  };

  const backToSearch = () => {
    onChange({ ...CLEARED_SELECTION, venue_name: '', venue_address: '', google_maps_url: '', venue_contact_phone: '', venue_city: cityName, venue_locality: localityName });
    setQuery('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        const it = items[active];
        if (it === 'manual') startManual();
        else if (it) chooseResult(it);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${uid}-opt-${i}`;

  const renderResult = (r: VenueSearchResult, i: number) => (
    <li
      key={r.id}
      id={optionId(i)}
      role="option"
      aria-selected={i === active}
      className={`vs-option ${i === active ? 'is-active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        chooseResult(r);
      }}
      onMouseEnter={() => setActive(i)}
    >
      <div className="vs-option-main">
        <div className="vs-option-title">
          <strong>{highlight(r.name, query)}</strong>
          <span className="vs-badge">{r.category_label}</span>
          {r.is_verified ? (
            <span className="vs-badge vs-badge-verified">
              <ShieldCheck size={11} /> Verified
            </span>
          ) : (
            <span className="vs-badge vs-badge-unverified">Unverified listing</span>
          )}
        </div>
        <div className="vs-option-meta">
          <MapPin size={12} aria-hidden />
          {r.locality && <span className="vs-option-locality">{highlight(r.locality, query)}</span>}
          {r.locality && r.full_address && <span aria-hidden>·</span>}
          <span>{r.full_address || r.city}</span>
        </div>
      </div>
      {r.distance_km !== null && <span className="vs-distance">{fmtKm(r.distance_km)}</span>}
    </li>
  );

  const scopeLabel: Record<Scope, string> = {
    locality: searchLocalityName || 'Selected area',
    nearby: 'Nearby areas',
    city: `All of ${cityName || 'city'}`,
  };

  const counts = data?.counts;
  const showEmpty = !loading && data && results.length === 0;

  // ---------------- Render ----------------
  return (
    <div className="vs-root">
      {/* 1. Venue type */}
      <div className="vs-field">
        <span className="vs-label" id={`${uid}-type`}>Venue Type</span>
        <div className="vs-type-grid" role="radiogroup" aria-labelledby={`${uid}-type`}>
          {VENUE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={value.venue_type === t.value}
              className={`vs-type ${value.venue_type === t.value ? 'is-selected' : ''}`}
              onClick={() => selectType(t.value)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Location cascade */}
      {!locError && (
        <div className="vs-location-grid">
          <SearchableSelect
            label="Country"
            options={countries}
            value={value.country_id}
            loading={locLoading === 'countries'}
            onChange={(o) =>
              onChange({ country_id: o?.id ?? null, state_id: null, city_id: null, locality_id: null, nearby_locality_id: null, venue_city: '', venue_locality: '' })
            }
          />
          <SearchableSelect
            label="State"
            options={states}
            value={value.state_id}
            disabled={!value.country_id}
            loading={locLoading === 'states'}
            onChange={(o) => onChange({ state_id: o?.id ?? null, city_id: null, locality_id: null, nearby_locality_id: null, venue_city: '', venue_locality: '' })}
          />
          <SearchableSelect
            label="City"
            options={cities}
            value={value.city_id}
            disabled={!value.state_id}
            loading={locLoading === 'cities'}
            emptyText="City not listed yet — use manual entry below"
            onChange={(o) => onChange({ city_id: o?.id ?? null, venue_city: o?.name || '', locality_id: null, nearby_locality_id: null, venue_locality: '' })}
          />
          <SearchableSelect
            label="Area / Locality"
            placeholder="e.g. Gumpa"
            options={localities}
            value={value.locality_id}
            disabled={!value.city_id}
            loading={locLoading === 'localities'}
            allowClear
            emptyText="Locality not listed — pick the closest or enter manually"
            onChange={(o) => onChange({ locality_id: o?.id ?? null, venue_locality: o?.name || '', nearby_locality_id: null })}
          />
          {!isHome && (
            <SearchableSelect
              label={nearby.length > 0 ? 'Nearby Area (optional)' : `Search another area of ${cityName || 'the city'} (optional)`}
              placeholder="Optional"
              options={nearbyOptions}
              value={value.nearby_locality_id}
              disabled={!value.locality_id}
              allowClear
              emptyText="No other areas available"
              onChange={(o) => onChange({ nearby_locality_id: o?.id ?? null })}
            />
          )}
        </div>
      )}
      {locError && (
        <div className="vs-notice">
          <AlertCircle size={14} /> The location directory is unavailable right now. Please enter your venue details below. Your order is not affected.
        </div>
      )}

      {/* 3a. Home Sweet Home */}
      {isHome && (
        <div className="vs-panel">
          <div className="vs-panel-title">
            <Home size={15} /> Celebrating at home
          </div>
          <div className="vs-form-grid">
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-home-name`}>How should the venue appear on the invitation?</label>
              <input id={`${uid}-home-name`} className="form-control" value={value.venue_name} onChange={(e) => onChange({ venue_name: e.target.value })} placeholder="e.g. Our Residence" />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-home-maps`}>Google Maps link (optional)</label>
              <input id={`${uid}-home-maps`} className="form-control" inputMode="url" value={value.google_maps_url || ''} onChange={(e) => onChange({ google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
            </div>
            <div className="vs-field vs-span-2">
              <label className="vs-label" htmlFor={`${uid}-home-addr`}>House no., street &amp; landmark{localityName ? ` (in ${localityName})` : ''}</label>
              <textarea id={`${uid}-home-addr`} className="form-control" rows={2} value={value.venue_address} onChange={(e) => onChange({ venue_address: e.target.value })} placeholder="e.g. H.No 4-12, Near Hanuman Temple" />
            </div>
            {(locError || !value.locality_id) && (
              <>
                <div className="vs-field">
                  <label className="vs-label" htmlFor={`${uid}-home-city`}>City</label>
                  <input id={`${uid}-home-city`} className="form-control" value={value.venue_city || ''} onChange={(e) => onChange({ venue_city: e.target.value })} />
                </div>
                <div className="vs-field">
                  <label className="vs-label" htmlFor={`${uid}-home-loc`}>Locality</label>
                  <input id={`${uid}-home-loc`} className="form-control" value={value.venue_locality || ''} onChange={(e) => onChange({ venue_locality: e.target.value })} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3b. Selected venue */}
      {isSelected && (
        <div className="vs-panel vs-selected">
          <div className="vs-selected-head">
            <div>
              <div className="vs-option-title">
                <strong>{value.venue_name}</strong>
                {value.venue_source === 'VERIFIED_DIRECTORY' ? (
                  <span className="vs-badge vs-badge-verified">
                    <ShieldCheck size={11} /> Verified venue
                  </span>
                ) : (
                  <span className="vs-badge vs-badge-unverified">Unverified listing — our team will confirm</span>
                )}
              </div>
              <div className="vs-option-meta">
                <MapPin size={12} aria-hidden />
                <span>
                  {[value.venue_locality, value.venue_city].filter(Boolean).join(', ')}
                  {fmtKm(value.venue_distance_km) && ` · ${fmtKm(value.venue_distance_km)} from ${localityName || 'your area'}`}
                </span>
              </div>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={backToSearch}>
              <RotateCcw size={13} /> Change venue
            </button>
          </div>
          {value.venue_address && <p className="vs-selected-address">{value.venue_address}</p>}
          <div className="vs-selected-links">
            {value.google_maps_url && (
              <a href={value.google_maps_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} /> Open in Maps
              </a>
            )}
            {value.venue_contact_phone && (
              <span>
                <Phone size={12} /> {value.venue_contact_phone}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3c. Autocomplete search */}
      {!isHome && !isManual && !isSelected && (
        <div className="vs-field" ref={wrapRef}>
          <label className="vs-label" htmlFor={`${uid}-q`}>Search venue</label>
          {directoryUsable ? (
            <>
              {searchLocalityId && (
                <div className="vs-scope" role="group" aria-label="Search area">
                  <span className="vs-scope-label">Search in:</span>
                  {(['locality', 'nearby', 'city'] as Scope[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`vs-chip ${scope === s ? 'is-selected' : ''}`}
                      aria-pressed={scope === s}
                      onClick={() => {
                        setScope(s);
                        setOpen(true);
                        inputRef.current?.focus();
                      }}
                    >
                      {s === 'nearby' && <Navigation size={11} />} {scopeLabel[s]}
                      {counts && query && <span className="vs-chip-count">{counts[s]}</span>}
                    </button>
                  ))}
                  {scope === 'nearby' && data?.locality?.has_coordinates && (
                    <label className="vs-radius">
                      within
                      <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                        {RADIUS_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r} km</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="vs-search-wrap">
              <div className="vs-search">
                <Search size={15} className="vs-search-icon" aria-hidden />
                <input
                  ref={inputRef}
                  id={`${uid}-q`}
                  className="form-control vs-search-input"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open ? optionId(active) : undefined}
                  autoComplete="off"
                  placeholder={searchLocalityName ? `Start typing a venue name in ${searchLocalityName}…` : `Start typing a venue name in ${cityName}…`}
                  value={query}
                  onFocus={() => setOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  onKeyDown={onKeyDown}
                />
                {loading && <Loader2 size={15} className="vs-spin" aria-label="Searching" />}
              </div>

              {open && (
                <ul className="vs-menu" role="listbox" id={listId} aria-label="Venue suggestions">
                  {searchError && <li className="vs-menu-empty">{searchError}</li>}
                  {!searchError && !data && loading && <li className="vs-menu-empty">Searching venues…</li>}

                  {results.map((r, i) => renderResult(r, i))}

                  {showEmpty && (
                    <li className="vs-empty" role="presentation">
                      <p>
                        {query.trim()
                          ? <>No matching venues found {scope === 'city' ? `in ${cityName}` : scope === 'nearby' ? `in or near ${searchLocalityName}` : `in ${searchLocalityName}`}.</>
                          : <>No verified venues listed {scope === 'city' ? `in ${cityName}` : `in ${searchLocalityName}`} yet.</>}
                      </p>
                      <div className="vs-empty-actions">
                        {scope === 'locality' && counts && counts.nearby > 0 && (
                          <button type="button" className="vs-chip" onMouseDown={(e) => { e.preventDefault(); setScope('nearby'); }}>
                            <Navigation size={11} /> Show {counts.nearby} in nearby areas
                          </button>
                        )}
                        {scope !== 'city' && counts && counts.city > 0 && (
                          <button type="button" className="vs-chip" onMouseDown={(e) => { e.preventDefault(); setScope('city'); }}>
                            Search all of {cityName} ({counts.city})
                          </button>
                        )}
                        {scope === 'nearby' && data?.locality?.has_coordinates && radius < RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1] && (
                          <button
                            type="button"
                            className="vs-chip"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setRadius(RADIUS_OPTIONS.find((r) => r > radius) || radius);
                            }}
                          >
                            Expand radius to {RADIUS_OPTIONS.find((r) => r > radius)} km
                          </button>
                        )}
                      </div>
                      {data && data.locality_suggestions.length > 0 && scope !== 'city' && (
                        <>
                          <span className="vs-empty-sub">
                            {data.locality_suggestion_kind === 'NEARBY' ? 'Nearby localities' : `Other localities in ${cityName}`}
                          </span>
                          <div className="vs-empty-actions">
                            {data.locality_suggestions.slice(0, 8).map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="vs-chip"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  onChange({ nearby_locality_id: s.id });
                                }}
                              >
                                {s.name}
                                {s.distance_km !== null && ` · ${fmtKm(s.distance_km)}`}
                                {query.trim() && <span className="vs-chip-count">{s.match_count}</span>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </li>
                  )}

                  {external.length > 0 && (
                    <>
                      <li className="vs-group-label" role="presentation">
                        From Google Maps — not verified by TechMasters
                      </li>
                      {external.map((r, i) => renderResult(r, results.length + i))}
                    </>
                  )}

                  <li
                    id={optionId(items.length - 1)}
                    role="option"
                    aria-selected={active === items.length - 1}
                    className={`vs-option vs-manual ${active === items.length - 1 ? 'is-active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startManual();
                    }}
                    onMouseEnter={() => setActive(items.length - 1)}
                  >
                    <PenLine size={14} /> Can&apos;t find your venue? <strong>Enter manually.</strong>
                  </li>
                </ul>
              )}
              </div>
            </>
          ) : (
            <div className="vs-notice">
              {locError ? 'Venue search is unavailable.' : 'Select your city to search venues.'}{' '}
              <button type="button" className="vs-link" onClick={startManual}>
                Can&apos;t find your venue? Enter manually.
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3d. Manual entry */}
      {isManual && (
        <div className="vs-panel">
          <div className="vs-panel-title">
            <PenLine size={15} /> Enter venue details
            {directoryUsable && (
              <button type="button" className="vs-link" style={{ marginLeft: 'auto' }} onClick={backToSearch}>
                ← Back to venue search
              </button>
            )}
          </div>
          <div className="vs-form-grid">
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-name`}>Venue Name</label>
              <input id={`${uid}-m-name`} className="form-control" value={value.venue_name} onChange={(e) => onChange({ venue_name: e.target.value })} placeholder="Venue name as it should appear" />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-type`}>Venue Type</label>
              <select id={`${uid}-m-type`} className="form-control" value={value.venue_type || 'OTHER'} onChange={(e) => onChange({ venue_type: e.target.value as VenueTypeValue })}>
                {COMMERCIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-city`}>City</label>
              <input id={`${uid}-m-city`} className="form-control" value={value.venue_city || ''} onChange={(e) => onChange({ venue_city: e.target.value })} />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-loc`}>Locality</label>
              <input id={`${uid}-m-loc`} className="form-control" value={value.venue_locality || ''} onChange={(e) => onChange({ venue_locality: e.target.value })} />
            </div>
            <div className="vs-field vs-span-2">
              <label className="vs-label" htmlFor={`${uid}-m-addr`}>Full Address</label>
              <textarea id={`${uid}-m-addr`} className="form-control" rows={2} value={value.venue_address} onChange={(e) => onChange({ venue_address: e.target.value })} />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-maps`}>Google Maps link (optional)</label>
              <input id={`${uid}-m-maps`} className="form-control" inputMode="url" value={value.google_maps_url || ''} onChange={(e) => onChange({ google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-phone`}>Contact Number (optional)</label>
              <input id={`${uid}-m-phone`} className="form-control" inputMode="tel" value={value.venue_contact_phone || ''} onChange={(e) => onChange({ venue_contact_phone: e.target.value })} />
            </div>
          </div>
          <p className="vs-help">Our team will confirm these details. You can submit your order now.</p>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
