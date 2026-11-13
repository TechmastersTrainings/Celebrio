import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, XCircle, Edit3, PlusCircle, RefreshCw, Power, MapPin, Search, X, Check, RotateCcw } from 'lucide-react';
import { ApiService } from '../../services/api';
import type { AdminLocality, AdminVenue, LocationOption } from '../../types';

const CATEGORIES = [
  { value: 'FUNCTION_HALL', label: 'Function Hall / Convention Hall' },
  { value: 'HOTEL_RESORT', label: 'Hotel / Resort' },
  { value: 'RESTAURANT_BANQUET', label: 'Restaurant / Banquet' },
  { value: 'OUTDOOR', label: 'Outdoor Venue' },
  { value: 'OTHER', label: 'Other Venue' },
];

const STATUS_CLASS: Record<string, string> = {
  VERIFIED: 'vs-badge vs-badge-verified',
  PENDING: 'vs-badge vs-badge-unverified',
  REJECTED: 'vs-badge vs-badge-rejected',
};

const emptyForm = {
  name: '',
  category: 'FUNCTION_HALL',
  city: '' as number | '',
  locality: '' as number | '',
  full_address: '',
  latitude: '',
  longitude: '',
  google_maps_url: '',
  contact_phone: '',
  contact_verified: false,
  admin_notes: '',
  is_active: true,
  mark_verified: false,
};

type VenueForm = typeof emptyForm;

function errText(e: any) {
  return e?.message || 'Request failed.';
}

