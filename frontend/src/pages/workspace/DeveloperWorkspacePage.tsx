import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  List,
  Inbox,
  User as UserIcon,
  Activity,
  PauseCircle,
  MessageSquare,
  CheckCircle2,
  Video,
  Sparkles,
  RefreshCw,
  LogOut,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { StaffHeader } from '../../components/StaffHeader';
import type { CustomerAsset, TicketDetail, TicketSummary, User } from '../../types';
import { OrderList } from '../../components/workspace/OrderList';
import { OrderRecord, type RecordFormValues } from '../../components/workspace/OrderRecord';
import { AttachmentPreview } from '../../components/workspace/AttachmentPreview';
import { VideoTaskList, type VideoTask } from '../../components/workspace/VideoTaskList';
import '../../components/workspace/workspace.css';

interface DeveloperWorkspacePageProps {
  currentUser: User;
  onOpenPreview: (previewUrl: string) => void;
  onLogout: () => void;
  onOpenWebsite: () => void;
}

type QueueKey = 'my_work' | 'all' | 'open' | 'mine' | 'wip' | 'on_hold' | 'awaiting' | 'closed' | 'video';

const QUEUES: { key: QueueKey; label: string; icon: React.ReactNode }[] = [
  { key: 'my_work', label: 'My Work', icon: <Briefcase size={15} /> },
  { key: 'all', label: 'All Orders', icon: <List size={15} /> },
  { key: 'open', label: 'Open Queue', icon: <Inbox size={15} /> },
  { key: 'mine', label: 'My Orders', icon: <UserIcon size={15} /> },
  { key: 'wip', label: 'In Progress', icon: <Activity size={15} /> },
  { key: 'on_hold', label: 'On Hold', icon: <PauseCircle size={15} /> },
  { key: 'awaiting', label: 'Awaiting Customer', icon: <MessageSquare size={15} /> },
  { key: 'closed', label: 'Completed / Closed', icon: <CheckCircle2 size={15} /> },
  { key: 'video', label: 'Video Tasks', icon: <Video size={15} /> },
];

const isHeld = (t: TicketSummary) => t.is_on_hold || t.status === 'ON_HOLD';
const recordFromUrl = () => new URLSearchParams(window.location.search).get('record');

