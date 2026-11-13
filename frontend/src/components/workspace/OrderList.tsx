import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Columns3, RefreshCw, Plus, X, ChevronUp, ChevronDown, Sparkles, Inbox, UserPlus } from 'lucide-react';
import type { TicketSummary } from '../../types';
import {
  PRIORITIES,
  PRIORITY_RANK,
  STATUS_LABELS,
  fmtDate,
  priorityLabel,
  priorityTone,
  statusLabel,
  statusTone,
  ticketCreated,
  ticketOccasion,
  ticketPackage,
} from './format';

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
type ColumnKey =
  | 'created'
  | 'number'
  | 'priority'
  | 'customer'
  | 'occasion'
  | 'package'
  | 'status'
  | 'team'
  | 'developer'
  | 'event_date'
  | 'description';

interface Column {
  key: ColumnKey;
  label: string;
  sortValue: (t: TicketSummary) => string | number;
}

const COLUMNS: Column[] = [
  { key: 'created', label: 'Created', sortValue: (t) => new Date(ticketCreated(t)).getTime() || 0 },
  { key: 'number', label: 'Order ID', sortValue: (t) => t.ticket_number || '' },
  { key: 'priority', label: 'Priority', sortValue: (t) => PRIORITY_RANK[t.priority] || 0 },
  { key: 'customer', label: 'Customer', sortValue: (t) => (t.customer_name || '').toLowerCase() },
  { key: 'occasion', label: 'Occasion', sortValue: (t) => ticketOccasion(t).toLowerCase() },
  { key: 'package', label: 'Invitation Package', sortValue: (t) => ticketPackage(t).toLowerCase() },
  { key: 'status', label: 'Status', sortValue: (t) => statusLabel(t.status) },
  { key: 'team', label: 'Assignment Group', sortValue: (t) => (t.assigned_team || '').toLowerCase() },
  { key: 'developer', label: 'Assigned To', sortValue: (t) => (t.assigned_developer_name || '').toLowerCase() },
  { key: 'event_date', label: 'Event Date', sortValue: (t) => (t.event_date ? new Date(t.event_date).getTime() : 0) },
  { key: 'description', label: 'Short Description', sortValue: (t) => (t.short_description || '').toLowerCase() },
];

const DEFAULT_COLUMNS: ColumnKey[] = COLUMNS.map((c) => c.key);
const COLUMN_STORE = 'ws.list.columns';

