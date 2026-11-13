import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Home, Building2, MapPin, Search, PenLine, Loader2, ExternalLink, RotateCcw, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';
import type { LocationOption, OrderEvent, VenueSearchResponse, VenueSearchResult, VenueTypeValue } from '../../types';
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
];

const SEARCH_DEBOUNCE_MS = 250;

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

export const VenueSelector: React.FC<VenueSelectorProps> = ({ value, onChange }) => {
  const uid = useId();
  const listId = `${uid}-venues`;

  // ---------------- Location cascade ----------------
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [localities, setLocalities] = useState<LocationOption[]>([]);
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

  const cityName = cities.find((c) => c.id === value.city_id)?.name || value.venue_city || '';
  const localityName = value.locality_id
    ? localities.find((l) => l.id === value.locality_id)?.name || ''
    : value.venue_locality || '';

  // ---------------- Venue mode ----------------
  const isHome = value.venue_type === 'HOME';
  const isManual = !isHome && value.venue_source === 'CUSTOMER_PROVIDED';
  const isSelected = !isHome && !isManual && Boolean(value.venue_id || value.external_place_id);

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
    } else {
      onChange({ ...CLEARED_SELECTION, venue_type: t, venue_name: '', venue_address: '', google_maps_url: '', venue_city: cityName, venue_locality: localityName });
    }
  };

  // ---------------- Function hall autocomplete ----------------
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [data, setData] = useState<VenueSearchResponse | null>(null);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !value.city_id || isHome || isManual || isSelected) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setLoading(true);
      setSearchError(null);
      // Halls can be booked anywhere in the city; ones in the customer's area are listed first.
      ApiService.searchVenues({ city: value.city_id!, locality: value.locality_id || null, q: query.trim(), scope: 'city' }, ctrl.signal)
        .then((res) => {
          setData(res);
          setActive(0);
        })
        .catch((e) => {
          if (e?.name !== 'AbortError') setSearchError('Search is temporarily unavailable. You can enter the hall details manually.');
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [open, query, value.city_id, value.locality_id, isHome, isManual, isSelected]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
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
        venue_type: 'FUNCTION_HALL',
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
      venue_type: 'FUNCTION_HALL',
      venue_name: query.trim() || value.venue_name || '',
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
        </div>
        <div className="vs-option-meta">
          <MapPin size={12} aria-hidden />
          {r.locality && <span className="vs-option-locality">{highlight(r.locality, query)}</span>}
          {r.locality && r.full_address && <span aria-hidden>·</span>}
          <span>{r.full_address || r.city}</span>
        </div>
      </div>
    </li>
  );

  const showEmpty = !loading && data && results.length === 0 && external.length === 0;

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

      {/* 2. Location */}
      {!locError && (
        <div className="vs-location-grid">
          <SearchableSelect
            label="Country"
            options={countries}
            value={value.country_id}
            loading={locLoading === 'countries'}
            onChange={(o) => onChange({ country_id: o?.id ?? null, state_id: null, city_id: null, locality_id: null, venue_city: '', venue_locality: '' })}
          />
          <SearchableSelect
            label="State"
            options={states}
            value={value.state_id}
            disabled={!value.country_id}
            loading={locLoading === 'states'}
            onChange={(o) => onChange({ state_id: o?.id ?? null, city_id: null, locality_id: null, venue_city: '', venue_locality: '' })}
          />
          <SearchableSelect
            label="City"
            options={cities}
            value={value.city_id}
            disabled={!value.state_id}
            loading={locLoading === 'cities'}
            onChange={(o) => onChange({ city_id: o?.id ?? null, venue_city: o?.name || '', locality_id: null, venue_locality: '' })}
          />
          <SearchableSelect
            label="Area / Locality"
            placeholder="e.g. Gumpa"
            options={localities}
            value={value.locality_id}
            disabled={!value.city_id}
            loading={locLoading === 'localities'}
            allowClear
            emptyText="Type your area name"
            freeText={value.locality_id ? '' : value.venue_locality || ''}
            onFreeText={(text) => onChange({ locality_id: null, venue_locality: text })}
            onChange={(o) => onChange({ locality_id: o?.id ?? null, venue_locality: o?.name || '' })}
          />
        </div>
      )}
      {locError && (
        <div className="vs-notice">
          <AlertCircle size={14} /> Location list is unavailable right now. Please enter the venue details below.
        </div>
      )}

      {/* 3a. Home Sweet Home */}
      {isHome && (
        <div className="vs-panel">
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
              <label className="vs-label" htmlFor={`${uid}-home-addr`}>House no., street &amp; landmark</label>
              <textarea id={`${uid}-home-addr`} className="form-control" rows={2} value={value.venue_address} onChange={(e) => onChange({ venue_address: e.target.value })} placeholder="e.g. H.No 4-12, Near Hanuman Temple" />
            </div>
            {locError && (
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

      {/* 3b. Selected hall */}
      {isSelected && (
        <div className="vs-panel vs-selected">
          <div className="vs-selected-head">
            <div>
              <div className="vs-option-title">
                <strong>{value.venue_name}</strong>
              </div>
              <div className="vs-option-meta">
                <MapPin size={12} aria-hidden />
                <span>{[value.venue_locality, value.venue_city].filter(Boolean).join(', ')}</span>
              </div>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={backToSearch}>
              <RotateCcw size={13} /> Change
            </button>
          </div>
          {value.venue_address && <p className="vs-selected-address">{value.venue_address}</p>}
          {value.google_maps_url && (
            <div className="vs-selected-links">
              <a href={value.google_maps_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} /> Open in Maps
              </a>
            </div>
          )}
        </div>
      )}

      {/* 3c. Function hall search */}
      {!isHome && !isManual && !isSelected && (
        <div className="vs-field" ref={wrapRef}>
          <label className="vs-label" htmlFor={`${uid}-q`}>Function Hall Name</label>
          {!locError && value.city_id ? (
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
                  placeholder="Start typing the function hall name…"
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
                <ul className="vs-menu" role="listbox" id={listId} aria-label="Function halls">
                  {searchError && <li className="vs-menu-empty">{searchError}</li>}
                  {!searchError && !data && loading && <li className="vs-menu-empty">Searching…</li>}
                  {results.map((r, i) => renderResult(r, i))}
                  {external.map((r, i) => renderResult(r, results.length + i))}
                  {showEmpty && (
                    <li className="vs-menu-empty" role="presentation">
                      {query.trim() ? `No function hall found matching “${query.trim()}” in ${cityName}.` : `No function halls listed in ${cityName} yet.`}
                    </li>
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
          ) : (
            <div className="vs-notice">
              {locError ? 'Search is unavailable.' : 'Select your city first.'}{' '}
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
            <PenLine size={15} /> Enter function hall details
            {!locError && value.city_id && (
              <button type="button" className="vs-link" style={{ marginLeft: 'auto' }} onClick={backToSearch}>
                ← Back to search
              </button>
            )}
          </div>
          <div className="vs-form-grid">
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-name`}>Function Hall Name</label>
              <input id={`${uid}-m-name`} className="form-control" value={value.venue_name} onChange={(e) => onChange({ venue_name: e.target.value })} />
            </div>
            <div className="vs-field">
              <label className="vs-label" htmlFor={`${uid}-m-maps`}>Google Maps link (optional)</label>
              <input id={`${uid}-m-maps`} className="form-control" inputMode="url" value={value.google_maps_url || ''} onChange={(e) => onChange({ google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
            </div>
            <div className="vs-field vs-span-2">
              <label className="vs-label" htmlFor={`${uid}-m-addr`}>Full Address</label>
              <textarea id={`${uid}-m-addr`} className="form-control" rows={2} value={value.venue_address} onChange={(e) => onChange({ venue_address: e.target.value })} />
            </div>
            {locError && (
              <>
                <div className="vs-field">
                  <label className="vs-label" htmlFor={`${uid}-m-city`}>City</label>
                  <input id={`${uid}-m-city`} className="form-control" value={value.venue_city || ''} onChange={(e) => onChange({ venue_city: e.target.value })} />
                </div>
                <div className="vs-field">
                  <label className="vs-label" htmlFor={`${uid}-m-loc`}>Locality</label>
                  <input id={`${uid}-m-loc`} className="form-control" value={value.venue_locality || ''} onChange={(e) => onChange({ venue_locality: e.target.value })} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
