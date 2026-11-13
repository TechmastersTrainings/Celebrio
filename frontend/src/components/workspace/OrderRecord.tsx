import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  UserPlus,
  Play,
  PauseCircle,
  Send,
  CheckCircle2,
  Eye,
  Download,
  Upload,
  Paperclip,
  Image as ImageIcon,
  Music,
  Film,
  FileText,
  ExternalLink,
  Globe,
  Lock,
  MessageSquare,
  AlertTriangle,
  Tag,
  X,
} from 'lucide-react';
import type { CustomerAsset, TicketDetail, User } from '../../types';
import {
  CLOSURE_CODES,
  allowedTargets,
  ON_HOLD_REASONS,
  PRIORITIES,
  assetKind,
  fileExt,
  fileSize,
  fmtDate,
  fmtDateTime,
  fmtTime,
  humanize,
  priorityLabel,
  priorityTone,
  statusLabel,
  statusTone,
} from './format';

type Tab = 'overview' | 'wording' | 'studio' | 'attachments' | 'history';

export interface RecordFormValues {
  status: string;
  priority: string;
  is_on_hold: boolean;
  hold_reason: string;
}

interface OrderRecordProps {
  detail: TicketDetail;
  currentUser: User;
  busy: boolean;
  onBack: () => void;
  onSave: (v: RecordFormValues) => Promise<boolean>;
  onAssign: () => Promise<boolean>;
  onTransition: (status: string) => Promise<boolean>;
  onHold: (reason: string, notes: string) => Promise<boolean>;
  onResume: (setInProgress: boolean) => Promise<boolean>;
  onCloseOrder: (code: string, notes: string) => Promise<boolean>;
  onPostNote: (text: string, type: 'CUSTOMER_UPDATE' | 'WORK_NOTE') => Promise<boolean>;
  onUpload: (file: File, category: string) => Promise<boolean>;
  onDownload: (asset: CustomerAsset) => void;
  onPreviewAsset: (asset: CustomerAsset) => void;
  onRenderVersion: (payload: { theme_color: string; accent_color: string }, watermark: string) => Promise<boolean>;
  onOpenPreview: (url: string) => void;
}

const UPLOAD_CATEGORIES: [string, string][] = [
  ['COUPLE_PHOTO', 'Couple / Portrait Photo'],
  ['FAMILY_PHOTO', 'Family Photo'],
  ['BACKGROUND_AUDIO', 'Audio Track / Music'],
  ['LOGO_ASSET', 'Logo / Monogram'],
  ['DOCUMENT', 'Document / Brief'],
  ['OTHER', 'Other'],
];

const PHYSICAL_CARD = ['PHYSICAL_CARD_FRONT', 'PHYSICAL_CARD_BACK', 'PHYSICAL_CARD_INSERT'];

const SOURCE_LABEL: Record<string, string> = {
  VERIFIED_DIRECTORY: 'Directory listing',
  EXTERNAL_PROVIDER: 'Google Maps (unverified)',
  CUSTOMER_PROVIDED: 'Customer provided',
};

function AssetIcon({ asset }: { asset: CustomerAsset }) {
  const k = assetKind(asset);
  if (k === 'image') return <ImageIcon size={15} />;
  if (k === 'audio') return <Music size={15} />;
  if (k === 'video') return <Film size={15} />;
  return <FileText size={15} />;
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`ws-field ${wide ? 'is-wide' : ''}`}>
      <span className="ws-field-label">{label}</span>
      <div className="ws-field-value">{children || <span className="ws-muted">—</span>}</div>
    </div>
  );
}

function paymentLabel(status: string): string {
  if (status === 'AWAITING_PAYMENT') return 'Awaiting payment';
  if (status === 'PAYMENT_DONE') return 'Payment received';
  return '—';
}