function loadColumns(): ColumnKey[] {
  try {
    const raw = localStorage.getItem(COLUMN_STORE);
    const parsed = raw ? (JSON.parse(raw) as ColumnKey[]) : null;
    if (parsed && parsed.length) return parsed.filter((k) => DEFAULT_COLUMNS.includes(k));
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_COLUMNS;
}

// ---------------------------------------------------------------------------
// Filter conditions
// ---------------------------------------------------------------------------
type FieldKey = 'status' | 'priority' | 'occasion' | 'package' | 'developer' | 'on_hold' | 'event_date' | 'created';
type Op = 'is' | 'is_not' | 'on_or_after' | 'on_or_before';

interface Condition {
  field: FieldKey;
  op: Op;
  value: string;
}

const FIELD_LABELS: Record<FieldKey, string> = {
  status: 'Status',
  priority: 'Priority',
  occasion: 'Occasion',
  package: 'Invitation Package',
  developer: 'Assigned To',
  on_hold: 'On Hold',
  event_date: 'Event Date',
  created: 'Created',
};

const OP_LABELS: Record<Op, string> = { is: 'is', is_not: 'is not', on_or_after: 'on or after', on_or_before: 'on or before' };
const isDateField = (f: FieldKey) => f === 'event_date' || f === 'created';
const UNASSIGNED = '__unassigned__';

function fieldValue(t: TicketSummary, f: FieldKey): string {
  switch (f) {
    case 'status':
      return t.status;
    case 'priority':
      return t.priority;
    case 'occasion':
      return ticketOccasion(t);
    case 'package':
      return ticketPackage(t);
    case 'developer':
      return t.assigned_developer_name || UNASSIGNED;
    case 'on_hold':
      return t.is_on_hold || t.status === 'ON_HOLD' ? 'YES' : 'NO';
    case 'event_date':
      return t.event_date || '';
    case 'created':
      return (ticketCreated(t) || '').slice(0, 10);
  }
}

function matches(t: TicketSummary, c: Condition): boolean {
  if (!c.value) return true;
  const v = fieldValue(t, c.field);
  if (c.op === 'is') return v === c.value;
  if (c.op === 'is_not') return v !== c.value;
  if (!v) return false;
  return c.op === 'on_or_after' ? v.slice(0, 10) >= c.value : v.slice(0, 10) <= c.value;
}

function conditionText(c: Condition): string {
  let v = c.value;
  if (c.field === 'status') v = statusLabel(v);
  else if (c.field === 'priority') v = priorityLabel(v);
  else if (c.field === 'developer' && v === UNASSIGNED) v = 'Unassigned';
  else if (c.field === 'on_hold') v = v === 'YES' ? 'Yes' : 'No';
  else if (isDateField(c.field)) v = fmtDate(v);
  return `${FIELD_LABELS[c.field]} ${OP_LABELS[c.op]} ${v}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface OrderListProps {
  title: string;
  tickets: TicketSummary[];
  loading: boolean;
  currentUserId: string;
  /** Assign-to-me is allowed (approved developer with free capacity). */
  canAssign: boolean;
  onOpen: (ticketId: string) => void;
  onAssign: (ticketId: string) => void;
  onRefresh: () => void;
  onClaimNext?: () => void;
  claimNextDisabled?: boolean;
}

export const OrderList: React.FC<OrderListProps> = ({
  title,
  tickets,
  loading,
  currentUserId,
  canAssign,
  onOpen,
  onAssign,
  onRefresh,
  onClaimNext,
  claimNextDisabled,
}) => {
  const [search, setSearch] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [draft, setDraft] = useState<Condition[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [visible, setVisible] = useState<ColumnKey[]>(loadColumns);
  const [sort, setSort] = useState<{ key: ColumnKey; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'desc' });
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORE, JSON.stringify(visible));
    } catch {
      /* storage unavailable */
    }
  }, [visible]);

  useEffect(() => setPage(1), [search, conditions, pageSize, tickets]);

  // Distinct values for reference-style condition pickers.
  const valueOptions = useMemo(() => {
    const uniq = (fn: (t: TicketSummary) => string) => Array.from(new Set(tickets.map(fn).filter(Boolean))).sort();
    return {
      occasion: uniq(ticketOccasion),
      package: uniq(ticketPackage),
      developer: uniq((t) => t.assigned_developer_name || ''),
    };
  }, [tickets]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tickets.filter((t) => conditions.every((c) => matches(t, c)));
    if (q) {
      list = list.filter((t) =>
        [
          t.ticket_number,
          t.order_reference,
          t.customer_name,
          t.customer_mobile,
          t.customer_email,
          ticketOccasion(t),
          ticketPackage(t),
          t.short_description,
          t.assigned_developer_name,
          statusLabel(t.status),
        ].some((v) => (v || '').toLowerCase().includes(q)),
      );
    }
    const col = COLUMNS.find((c) => c.key === sort.key)!;
    return [...list].sort((a, b) => {
      const x = col.sortValue(a);
      const y = col.sortValue(b);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === 'asc' ? r : -r;
    });
  }, [tickets, conditions, search, sort]);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const shownCols = COLUMNS.filter((c) => visible.includes(c.key));

  const toggleSort = (key: ColumnKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'created' || key === 'priority' ? 'desc' : 'asc' }));

  const openFilter = () => {
    setDraft(conditions.length ? conditions : [{ field: 'status', op: 'is', value: '' }]);
    setShowFilter((v) => !v);
    setShowColumns(false);
  };

  const runFilter = () => {
    setConditions(draft.filter((c) => c.value));
    setShowFilter(false);
  };

  const renderValueInput = (c: Condition, idx: number) => {
    const set = (value: string) => setDraft((d) => d.map((x, i) => (i === idx ? { ...x, value } : x)));
    if (isDateField(c.field)) return <input type="date" className="ws-input" value={c.value} onChange={(e) => set(e.target.value)} />;
    let opts: { value: string; label: string }[] = [];
    if (c.field === 'status') opts = Object.keys(STATUS_LABELS).map((s) => ({ value: s, label: STATUS_LABELS[s] }));
    else if (c.field === 'priority') opts = PRIORITIES.map((p) => ({ value: p, label: priorityLabel(p) }));
    else if (c.field === 'on_hold') opts = [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }];
    else if (c.field === 'developer') opts = [{ value: UNASSIGNED, label: 'Unassigned' }, ...valueOptions.developer.map((v) => ({ value: v, label: v }))];
    else opts = valueOptions[c.field as 'occasion' | 'package'].map((v) => ({ value: v, label: v }));
    return (
      <select className="ws-input" value={c.value} onChange={(e) => set(e.target.value)}>
        <option value="">-- choose --</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  };

  const renderCell = (t: TicketSummary, key: ColumnKey) => {
    switch (key) {
      case 'created':
        return <span className="ws-muted ws-nowrap">{fmtDate(ticketCreated(t))}</span>;
      case 'number':
        return (
          <button type="button" className="ws-link" onClick={() => onOpen(t.id)}>
            {t.ticket_number}
          </button>
        );
      case 'priority':
        return <span className={`ws-pill tone-${priorityTone(t.priority)}`}>{priorityLabel(t.priority)}</span>;
      case 'customer':
        return (
          <div className="ws-nowrap">
            {t.customer_name || '—'}
            {t.customer_mobile && <div className="ws-sub">{t.customer_mobile}</div>}
          </div>
        );
      case 'occasion':
        return ticketOccasion(t) || '—';
      case 'package':
        return ticketPackage(t) || '—';
      case 'status':
        return (
          <span className="ws-nowrap">
            <span className={`ws-dot tone-${statusTone(t.status, t.is_on_hold)}`} />
            {statusLabel(t.status)}
            {t.is_on_hold && t.status !== 'ON_HOLD' && <span className="ws-pill tone-warn ws-ml">On hold</span>}
          </span>
        );
      case 'team':
        return t.assigned_team || <span className="ws-muted">—</span>;
      case 'developer':
        return t.assigned_developer_name || <span className="ws-muted">(empty)</span>;
      case 'event_date':
        return <span className="ws-nowrap">{fmtDate(t.event_date)}</span>;
      case 'description':
        return <span className="ws-clamp">{t.short_description || `${t.customer_name} — ${ticketOccasion(t)}`}</span>;
    }
  };

  return (
    <section className="ws-list">
      {/* Toolbar */}
      <div className="ws-list-toolbar">
        <div className="ws-list-title">
          <h1>{title}</h1>
          <span className="ws-count">{total} {total === 1 ? 'record' : 'records'}</span>
        </div>
        <div className="ws-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search order ID, customer, mobile, occasion, package…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search records"
          />
        </div>
        <div className="ws-toolbar-actions">
          <button type="button" className={`ws-btn ${showFilter || conditions.length ? 'is-on' : ''}`} onClick={openFilter} aria-expanded={showFilter}>
            <Filter size={14} /> Filter{conditions.length > 0 && <span className="ws-badge">{conditions.length}</span>}
          </button>
          <div className="ws-pop-anchor">
            <button
              type="button"
              className={`ws-btn ws-icon-btn ${showColumns ? 'is-on' : ''}`}
              onClick={() => {
                setShowColumns((v) => !v);
                setShowFilter(false);
              }}
              aria-expanded={showColumns}
              title="Configure columns"
              aria-label="Configure columns"
            >
              <Columns3 size={15} />
            </button>
            {showColumns && (
              <div className="ws-popover" role="dialog" aria-label="Columns">
                <div className="ws-popover-head">
                  Columns
                  <button type="button" className="ws-text-btn" onClick={() => setVisible(DEFAULT_COLUMNS)}>Reset</button>
                </div>
                {COLUMNS.map((c) => (
                  <label key={c.key} className="ws-check">
                    <input
                      type="checkbox"
                      checked={visible.includes(c.key)}
                      disabled={c.key === 'number'}
                      onChange={(e) =>
                        setVisible((v) => (e.target.checked ? DEFAULT_COLUMNS.filter((k) => v.includes(k) || k === c.key) : v.filter((k) => k !== c.key)))
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="ws-btn ws-icon-btn" onClick={onRefresh} disabled={loading} title="Refresh" aria-label="Refresh list">
            <RefreshCw size={15} className={loading ? 'ws-spin' : ''} />
          </button>
          {onClaimNext && (
            <button type="button" className="ws-btn ws-btn-primary" onClick={onClaimNext} disabled={claimNextDisabled || loading}>
              <Sparkles size={14} /> Claim Next Order
            </button>
          )}
        </div>
      </div>

      {/* Filter builder */}
      {showFilter && (
        <div className="ws-filter-panel">
          {draft.map((c, idx) => (
            <div key={idx} className="ws-condition">
              <span className="ws-condition-join">{idx === 0 ? 'Where' : 'and'}</span>
              <select
                className="ws-input"
                value={c.field}
                onChange={(e) => {
                  const field = e.target.value as FieldKey;
                  setDraft((d) => d.map((x, i) => (i === idx ? { field, op: isDateField(field) ? 'on_or_after' : 'is', value: '' } : x)));
                }}
              >
                {(Object.keys(FIELD_LABELS) as FieldKey[]).map((f) => (
                  <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                ))}
              </select>
              <select className="ws-input" value={c.op} onChange={(e) => setDraft((d) => d.map((x, i) => (i === idx ? { ...x, op: e.target.value as Op } : x)))}>
                {(isDateField(c.field) ? (['on_or_after', 'on_or_before'] as Op[]) : (['is', 'is_not'] as Op[])).map((o) => (
                  <option key={o} value={o}>{OP_LABELS[o]}</option>
                ))}
              </select>
              {renderValueInput(c, idx)}
              <button type="button" className="ws-btn ws-icon-btn" aria-label="Remove condition" onClick={() => setDraft((d) => d.filter((_, i) => i !== idx))}>
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="ws-filter-actions">
            <button type="button" className="ws-text-btn" onClick={() => setDraft((d) => [...d, { field: 'priority', op: 'is', value: '' }])}>
              <Plus size={13} /> Add condition
            </button>
            <span className="ws-grow" />
            <button
              type="button"
              className="ws-btn"
              onClick={() => {
                setDraft([]);
                setConditions([]);
                setShowFilter(false);
              }}
            >
              Clear all
            </button>
            <button type="button" className="ws-btn ws-btn-primary" onClick={runFilter}>Run</button>
          </div>
        </div>
      )}

      {/* Condition breadcrumb */}
      {conditions.length > 0 && (
        <div className="ws-crumbs" aria-label="Active filters">
          <button type="button" className="ws-text-btn" onClick={() => setConditions([])}>All</button>
          {conditions.map((c, i) => (
            <span key={i} className="ws-crumb">
              <span aria-hidden>›</span> {conditionText(c)}
              <button type="button" aria-label={`Remove ${conditionText(c)}`} onClick={() => setConditions((cs) => cs.filter((_, j) => j !== i))}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="ws-table-wrap">
        <table className="ws-table">
          <thead>
            <tr>
              {shownCols.map((c) => (
                <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sort.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </button>
                </th>
              ))}
              <th className="ws-th-actions"><span className="ws-sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((t) => {
              const mine = t.assigned_developer === currentUserId;
              return (
                <tr key={t.id}>
                  {shownCols.map((c) => (
                    <td key={c.key}>{renderCell(t, c.key)}</td>
                  ))}
                  <td className="ws-td-actions">
                    {!mine && !t.assigned_developer && t.status !== 'CLOSED' && (
                      <button type="button" className="ws-btn ws-btn-sm" disabled={!canAssign || loading} onClick={() => onAssign(t.id)} title="Assign to me">
                        <UserPlus size={13} /> Assign
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={shownCols.length + 1} className="ws-empty">
                  <Inbox size={26} aria-hidden />
                  <strong>{loading ? 'Loading records…' : 'No records to display'}</strong>
                  {!loading && (search || conditions.length > 0) && <span>Try clearing the search or filter conditions.</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="ws-pager">
        <span>
          {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <label className="ws-pager-size">
          Rows
          <select className="ws-input" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="ws-pager-nav">
          <button type="button" className="ws-btn ws-btn-sm" onClick={() => setPage(1)} disabled={page <= 1} aria-label="First page">«</button>
          <button type="button" className="ws-btn ws-btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="ws-btn ws-btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pages} aria-label="Next page">›</button>
          <button type="button" className="ws-btn ws-btn-sm" onClick={() => setPage(pages)} disabled={page >= pages} aria-label="Last page">»</button>
        </div>
      </div>
    </section>
  );
};
