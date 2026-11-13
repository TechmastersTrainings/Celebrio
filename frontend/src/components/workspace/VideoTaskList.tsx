import React from 'react';
import { RefreshCw, Inbox, UserPlus } from 'lucide-react';
import { fmtDate, humanize } from './format';

export interface VideoTask {
  id: string;
  order_reference: string;
  customer_name: string;
  occasion: string;
  status: string;
  assigned_specialist: string | null;
  duration_seconds?: number | null;
  resolution?: string | null;
  created_at: string;
}

interface Props {
  tasks: VideoTask[];
  loading: boolean;
  currentUserName: string;
  onClaim: (id: string) => void;
  onRefresh: () => void;
}

export const VideoTaskList: React.FC<Props> = ({ tasks, loading, currentUserName, onClaim, onRefresh }) => (
  <section className="ws-list">
    <div className="ws-list-toolbar">
      <div className="ws-list-title">
        <h1>Video Tasks</h1>
        <span className="ws-count">{tasks.length} {tasks.length === 1 ? 'record' : 'records'}</span>
      </div>
      <span className="ws-grow" />
      <button type="button" className="ws-btn ws-icon-btn" onClick={onRefresh} disabled={loading} aria-label="Refresh list" title="Refresh">
        <RefreshCw size={15} className={loading ? 'ws-spin' : ''} />
      </button>
    </div>
    <div className="ws-table-wrap">
      <table className="ws-table">
        <thead>
          <tr>
            <th><button type="button">Created</button></th>
            <th><button type="button">Order</button></th>
            <th><button type="button">Customer</button></th>
            <th><button type="button">Occasion</button></th>
            <th><button type="button">Status</button></th>
            <th><button type="button">Specialist</button></th>
            <th><button type="button">Duration</button></th>
            <th><button type="button">Resolution</button></th>
            <th className="ws-th-actions"><span className="ws-sr">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td className="ws-nowrap ws-muted">{fmtDate(t.created_at)}</td>
              <td className="ws-nowrap"><strong>{t.order_reference}</strong></td>
              <td>{t.customer_name}</td>
              <td>{t.occasion}</td>
              <td>{humanize(t.status)}</td>
              <td>{t.assigned_specialist || <span className="ws-muted">(empty)</span>}</td>
              <td>{t.duration_seconds ? `${t.duration_seconds}s` : '—'}</td>
              <td>{t.resolution || '—'}</td>
              <td className="ws-td-actions">
                {!t.assigned_specialist && (
                  <button type="button" className="ws-btn ws-btn-sm" onClick={() => onClaim(t.id)} disabled={loading}>
                    <UserPlus size={13} /> Claim
                  </button>
                )}
                {t.assigned_specialist === currentUserName && <span className="ws-muted">Yours</span>}
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={9} className="ws-empty">
                <Inbox size={26} aria-hidden />
                <strong>{loading ? 'Loading…' : 'No video tasks'}</strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);
