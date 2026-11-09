import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { TicketSummary, TicketDetail, User } from '../../types';
import {
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Video,
  FileText,
  Layers,
  Send,
  Upload,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin
} from 'lucide-react';

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
  const [themeColor, setThemeColor] = useState('#6B1728');
  const [accentColor, setAccentColor] = useState('#B88E3E');
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
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '0 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <span className="editorial-kicker">GOVERNANCE &bull; ACCESS PENDING</span>
          <h2 style={{ fontSize: '1.9rem', color: 'var(--navy-deep)', marginBottom: '0.75rem' }}>
            Account Pending Administrator Approval
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '2rem' }}>
            Your developer profile has been registered and is currently under review by a TechMasters Operations Administrator. Access to customer celebration orders and the FIFO queue will activate once Admin approval is granted.
          </p>
          <div style={{ background: 'var(--bg-champagne)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: '0.88rem' }}>
            Current Status: <span className="badge badge-assigned">{currentUser.developer_profile?.approval_status || 'PENDING_APPROVAL'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '3rem auto 5rem', padding: '0 1.5rem' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <span className="editorial-kicker">CREATIVE OPERATIONS</span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--navy-deep)' }}>
            Developer Production Workspace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '2px' }}>
            Artisan: <strong>{currentUser.full_name}</strong> &bull; Role: <strong>{currentUser.role}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 1.15rem',
              fontSize: '0.88rem',
            }}
          >
            Workload: <strong>{assignedTickets.length} / {currentUser.developer_profile?.max_active_tickets || 3} Active Tickets</strong>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMsg}</span>
          <button
            onClick={() => setActionMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: 'var(--color-danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => { setActiveTab('queue'); setSelectedTicketId(null); }}
        >
          <span>Available FIFO Queue ({availableTickets.length})</span>
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => { setActiveTab('assigned'); setSelectedTicketId(null); }}
        >
          <span>My Active Tickets ({assignedTickets.length})</span>
        </button>

        {canVideo && (
          <button
            className={`btn btn-sm ${activeTab === 'video' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            onClick={() => { setActiveTab('video'); setSelectedTicketId(null); }}
          >
            <Video size={14} />
            <span>Video Specialist Queue ({videoTasks.length})</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: AVAILABLE FIFO QUEUE
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>FIFO Self-Assignment Engine</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Claims the oldest unassigned ticket atomically using database-level locking (<code>SKIP LOCKED</code>).
              </p>
            </div>

            <button
              className="btn btn-gold"
              onClick={handleClaimFIFO}
              disabled={loading || assignedTickets.length >= (currentUser.developer_profile?.max_active_tickets || 3)}
            >
              <Sparkles size={16} />
              <span>Claim Next Available Ticket (FIFO)</span>
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket Ref</th>
                  <th>Occasion</th>
                  <th>Customer</th>
                  <th>Created At</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
                        {t.ticket_number}
                      </strong>
                    </td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.customer_name}</td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-new">{t.priority}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          loadTicketDetail(t.id);
                          setActiveTab('assigned');
                        }}
                      >
                        Inspect Requirements
                      </button>
                    </td>
                  </tr>
                ))}
                {availableTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No unassigned tickets currently in the FIFO queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ASSIGNED TICKETS & STUDIO
          ========================================================================= */}
      {activeTab === 'assigned' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTicketId ? '1fr 1.6fr' : '1fr', gap: '2rem' }}>
          {/* Ticket List */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              My Assigned Production Tickets ({assignedTickets.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignedTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetail(t.id)}
                  style={{
                    background: '#FFFFFF',
                    border: selectedTicketId === t.id ? '2px solid var(--burgundy-rich)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: selectedTicketId === t.id ? 'var(--shadow-card)' : 'var(--shadow-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--burgundy-rich)', fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>
                      {t.ticket_number}
                    </strong>
                    <span className="badge badge-assigned">{t.status}</span>
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                    {t.customer_name}'s {t.occasion_name || t.occasion}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Assigned: {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {assignedTickets.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  You currently have no active assigned tickets. Claim one from the FIFO queue to begin artisan production!
                </div>
              )}
            </div>
          </div>

          {/* Ticket Workspace / Studio */}
          {selectedTicketId && ticketDetail && (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <span className="editorial-kicker" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                    TICKET STUDIO &bull; {ticketDetail.ticket_number}
                  </span>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-deep)' }}>
                    {ticketDetail.customer_name || ticketDetail.order?.customer_name}'s {ticketDetail.occasion || ticketDetail.order?.occasion_name}
                  </h2>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    Order Ref: <strong>{ticketDetail.order_reference || ticketDetail.order?.order_reference}</strong> &bull; Status: <span className="badge badge-wip">{ticketDetail.status}</span>
                  </span>
                </div>
              </div>

              {/* Ceremonies Itinerary Accordion */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--burgundy-rich)' }}>
                  Customer Ceremonies &amp; Venue Requirements
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(ticketDetail.events || ticketDetail.order?.events || []).map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-champagne)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.88rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{ev.event_title}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>{ev.event_date} &bull; {ev.start_time}</span>
                      </div>
                      <div style={{ color: 'var(--text-body)', marginTop: '4px' }}>
                        📍 {ev.venue_name} &bull; {ev.venue_address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions & Unicode Notes */}
              {(ticketDetail.customer_requirements || ticketDetail.order?.special_instructions) && (
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '2rem' }}>
                  <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '0.35rem' }}>
                    Customer Special Instructions:
                  </strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', margin: 0, fontStyle: 'italic' }}>
                    "{ticketDetail.customer_requirements || ticketDetail.order?.special_instructions}"
                  </p>
                </div>
              )}

              {/* Design Studio: Upload Version / Protected Preview */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: 'var(--bg-card-subtle)', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--navy-deep)' }}>
                  Draft Preview Generator &amp; Watermarking
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Theme Primary Color</label>
                    <input
                      type="color"
                      className="form-control"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      style={{ height: '42px', padding: '4px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Accent Highlight Color</label>
                    <input
                      type="color"
                      className="form-control"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      style={{ height: '42px', padding: '4px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Preview Watermark Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary btn-sm" onClick={handleUploadDesign} disabled={loading}>
                  <Upload size={14} />
                  <span>Render &amp; Publish Next Design Version</span>
                </button>
              </div>

              {/* Version History */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  Design Version Changelog ({ticketDetail.design_versions?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ticketDetail.design_versions?.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.86rem',
                      }}
                    >
                      <div>
                        <strong>v{ver.version_number}</strong> &bull; Status: <span className="badge badge-assigned">{ver.status}</span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onOpenPreview(`/preview/${ver.preview_token}`)}
                      >
                        <Eye size={14} /> Preview
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  Internal Production Notes (Hidden from Customer)
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add internal production note..."
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                  />
                  <button className="btn btn-navy btn-sm" onClick={handleAddNote}>
                    <Send size={14} /> Add Note
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ticketDetail.internal_notes?.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-champagne)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <strong style={{ color: 'var(--navy-deep)' }}>{n.author_name}:</strong> {n.note_text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: VIDEO SPECIALIST MODULE
          ========================================================================= */}
      {activeTab === 'video' && canVideo && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.75rem', marginBottom: '2rem' }}>
            <span className="editorial-kicker">VIDEO PRODUCTION QUEUE</span>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '0.5rem' }}>
              Motion Graphics &amp; Video Production
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Specialist queue restricted to authorized video engineers. Process audio sync, animated photo overlays, and export 1080p MP4 deliverables.
            </p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task Ref</th>
                  <th>Occasion</th>
                  <th>Status</th>
                  <th>Assigned Specialist</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videoTasks.map((vt) => (
                  <tr key={vt.id}>
                    <td><strong>{vt.task_number || vt.id.slice(0, 8)}</strong></td>
                    <td>{vt.occasion || 'Celebration Video'}</td>
                    <td><span className="badge badge-wip">{vt.status}</span></td>
                    <td>{vt.specialist_name || 'Unassigned'}</td>
                    <td>
                      {!vt.specialist_name && (
                        <button className="btn btn-gold btn-sm" onClick={() => handleClaimVideo(vt.id)}>
                          Claim Video Task
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {videoTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No video tasks currently pending in the specialist queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
