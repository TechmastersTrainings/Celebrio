import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { TicketSummary, TicketDetail, User } from '../../types';

interface DeveloperWorkspacePageProps {
  currentUser: User;
  onOpenPreview: (previewUrl: string) => void;
}

export const DeveloperWorkspacePage: React.FC<DeveloperWorkspacePageProps> = ({
  currentUser,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'assigned' | 'video'>('queue');
  const [availableTickets, setAvailableTickets] = useState<TicketSummary[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<TicketSummary[]>([]);
  const [videoTasks, setVideoTasks] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Studio State
  const [themeColor, setThemeColor] = useState('#7C182A');
  const [accentColor, setAccentColor] = useState('#CFA043');
  const [watermark, setWatermark] = useState('TECHMASTERS PREVIEW - NOT FINAL');
  const [internalNoteText, setInternalNoteText] = useState('');

  const isApproved = currentUser.is_approved_developer;
  const canVideo = currentUser.can_produce_video;

  const loadData = async () => {
    if (!isApproved) return;
    try {
      setLoading(true);
      setError(null);
      const [avail, myTickets] = await Promise.all([
        ApiService.getAvailableTickets(),
        ApiService.getAssignedTickets(),
      ]);
      setAvailableTickets(avail);
      setAssignedTickets(myTickets);

      if (canVideo) {
        const vTasks = await ApiService.getVideoTasks();
        setVideoTasks(vTasks);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isApproved]);

  const loadTicketDetail = async (ticketId: string) => {
    try {
      setLoading(true);
      const detail: any = await ApiService.getTicketDetail(ticketId);
      setTicketDetail(detail);
      setSelectedTicketId(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFIFO = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.claimNextFIFOTicket();
      setActionMsg(res.message);
      await loadData();
      if (res.ticket_id) {
        await loadTicketDetail(res.ticket_id);
        setActiveTab('assigned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDesign = async () => {
    if (!selectedTicketId) return;
    try {
      setLoading(true);
      const res: any = await ApiService.uploadDesignVersion(
        selectedTicketId,
        { theme_color: themeColor, accent_color: accentColor },
        watermark
      );
      setActionMsg(res.message);
      await loadTicketDetail(selectedTicketId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload preview');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicketId || !internalNoteText.trim()) return;
    try {
      await ApiService.addInternalNote(selectedTicketId, internalNoteText);
      setInternalNoteText('');
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    }
  };

  const handleClaimVideo = async (taskId: string) => {
    try {
      setLoading(true);
      const res: any = await ApiService.claimVideoTask(taskId);
      setActionMsg(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to claim video task');
    } finally {
      setLoading(false);
    }
  };

  if (!isApproved) {
    return (
      <div className="card" style={{ maxWidth: '650px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Account Pending Administrator Approval
        </h2>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your developer registration has been received and is currently under review by a TechMasters Operations Administrator. Access to customer orders and the FIFO assignment queue is restricted until an Admin grants approval.
        </p>
        <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.85rem' }}>
          Status: <span className="badge badge-assigned">{currentUser.developer_profile?.approval_status || 'PENDING_APPROVAL'}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header & Workload Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>
            Developer Production Workspace
          </h2>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{currentUser.full_name}</strong> • Role: <strong>{currentUser.role}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Active Workload: <strong>{assignedTickets.length} / {currentUser.developer_profile?.max_active_tickets || 3} Tickets</strong>
          </div>
          <button className="btn btn-sm btn-outline" onClick={loadData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionMsg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontWeight: 'bold' }} onClick={() => setActionMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => { setActiveTab('queue'); setSelectedTicketId(null); }}
        >
          Available FIFO Queue ({availableTickets.length})
        </button>

        <button
          className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setActiveTab('assigned')}
        >
          My Assigned Tickets ({assignedTickets.length})
        </button>

        {canVideo && (
          <button
            className={`btn ${activeTab === 'video' ? 'btn-gold' : 'btn-outline'}`}
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
            onClick={() => setActiveTab('video')}
          >
            🎬 Video Tasks ({videoTasks.length})
          </button>
        )}
      </div>

      {/* TAB 1: Available FIFO Queue */}
      {activeTab === 'queue' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                First-In, First-Out Available Ticket Queue
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Orders are sequenced strictly by eligibility timestamp. Two developers can never claim the same ticket concurrently.
              </p>
            </div>

            <button
              className="btn btn-gold"
              onClick={handleClaimFIFO}
              disabled={loading || availableTickets.length === 0}
            >
              ⚡ Claim Next FIFO Ticket
            </button>
          </div>

          {availableTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
              No unclaimed orders currently waiting in the queue.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Waiting Since</th>
                    <th>Ticket Ref</th>
                    <th>Celebration</th>
                    <th>Package Tier</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(t.eligible_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <strong>{t.ticket_number}</strong>
                      </td>
                      <td>{t.occasion_name}</td>
                      <td>{t.package_name}</td>
                      <td>
                        <span className={`badge ${t.priority === 'HIGH' ? 'badge-hold' : 'badge-assigned'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-new">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Assigned Tickets & Production Studio */}
      {activeTab === 'assigned' && (
        <div className="grid grid-cols-3" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Assigned Tickets List */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              My Active Orders ({assignedTickets.length})
            </h4>

            {assignedTickets.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                You have no active tickets. Switch to the Available Queue tab to claim a ticket!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assignedTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: selectedTicketId === t.id ? 'var(--color-primary)' : 'var(--color-border)',
                      background: selectedTicketId === t.id ? '#FFF1F2' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{t.ticket_number}</strong>
                      <span className={`badge ${t.status === 'WORK_IN_PROGRESS' ? 'badge-wip' : 'badge-review'}`} style={{ fontSize: '0.65rem' }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.25rem' }}>
                      {t.customer_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {t.occasion_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Two Columns: Production Studio */}
          <div style={{ gridColumn: 'span 2' }}>
            {!ticketDetail ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
                Select an assigned ticket on the left to launch the creative production studio.
              </div>
            ) : (
              <div className="card">
                {/* Ticket Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span className="badge badge-assigned" style={{ marginBottom: '0.35rem' }}>
                      {ticketDetail.ticket_number}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--color-primary)' }}>
                      {ticketDetail.order.customer_name}'s {ticketDetail.order.occasion_name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Language: <strong>{ticketDetail.order.selected_language}</strong> • Package: <strong>{ticketDetail.order.package_name}</strong>
                    </div>
                  </div>

                  <span className="badge badge-wip">{ticketDetail.status}</span>
                </div>

                {/* Creative Brief & Itinerary */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                  <h5 style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                    Customer Requirements & Creative Brief:
                  </h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    {ticketDetail.order.special_instructions || 'No custom notes provided.'}
                  </p>

                  <h5 style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                    Ceremonies & Venues:
                  </h5>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem' }}>
                    {ticketDetail.order.events?.map((ev, i) => (
                      <li key={i}>
                        <strong>{ev.event_title}</strong>: {ev.event_date} at {ev.start_time} — {ev.venue_name} ({ev.venue_address})
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Template & Theme Studio */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                    Design Version Studio & Theme Configurator
                  </h4>

                  <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Primary Brand / Theme Color</label>
                      <input
                        type="color"
                        className="form-control"
                        style={{ height: '42px', padding: '4px' }}
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Accent Celebration Gold Color</label>
                      <input
                        type="color"
                        className="form-control"
                        style={{ height: '42px', padding: '4px' }}
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preview Watermark Overlay Text</label>
                    <input
                      type="text"
                      className="form-control"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-gold"
                    onClick={handleUploadDesign}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    🚀 Deploy & Dispatch Draft Preview v{ticketDetail.design_versions.length + 1}
                  </button>
                </div>

                {/* Revision Feedback Inspector */}
                {ticketDetail.order.has_active_preview && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#92400E' }}>
                        Active Customer Preview v{ticketDetail.design_versions[0]?.version_number}
                      </strong>
                      {ticketDetail.order.preview_url && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => onOpenPreview(ticketDetail.order.preview_url!)}
                        >
                          👁️ View Preview
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#78350F' }}>
                      Preview Token: <code>{ticketDetail.design_versions[0]?.preview_token}</code>
                    </div>
                  </div>
                )}

                {/* Internal Notes Feed */}
                <div>
                  <h5 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                    Internal Staff Notes (Admin & Developer Collaboration)
                  </h5>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add an internal production note..."
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleAddNote}>
                      Post Note
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                    {ticketDetail.internal_notes?.map((n) => (
                      <div key={n.id} style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
                        <strong>{n.author_name}</strong>: {n.note_text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Video Tasks */}
      {activeTab === 'video' && canVideo && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            🎬 Video Production Queue (FFmpeg Animated MP4 Pipeline)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Restricted to video specialists with explicit Admin permissions. Compose motion graphics, typography transitions, and audio sync.
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Occasion</th>
                  <th>Preset</th>
                  <th>Specialist</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {videoTasks.map((vt) => (
                  <tr key={vt.id}>
                    <td><strong>{vt.order_reference}</strong></td>
                    <td>{vt.customer_name}</td>
                    <td>{vt.occasion}</td>
                    <td>{vt.duration_seconds}s @ {vt.resolution}</td>
                    <td>{vt.assigned_specialist || <span style={{ color: 'var(--color-text-muted)' }}>Unclaimed</span>}</td>
                    <td><span className="badge badge-wip">{vt.status}</span></td>
                    <td>
                      {!vt.assigned_specialist ? (
                        <button className="btn btn-sm btn-gold" onClick={() => handleClaimVideo(vt.id)}>
                          Claim Task
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>In Production</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