export const VenueDirectoryManager: React.FC = () => {
  const [section, setSection] = useState<'venues' | 'localities'>('venues');
  const [cities, setCities] = useState<(LocationOption & { state_name?: string })[]>([]);
  const [localities, setLocalities] = useState<AdminLocality[]>([]);
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState({ q: '', status: '', active: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<AdminVenue | 'new' | null>(null);
  const [form, setForm] = useState<VenueForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 4000);
  };

  const loadVenues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAdminVenues(filters);
      setVenues(res.venues);
      setCounts(res.counts);
    } catch (e) {
      flash('err', errText(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadLocalities = useCallback(async () => {
    try {
      setLocalities(await ApiService.getAdminLocalities());
    } catch (e) {
      flash('err', errText(e));
    }
  }, []);

  useEffect(() => {
    ApiService.getAllCities().then(setCities).catch(() => {});
    loadLocalities();
  }, [loadLocalities]);

  useEffect(() => {
    const t = window.setTimeout(loadVenues, 250);
    return () => window.clearTimeout(t);
  }, [loadVenues]);

  const openEdit = (v: AdminVenue | 'new') => {
    setEditing(v);
    if (v === 'new') {
      setForm({ ...emptyForm, city: cities.length === 1 ? cities[0].id : '' });
    } else {
      setForm({
        name: v.name,
        category: v.category,
        city: v.city,
        locality: v.locality ?? '',
        full_address: v.full_address,
        latitude: v.latitude ?? '',
        longitude: v.longitude ?? '',
        google_maps_url: v.google_maps_url,
        contact_phone: v.contact_phone,
        contact_verified: v.contact_verified,
        admin_notes: v.admin_notes,
        is_active: v.is_active,
        mark_verified: false,
      });
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.city) {
      flash('err', 'Venue name and city are required.');
      return;
    }
    setSaving(true);
    const payload: Record<string, any> = {
      ...form,
      locality: form.locality || null,
      latitude: form.latitude === '' ? null : form.latitude,
      longitude: form.longitude === '' ? null : form.longitude,
    };
    try {
      if (editing === 'new') {
        await ApiService.createAdminVenue(payload);
        flash('ok', `Venue “${form.name}” added${form.mark_verified ? ' and verified' : ' (pending verification)'}.`);
      } else if (editing) {
        delete payload.mark_verified;
        await ApiService.updateAdminVenue(editing.id, payload);
        flash('ok', `Venue “${form.name}” updated.`);
      }
      setEditing(null);
      loadVenues();
    } catch (e) {
      flash('err', errText(e));
    } finally {
      setSaving(false);
    }
  };

  const decide = async (v: AdminVenue, decision: 'VERIFY' | 'REJECT' | 'RESET') => {
    try {
      await ApiService.verifyAdminVenue(v.id, decision);
      flash('ok', `${v.name}: ${decision === 'VERIFY' ? 'verified — now visible to customers' : decision === 'REJECT' ? 'rejected' : 'moved back to pending'}.`);
      loadVenues();
    } catch (e) {
      flash('err', errText(e));
    }
  };

  const toggleActive = async (v: AdminVenue) => {
    try {
      await ApiService.updateAdminVenue(v.id, { is_active: !v.is_active });
      flash('ok', `${v.name} ${v.is_active ? 'deactivated' : 'reactivated'}.`);
      loadVenues();
    } catch (e) {
      flash('err', errText(e));
    }
  };

  const formLocalities = useMemo(() => localities.filter((l) => l.city === form.city), [localities, form.city]);

  return (
    <div className="vdm">
      <div className="vdm-head">
        <div>
          <span className="editorial-kicker">LOCATION DATASET &bull; VENUE GOVERNANCE</span>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-deep)', margin: '0.2rem 0' }}>Venue Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
            Customers only see <strong>verified, active</strong> venues. Venues customers enter manually arrive here as pending.
          </p>
        </div>
        <div className="vdm-tabs" role="tablist">
          <button role="tab" aria-selected={section === 'venues'} className={`vs-chip ${section === 'venues' ? 'is-selected' : ''}`} onClick={() => setSection('venues')}>
            Venues
          </button>
          <button role="tab" aria-selected={section === 'localities'} className={`vs-chip ${section === 'localities' ? 'is-selected' : ''}`} onClick={() => setSection('localities')}>
            Localities
          </button>
        </div>
      </div>

      {msg && <div className={`vdm-msg ${msg.kind === 'err' ? 'is-err' : ''}`}>{msg.text}</div>}

      {section === 'venues' && (
        <>
          <div className="vdm-toolbar">
            <div className="vs-search" style={{ flex: '1 1 220px' }}>
              <Search size={14} className="vs-search-icon" aria-hidden />
              <input className="form-control vs-search-input" placeholder="Search name, address, locality" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} aria-label="Search venues" />
            </div>
            <select className="form-control vdm-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} aria-label="Verification status">
              <option value="">All statuses</option>
              <option value="PENDING">Pending ({counts.PENDING ?? 0})</option>
              <option value="VERIFIED">Verified ({counts.VERIFIED ?? 0})</option>
              <option value="REJECTED">Rejected ({counts.REJECTED ?? 0})</option>
            </select>
            <select className="form-control vdm-select" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })} aria-label="Active status">
              <option value="">Active &amp; inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
            {cities.length > 1 && (
              <select className="form-control vdm-select" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} aria-label="City">
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <button className="btn btn-outline btn-sm" onClick={loadVenues} title="Refresh">
              <RefreshCw size={13} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openEdit('new')}>
              <PlusCircle size={13} /> Add venue
            </button>
          </div>

          <div className="vdm-list">
            {loading && venues.length === 0 && <div className="vdm-empty">Loading venues…</div>}
            {!loading && venues.length === 0 && (
              <div className="vdm-empty">No venues match these filters. Add verified venues so customers can find them in the order form.</div>
            )}
            {venues.map((v) => (
              <div key={v.id} className={`vdm-row ${v.is_active ? '' : 'is-inactive'}`}>
                <div className="vdm-row-main">
                  <div className="vs-option-title">
                    <strong>{v.name}</strong>
                    <span className="vs-badge">{v.category_label}</span>
                    <span className={STATUS_CLASS[v.verification_status]}>{v.verification_status_label}</span>
                    {!v.is_active && <span className="vs-badge vs-badge-rejected">Inactive</span>}
                  </div>
                  <div className="vs-option-meta">
                    <MapPin size={12} aria-hidden />
                    <span>{[v.locality_name, v.city_name].filter(Boolean).join(', ')}</span>
                    {v.full_address && <><span aria-hidden>·</span><span>{v.full_address}</span></>}
                  </div>
                  <div className="vdm-row-sub">
                    Source: {v.data_source_label}
                    {v.last_verified_at && <> · Verified {new Date(v.last_verified_at).toLocaleDateString()}{v.verified_by_name ? ` by ${v.verified_by_name}` : ''}</>}
                    {v.latitude && v.longitude ? ' · Has coordinates' : ' · No coordinates'}
                    {v.contact_phone && <> · {v.contact_phone}{v.contact_verified ? ' (verified)' : ' (unverified)'}</>}
                    {v.order_event_count > 0 && <> · Used in {v.order_event_count} order event(s)</>}
                  </div>
                </div>
                <div className="vdm-row-actions">
                  {v.verification_status !== 'VERIFIED' && (
                    <button className="btn btn-sm vdm-btn-ok" onClick={() => decide(v, 'VERIFY')}>
                      <ShieldCheck size={13} /> Verify
                    </button>
                  )}
                  {v.verification_status === 'PENDING' && (
                    <button className="btn btn-outline btn-sm" onClick={() => decide(v, 'REJECT')}>
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                  {v.verification_status !== 'PENDING' && (
                    <button className="btn btn-outline btn-sm" onClick={() => decide(v, 'RESET')} title="Move back to pending">
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>
                    <Edit3 size={13} /> Edit
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleActive(v)} title={v.is_active ? 'Deactivate' : 'Reactivate'}>
                    <Power size={13} /> {v.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {section === 'localities' && <LocalityManager cities={cities} localities={localities} reload={loadLocalities} flash={flash} />}

      {editing && (
        <div className="vdm-modal-backdrop" role="dialog" aria-modal="true" aria-label={editing === 'new' ? 'Add venue' : 'Edit venue'}>
          <div className="vdm-modal">
            <div className="vdm-modal-head">
              <h3>{editing === 'new' ? 'Add venue' : `Edit ${editing.name}`}</h3>
              <button className="vs-link" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="vs-form-grid">
              <div className="vs-field vs-span-2">
                <label className="vs-label">Venue Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="vs-field">
                <label className="vs-label">Category</label>
                <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="vs-field">
                <label className="vs-label">City *</label>
                <select className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value ? Number(e.target.value) : '', locality: '' })}>
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="vs-field">
                <label className="vs-label">Area / Locality</label>
                <select className="form-control" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value ? Number(e.target.value) : '' })} disabled={!form.city}>
                  <option value="">Not set</option>
                  {formLocalities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="vs-field">
                <label className="vs-label">Google Maps link</label>
                <input className="form-control" value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
              </div>
              <div className="vs-field vs-span-2">
                <label className="vs-label">Full Address</label>
                <textarea className="form-control" rows={2} value={form.full_address} onChange={(e) => setForm({ ...form, full_address: e.target.value })} />
              </div>
              <div className="vs-field">
                <label className="vs-label">Latitude</label>
                <input className="form-control" inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Leave blank if unknown" />
              </div>
              <div className="vs-field">
                <label className="vs-label">Longitude</label>
                <input className="form-control" inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Leave blank if unknown" />
              </div>
              <div className="vs-field">
                <label className="vs-label">Contact Number</label>
                <input className="form-control" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
              <label className="vdm-check">
                <input type="checkbox" checked={form.contact_verified} onChange={(e) => setForm({ ...form, contact_verified: e.target.checked })} />
                Contact number verified (shown to customers)
              </label>
              <div className="vs-field vs-span-2">
                <label className="vs-label">Admin notes</label>
                <textarea className="form-control" rows={2} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
              </div>
              {editing === 'new' && (
                <label className="vdm-check vs-span-2">
                  <input type="checkbox" checked={form.mark_verified} onChange={(e) => setForm({ ...form, mark_verified: e.target.checked })} />
                  I have verified this venue exists at this address (publish to customers now)
                </label>
              )}
            </div>
            <p className="vs-help">Coordinates enable distance display and radius search. Only enter coordinates you have confirmed, e.g. copied from the venue&apos;s Google Maps pin.</p>
            <div className="vdm-modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                <Check size={13} /> {saving ? 'Saving…' : 'Save venue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------- //
// Localities: coordinates + curated "nearby" relationships
// --------------------------------------------------------------------------- //
const LocalityManager: React.FC<{
  cities: LocationOption[];
  localities: AdminLocality[];
  reload: () => void;
  flash: (k: 'ok' | 'err', t: string) => void;
}> = ({ cities, localities, reload, flash }) => {
  const [cityId, setCityId] = useState<number | ''>('');
  const [edit, setEdit] = useState<AdminLocality | null>(null);
  const [draft, setDraft] = useState({ latitude: '', longitude: '', pincode: '', nearby: [] as number[] });
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (cityId === '' && cities.length > 0) setCityId(cities[0].id);
  }, [cities, cityId]);

  const list = localities.filter((l) => l.city === cityId);
  const nameOf = (id: number) => localities.find((l) => l.id === id)?.name || `#${id}`;

  const startEdit = (l: AdminLocality) => {
    setEdit(l);
    setDraft({ latitude: l.latitude ?? '', longitude: l.longitude ?? '', pincode: l.pincode, nearby: [...l.nearby_localities] });
  };

  const save = async () => {
    if (!edit) return;
    try {
      await ApiService.updateAdminLocality(edit.id, {
        latitude: draft.latitude === '' ? null : draft.latitude,
        longitude: draft.longitude === '' ? null : draft.longitude,
        pincode: draft.pincode,
        nearby_localities: draft.nearby,
      });
      flash('ok', `${edit.name} updated.`);
      setEdit(null);
      reload();
    } catch (e) {
      flash('err', errText(e));
    }
  };

  const add = async () => {
    if (!newName.trim() || cityId === '') return;
    try {
      await ApiService.createAdminLocality({ name: newName.trim(), city: cityId });
      flash('ok', `Locality ${newName.trim()} added.`);
      setNewName('');
      reload();
    } catch (e) {
      flash('err', errText(e));
    }
  };

  const toggleActive = async (l: AdminLocality) => {
    try {
      await ApiService.updateAdminLocality(l.id, { is_active: !l.is_active });
      reload();
    } catch (e) {
      flash('err', errText(e));
    }
  };

  return (
    <div>
      <div className="vdm-toolbar">
        <select className="form-control vdm-select" value={cityId} onChange={(e) => setCityId(Number(e.target.value))} aria-label="City">
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="form-control" style={{ flex: '1 1 200px' }} placeholder="New locality name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn btn-primary btn-sm" onClick={add}><PlusCircle size={13} /> Add locality</button>
      </div>
      <p className="vs-help">
        Link localities as <strong>nearby</strong> so customers are offered genuine alternatives when their area has no venues. Add coordinates to enable distances and radius search.
      </p>
      <div className="vdm-list">
        {list.map((l) => (
          <div key={l.id} className={`vdm-row ${l.is_active ? '' : 'is-inactive'}`}>
            <div className="vdm-row-main">
              <div className="vs-option-title">
                <strong>{l.name}</strong>
                {l.pincode && <span className="vs-badge">{l.pincode}</span>}
                <span className={l.has_coordinates ? 'vs-badge vs-badge-verified' : 'vs-badge'}>{l.has_coordinates ? 'Has coordinates' : 'No coordinates'}</span>
                <span className="vs-badge">{l.venue_count} venue(s)</span>
                {!l.is_active && <span className="vs-badge vs-badge-rejected">Inactive</span>}
              </div>
              <div className="vdm-row-sub">
                Nearby: {l.nearby_localities.length ? l.nearby_localities.map(nameOf).join(', ') : 'none set'}
              </div>
            </div>
            <div className="vdm-row-actions">
              <button className="btn btn-outline btn-sm" onClick={() => startEdit(l)}><Edit3 size={13} /> Edit</button>
              <button className="btn btn-outline btn-sm" onClick={() => toggleActive(l)}><Power size={13} /> {l.is_active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="vdm-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Edit ${edit.name}`}>
          <div className="vdm-modal">
            <div className="vdm-modal-head">
              <h3>Edit {edit.name}</h3>
              <button className="vs-link" onClick={() => setEdit(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="vs-form-grid">
              <div className="vs-field">
                <label className="vs-label">Latitude</label>
                <input className="form-control" inputMode="decimal" value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} />
              </div>
              <div className="vs-field">
                <label className="vs-label">Longitude</label>
                <input className="form-control" inputMode="decimal" value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} />
              </div>
              <div className="vs-field">
                <label className="vs-label">Pincode</label>
                <input className="form-control" value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value })} />
              </div>
            </div>
            <span className="vs-label" style={{ marginTop: '0.75rem', display: 'block' }}>Nearby localities</span>
            <div className="vdm-nearby-grid">
              {list.filter((o) => o.id !== edit.id).map((o) => (
                <label key={o.id} className="vdm-check">
                  <input
                    type="checkbox"
                    checked={draft.nearby.includes(o.id)}
                    onChange={(e) =>
                      setDraft({ ...draft, nearby: e.target.checked ? [...draft.nearby, o.id] : draft.nearby.filter((x) => x !== o.id) })
                    }
                  />
                  {o.name}
                </label>
              ))}
            </div>
            <div className="vdm-modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save}><Check size={13} /> Save locality</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueDirectoryManager;