export const DeveloperWorkspacePage: React.FC<DeveloperWorkspacePageProps> = ({ currentUser, onOpenPreview, onLogout, onOpenWebsite }) => {
  const isApproved = Boolean(currentUser.is_approved_developer);
  const canVideo = Boolean(currentUser.can_produce_video);
  const maxActive = currentUser.developer_profile?.max_active_tickets || 3;

  const [queue, setQueue] = useState<QueueKey>('my_work');
  const [available, setAvailable] = useState<TicketSummary[]>([]);
  const [assigned, setAssigned] = useState<TicketSummary[]>([]);
  const [closed, setClosed] = useState<TicketSummary[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [recordId, setRecordId] = useState<string | null>(recordFromUrl);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [preview, setPreview] = useState<CustomerAsset | null>(null);

  // ---------------------------------------------------------------- data
  const loadLists = useCallback(async () => {
    if (!isApproved) return;
    setLoading(true);
    try {
      const [a, mine, done] = await Promise.all([
        ApiService.getAvailableTickets(),
        ApiService.getAssignedTickets(),
        ApiService.getClosedTickets(),
      ]);
      setAvailable(a || []);
      setAssigned(mine || []);
      setClosed(done || []);
      if (canVideo) setVideoTasks((await ApiService.getVideoTasks()) || []);
    } catch (e: any) {
      setMessage({ kind: 'error', text: e?.message || 'Could not load orders.' });
    } finally {
      setLoading(false);
    }
  }, [isApproved, canVideo]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const d = (await ApiService.getTicketDetail(id)) as TicketDetail;
      setDetail(d);
    } catch (e: any) {
      setMessage({ kind: 'error', text: e?.message || 'Could not load the order record.' });
      setDetail(null);
      setRecordId(null);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (recordId) loadDetail(recordId);
    else setDetail(null);
  }, [recordId, loadDetail]);

  // Keep the open record in the URL (?record=) so refresh and Back work.
  useEffect(() => {
    const onPop = () => setRecordId(recordFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openRecord = (id: string) => {
    window.history.pushState({}, '', `/developers?record=${encodeURIComponent(id)}`);
    setDetail(null);
    setRecordId(id);
    window.scrollTo({ top: 0 });
  };

  const closeRecord = () => {
    window.history.pushState({}, '', '/developers');
    setRecordId(null);
  };

  /** Runs an action, reports the result, refreshes data. Returns true on success. */
  const run = async (fn: () => Promise<any>, okText: string | ((r: any) => string), refreshRecord = true): Promise<boolean> => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn();
      setMessage({ kind: 'ok', text: typeof okText === 'function' ? okText(res) : okText });
      await Promise.all([loadLists(), refreshRecord && recordId ? loadDetail(recordId) : Promise.resolve()]);
      return true;
    } catch (e: any) {
      setMessage({ kind: 'error', text: e?.message || 'The action failed.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------- queues
  const all = useMemo(() => {
    const map = new Map<string, TicketSummary>();
    [...closed, ...available, ...assigned].forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [assigned, available, closed]);

  const activeMine = assigned.filter((t) => t.status !== 'CLOSED');
  const atCapacity = activeMine.length >= maxActive;

  const queueTickets: Record<Exclude<QueueKey, 'video'>, TicketSummary[]> = useMemo(
    () => ({
      my_work: assigned.filter((t) => t.status !== 'CLOSED' && !isHeld(t) && t.status !== 'AWAITING_CUSTOMER_RESPONSE'),
      all,
      open: available,
      mine: assigned,
      wip: all.filter((t) => t.status === 'WORK_IN_PROGRESS' && !isHeld(t)),
      on_hold: all.filter(isHeld),
      awaiting: all.filter((t) => t.status === 'AWAITING_CUSTOMER_RESPONSE'),
      closed: all.filter((t) => t.status === 'CLOSED'),
    }),
    [assigned, available, all],
  );

  const count = (k: QueueKey) => (k === 'video' ? videoTasks.length : queueTickets[k].length);

  const claimNext = () =>
    run(
      async () => {
        const res: any = await ApiService.claimNextFIFOTicket();
        if (res?.ticket_id) openRecord(res.ticket_id);
        return res;
      },
      (r) => r?.message || 'Next order assigned to you.',
      false,
    );

  const assign = (id: string) => run(() => ApiService.claimSpecificTicket(id), (r) => r?.message || 'Order assigned to you.');

  // ---------------------------------------------------------------- record actions
  const d = detail;
  const recordHandlers = d && {
    onSave: (v: RecordFormValues) =>
      run(
        () =>
          ApiService.updateTicketDetails(d.id, {
            status: v.status,
            priority: v.priority,
            is_on_hold: v.is_on_hold,
            hold_reason: v.is_on_hold ? v.hold_reason : '',
            work_notes: `Record updated by ${currentUser.full_name}: state ${v.status}, priority ${v.priority}${v.is_on_hold ? `, on hold (${v.hold_reason})` : ''}.`,
          }),
        `${d.ticket_number} saved.`,
      ),
    onAssign: () => assign(d.id),
    onTransition: (status: string) =>
      run(
        () => ApiService.updateTicketStatus(d.id, status, `Moved to ${status}`, `State changed to ${status} by ${currentUser.full_name}`),
        `${d.ticket_number} updated.`,
      ),
    onHold: (reason: string, notes: string) =>
      run(
        () => ApiService.updateTicketDetails(d.id, { is_on_hold: true, hold_reason: reason, work_notes: `[ON HOLD: ${reason}] ${notes}` }),
        `${d.ticket_number} put on hold.`,
      ),
    onResume: (setInProgress: boolean) =>
      run(
        () =>
          ApiService.updateTicketDetails(d.id, {
            is_on_hold: false,
            hold_reason: '',
            ...(setInProgress ? { status: 'WORK_IN_PROGRESS' } : {}),
            work_notes: `Resumed from hold by ${currentUser.full_name}.`,
          }),
        `${d.ticket_number} resumed.`,
      ),
    onCloseOrder: (code: string, notes: string) =>
      run(() => ApiService.updateTicketStatus(d.id, 'CLOSED', code, `[RESOLUTION: ${code}] ${notes}`), `${d.ticket_number} closed.`),
    onPostNote: (text: string, type: 'CUSTOMER_UPDATE' | 'WORK_NOTE') =>
      run(() => ApiService.addInternalNote(d.id, text, type), type === 'CUSTOMER_UPDATE' ? 'Customer update posted.' : 'Work note posted.'),
    onUpload: (file: File, category: string) =>
      run(() => ApiService.uploadOrderAsset(d.order.order_reference, file, category), `Uploaded ${file.name}.`),
    onRenderVersion: (payload: { theme_color: string; accent_color: string }, watermark: string) =>
      run(() => ApiService.uploadDesignVersion(d.id, payload, watermark), (r) => r?.message || 'New design version shared.'),
  };

  const download = async (asset: CustomerAsset) => {
    try {
      await ApiService.downloadAssetFile(asset.id, asset.file_name);
    } catch (e: any) {
      setMessage({ kind: 'error', text: e?.message || `Could not download ${asset.file_name}.` });
    }
  };

  // ---------------------------------------------------------------- render
  if (!isApproved) {
    return (
      <div className="ws-pending">
        <div className="ws-pending-card">
          <h1>Account pending approval</h1>
          <p>Your developer profile is registered and waiting for administrator approval. Orders will appear here once you are approved.</p>
          <p className="ws-muted">Status: {currentUser.developer_profile?.approval_status || 'PENDING_APPROVAL'}</p>
          <button type="button" className="ws-btn" onClick={onLogout}><LogOut size={14} /> Log out</button>
        </div>
      </div>
    );
  }

  const queues = QUEUES.filter((q) => q.key !== 'video' || canVideo);
  const currentQueue = QUEUES.find((q) => q.key === queue)!;

  return (
    <div className="ws-shell">
      <StaffHeader appName="Developer Workspace" user={currentUser} onLogout={onLogout} onOpenWebsite={onOpenWebsite} />

      <aside className="ws-sidebar">
        <nav className="ws-nav" aria-label="Order queues">
          {queues.map((q) => (
            <button
              key={q.key}
              type="button"
              className={`ws-nav-item ${queue === q.key && !recordId ? 'is-active' : ''}`}
              aria-current={queue === q.key && !recordId ? 'page' : undefined}
              onClick={() => {
                setQueue(q.key);
                if (recordId) closeRecord();
              }}
            >
              {q.icon}
              <span>{q.label}</span>
              <span className="ws-nav-count">{count(q.key)}</span>
            </button>
          ))}
        </nav>
        <div className="ws-sidebar-foot">
          <div className="ws-capacity">
            Active orders <strong>{activeMine.length} / {maxActive}</strong>
            <span className="ws-capacity-bar"><span style={{ width: `${Math.min(100, (activeMine.length / maxActive) * 100)}%` }} /></span>
          </div>
          <button type="button" className="ws-btn ws-btn-primary ws-block" onClick={claimNext} disabled={busy || atCapacity || available.length === 0}>
            <Sparkles size={14} /> Claim Next Order
          </button>
          <button type="button" className="ws-btn ws-btn-ghost ws-block" onClick={loadLists} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'ws-spin' : ''} /> Refresh Orders
          </button>
        </div>
      </aside>

      <div className="ws-main">
        {message && (
          <div className={`ws-banner is-${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
            {message.kind === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}

        <main className="ws-content">
          {recordId ? (
            d && recordHandlers ? (
              <OrderRecord
                key={d.id}
                detail={d}
                currentUser={currentUser}
                busy={busy}
                onBack={closeRecord}
                onDownload={download}
                onPreviewAsset={setPreview}
                onOpenPreview={onOpenPreview}
                {...recordHandlers}
              />
            ) : (
              <div className="ws-loading">Loading order record…</div>
            )
          ) : queue === 'video' ? (
            <VideoTaskList
              tasks={videoTasks}
              loading={loading}
              currentUserName={currentUser.full_name}
              onRefresh={loadLists}
              onClaim={(id) => run(() => ApiService.claimVideoTask(id), 'Video task claimed.', false)}
            />
          ) : (
            <OrderList
              key={queue}
              title={currentQueue.label}
              tickets={queueTickets[queue]}
              loading={loading}
              currentUserId={currentUser.id}
              canAssign={!atCapacity && !busy}
              onOpen={openRecord}
              onAssign={assign}
              onRefresh={loadLists}
              onClaimNext={queue === 'open' ? claimNext : undefined}
              claimNextDisabled={atCapacity || available.length === 0}
            />
          )}
        </main>
      </div>

      {preview && <AttachmentPreview asset={preview} onClose={() => setPreview(null)} onDownload={download} />}
    </div>
  );
};

export default DeveloperWorkspacePage;