export const OrderRecord: React.FC<OrderRecordProps> = (props) => {
  const { detail, currentUser, busy } = props;
  const order = detail.order;
  const events: any[] = (detail.events && detail.events.length ? detail.events : order?.events) || [];
  const assets: CustomerAsset[] = order?.assets || [];
  const first = events[0];

  const isMine = Boolean(detail.assigned_developer && detail.assigned_developer === currentUser.id);
  const isAdmin = Boolean(currentUser.is_admin);
  const canEdit = isMine || isAdmin;
  const isClosed = detail.status === 'CLOSED' || detail.status === 'CANCELLED';
  const targets = allowedTargets(detail.status, isAdmin);
  const can = (s: string) => targets.includes(s);

  // ---- Form state -------------------------------------------------------
  const initial = (): RecordFormValues => ({
    status: detail.status || 'NEW_OPEN',
    priority: detail.priority || 'NORMAL',
    is_on_hold: Boolean(detail.is_on_hold),
    hold_reason: detail.hold_reason || '',
  });
  const [form, setForm] = useState<RecordFormValues>(initial);
  useEffect(() => setForm(initial()), [detail.id, detail.status, detail.priority, detail.is_on_hold, detail.hold_reason]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty =
    form.status !== detail.status ||
    form.priority !== detail.priority ||
    form.is_on_hold !== Boolean(detail.is_on_hold) ||
    (form.is_on_hold && form.hold_reason !== (detail.hold_reason || ''));

  const [tab, setTab] = useState<Tab>('overview');

  // ---- Modals -----------------------------------------------------------
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState(ON_HOLD_REASONS[0]);
  const [holdNotes, setHoldNotes] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeCode, setCloseCode] = useState(CLOSURE_CODES[0]);
  const [closeNotes, setCloseNotes] = useState('');

  // ---- Notes -----------------------------------------------------------
  const [customerText, setCustomerText] = useState('');
  const [workText, setWorkText] = useState('');
  const [posting, setPosting] = useState<string | null>(null);
  const post = async (type: 'CUSTOMER_UPDATE' | 'WORK_NOTE') => {
    const text = (type === 'CUSTOMER_UPDATE' ? customerText : workText).trim();
    if (!text) return;
    setPosting(type);
    try {
      if (await props.onPostNote(text, type)) {
        if (type === 'CUSTOMER_UPDATE') setCustomerText('');
        else setWorkText('');
      }
    } finally {
      setPosting(null);
    }
  };

  // ---- Upload ----------------------------------------------------------
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('COUPLE_PHOTO');
  const [uploading, setUploading] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) await props.onUpload(f, uploadCategory);
    } finally {
      setUploading(false);
    }
  };

  // ---- Design studio ---------------------------------------------------
  const latest = detail.design_versions?.[0];
  const [themeColor, setThemeColor] = useState(latest?.web_preview_payload?.theme_color || '#6B1728');
  const [accentColor, setAccentColor] = useState(latest?.web_preview_payload?.accent_color || '#B88E3E');
  const [watermark, setWatermark] = useState(latest?.watermark_text || 'TECHMASTERS PREVIEW - NOT FINAL');

  // ---- Activity timeline (newest first) --------------------------------
  const timeline = [
    ...(detail.internal_notes || []).map((n) => ({
      key: `n-${n.id}`,
      at: n.created_at,
      kind: n.is_customer_visible || n.note_type === 'CUSTOMER_UPDATE' ? 'customer' : 'work',
      author: n.author_name,
      text: n.clean_note_text || n.note_text,
    })),
    ...(detail.status_history || []).map((s, i) => ({
      key: `s-${i}`,
      at: s.created_at,
      kind: 'state',
      author: s.changed_by_name || 'System',
      text: `${statusLabel(s.previous_status)} → ${statusLabel(s.new_status)}${s.transition_reason ? ` · ${s.transition_reason}` : ''}`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const occasionReq = order?.occasion_requirements_json && typeof order.occasion_requirements_json === 'object'
    ? Object.entries(order.occasion_requirements_json).filter(([, v]) => v !== null && v !== undefined && v !== '')
    : [];

  const physicalAssets = assets.filter((a) => PHYSICAL_CARD.includes(a.asset_category));
  const amount = (v?: string) => (v && parseFloat(v) > 0 ? `₹${v}` : '—');

  return (
    <section className="ws-record">
      {/* A. Header & action toolbar */}
      <header className="ws-record-head">
        <div className="ws-breadcrumb">
          <button type="button" className="ws-text-btn" onClick={props.onBack}>
            <ArrowLeft size={13} /> Orders
          </button>
          <span aria-hidden>›</span>
          <span>{detail.ticket_number}</span>
        </div>
        <div className="ws-record-titlebar">
          <div className="ws-record-title">
            <h1>
              {detail.ticket_number}
              <span className="ws-record-sub">{detail.customer_name || order?.customer_name} · {detail.occasion || order?.occasion_name}</span>
            </h1>
            <div className="ws-record-meta">
              <span><span className={`ws-dot tone-${statusTone(detail.status, detail.is_on_hold)}`} />{statusLabel(detail.status)}</span>
              <span className={`ws-pill tone-${priorityTone(detail.priority)}`}>{priorityLabel(detail.priority)}</span>
              {detail.is_on_hold && <span className="ws-pill tone-warn">On hold · {detail.hold_reason || 'No reason given'}</span>}
              <span>Event {fmtDate(first?.event_date)}</span>
              <span className="ws-muted">Order {detail.order_reference || order?.order_reference}</span>
            </div>
          </div>
          <div className="ws-record-actions">
            {!detail.assigned_developer && !isClosed && (
              <button type="button" className="ws-btn ws-btn-primary" onClick={props.onAssign} disabled={busy}>
                <UserPlus size={14} /> Assign to me
              </button>
            )}
            {canEdit && (
              <>
                <button type="button" className="ws-btn ws-btn-primary" onClick={() => props.onSave(form)} disabled={busy || !dirty}>
                  <Save size={14} /> Save
                </button>
                {can('WORK_IN_PROGRESS') && !detail.is_on_hold && (
                  <button type="button" className="ws-btn" onClick={() => props.onTransition('WORK_IN_PROGRESS')} disabled={busy}>
                    <Play size={14} /> Start work
                  </button>
                )}
                {!isClosed && (detail.is_on_hold ? (
                  <button type="button" className="ws-btn" onClick={() => props.onResume(can('WORK_IN_PROGRESS'))} disabled={busy}>
                    <Play size={14} /> Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ws-btn"
                    onClick={() => {
                      setHoldReason(ON_HOLD_REASONS[0]);
                      setHoldNotes('');
                      setHoldOpen(true);
                    }}
                    disabled={busy}
                  >
                    <PauseCircle size={14} /> Put on hold
                  </button>
                ))}
                {can('AWAITING_CUSTOMER_RESPONSE') && (
                  <button type="button" className="ws-btn" onClick={() => props.onTransition('AWAITING_CUSTOMER_RESPONSE')} disabled={busy}>
                    <Send size={14} /> Preview ready
                  </button>
                )}
                {can('CLOSED') && (
                  <button
                    type="button"
                    className="ws-btn ws-btn-success"
                    onClick={() => {
                      setCloseCode(CLOSURE_CODES[0]);
                      setCloseNotes('');
                      setCloseOpen(true);
                    }}
                    disabled={busy}
                  >
                    <CheckCircle2 size={14} /> Deliver &amp; close
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {!canEdit && detail.assigned_developer && (
          <div className="ws-notice">This order is assigned to {detail.assigned_developer_name}. It is read-only for you.</div>
        )}
      </header>

      {/* B. Attachment strip */}
      <div className="ws-attach-strip" aria-label="Attachments">
        <span className="ws-attach-label"><Paperclip size={13} /> {assets.length} attachment{assets.length === 1 ? '' : 's'}</span>
        {assets.map((a) => (
          <div key={a.id} className="ws-attach-chip">
            <AssetIcon asset={a} />
            <button type="button" className="ws-attach-name" onClick={() => props.onPreviewAsset(a)} title={`Preview ${a.file_name}`}>
              {a.file_name}
            </button>
            <span className="ws-attach-meta">{fileExt(a).toUpperCase() || 'FILE'} · {fileSize(a)} · {fmtDate(a.uploaded_at)}</span>
            <button type="button" className="ws-icon-mini" onClick={() => props.onPreviewAsset(a)} aria-label={`Preview ${a.file_name}`}><Eye size={13} /></button>
            <button type="button" className="ws-icon-mini" onClick={() => props.onDownload(a)} aria-label={`Download ${a.file_name}`}><Download size={13} /></button>
          </div>
        ))}
        {assets.length === 0 && <span className="ws-muted">No files uploaded by the customer.</span>}
      </div>

      {/* C. Record form */}
      <div className="ws-form">
        <div className="ws-form-col">
          <Field label="Number">{detail.ticket_number}</Field>
          <Field label="Customer">{detail.customer_name || order?.customer_name}</Field>
          <Field label="Mobile">{detail.customer_mobile || order?.customer_mobile}</Field>
          <Field label="Email">{detail.customer_email || order?.customer_email}</Field>
          <Field label="Occasion">{detail.occasion || order?.occasion_name}</Field>
          <Field label="Invitation package">{order?.package_name}</Field>
          <Field label="Preferred language">{order?.selected_language}</Field>
          <Field label="Event date & time">{first ? `${fmtDate(first.event_date)}${first.start_time ? ` · ${fmtTime(first.start_time)}` : ''}` : ''}</Field>
          <Field label="Primary venue">
            {first?.venue_name ? [first.venue_name, first.venue_locality, first.venue_city].filter(Boolean).join(', ') : ''}
          </Field>
          <Field label="Created">{fmtDateTime(detail.created_at || detail.eligible_at)}</Field>
        </div>
        <div className="ws-form-col">
          <div className="ws-field">
            <label className="ws-field-label" htmlFor="ws-f-status">State</label>
            <select id="ws-f-status" className="ws-input" value={form.status} disabled={!canEdit} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {[detail.status, ...targets].map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div className="ws-field">
            <label className="ws-field-label" htmlFor="ws-f-priority">Priority</label>
            <select id="ws-f-priority" className="ws-input" value={form.priority} disabled={!canEdit} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </div>
          <Field label="Assignment group">{detail.assigned_team}</Field>
          <Field label="Assigned to">{detail.assigned_developer_name}</Field>
          <div className="ws-field">
            <label className="ws-field-label" htmlFor="ws-f-hold">On hold</label>
            <select
              id="ws-f-hold"
              className="ws-input"
              value={form.is_on_hold ? 'YES' : 'NO'}
              disabled={!canEdit || isClosed}
              onChange={(e) => {
                const on = e.target.value === 'YES';
                setForm({ ...form, is_on_hold: on, hold_reason: on ? form.hold_reason || ON_HOLD_REASONS[0] : '' });
              }}
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
          <div className="ws-field">
            <label className="ws-field-label" htmlFor="ws-f-reason">On hold reason</label>
            <select id="ws-f-reason" className="ws-input" value={form.hold_reason} disabled={!canEdit || !form.is_on_hold} onChange={(e) => setForm({ ...form, hold_reason: e.target.value })}>
              <option value="">-- None --</option>
              {[...new Set([...ON_HOLD_REASONS, ...(detail.hold_reason ? [detail.hold_reason] : [])])].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <Field label="Payment">{paymentLabel(detail.status)}</Field>
          <Field label="Order total">{order?.total_amount_inr ? `₹${order.total_amount_inr}` : ''}</Field>
          <Field label="Publishing">
            {order?.is_published && order.published_url ? (
              <a href={order.published_url} target="_blank" rel="noopener noreferrer" className="ws-link">
                Published <ExternalLink size={11} />
              </a>
            ) : (
              'Not published'
            )}
          </Field>
          <Field label="Design versions">{String(detail.design_versions?.length || 0)}</Field>
        </div>
        {(detail.customer_requirements || order?.special_instructions) && (
          <Field label="Customer requirements" wide>
            <span className="ws-prewrap">{detail.customer_requirements || order?.special_instructions}</span>
          </Field>
        )}
        {canEdit && dirty && (
          <div className="ws-form-dirty">
            Unsaved changes
            <button type="button" className="ws-btn ws-btn-sm" onClick={() => setForm(initial())}>Cancel</button>
            <button type="button" className="ws-btn ws-btn-sm ws-btn-primary" onClick={() => props.onSave(form)} disabled={busy}>Save</button>
          </div>
        )}
      </div>

      {/* D. Tabs */}
      <div className="ws-tabs" role="tablist">
        {([
          ['overview', 'Order Overview & Ceremonies'],
          ['wording', 'Invitation & Wording'],
          ['studio', `Design Versions (${detail.design_versions?.length || 0})`],
          ['attachments', `Attachments (${assets.length})`],
          ['history', 'History'],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`ws-tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="ws-tab-panel" role="tabpanel">
        {tab === 'overview' && (
          <>
            {occasionReq.length > 0 && (
              <div className="ws-section">
                <h2>{detail.occasion || order?.occasion_name} details</h2>
                <div className="ws-kv-grid">
                  {occasionReq.map(([k, v]) => (
                    <Field key={k} label={humanize(k)}>
                      {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </Field>
                  ))}
                </div>
              </div>
            )}
            <div className="ws-section">
              <h2>Ceremony Schedule &amp; Venue Locations</h2>
              {events.length === 0 ? (
                <p className="ws-muted">No ceremonies recorded for this order.</p>
              ) : (
                <div className="ws-table-wrap">
                  <table className="ws-table ws-table-compact">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Venue</th>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Locality</th>
                        <th>Address</th>
                        <th>Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev, i) => (
                        <tr key={ev.id || i}>
                          <td className="ws-muted">{i + 1}</td>
                          <td><strong>{ev.event_title}</strong>{ev.dress_code && <div className="ws-sub">Dress: {ev.dress_code}</div>}</td>
                          <td className="ws-nowrap">{fmtDate(ev.event_date)}</td>
                          <td className="ws-nowrap">{fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}</td>
                          <td className="ws-wrap">{ev.venue_name || '—'}</td>
                          <td className="ws-nowrap">{ev.venue_type_label || '—'}</td>
                          <td className="ws-nowrap">{SOURCE_LABEL[ev.venue_source] || (ev.venue_name ? 'Free text' : '—')}</td>
                          <td>{[ev.venue_locality, ev.venue_city].filter(Boolean).join(', ') || '—'}</td>
                          <td className="ws-clamp">{ev.venue_address || '—'}</td>
                          <td>
                            {ev.google_maps_url ? (
                              <a href={ev.google_maps_url} target="_blank" rel="noopener noreferrer" className="ws-link" aria-label={`Open ${ev.venue_name} in Maps`}>
                                <ExternalLink size={13} />
                              </a>
                            ) : (
                              <span className="ws-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'wording' && (
          <>
            <div className="ws-section">
              <h2>Information readiness</h2>
              <div className="ws-kv-grid">
                <Field label="Completeness">{`${order?.completeness_score ?? 0}%`}</Field>
                <Field label="Information confirmed">{order?.is_information_confirmed ? 'Yes' : 'No'}</Field>
                <Field label="Ready for production">{order?.is_ready_for_production ? 'Yes' : 'No'}</Field>
                <Field label="Preferred language">{order?.selected_language}</Field>
              </div>
              {order?.missing_fields_json && order.missing_fields_json.length > 0 && (
                <div className="ws-missing">
                  <AlertTriangle size={14} /> Missing: {order.missing_fields_json.map(humanize).join(', ')}
                </div>
              )}
            </div>
            <div className="ws-section">
              <h2>Wording &amp; customer instructions</h2>
              <p className="ws-prewrap">{detail.customer_requirements || order?.special_instructions || <span className="ws-muted">No wording or instructions provided.</span>}</p>
            </div>
            <div className="ws-section">
              <h2>Physical invitation card</h2>
              <div className="ws-kv-grid">
                <Field label="Has physical card">{order?.has_physical_card ? 'Yes' : 'No'}</Field>
                {order?.physical_card_notes && <Field label="Card notes" wide>{order.physical_card_notes}</Field>}
              </div>
              {physicalAssets.length > 0 && (
                <div className="ws-chip-row">
                  {physicalAssets.map((a) => (
                    <button key={a.id} type="button" className="ws-btn ws-btn-sm" onClick={() => props.onPreviewAsset(a)}>
                      <Eye size={13} /> {humanize(a.asset_category)}
                    </button>
                  ))}
                </div>
              )}
              {(order?.ocr_data_json || order?.ocr_extracted_text) && (
                <>
                  <h3>Text read from the card</h3>
                  {order?.ocr_data_json && typeof order.ocr_data_json === 'object' ? (
                    <div className="ws-kv-grid">
                      {Object.entries(order.ocr_data_json).map(([k, v]) => (
                        <Field key={k} label={humanize(k)}>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</Field>
                      ))}
                    </div>
                  ) : (
                    <pre className="ws-pre">{order?.ocr_extracted_text}</pre>
                  )}
                </>
              )}
            </div>
            <div className="ws-section">
              <h2>Pricing</h2>
              <div className="ws-kv-grid">
                <Field label="Base amount">{amount(order?.base_amount_inr || order?.total_amount_inr)}</Field>
                <Field label="Automatic discount">{order?.auto_discount_amount_inr && parseFloat(order.auto_discount_amount_inr) > 0 ? `−₹${order.auto_discount_amount_inr}` : ''}</Field>
                <Field label="Coupon discount">{order?.coupon_discount_amount_inr && parseFloat(order.coupon_discount_amount_inr) > 0 ? `−₹${order.coupon_discount_amount_inr}` : ''}</Field>
                <Field label="Coupon code">{order?.applied_coupon_code ? <span className="ws-pill tone-info"><Tag size={11} /> {order.applied_coupon_code}</span> : ''}</Field>
                <Field label="Total">{amount(order?.total_amount_inr)}</Field>
              </div>
            </div>
          </>
        )}

        {tab === 'studio' && (
          <>
            {canEdit && !isClosed && (
              <div className="ws-section">
                <h2>Render a new preview version</h2>
                <div className="ws-studio">
                  <label className="ws-field">
                    <span className="ws-field-label">Theme colour</span>
                    <span className="ws-color"><input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} /><input className="ws-input" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} /></span>
                  </label>
                  <label className="ws-field">
                    <span className="ws-field-label">Accent colour</span>
                    <span className="ws-color"><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /><input className="ws-input" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /></span>
                  </label>
                  <label className="ws-field is-wide">
                    <span className="ws-field-label">Watermark</span>
                    <input className="ws-input" value={watermark} onChange={(e) => setWatermark(e.target.value)} />
                  </label>
                </div>
                <button type="button" className="ws-btn ws-btn-primary" disabled={busy} onClick={() => props.onRenderVersion({ theme_color: themeColor, accent_color: accentColor }, watermark)}>
                  <Upload size={14} /> Render &amp; share with customer
                </button>
              </div>
            )}
            <div className="ws-section">
              <h2>Versions</h2>
              {detail.design_versions?.length ? (
                <div className="ws-table-wrap">
                  <table className="ws-table ws-table-compact">
                    <thead>
                      <tr><th>Version</th><th>Status</th><th>Created</th><th>Revision requests</th><th>Watermark</th><th /></tr>
                    </thead>
                    <tbody>
                      {detail.design_versions.map((v) => (
                        <tr key={v.id}>
                          <td><strong>v{v.version_number}</strong></td>
                          <td>{humanize(v.status)}</td>
                          <td className="ws-nowrap">{fmtDateTime(v.created_at)}</td>
                          <td>{v.revisions_count}</td>
                          <td className="ws-clamp">{v.watermark_text}</td>
                          <td className="ws-td-actions">
                            <button type="button" className="ws-btn ws-btn-sm" onClick={() => props.onOpenPreview(`/preview/${v.preview_token}`)}>
                              <Eye size={13} /> Open preview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ws-muted">No design versions yet.</p>
              )}
            </div>
          </>
        )}

        {tab === 'attachments' && (
          <div className="ws-section">
            <div className="ws-section-head">
              <h2>Attachments &amp; files</h2>
              {canEdit && (
                <div className="ws-upload">
                  <select className="ws-input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} aria-label="Category for uploaded files">
                    {UPLOAD_CATEGORIES.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <input ref={fileRef} type="file" multiple hidden onChange={onFile} />
                  <button type="button" className="ws-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload files'}
                  </button>
                </div>
              )}
            </div>
            {assets.length ? (
              <div className="ws-table-wrap">
                <table className="ws-table ws-table-compact">
                  <thead>
                    <tr><th>File name</th><th>Category</th><th>Type</th><th>Size</th><th>Uploaded</th><th /></tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.id}>
                        <td><span className="ws-file"><AssetIcon asset={a} /> {a.file_name}</span></td>
                        <td>{humanize(a.asset_category || 'OTHER')}</td>
                        <td>{fileExt(a).toUpperCase() || '—'}</td>
                        <td className="ws-nowrap">{fileSize(a)}</td>
                        <td className="ws-nowrap">{fmtDateTime(a.uploaded_at)}</td>
                        <td className="ws-td-actions">
                          <button type="button" className="ws-btn ws-btn-sm" onClick={() => props.onPreviewAsset(a)}><Eye size={13} /> Preview</button>
                          <button type="button" className="ws-btn ws-btn-sm" onClick={() => props.onDownload(a)}><Download size={13} /> Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ws-muted">No files uploaded for this order.</p>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="ws-section">
            <h2>State &amp; assignment history</h2>
            <div className="ws-table-wrap">
              <table className="ws-table ws-table-compact">
                <thead>
                  <tr><th>When</th><th>Type</th><th>By</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {[
                    ...(detail.status_history || []).map((s, i) => ({
                      k: `s${i}`, at: s.created_at, type: 'State change', by: s.changed_by_name || 'System',
                      text: `${statusLabel(s.previous_status)} → ${statusLabel(s.new_status)}${s.transition_reason ? ` (${s.transition_reason})` : ''}`,
                    })),
                    ...(detail.assignment_history || []).map((a, i) => ({
                      k: `a${i}`, at: a.created_at, type: 'Assignment', by: a.assigned_by_name || 'System',
                      text: `Assigned to ${a.developer_name} (${humanize(a.assignment_type)})`,
                    })),
                  ]
                    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                    .map((r) => (
                      <tr key={r.k}>
                        <td className="ws-nowrap">{fmtDateTime(r.at)}</td>
                        <td>{r.type}</td>
                        <td>{r.by}</td>
                        <td className="ws-wrap">{r.text}</td>
                      </tr>
                    ))}
                  {!detail.status_history?.length && !detail.assignment_history?.length && (
                    <tr><td colSpan={4} className="ws-muted">No history recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* E. Notes & activity */}
      <div className="ws-activity">
        <h2><MessageSquare size={15} /> Activity</h2>
        {canEdit && (
          <div className="ws-compose">
            <div className="ws-compose-box is-customer">
              <label htmlFor="ws-note-customer"><Globe size={13} /> Customer update <span>visible to the customer</span></label>
              <textarea id="ws-note-customer" rows={3} value={customerText} onChange={(e) => setCustomerText(e.target.value)} placeholder="Message the customer will see on their order tracking page" />
              <button type="button" className="ws-btn ws-btn-sm ws-btn-primary" disabled={!customerText.trim() || posting !== null} onClick={() => post('CUSTOMER_UPDATE')}>
                {posting === 'CUSTOMER_UPDATE' ? 'Posting…' : 'Post customer update'}
              </button>
            </div>
            <div className="ws-compose-box is-work">
              <label htmlFor="ws-note-work"><Lock size={13} /> Work note <span>internal only, never shown to customers</span></label>
              <textarea id="ws-note-work" rows={3} value={workText} onChange={(e) => setWorkText(e.target.value)} placeholder="Internal note for the team" />
              <button type="button" className="ws-btn ws-btn-sm" disabled={!workText.trim() || posting !== null} onClick={() => post('WORK_NOTE')}>
                {posting === 'WORK_NOTE' ? 'Posting…' : 'Post work note'}
              </button>
            </div>
          </div>
        )}
        <ol className="ws-timeline">
          {timeline.map((t) => (
            <li key={t.key} className={`ws-entry is-${t.kind}`}>
              <div className="ws-entry-head">
                <strong>{t.author}</strong>
                <span className="ws-entry-type">
                  {t.kind === 'customer' ? <><Globe size={11} /> Customer update</> : t.kind === 'work' ? <><Lock size={11} /> Work note</> : 'State change'}
                </span>
                <time>{fmtDateTime(t.at)}</time>
              </div>
              <p>{t.text}</p>
            </li>
          ))}
          {timeline.length === 0 && <li className="ws-muted">No activity yet.</li>}
        </ol>
      </div>

      {/* Hold modal */}
      {holdOpen && (
        <div className="ws-modal-backdrop" onClick={() => setHoldOpen(false)}>
          <div className="ws-modal" role="dialog" aria-modal="true" aria-labelledby="ws-hold-title" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3 id="ws-hold-title">Put {detail.ticket_number} on hold</h3>
              <button type="button" className="ws-icon-mini" onClick={() => setHoldOpen(false)} aria-label="Close"><X size={15} /></button>
            </header>
            <label className="ws-field">
              <span className="ws-field-label">Reason</span>
              <select className="ws-input" value={holdReason} onChange={(e) => setHoldReason(e.target.value)}>
                {ON_HOLD_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="ws-field">
              <span className="ws-field-label">Work note (required)</span>
              <textarea className="ws-input" rows={4} value={holdNotes} onChange={(e) => setHoldNotes(e.target.value)} placeholder="What is blocking the work?" />
            </label>
            <footer>
              <button type="button" className="ws-btn" onClick={() => setHoldOpen(false)}>Cancel</button>
              <button
                type="button"
                className="ws-btn ws-btn-primary"
                disabled={busy || !holdNotes.trim()}
                onClick={async () => {
                  if (await props.onHold(holdReason, holdNotes.trim())) setHoldOpen(false);
                }}
              >
                Put on hold
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Close modal */}
      {closeOpen && (
        <div className="ws-modal-backdrop" onClick={() => setCloseOpen(false)}>
          <div className="ws-modal" role="dialog" aria-modal="true" aria-labelledby="ws-close-title" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3 id="ws-close-title">Deliver &amp; close {detail.ticket_number}</h3>
              <button type="button" className="ws-icon-mini" onClick={() => setCloseOpen(false)} aria-label="Close"><X size={15} /></button>
            </header>
            <label className="ws-field">
              <span className="ws-field-label">Resolution code</span>
              <select className="ws-input" value={closeCode} onChange={(e) => setCloseCode(e.target.value)}>
                {CLOSURE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="ws-field">
              <span className="ws-field-label">Resolution notes (required)</span>
              <textarea className="ws-input" rows={4} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="What was delivered and how the customer signed off" />
            </label>
            <footer>
              <button type="button" className="ws-btn" onClick={() => setCloseOpen(false)}>Cancel</button>
              <button
                type="button"
                className="ws-btn ws-btn-success"
                disabled={busy || !closeNotes.trim()}
                onClick={async () => {
                  if (await props.onCloseOrder(closeCode, closeNotes.trim())) setCloseOpen(false);
                }}
              >
                Close order
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};
