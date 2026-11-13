import type { CustomerAsset, TicketSummary } from '../../types';

export const STATUS_LABELS: Record<string, string> = {
  NEW_OPEN: 'New',
  ASSIGNED: 'Assigned',
  WORK_IN_PROGRESS: 'In Progress',
  AWAITING_CUSTOMER_RESPONSE: 'Awaiting Customer',
  AWAITING_PAYMENT: 'Awaiting Payment',
  PAYMENT_DONE: 'Payment Done',
  ON_HOLD: 'On Hold',
  INTERNAL_REVIEW: 'Internal Review',
  REOPENED: 'Reopened',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};

/** Mirrors the backend developer state machine (apps/tickets/views.py). Admins may override. */
export const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW_OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['WORK_IN_PROGRESS', 'NEW_OPEN', 'ON_HOLD'],
  WORK_IN_PROGRESS: ['INTERNAL_REVIEW', 'AWAITING_CUSTOMER_RESPONSE', 'ON_HOLD'],
  INTERNAL_REVIEW: ['WORK_IN_PROGRESS', 'AWAITING_CUSTOMER_RESPONSE'],
  AWAITING_CUSTOMER_RESPONSE: ['WORK_IN_PROGRESS', 'AWAITING_PAYMENT', 'ON_HOLD'],
  AWAITING_PAYMENT: ['PAYMENT_DONE', 'WORK_IN_PROGRESS'],
  PAYMENT_DONE: ['CLOSED'],
  CLOSED: ['REOPENED'],
  ON_HOLD: ['WORK_IN_PROGRESS', 'CANCELLED'],
  REOPENED: ['WORK_IN_PROGRESS'],
};

export function allowedTargets(status: string, isAdmin: boolean): string[] {
  return isAdmin ? Object.keys(STATUS_LABELS).filter((s) => s !== status) : PERMITTED_TRANSITIONS[status] || [];
}

export const PRIORITIES = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
export const PRIORITY_RANK: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

export const ON_HOLD_REASONS = [
  'Customer Clarification Required',
  'Awaiting High-Resolution Photos / Media',
  'Payment Verification Pending',
  'Special Customization Engineering Review',
  'Customer Requested Event Reschedule / Delay',
  'Other Operational Hold',
];

export const CLOSURE_CODES = [
  'Fulfilled — Invitation Delivered & Live',
  'Customer Approved & Accepted',
  'Delivered with Custom Adjustments',
  'Cancelled by Customer Request',
];

export const statusLabel = (s?: string) => (s ? STATUS_LABELS[s] || humanize(s) : '—');
export const priorityLabel = (p?: string) => (p ? p.charAt(0) + p.slice(1).toLowerCase() : '—');

export function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtDate(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtTime(v?: string | null): string {
  if (!v) return '';
  const [h, m] = v.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return v;
  return `${((hour + 11) % 12) + 1}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function fileSize(a: CustomerAsset): string {
  if (a.readable_size) return a.readable_size;
  const b = a.file_size_bytes || 0;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

export type AssetKind = 'image' | 'audio' | 'video' | 'pdf' | 'doc';

export function fileExt(a: CustomerAsset): string {
  return (a.extension || a.file_name.split('.').pop() || '').toLowerCase();
}

export function assetKind(a: CustomerAsset): AssetKind {
  const ext = fileExt(a);
  const t = a.file_type || '';
  if (t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic'].includes(ext)) return 'image';
  if (t.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return 'audio';
  if (t.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'doc';
}

export const ticketOccasion = (t: TicketSummary) => t.occasion_name || t.occasion || '';
export const ticketPackage = (t: TicketSummary) => t.package_name || t.invitation_type || '';
export const ticketCreated = (t: TicketSummary) => t.created_at || t.eligible_at;

export function statusTone(status: string, onHold?: boolean): string {
  if (onHold || status === 'ON_HOLD') return 'warn';
  switch (status) {
    case 'NEW_OPEN':
      return 'info';
    case 'WORK_IN_PROGRESS':
    case 'ASSIGNED':
      return 'active';
    case 'AWAITING_CUSTOMER_RESPONSE':
    case 'AWAITING_PAYMENT':
      return 'pending';
    case 'CLOSED':
    case 'PAYMENT_DONE':
      return 'done';
    default:
      return 'neutral';
  }
}

export const priorityTone = (p: string) => (p === 'URGENT' ? 'danger' : p === 'HIGH' ? 'warn' : 'neutral');
