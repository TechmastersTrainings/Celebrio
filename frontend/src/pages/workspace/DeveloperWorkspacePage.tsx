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
  ArrowLeft,
  ShieldCheck,
  Calendar,
  MapPin,
  Search,
  Check,
  ExternalLink,
  MessageSquare,
  Activity,
  Filter,
  Tag,
  ChevronRight,
  X,
  Phone,
  Mail,
  FolderOpen
} from 'lucide-react';

interface DeveloperWorkspacePageProps {
  currentUser: User;
  onOpenPreview: (previewUrl: string) => void;
}

const ITIL_STAGES = [
  { key: 'NEW_OPEN', label: '1. New / Open' },
  { key: 'ASSIGNED', label: '2. Assigned' },
  { key: 'WORK_IN_PROGRESS', label: '3. Work in Progress' },
  { key: 'AWAITING_CUSTOMER_RESPONSE', label: '4. Awaiting Customer' },
  { key: 'CLOSED', label: '5. Closed / Resolved' }
];

export const DeveloperWorkspacePage: React.FC<DeveloperWorkspacePageProps> = ({
  currentUser,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'queue' | 'awaiting' | 'closed' | 'video'>('assigned');
  const [availableTickets, setAvailableTickets] = useState<TicketSummary[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<TicketSummary[]>([]);
  const [videoTasks, setVideoTasks] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Design Studio State
  const [themeColor, setThemeColor] = useState('#6B1728');
  const [accentColor, setAccentColor] = useState('#B88E3E');
  const [watermark, setWatermark] = useState('TECHMASTERS PREVIEW - NOT FINAL');
  const [internalNoteText, setInternalNoteText] = useState('');

  // ITIL Closure Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureCode, setClosureCode] = useState('Fulfilled — Invitation Delivered & Live');
  const [closureNotes, setClosureNotes] = useState('');
  const [closureError, setClosureError] = useState<string | null>(null);

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
      setAvailableTickets(avail || []);
      setAssignedTickets(myTickets || []);

      if (canVideo) {
        const vTasks = await ApiService.getVideoTasks();
        setVideoTasks(vTasks || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh workspace data');
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
      setError(null);
      const detail: any = await ApiService.getTicketDetail(ticketId);
      setTicketDetail(detail);
      setSelectedTicketId(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  // FIFO Queue Claim
  const handleClaimFIFO = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.claimNextFIFOTicket();
      setActionMsg(res.message || 'Next FIFO ticket assigned to you successfully!');
      await loadData();
      if (res.ticket_id) {
        await loadTicketDetail(res.ticket_id);
        setActiveTab('assigned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim next FIFO ticket');
    } finally {
      setLoading(false);
    }
  };

  // Direct 1-Click Ticket Claim
  const handleClaimSpecific = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.claimSpecificTicket(ticketId);
      setActionMsg(res.message || 'Ticket assigned to you successfully!');
      await loadData();
      await loadTicketDetail(ticketId);
      setActiveTab('assigned');
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  // State Transitions (ITIL Agent Workflow)
  const handleStatusTransition = async (newStatus: string) => {
    if (!ticketDetail) return;
    if (newStatus === 'CLOSED') {
      setClosureNotes('');
      setClosureError(null);
      setShowCloseModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.updateTicketStatus(
        ticketDetail.id,
        newStatus,
        `Agent status transition to ${newStatus}`,
        `Incident state updated to ${newStatus} by ${currentUser.full_name}`
      );
      setActionMsg(`Ticket ${ticketDetail.ticket_number} moved to ${newStatus}.`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to transition state to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  };

  // ITIL Closure Confirm with Mandatory Work Notes
  const handleConfirmClosure = async () => {
    if (!ticketDetail) return;
    if (!closureNotes.trim()) {
      setClosureError('Resolution work notes are required by ITIL protocol before closing this ticket.');
      return;
    }

    try {
      setLoading(true);
      setClosureError(null);
      const workNoteCombined = `[RESOLUTION: ${closureCode}] ${closureNotes.trim()}`;
      await ApiService.updateTicketStatus(
        ticketDetail.id,
        'CLOSED',
        closureCode,
        workNoteCombined
      );
      setShowCloseModal(false);
      setActionMsg(`Ticket ${ticketDetail.ticket_number} successfully resolved and closed.`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setClosureError(err.message || 'Failed to close ticket');
    } finally {
      setLoading(false);
    }
  };

  // Design Upload
  const handleUploadDesign = async () => {
    if (!selectedTicketId) return;
    try {
      setLoading(true);
      const res: any = await ApiService.uploadDesignVersion(
        selectedTicketId,
        { theme_color: themeColor, accent_color: accentColor },
        watermark
      );
      setActionMsg(res.message || 'New design draft rendered and published.');
      await loadTicketDetail(selectedTicketId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload preview');
    } finally {
      setLoading(false);
    }
  };

  // Add ServiceNow Internal Work Note
  const handleAddWorkNote = async () => {
    if (!selectedTicketId || !internalNoteText.trim()) return;
    try {
      await ApiService.addInternalNote(selectedTicketId, internalNoteText.trim());
      setInternalNoteText('');
      setActionMsg('Internal work note logged in activity stream.');
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err.message || 'Failed to post internal work note');
    }
  };

  // Claim Video Task
  const handleClaimVideo = async (taskId: string) => {
    try {
      setLoading(true);
      const res: any = await ApiService.claimVideoTask(taskId);
      setActionMsg(res.message || 'Video task claimed successfully!');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to claim video task');
    } finally {
      setLoading(false);
    }
  };

  // Filter Helper
  const filterList = (items: TicketSummary[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (t) =>
        t.ticket_number?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q) ||
        (t.occasion_name || t.occasion || '').toLowerCase().includes(q) ||
        (t.order_reference || '').toLowerCase().includes(q)
    );
  };

  // Filtered Lists for Tabs
  const myActiveList = filterList(assignedTickets.filter((t) => t.status !== 'CLOSED'));
  const awaitingCustomerList = filterList(assignedTickets.filter((t) => t.status === 'AWAITING_CUSTOMER_RESPONSE'));
  const closedList = filterList(assignedTickets.filter((t) => t.status === 'CLOSED'));
  const queueList = filterList(availableTickets);

  if (!isApproved) {
    return (
      <div style={{ maxWidth: '680px', margin: '4rem auto', padding: '0 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <span className="editorial-kicker">DEVELOPER ACCESS &bull; PENDING APPROVAL</span>
          <h2 style={{ fontSize: '1.9rem', color: 'var(--navy-deep)', marginBottom: '0.75rem' }}>
            Your Account is Pending Administrator Approval
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '2rem' }}>
            Your developer profile has been registered and is under review by a TechMasters Administrator. Access to customer celebration orders will activate once your account is approved.
          </p>
          <div style={{ background: 'var(--bg-champagne)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: '0.88rem' }}>
            Profile Status: <span className="badge badge-assigned">{currentUser.developer_profile?.approval_status || 'PENDING_APPROVAL'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine stage index for ServiceNow Process Stepper
  const getStageIndex = (statusStr: string) => {
    switch (statusStr) {
      case 'NEW_OPEN':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'WORK_IN_PROGRESS':
        return 2;
      case 'AWAITING_CUSTOMER_RESPONSE':
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_DONE':
        return 3;
      case 'CLOSED':
        return 4;
      default:
        return 2;
    }
  };

  const isAssignedToMe = ticketDetail?.assigned_developer === currentUser.id ||
    ticketDetail?.assigned_developer_name === currentUser.full_name;

  return (
    <div style={{ maxWidth: '1280px', margin: '2.5rem auto 5rem', padding: '0 1.5rem' }}>
      {/* Developer Workspace Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B1B3D 0%, #152A56 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(11, 27, 61, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E5C07B', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
            TECHMASTERS DIGITAL SERVICES &bull; DEVELOPER WORKSPACE
          </span>
          <h1 style={{ fontSize: '1.85rem', margin: 0, color: '#FFFFFF', fontWeight: 600 }}>
            TechMasters Creative Developer Workspace
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Welcome, <strong>{currentUser.full_name}</strong> &bull; Manage your assigned celebration orders below
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 1rem',
              fontSize: '0.86rem',
              color: '#FFFFFF'
            }}
          >
            Active Orders: <strong>{assignedTickets.filter(t => t.status !== 'CLOSED').length} / {currentUser.developer_profile?.max_active_tickets || 3}</strong>
          </div>
          <button
            className="btn btn-sm"
            onClick={loadData}
            style={{ background: '#FFFFFF', color: '#0B1B3D', border: 'none', fontWeight: 600 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Success Notification */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span style={{ fontSize: '0.92rem' }}>{actionMsg}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 'bold' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Alert */}
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
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.92rem' }}>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: TICKET DETAIL & SERVICENOW FORM (When a ticket is selected)
          ========================================================================= */}
      {selectedTicketId && ticketDetail ? (
        <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
          {/* ServiceNow Header & Action Ribbon */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.75rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedTicketId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={14} /> Back to Incidents Queue
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--burgundy-rich)' }}>
                      {ticketDetail.ticket_number}
                    </span>
                    <span className={`badge ${
                      ticketDetail.priority === 'URGENT' ? 'badge-new' : 'badge-assigned'
                    }`}>
                      {ticketDetail.priority || 'NORMAL'} PRIORITY
                    </span>
                    <span className="badge badge-wip">
                      STATE: {ticketDetail.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Order Ref: <strong>{ticketDetail.order_reference || ticketDetail.order?.order_reference}</strong> &bull; Created: {new Date(ticketDetail.eligible_at || ticketDetail.order?.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* ServiceNow ITIL Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {/* 1-Click Self Assignment */}
                {(!ticketDetail.assigned_developer || !isAssignedToMe) && (
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => handleClaimSpecific(ticketDetail.id)}
                    disabled={loading}
                  >
                    <UserIcon size={14} /> Assign to Me
                  </button>
                )}

                {/* State Transitions for Assigned Agent / Admin */}
                {ticketDetail.status !== 'WORK_IN_PROGRESS' && ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-navy btn-sm"
                    onClick={() => handleStatusTransition('WORK_IN_PROGRESS')}
                    disabled={loading}
                    title="Move status to Work in Progress"
                  >
                    ▶ Start Work (WIP)
                  </button>
                )}

                {ticketDetail.status !== 'AWAITING_CUSTOMER_RESPONSE' && ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleStatusTransition('AWAITING_CUSTOMER_RESPONSE')}
                    disabled={loading}
                    title="Send preview to customer and set awaiting response"
                  >
                    💬 Awaiting Customer
                  </button>
                )}

                {ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStatusTransition('CLOSED')}
                    disabled={loading}
                    title="Resolve & Close this ticket (requires mandatory work notes)"
                    style={{ background: '#166534', borderColor: '#166534' }}
                  >
                    <CheckCircle2 size={14} /> Resolve &amp; Close Ticket
                  </button>
                )}

                {/* Live Preview Button */}
                {ticketDetail.design_versions && ticketDetail.design_versions.length > 0 && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onOpenPreview(`/preview/${ticketDetail.design_versions[0].preview_token}`)}
                  >
                    <Eye size={14} /> View Latest Preview
                  </button>
                )}
              </div>
            </div>

            {/* ServiceNow Process Chevron Bar (ITIL Stages) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.35rem',
                background: 'var(--bg-champagne)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {ITIL_STAGES.map((stg, idx) => {
                const currentStageIdx = getStageIndex(ticketDetail.status);
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div
                    key={stg.key}
                    style={{
                      padding: '0.6rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      fontWeight: isCurrent ? 700 : 500,
                      borderRadius: 'var(--radius-xs)',
                      background: isCurrent ? '#0B1B3D' : isPassed ? '#E2F0D9' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : isPassed ? '#276749' : 'var(--text-muted)',
                      border: isCurrent ? '1px solid #0B1B3D' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isPassed && <Check size={12} />}
                    {isCurrent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E5C07B', display: 'inline-block' }} />}
                    <span>{stg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ServiceNow Two-Column Form Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* LEFT COLUMN: Specification, Ceremonies, Customer Requirements & Studio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Card 1: Incident Specifications & Caller Data */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--burgundy-rich)" />
                    Incident Specification &amp; Customer Order
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Assigned Agent: <strong>{ticketDetail.assigned_developer_name || 'Unassigned'}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>
                      Caller / Host Name
                    </label>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {ticketDetail.customer_name || ticketDetail.order?.customer_name}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>
                      Celebration Occasion
                    </label>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--burgundy-rich)' }}>
                      {ticketDetail.occasion || ticketDetail.order?.occasion_name}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>
                      Contact Mobile &amp; Email
                    </label>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} color="var(--text-muted)" /> {ticketDetail.order?.customer_mobile || 'Not provided'}
                      </span>
                      {ticketDetail.order?.customer_email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                          <Mail size={13} color="var(--text-muted)" /> {ticketDetail.order.customer_email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>
                      Package Tier &amp; Language
                    </label>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>
                      <strong>{ticketDetail.order?.package_name || 'Standard Package'}</strong> &bull; {ticketDetail.order?.selected_language || 'English'}
                    </div>
                  </div>
                </div>

                {/* Captured Special Instructions (As-Is) */}
                {(ticketDetail.customer_requirements || ticketDetail.order?.special_instructions) && (
                  <div style={{ background: '#FFFDF9', border: '1px solid #F3EBDD', borderLeft: '4px solid var(--gold-accent)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      Captured Customer Instructions (As-Is)
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      "{ticketDetail.customer_requirements || ticketDetail.order?.special_instructions}"
                    </p>
                  </div>
                )}
              </div>

              {/* Card 2: Ceremony Schedule & Venues (Captured As-Is) */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-deep)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--burgundy-rich)" />
                  Ceremony Itinerary &amp; Venue Locations
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(ticketDetail.events || ticketDetail.order?.events || []).map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-champagne)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.15rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--navy-deep)' }}>
                          {ev.event_title}
                        </strong>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--burgundy-rich)', background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          {ev.event_date} &bull; {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="var(--gold-accent)" />
                        <strong>{ev.venue_name}</strong> &bull; {ev.venue_address}
                      </div>
                      {ev.google_maps_url && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
                          <a href={ev.google_maps_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--burgundy-rich)', textDecoration: 'underline' }}>
                            Open in Google Maps &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!ticketDetail.events || ticketDetail.events.length === 0) &&
                   (!ticketDetail.order?.events || ticketDetail.order.events.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      No specific ceremony sub-events attached to this order.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Artisan Studio Version Generator */}
              <div className="card" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-deep)', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--burgundy-rich)" />
                  Design Studio &amp; Protected Draft Generator
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Adjust artisan palette styling, set preview watermark, and render next draft revision for client review.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>Primary Theme Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        style={{ width: '42px', height: '38px', padding: 0, border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        style={{ height: '38px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>Accent Highlight Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        style={{ width: '42px', height: '38px', padding: 0, border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        style={{ height: '38px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Draft Watermark String</label>
                  <input
                    type="text"
                    className="form-control"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    style={{ height: '38px', fontSize: '0.88rem' }}
                  />
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUploadDesign}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Upload size={14} /> Render &amp; Publish Next Design Version
                </button>

                {/* Version History Table */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '0.65rem' }}>
                    Rendered Design Versions ({ticketDetail.design_versions?.length || 0})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ticketDetail.design_versions?.map((ver) => (
                      <div
                        key={ver.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-champagne)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.86rem'
                        }}
                      >
                        <div>
                          <strong>v{ver.version_number}</strong> &bull; Status: <span className="badge badge-assigned">{ver.status}</span> &bull; <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(ver.created_at).toLocaleString()}</span>
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onOpenPreview(`/preview/${ver.preview_token}`)}
                        >
                          <Eye size={13} /> Open Preview
                        </button>
                      </div>
                    ))}
                    {(!ticketDetail.design_versions || ticketDetail.design_versions.length === 0) && (
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        No versions rendered yet. Click above to generate initial draft.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ServiceNow Work Notes & Activity Stream Journal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* ServiceNow Work Notes (Yellow Box) */}
              <div
                style={{
                  background: '#FFFDE7',
                  border: '1px solid #FFE082',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <Lock size={15} color="#B78103" />
                  <strong style={{ fontSize: '0.92rem', color: '#7A5200' }}>
                    Work Notes (Private / Engineering Team Only)
                  </strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#8D6E12', margin: '0 0 0.85rem' }}>
                  Internal ITIL audit notes. Hidden from customer. Document revisions, communications, or blockers.
                </p>

                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Enter internal production work notes..."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #FFE082',
                    fontSize: '0.88rem',
                    marginBottom: '0.75rem',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-sm"
                    onClick={handleAddWorkNote}
                    disabled={loading || !internalNoteText.trim()}
                    style={{
                      background: '#B88E3E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Send size={13} /> Post Work Note
                  </button>
                </div>
              </div>

              {/* ServiceNow Combined Activity Stream Journal */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--navy-deep)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={16} color="var(--burgundy-rich)" />
                  Incident Activity Stream &amp; Audit History
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Status History Events */}
                  {(ticketDetail.status_history || []).map((sh: any, idx: number) => (
                    <div
                      key={`sh-${idx}`}
                      style={{
                        padding: '0.85rem 1rem',
                        background: '#FAF7F2',
                        borderLeft: '3px solid var(--navy-deep)',
                        borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy-deep)' }}>
                          Status changed to <span className="badge badge-assigned">{sh.new_status}</span>
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {new Date(sh.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-body)', marginTop: '2px' }}>
                        {sh.transition_reason || 'State transition'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        By: {sh.changed_by_name || 'System / Agent'}
                      </div>
                    </div>
                  ))}

                  {/* Internal Work Notes */}
                  {(ticketDetail.internal_notes || []).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.85rem 1rem',
                        background: '#FFFDE7',
                        borderLeft: '3px solid #F59E0B',
                        borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <strong style={{ color: '#7A5200' }}>
                          Work Note &bull; {n.author_name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#8D6E12' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#451A03', whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                        {n.note_text}
                      </div>
                    </div>
                  ))}

                  {(!ticketDetail.status_history || ticketDetail.status_history.length === 0) &&
                   (!ticketDetail.internal_notes || ticketDetail.internal_notes.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No prior activity entries recorded for this ticket.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: SERVICENOW INCIDENTS LIST VIEW & QUEUES
            ========================================================================= */
        <div>
          {/* Navigation Tabs (ServiceNow Queues) */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              borderBottom: '2px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              overflowX: 'auto'
            }}
          >
            <button
              className={`btn btn-sm ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.65rem 1.25rem' }}
              onClick={() => setActiveTab('assigned')}
            >
              Assigned to Me ({assignedTickets.filter(t => t.status !== 'CLOSED').length})
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.65rem 1.25rem' }}
              onClick={() => setActiveTab('queue')}
            >
              Open Queue &bull; FIFO Self-Claim ({availableTickets.length})
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'awaiting' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.65rem 1.25rem' }}
              onClick={() => setActiveTab('awaiting')}
            >
              Awaiting Customer ({assignedTickets.filter(t => t.status === 'AWAITING_CUSTOMER_RESPONSE').length})
            </button>

            <button
              className={`btn btn-sm ${activeTab === 'closed' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.65rem 1.25rem' }}
              onClick={() => setActiveTab('closed')}
            >
              Closed / Resolved ({assignedTickets.filter(t => t.status === 'CLOSED').length})
            </button>

            {canVideo && (
              <button
                className={`btn btn-sm ${activeTab === 'video' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '0.65rem 1.25rem' }}
                onClick={() => setActiveTab('video')}
              >
                <Video size={14} /> Video Specialist Tasks ({videoTasks.length})
              </button>
            )}
          </div>

          {/* Search & Actions Ribbon */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ position: 'relative', width: '340px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search ticket ref, customer, occasion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', height: '38px', fontSize: '0.86rem' }}
              />
            </div>

            {/* FIFO Claim Action Button */}
            {activeTab === 'queue' && (
              <button
                className="btn btn-gold btn-sm"
                onClick={handleClaimFIFO}
                disabled={loading || assignedTickets.filter(t => t.status !== 'CLOSED').length >= (currentUser.developer_profile?.max_active_tickets || 3)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Sparkles size={15} /> Claim Oldest Ticket (FIFO Locking)
              </button>
            )}
          </div>

          {/* Incidents Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Incident Ref</th>
                  <th>Customer / Caller</th>
                  <th>Occasion</th>
                  <th>Package Tier</th>
                  <th>State</th>
                  <th>Priority</th>
                  <th>Assigned Artisan</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* TAB 1: Assigned to Me */}
                {activeTab === 'assigned' && myActiveList.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                        {t.ticket_number}
                      </strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t.order_reference}</div>
                    </td>
                    <td>
                      <strong>{t.customer_name}</strong>
                    </td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.package_name || 'Standard'}</td>
                    <td>
                      <span className={`badge ${t.status === 'WORK_IN_PROGRESS' ? 'badge-wip' : 'badge-assigned'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority === 'URGENT' ? 'badge-new' : 'badge-assigned'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <strong>{currentUser.full_name}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-navy btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTicketDetail(t.id);
                        }}
                      >
                        Open Ticket &rarr;
                      </button>
                    </td>
                  </tr>
                ))}

                {/* TAB 2: Available Queue (Unassigned) */}
                {activeTab === 'queue' && queueList.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                        {t.ticket_number}
                      </strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t.order_reference}</div>
                    </td>
                    <td>
                      <strong>{t.customer_name}</strong>
                    </td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.package_name || 'Standard'}</td>
                    <td>
                      <span className="badge badge-new">{t.status}</span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority === 'URGENT' ? 'badge-new' : 'badge-assigned'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned (In Queue)</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-gold btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimSpecific(t.id);
                          }}
                          disabled={loading || assignedTickets.filter(x => x.status !== 'CLOSED').length >= (currentUser.developer_profile?.max_active_tickets || 3)}
                        >
                          <UserIcon size={12} /> Assign to Me
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadTicketDetail(t.id);
                          }}
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* TAB 3: Awaiting Customer */}
                {activeTab === 'awaiting' && awaitingCustomerList.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                        {t.ticket_number}
                      </strong>
                    </td>
                    <td>{t.customer_name}</td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.package_name || 'Standard'}</td>
                    <td>
                      <span className="badge badge-wip">AWAITING_CUSTOMER_RESPONSE</span>
                    </td>
                    <td>{t.priority}</td>
                    <td>{currentUser.full_name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTicketDetail(t.id);
                        }}
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}

                {/* TAB 4: Closed / Resolved */}
                {activeTab === 'closed' && closedList.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                        {t.ticket_number}
                      </strong>
                    </td>
                    <td>{t.customer_name}</td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.package_name || 'Standard'}</td>
                    <td>
                      <span className="badge badge-published">CLOSED / DELIVERED</span>
                    </td>
                    <td>{t.priority}</td>
                    <td>{currentUser.full_name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTicketDetail(t.id);
                        }}
                      >
                        Review Notes
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty State Rows */}
                {activeTab === 'assigned' && myActiveList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                      You have no active production tickets assigned right now. Claim a ticket from the Open Queue to begin work!
                    </td>
                  </tr>
                )}
                {activeTab === 'queue' && queueList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                      No unassigned celebration orders currently in the Open Queue. All orders are assigned!
                    </td>
                  </tr>
                )}
                {activeTab === 'awaiting' && awaitingCustomerList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                      No tickets currently awaiting customer review.
                    </td>
                  </tr>
                )}
                {activeTab === 'closed' && closedList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                      No closed tickets recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TAB 5: Video Specialist Module */}
          {activeTab === 'video' && canVideo && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <span className="editorial-kicker">VIDEO PRODUCTION QUEUE</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-deep)', marginBottom: '0.4rem' }}>
                  Motion Graphics &amp; Video Specialist Render Tasks
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  Specialist queue restricted to authorized video engineers. Process audio tracks, animated photo overlays, and export 1080p MP4 deliverables.
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
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoTasks.map((vt) => (
                      <tr key={vt.id}>
                        <td><strong>{vt.task_number || vt.id.slice(0, 8)}</strong></td>
                        <td>{vt.occasion || 'Celebration Video'}</td>
                        <td><span className="badge badge-wip">{vt.status}</span></td>
                        <td>{vt.specialist_name || 'Unassigned'}</td>
                        <td style={{ textAlign: 'right' }}>
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
      )}

      {/* =========================================================================
          ITIL RESOLUTION & CLOSURE MODAL (Mandatory Work Notes)
          ========================================================================= */}
      {showCloseModal && ticketDetail && (
        <div className="modal-backdrop" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#166534" />
                  Resolve &amp; Close Incident (ITIL Compliance)
                </h3>
                <button
                  onClick={() => setShowCloseModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Incident: <strong>{ticketDetail.ticket_number}</strong> &bull; Caller: <strong>{ticketDetail.customer_name || ticketDetail.order?.customer_name}</strong>
              </p>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {closureError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertCircle size={15} />
                  <span>{closureError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  ITIL Resolution Code
                </label>
                <select
                  className="form-control"
                  value={closureCode}
                  onChange={(e) => setClosureCode(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                >
                  <option value="Fulfilled — Invitation Delivered & Live">Fulfilled — Invitation Delivered &amp; Live</option>
                  <option value="Customer Approved & Accepted">Customer Approved &amp; Accepted</option>
                  <option value="Delivered with Custom Adjustments">Delivered with Custom Adjustments</option>
                  <option value="Cancelled by Customer Request">Cancelled by Customer Request</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resolution Work Notes (Mandatory)</span>
                  <span style={{ color: 'var(--color-danger)', fontSize: '0.78rem' }}>* Required by ITIL Protocol</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Document specific deliverables provided, links shared, and customer sign-off details..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  style={{ fontSize: '0.88rem', resize: 'vertical' }}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  These notes will be permanently archived in the ServiceNow internal audit log and order record.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirmClosure}
                  disabled={loading || !closureNotes.trim()}
                  style={{ background: '#166534', borderColor: '#166534' }}
                >
                  Confirm &amp; Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
