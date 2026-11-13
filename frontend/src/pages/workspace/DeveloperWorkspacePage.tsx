import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ApiService } from '../../services/api';
import { VenueDetailsCard } from '../../components/venue/VenueDetailsCard';
import { TicketSummary, TicketDetail, User, CustomerAsset } from '../../types';
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
  ChevronDown,
  ChevronUp,
  X,
  Phone,
  Mail,
  FolderOpen,
  Download,
  Inbox,
  Code,
  Image as ImageIcon,
  Music,
  Film,
  FileCheck,
  Save,
  Globe,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  BarChart3,
  CreditCard
} from 'lucide-react';

interface DeveloperWorkspacePageProps {
  currentUser: User;
  onOpenPreview: (previewUrl: string) => void;
}

const ORDER_STAGES = [
  { key: 'NEW_OPEN', label: '1. New Order' },
  { key: 'ASSIGNED', label: '2. Assigned' },
  { key: 'WORK_IN_PROGRESS', label: '3. In Production' },
  { key: 'AWAITING_CUSTOMER_RESPONSE', label: '4. Awaiting Customer' },
  { key: 'CLOSED', label: '5. Delivered & Live' }
];

const ON_HOLD_REASONS = [
  'Customer Clarification Required',
  'Awaiting High-Resolution Photos / Media',
  'Payment Verification Pending',
  'Special Customization Engineering Review',
  'Customer Requested Event Reschedule / Delay',
  'Other Operational Hold'
];

export const DeveloperWorkspacePage: React.FC<DeveloperWorkspacePageProps> = ({
  currentUser,
  onOpenPreview,
}) => {
  // Navigation / Queue State
  const [activeQueue, setActiveQueue] = useState<
    'all' | 'assigned' | 'queue' | 'wip' | 'on_hold' | 'awaiting' | 'closed' | 'video'
  >('assigned');

  // Ticket Data Collections
  const [availableTickets, setAvailableTickets] = useState<TicketSummary[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<TicketSummary[]>([]);
  const [closedTickets, setClosedTickets] = useState<TicketSummary[]>([]);
  const [videoTasks, setVideoTasks] = useState<any[]>([]);

  // Selected Record View State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [recordTab, setRecordTab] = useState<
    'overview' | 'wording' | 'studio' | 'attachments' | 'notes' | 'revisions' | 'deliverables'
  >('overview');

  // Operational Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Table Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [occasionFilter, setOccasionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'created_at' | 'ticket_number' | 'event_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Record Form Editable Workflow Fields
  const [formStatus, setFormStatus] = useState<string>('');
  const [formPriority, setFormPriority] = useState<string>('');
  const [formIsOnHold, setFormIsOnHold] = useState<boolean>(false);
  const [formHoldReason, setFormHoldReason] = useState<string>('');

  // Dual Activity Inputs
  const [customerUpdateText, setCustomerUpdateText] = useState('');
  const [internalWorkNoteText, setInternalWorkNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);

  // Attachment Management & Preview Lightbox
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'audio' | 'video' | 'pdf' | 'doc';
    url: string;
    title: string;
    category?: string;
    assetId?: string;
    fileSize?: string;
  } | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<boolean>(false);
  const [assetCategory, setAssetCategory] = useState<string>('COUPLE_PHOTO');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Design Studio State
  const [themeColor, setThemeColor] = useState('#6B1728');
  const [accentColor, setAccentColor] = useState('#B88E3E');
  const [watermark, setWatermark] = useState('TECHMASTERS PREVIEW - NOT FINAL');

  // Operational Modals
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [modalHoldReason, setModalHoldReason] = useState(ON_HOLD_REASONS[0]);
  const [modalHoldNotes, setModalHoldNotes] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureCode, setClosureCode] = useState('Fulfilled — Invitation Delivered & Live');
  const [closureNotes, setClosureNotes] = useState('');
  const [closureError, setClosureError] = useState<string | null>(null);

  const isApproved = currentUser.is_approved_developer;
  const canVideo = currentUser.can_produce_video;

  // Initial Data Fetch
  const loadData = async () => {
    if (!isApproved) return;
    try {
      setLoading(true);
      setError(null);
      const [avail, myTickets, closedAll] = await Promise.all([
        ApiService.getAvailableTickets().catch(() => []),
        ApiService.getAssignedTickets().catch(() => []),
        ApiService.getClosedTickets().catch(() => []),
      ]);
      setAvailableTickets(avail || []);
      setAssignedTickets(myTickets || []);
      setClosedTickets(closedAll || []);

      if (canVideo) {
        const vTasks = await ApiService.getVideoTasks().catch(() => []);
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

  // Load Individual Record
  const loadTicketDetail = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      const detail: any = await ApiService.getTicketDetail(ticketId);
      setTicketDetail(detail);
      setSelectedTicketId(ticketId);

      // Populate controlled dropdown fields
      setFormStatus(detail.status || 'NEW_OPEN');
      setFormPriority(detail.priority || 'NORMAL');
      setFormIsOnHold(Boolean(detail.is_on_hold));
      setFormHoldReason(detail.hold_reason || '');

      // Load studio defaults if existing
      if (detail.design_versions && detail.design_versions.length > 0) {
        const latest = detail.design_versions[0];
        if (latest.web_preview_payload?.theme_color) setThemeColor(latest.web_preview_payload.theme_color);
        if (latest.web_preview_payload?.accent_color) setAccentColor(latest.web_preview_payload.accent_color);
        if (latest.watermark_text) setWatermark(latest.watermark_text);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket record');
    } finally {
      setLoading(false);
    }
  };

  // Claim Order (Assign to Me)
  const handleClaimSpecific = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.claimSpecificTicket(ticketId);
      setActionMsg(res.message || 'Order assigned to your queue successfully.');
      await loadData();
      await loadTicketDetail(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to assign order');
    } finally {
      setLoading(false);
    }
  };

  // Claim Next Available Order
  const handleClaimNextOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.claimNextFIFOTicket();
      setActionMsg(res.message || 'Next order claimed successfully.');
      await loadData();
      if (res.ticket_id) {
        await loadTicketDetail(res.ticket_id);
        setActiveQueue('assigned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim next order');
    } finally {
      setLoading(false);
    }
  };

  // Save / Update Record Form
  const handleSaveRecord = async () => {
    if (!ticketDetail) return;
    try {
      setSavingRecord(true);
      setError(null);
      await ApiService.updateTicketDetails(ticketDetail.id, {
        status: formStatus,
        priority: formPriority,
        is_on_hold: formIsOnHold,
        hold_reason: formIsOnHold ? formHoldReason : '',
        work_notes: `Record updated via ServiceNow Form: Status=${formStatus}, Priority=${formPriority}, OnHold=${formIsOnHold}`,
      });
      setActionMsg(`Record ${ticketDetail.ticket_number} updated successfully.`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket record');
    } finally {
      setSavingRecord(false);
    }
  };

  // State Transition Quick Action
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
      await ApiService.updateTicketStatus(
        ticketDetail.id,
        newStatus,
        `Workflow state transition to ${newStatus}`,
        `Incident state transitioned to ${newStatus} by ${currentUser.full_name}`
      );
      setActionMsg(`Order ${ticketDetail.ticket_number} transitioned to ${newStatus}.`);
      setFormStatus(newStatus);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to transition state to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  };

  // Put Order On Hold
  const handleConfirmOnHold = async () => {
    if (!ticketDetail) return;
    if (!modalHoldNotes.trim()) {
      setError('A work note explaining the hold reason is required.');
      return;
    }

    try {
      setLoading(true);
      await ApiService.updateTicketDetails(ticketDetail.id, {
        is_on_hold: true,
        hold_reason: modalHoldReason,
        work_notes: `[ON HOLD: ${modalHoldReason}] ${modalHoldNotes.trim()}`,
      });
      setShowHoldModal(false);
      setModalHoldNotes('');
      setActionMsg(`Order ${ticketDetail.ticket_number} placed On Hold (${modalHoldReason}).`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to place order on hold');
    } finally {
      setLoading(false);
    }
  };

  // Resume Work from On Hold
  const handleResumeWork = async () => {
    if (!ticketDetail) return;
    try {
      setLoading(true);
      await ApiService.updateTicketDetails(ticketDetail.id, {
        is_on_hold: false,
        hold_reason: '',
        status: 'WORK_IN_PROGRESS',
        work_notes: `Order resumed from hold by ${currentUser.full_name}. Status set to WORK_IN_PROGRESS.`,
      });
      setActionMsg(`Order ${ticketDetail.ticket_number} resumed into Work in Progress.`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to resume order');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Closure
  const handleConfirmClosure = async () => {
    if (!ticketDetail) return;
    if (!closureNotes.trim()) {
      setClosureError('Resolution work notes are mandatory before closing this record.');
      return;
    }

    try {
      setLoading(true);
      setClosureError(null);
      await ApiService.updateTicketStatus(
        ticketDetail.id,
        'CLOSED',
        closureCode,
        `[RESOLUTION: ${closureCode}] ${closureNotes.trim()}`
      );
      setShowCloseModal(false);
      setActionMsg(`Order ${ticketDetail.ticket_number} marked as Delivered & Resolved.`);
      await loadTicketDetail(ticketDetail.id);
      await loadData();
    } catch (err: any) {
      setClosureError(err.message || 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  // Post Customer Update (Visible to Customer)
  const handlePostCustomerUpdate = async () => {
    if (!selectedTicketId || !customerUpdateText.trim()) return;
    try {
      setPostingNote(true);
      await ApiService.addInternalNote(selectedTicketId, customerUpdateText.trim(), 'CUSTOMER_UPDATE');
      setCustomerUpdateText('');
      setActionMsg('Customer Update logged and made available in customer tracking.');
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err.message || 'Failed to post customer update');
    } finally {
      setPostingNote(false);
    }
  };

  // Post Work Note (Private / Internal Only)
  const handlePostWorkNote = async () => {
    if (!selectedTicketId || !internalWorkNoteText.trim()) return;
    try {
      setPostingNote(true);
      await ApiService.addInternalNote(selectedTicketId, internalWorkNoteText.trim(), 'WORK_NOTE');
      setInternalWorkNoteText('');
      setActionMsg('Internal Work Note posted to private audit trail.');
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err.message || 'Failed to post internal work note');
    } finally {
      setPostingNote(false);
    }
  };

  // Upload Additional Asset
  const handleUploadAssetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ticketDetail?.order?.order_reference || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingAsset(true);
      await ApiService.uploadOrderAsset(ticketDetail.order.order_reference, file, assetCategory);
      setActionMsg(`File "${file.name}" uploaded successfully.`);
      await loadTicketDetail(ticketDetail.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setUploadingAsset(false);
      e.target.value = '';
    }
  };

  // Direct Authenticated Asset Download
  const handleDownloadAsset = async (asset: CustomerAsset) => {
    try {
      setActionMsg(`Downloading ${asset.file_name}...`);
      await ApiService.downloadAssetFile(asset.id, asset.file_name);
      setActionMsg(`Downloaded "${asset.file_name}" successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to download asset');
    }
  };

  // Open In-App Inspection Preview
  const handleInspectAsset = (asset: CustomerAsset) => {
    const ext = (asset.extension || asset.file_name.split('.').pop() || '').toLowerCase();
    const mediaUrl = ApiService.getMediaUrl(asset.file_key || asset.url || '');
    const previewUrl = ApiService.getAssetPreviewUrl(asset.id);

    let mediaType: 'image' | 'audio' | 'video' | 'pdf' | 'doc' = 'doc';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || asset.file_type?.startsWith('image/')) {
      mediaType = 'image';
    } else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext) || asset.file_type?.startsWith('audio/')) {
      mediaType = 'audio';
    } else if (['mp4', 'mov', 'webm'].includes(ext) || asset.file_type?.startsWith('video/')) {
      mediaType = 'video';
    } else if (ext === 'pdf' || asset.file_type === 'application/pdf') {
      mediaType = 'pdf';
    }

    setPreviewMedia({
      type: mediaType,
      url: mediaUrl || previewUrl,
      title: asset.file_name,
      category: asset.asset_category,
      assetId: asset.id,
      fileSize: asset.readable_size || (asset.file_size_bytes ? `${(asset.file_size_bytes / 1024).toFixed(1)} KB` : 'N/A'),
    });
  };

  // Design Version Rendering
  const handleRenderDesignVersion = async () => {
    if (!selectedTicketId) return;
    try {
      setLoading(true);
      const res: any = await ApiService.uploadDesignVersion(
        selectedTicketId,
        { theme_color: themeColor, accent_color: accentColor },
        watermark
      );
      setActionMsg(res.message || 'New design draft rendered and published for preview.');
      await loadTicketDetail(selectedTicketId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to render design draft');
    } finally {
      setLoading(false);
    }
  };

  // Consolidate Unique Accessible Tickets
  const allTicketsMap = useMemo(() => {
    const map = new Map<string, TicketSummary>();
    assignedTickets.forEach((t) => map.set(t.id, t));
    availableTickets.forEach((t) => map.set(t.id, t));
    closedTickets.forEach((t) => map.set(t.id, t));
    return map;
  }, [assignedTickets, availableTickets, closedTickets]);

  const allAccessibleList = useMemo(() => Array.from(allTicketsMap.values()), [allTicketsMap]);

  // Filter By Selected Queue
  const queueFilteredTickets = useMemo(() => {
    switch (activeQueue) {
      case 'assigned':
        return assignedTickets.filter((t) => t.status !== 'CLOSED');
      case 'queue':
        return availableTickets;
      case 'wip':
        return allAccessibleList.filter((t) => t.status === 'WORK_IN_PROGRESS');
      case 'on_hold':
        return allAccessibleList.filter((t) => t.is_on_hold || t.status === 'ON_HOLD');
      case 'awaiting':
        return allAccessibleList.filter((t) => t.status === 'AWAITING_CUSTOMER_RESPONSE');
      case 'closed':
        return allAccessibleList.filter((t) => t.status === 'CLOSED');
      case 'all':
      default:
        return allAccessibleList;
    }
  }, [activeQueue, assignedTickets, availableTickets, allAccessibleList]);

  // Search & Column Filters
  const displayedTickets = useMemo(() => {
    let list = queueFilteredTickets;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.ticket_number?.toLowerCase().includes(q) ||
          t.order_reference?.toLowerCase().includes(q) ||
          t.customer_name?.toLowerCase().includes(q) ||
          t.customer_mobile?.includes(q) ||
          (t.occasion_name || t.occasion || '').toLowerCase().includes(q) ||
          t.short_description?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Occasion filter
    if (occasionFilter !== 'ALL') {
      list = list.filter((t) => (t.occasion_slug || t.occasion) === occasionFilter);
    }

    // Sorting
    list = [...list].sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';
      if (sortBy === 'created_at' || sortBy === 'event_date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [queueFilteredTickets, searchQuery, statusFilter, priorityFilter, occasionFilter, sortBy, sortOrder]);

  // Pagination Slice
  const totalRecords = displayedTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedTickets.slice(start, start + pageSize);
  }, [displayedTickets, currentPage, pageSize]);

  // Distinct Occasions for Filter Dropdown
  const occasionOptions = useMemo(() => {
    const set = new Set<string>();
    allAccessibleList.forEach((t) => {
      const occ = t.occasion_name || t.occasion;
      if (occ) set.add(occ);
    });
    return Array.from(set);
  }, [allAccessibleList]);

  // Stepper helper
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

  const isAssignedToMe =
    ticketDetail?.assigned_developer === currentUser.id ||
    ticketDetail?.assigned_developer_name === currentUser.full_name;

  if (!isApproved) {
    return (
      <div style={{ maxWidth: '680px', margin: '4rem auto', padding: '0 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <span className="editorial-kicker">DEVELOPER ACCESS &bull; PENDING APPROVAL</span>
          <h2 style={{ fontSize: '1.9rem', color: 'var(--navy-deep)', marginBottom: '0.75rem' }}>
            Account Pending Administrator Approval
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '2rem' }}>
            Your developer profile has been registered and is under review by TechMasters System Administration.
            Access to celebration orders will activate immediately once approved.
          </p>
          <div
            style={{
              background: 'var(--bg-champagne)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              fontSize: '0.88rem',
            }}
          >
            Profile Status:{' '}
            <span className="badge badge-assigned">
              {currentUser.developer_profile?.approval_status || 'PENDING_APPROVAL'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-console-wrapper">
      {/* =========================================================================
          LEFT NAVIGATION SIDEBAR (Operational Workspace Queues)
          ========================================================================= */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-badge">
            <Code size={13} style={{ color: 'var(--gold-soft)' }} />
            <span>CREATIVE DEVELOPER</span>
          </div>
          <h2 className="admin-sidebar-title">Service Operations</h2>
          <span className="admin-sidebar-user">{currentUser.email || currentUser.full_name}</span>
        </div>

        {/* Workspace Queue Menus */}
        <nav className="admin-sidebar-nav">
          <button
            className={`admin-nav-item ${activeQueue === 'assigned' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('assigned');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><Layers size={16} /></div>
            <span className="admin-nav-label">My Orders</span>
            <span className="admin-nav-badge">
              {assignedTickets.filter((t) => t.status !== 'CLOSED').length}
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'queue' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('queue');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><Inbox size={16} /></div>
            <span className="admin-nav-label">Open Queue</span>
            <span className="admin-nav-badge">{availableTickets.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'all' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('all');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><FolderOpen size={16} /></div>
            <span className="admin-nav-label">All Accessible Orders</span>
            <span className="admin-nav-badge">{allAccessibleList.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'wip' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('wip');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><Activity size={16} /></div>
            <span className="admin-nav-label">In Progress (WIP)</span>
            <span className="admin-nav-badge">
              {allAccessibleList.filter((t) => t.status === 'WORK_IN_PROGRESS').length}
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'on_hold' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('on_hold');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><AlertTriangle size={16} /></div>
            <span className="admin-nav-label">On Hold</span>
            <span className="admin-nav-badge">
              {allAccessibleList.filter((t) => t.is_on_hold || t.status === 'ON_HOLD').length}
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'awaiting' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('awaiting');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><MessageSquare size={16} /></div>
            <span className="admin-nav-label">Awaiting Customer</span>
            <span className="admin-nav-badge">
              {allAccessibleList.filter((t) => t.status === 'AWAITING_CUSTOMER_RESPONSE').length}
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeQueue === 'closed' && !selectedTicketId ? 'active' : ''}`}
            onClick={() => {
              setSelectedTicketId(null);
              setActiveQueue('closed');
              setCurrentPage(1);
            }}
          >
            <div className="admin-nav-icon"><CheckCircle2 size={16} /></div>
            <span className="admin-nav-label">Closed / Resolved</span>
            <span className="admin-nav-badge">
              {allAccessibleList.filter((t) => t.status === 'CLOSED').length}
            </span>
          </button>

          {canVideo && (
            <button
              className={`admin-nav-item ${activeQueue === 'video' && !selectedTicketId ? 'active' : ''}`}
              onClick={() => {
                setSelectedTicketId(null);
                setActiveQueue('video');
                setCurrentPage(1);
              }}
            >
              <div className="admin-nav-icon"><Video size={16} /></div>
              <span className="admin-nav-label">Video Tasks</span>
              <span className="admin-nav-badge">{videoTasks.length}</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="admin-sidebar-footer">
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              marginBottom: '0.75rem',
              fontSize: '0.8rem',
              color: '#CBD5E1',
            }}
          >
            Active Orders:{' '}
            <strong style={{ color: '#FFFFFF' }}>
              {assignedTickets.filter((t) => t.status !== 'CLOSED').length} /{' '}
              {currentUser.developer_profile?.max_active_tickets || 3}
            </strong>
          </div>

          {availableTickets.length > 0 && (
            <button
              className="btn btn-gold btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
              onClick={handleClaimNextOrder}
              disabled={
                loading ||
                assignedTickets.filter((t) => t.status !== 'CLOSED').length >=
                  (currentUser.developer_profile?.max_active_tickets || 3)
              }
            >
              <Sparkles size={14} /> Claim Next Order
            </button>
          )}

          <button
            className="btn btn-outline btn-sm"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              color: '#CBD5E1',
              borderColor: 'rgba(255,255,255,0.15)',
            }}
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Orders
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN OPERATIONAL CONTENT AREA
          ========================================================================= */}
      <main className="admin-main-content">
        {/* Global Feedback Banners */}
        {actionMsg && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#15803D',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{actionMsg}</span>
            </div>
            <button
              onClick={() => setActionMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW MODE 1: INDIVIDUAL ORDER RECORD FORM (SERVICENOW INCIDENT FORM)
            ========================================================================= */}
        {selectedTicketId && ticketDetail ? (
          <div>
            {/* Top Action Toolbar */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedTicketId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={14} /> Back to Orders
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-serif)',
                        color: 'var(--burgundy-rich)',
                      }}
                    >
                      {ticketDetail.ticket_number}
                    </span>
                    <span
                      className={`badge ${
                        ticketDetail.priority === 'URGENT' ? 'badge-new' : 'badge-assigned'
                      }`}
                    >
                      {ticketDetail.priority} PRIORITY
                    </span>
                    <span
                      className={`badge ${
                        ticketDetail.status === 'WORK_IN_PROGRESS' ? 'badge-wip' : 'badge-assigned'
                      }`}
                    >
                      {ticketDetail.status}
                    </span>
                    {ticketDetail.is_on_hold && (
                      <span className="badge badge-new" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        ON HOLD: {ticketDetail.hold_reason || 'Active Hold'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Order Ref: <strong>{ticketDetail.order_reference}</strong> &bull; Host:{' '}
                    <strong>{ticketDetail.customer_name}</strong> &bull; Created:{' '}
                    {new Date(ticketDetail.created_at || ticketDetail.eligible_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-navy btn-sm"
                  onClick={handleSaveRecord}
                  disabled={savingRecord || loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={13} /> {savingRecord ? 'Saving...' : 'Save Record'}
                </button>

                {!isAssignedToMe && (
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => handleClaimSpecific(ticketDetail.id)}
                    disabled={loading}
                  >
                    <UserIcon size={13} /> Assign to Me
                  </button>
                )}

                {ticketDetail.status !== 'WORK_IN_PROGRESS' && ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleStatusTransition('WORK_IN_PROGRESS')}
                    disabled={loading}
                    title="Start working on invitation production"
                  >
                    ▶ Start Work (WIP)
                  </button>
                )}

                {!ticketDetail.is_on_hold ? (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setModalHoldReason(ON_HOLD_REASONS[0]);
                      setModalHoldNotes('');
                      setShowHoldModal(true);
                    }}
                    disabled={loading || ticketDetail.status === 'CLOSED'}
                    style={{ borderColor: '#F59E0B', color: '#B45309' }}
                  >
                    <AlertTriangle size={13} /> Put On Hold
                  </button>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleResumeWork}
                    disabled={loading}
                    style={{ borderColor: '#16A34A', color: '#16A34A' }}
                  >
                    <Play size={13} /> Resume Work
                  </button>
                )}

                {ticketDetail.status !== 'AWAITING_CUSTOMER_RESPONSE' && ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleStatusTransition('AWAITING_CUSTOMER_RESPONSE')}
                    disabled={loading}
                  >
                    <MessageSquare size={13} /> Mark Preview Ready
                  </button>
                )}

                {ticketDetail.status !== 'CLOSED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStatusTransition('CLOSED')}
                    disabled={loading}
                    style={{ background: '#166534', borderColor: '#166534' }}
                  >
                    <CheckCircle2 size={13} /> Deliver &amp; Close Order
                  </button>
                )}
              </div>
            </div>

            {/* Stepper Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.35rem',
                background: '#FFFFFF',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
              }}
            >
              {ORDER_STAGES.map((stg, idx) => {
                const currentStageIdx = getStageIndex(ticketDetail.status);
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div
                    key={stg.key}
                    style={{
                      padding: '0.5rem 0.4rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 500,
                      borderRadius: 'var(--radius-xs)',
                      background: isCurrent ? '#0B1B3D' : isPassed ? '#E2F0D9' : '#F8FAFC',
                      color: isCurrent ? '#FFFFFF' : isPassed ? '#276749' : 'var(--text-muted)',
                      border: isCurrent ? '1px solid #0B1B3D' : '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {isPassed && <Check size={11} />}
                    {isCurrent && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#E5C07B',
                          display: 'inline-block',
                        }}
                      />
                    )}
                    <span>{stg.label}</span>
                  </div>
                );
              })}
            </div>

            {/* TWO-COLUMN FORM LAYOUT */}
            <div className="sn-form-card">
              <div className="sn-form-card-title">
                <FileText size={16} color="var(--burgundy-rich)" />
                Record Header &bull; Operational Properties
              </div>

              <div className="sn-form-grid-2">
                {/* LEFT COLUMN: Customer and Order Information (Read-Only Customer Data) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-deep)', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem' }}>
                    A. Customer &amp; Order Requirements (Read-Only)
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Order Ref</label>
                      <div className="sn-field-value-readonly">{ticketDetail.order_reference}</div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Customer Name</label>
                      <div className="sn-field-value-readonly">{ticketDetail.customer_name}</div>
                    </div>
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Customer Mobile</label>
                      <div className="sn-field-value-readonly">
                        <Phone size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                        {ticketDetail.customer_mobile || ticketDetail.order?.customer_mobile || 'N/A'}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Customer Email</label>
                      <div className="sn-field-value-readonly">
                        <Mail size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                        {ticketDetail.customer_email || ticketDetail.order?.customer_email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Occasion</label>
                      <div className="sn-field-value-readonly" style={{ fontWeight: 600, color: 'var(--burgundy-rich)' }}>
                        {ticketDetail.occasion || ticketDetail.order?.occasion_name}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Invitation Package</label>
                      <div className="sn-field-value-readonly">
                        {ticketDetail.order?.package_name || 'Standard Tier'}
                      </div>
                    </div>
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Preferred Language</label>
                      <div className="sn-field-value-readonly">
                        <Globe size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                        {ticketDetail.order?.selected_language || 'English'}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Event Date</label>
                      <div className="sn-field-value-readonly">
                        <Calendar size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                        {ticketDetail.order?.events?.[0]?.event_date || 'Multiple Ceremonies'}
                      </div>
                    </div>
                  </div>

                  <div className="sn-field">
                    <label className="sn-field-label">Primary Venue / Location</label>
                    <div className="sn-field-value-readonly">
                      <MapPin size={12} style={{ marginRight: '6px', color: 'var(--gold-primary)' }} />
                      {ticketDetail.order?.events?.[0]?.venue_name
                        ? `${ticketDetail.order.events[0].venue_name}${ticketDetail.order.events[0].venue_locality ? `, ${ticketDetail.order.events[0].venue_locality}` : ''} — ${ticketDetail.order.events[0].venue_address}${
                            ticketDetail.order.events[0].venue_source === 'VERIFIED_DIRECTORY'
                              ? ' (Verified venue)'
                              : ticketDetail.order.events[0].venue_source
                              ? ' (Customer provided)'
                              : ''
                          }`
                        : 'Venue details in Ceremonies tab'}
                    </div>
                  </div>

                  {(ticketDetail.customer_requirements || ticketDetail.order?.special_instructions) && (
                    <div className="sn-field">
                      <label className="sn-field-label">Customer Requirements &amp; Special Instructions</label>
                      <div
                        className="sn-field-value-readonly"
                        style={{ background: '#FFFDF9', borderColor: '#F3EBDD', fontStyle: 'italic', lineHeight: 1.45, minHeight: 'auto', padding: '0.65rem' }}
                      >
                        "{ticketDetail.customer_requirements || ticketDetail.order?.special_instructions}"
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Assignment, Workflow State & Payment (Controlled Dropdowns) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-deep)', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem' }}>
                    B. Assignment &amp; Production Workflow
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label required">Workflow State</label>
                      <select
                        className="sn-field-input"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                      >
                        <option value="NEW_OPEN">NEW_OPEN</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS</option>
                        <option value="AWAITING_CUSTOMER_RESPONSE">AWAITING_CUSTOMER_RESPONSE</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div className="sn-field">
                      <label className="sn-field-label required">Priority</label>
                      <select
                        className="sn-field-input"
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                      >
                        <option value="LOW">LOW</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Assigned Engineering Team</label>
                      <div className="sn-field-value-readonly">
                        {ticketDetail.assigned_team || 'Creative Artisan Engineering'}
                      </div>
                    </div>

                    <div className="sn-field">
                      <label className="sn-field-label">Assigned Developer</label>
                      <div className="sn-field-value-readonly" style={{ fontWeight: 600 }}>
                        {ticketDetail.assigned_developer_name || (
                          <span style={{ color: '#B45309' }}>Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">On Hold Status</label>
                      <select
                        className="sn-field-input"
                        value={formIsOnHold ? 'YES' : 'NO'}
                        onChange={(e) => {
                          const val = e.target.value === 'YES';
                          setFormIsOnHold(val);
                          if (val && !formHoldReason) setFormHoldReason(ON_HOLD_REASONS[0]);
                        }}
                      >
                        <option value="NO">No — Active Workflow</option>
                        <option value="YES">Yes — On Hold</option>
                      </select>
                    </div>

                    <div className="sn-field">
                      <label className="sn-field-label">On Hold Reason</label>
                      <select
                        className="sn-field-input"
                        value={formHoldReason}
                        onChange={(e) => setFormHoldReason(e.target.value)}
                        disabled={!formIsOnHold}
                      >
                        <option value="">-- None --</option>
                        {ON_HOLD_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Read-Only Payment & Publishing Information */}
                  <div style={{ marginTop: '0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-xs)', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      C. Payment &amp; Publishing Telemetry (Read-Only)
                    </div>
                    <div className="sn-form-grid-2" style={{ fontSize: '0.8rem', gap: '0.5rem' }}>
                      <div>Payment Status: <strong>{ticketDetail.order?.status === 'PAID' ? 'PAID' : 'PENDING'}</strong></div>
                      <div>Total Settlement: <strong>₹{ticketDetail.order?.total_amount_inr || '0.00'}</strong></div>
                      <div>Published Live: <strong>{ticketDetail.order?.is_published ? 'YES' : 'NO'}</strong></div>
                      <div>Versions Rendered: <strong>{ticketDetail.design_versions?.length || 0}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                7 OPERATIONAL RECORD TABS
                ========================================================================= */}
            <div className="sn-tabs-nav">
              <button
                className={`sn-tab-btn ${recordTab === 'overview' ? 'active' : ''}`}
                onClick={() => setRecordTab('overview')}
              >
                <Calendar size={14} /> 1. Order Overview &amp; Ceremonies
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'wording' ? 'active' : ''}`}
                onClick={() => setRecordTab('wording')}
              >
                <FileText size={14} /> 2. Invitation &amp; Wording Details
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'studio' ? 'active' : ''}`}
                onClick={() => setRecordTab('studio')}
              >
                <Layers size={14} /> 3. Design Studio &amp; Versions ({ticketDetail.design_versions?.length || 0})
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'attachments' ? 'active' : ''}`}
                onClick={() => setRecordTab('attachments')}
              >
                <FolderOpen size={14} /> 4. Attachments &amp; Files ({(ticketDetail.order?.assets || []).length})
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'notes' ? 'active' : ''}`}
                onClick={() => setRecordTab('notes')}
              >
                <MessageSquare size={14} /> 5. Notes &amp; Activity Stream ({(ticketDetail.internal_notes || []).length})
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'revisions' ? 'active' : ''}`}
                onClick={() => setRecordTab('revisions')}
              >
                <Activity size={14} /> 6. Revisions &amp; Audit Log
              </button>
              <button
                className={`sn-tab-btn ${recordTab === 'deliverables' ? 'active' : ''}`}
                onClick={() => setRecordTab('deliverables')}
              >
                <CheckCircle2 size={14} /> 7. Resolution &amp; Deliverables
              </button>
            </div>

            {/* TAB 1: CEREMONIES & ITINERARY */}
            {recordTab === 'overview' && (
              <div className="sn-form-card">
                <div className="sn-form-card-title">
                  <Calendar size={16} color="var(--burgundy-rich)" />
                  Ceremony Schedule &amp; Venue Locations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(ticketDetail.events || ticketDetail.order?.events || []).map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-champagne)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--navy-deep)' }}>
                          {ev.event_title}
                        </strong>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--burgundy-rich)', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          {ev.event_date} &bull; {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}
                        </span>
                      </div>
                      <VenueDetailsCard event={ev} />
                    </div>
                  ))}

                  {(!ticketDetail.events || ticketDetail.events.length === 0) &&
                    (!ticketDetail.order?.events || ticketDetail.order.events.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                        No specific ceremony sub-events recorded.
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* TAB 2: INVITATION WORDING & DESIGN THEME */}
            {recordTab === 'wording' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* ── A. Information Completeness Banner ── */}
                <div className="sn-form-card" style={{ borderLeft: `4px solid ${(ticketDetail.order?.completeness_score ?? 0) >= 80 ? '#16a34a' : (ticketDetail.order?.completeness_score ?? 0) >= 50 ? '#d97706' : '#dc2626'}` }}>
                  <div className="sn-form-card-title">
                    <BarChart3 size={16} color="var(--burgundy-rich)" />
                    Information Completeness
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Completeness Score</span>
                        <span style={{ fontWeight: 600 }}>{ticketDetail.order?.completeness_score ?? 0}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ticketDetail.order?.completeness_score ?? 0}%`, background: (ticketDetail.order?.completeness_score ?? 0) >= 80 ? '#16a34a' : (ticketDetail.order?.completeness_score ?? 0) >= 50 ? '#d97706' : '#dc2626', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '12px', background: ticketDetail.order?.is_information_confirmed ? '#dcfce7' : '#fef3c7', color: ticketDetail.order?.is_information_confirmed ? '#166534' : '#92400e' }}>
                      {ticketDetail.order?.is_information_confirmed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      {ticketDetail.order?.is_information_confirmed ? 'Information Confirmed' : 'Pending Confirmation'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '12px', background: ticketDetail.order?.is_ready_for_production ? '#dcfce7' : '#fee2e2', color: ticketDetail.order?.is_ready_for_production ? '#166534' : '#991b1b' }}>
                      {ticketDetail.order?.is_ready_for_production ? <Check size={13} /> : <AlertTriangle size={13} />}
                      {ticketDetail.order?.is_ready_for_production ? 'Ready for Production' : 'Not Ready'}
                    </span>
                    {ticketDetail.order?.missing_fields_json && ticketDetail.order.missing_fields_json.length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '12px', background: '#fef3c7', color: '#92400e' }}>
                        <AlertTriangle size={13} />
                        {ticketDetail.order.missing_fields_json.length} Missing Field{ticketDetail.order.missing_fields_json.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Original Specifications ── */}
                <div className="sn-form-card">
                  <div className="sn-form-card-title">
                    <FileText size={16} color="var(--burgundy-rich)" />
                    Invitation Wording, Theme &amp; Deliverable Specifications
                  </div>
                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Selected Language</label>
                      <div className="sn-field-value-readonly">{ticketDetail.order?.selected_language || 'English'}</div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Deliverable Type</label>
                      <div className="sn-field-value-readonly">Digital Interactive Web + Watermarked PDF Draft</div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Design Category</label>
                      <div className="sn-field-value-readonly">{ticketDetail.occasion || 'Milestone Celebration'}</div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Package Tier</label>
                      <div className="sn-field-value-readonly">{ticketDetail.order?.package_name || 'Standard'}</div>
                    </div>
                  </div>
                  <div className="sn-field" style={{ marginTop: '1rem' }}>
                    <label className="sn-field-label">Captured Wording &amp; Requirements</label>
                    <div className="sn-field-value-readonly" style={{ minHeight: '80px', alignItems: 'flex-start', paddingTop: '0.65rem' }}>
                      {ticketDetail.customer_requirements || ticketDetail.order?.special_instructions || 'Standard festive wording specified during catalog booking.'}
                    </div>
                  </div>
                </div>

                {/* ── B. Physical Invitation Card Section ── */}
                <div className="sn-form-card">
                  <div className="sn-form-card-title">
                    <CreditCard size={16} color="var(--burgundy-rich)" />
                    Physical Invitation Card
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '12px', background: ticketDetail.order?.has_physical_card ? '#dbeafe' : '#f3f4f6', color: ticketDetail.order?.has_physical_card ? '#1e40af' : '#6b7280' }}>
                      Has Physical Card: {ticketDetail.order?.has_physical_card ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {ticketDetail.order?.has_physical_card && (
                    <>
                      {ticketDetail.order?.physical_card_notes && (
                        <div className="sn-field" style={{ marginBottom: '0.75rem' }}>
                          <label className="sn-field-label">Physical Card Notes</label>
                          <div className="sn-field-value-readonly" style={{ alignItems: 'flex-start', paddingTop: '0.5rem' }}>
                            {ticketDetail.order.physical_card_notes}
                          </div>
                        </div>
                      )}
                      {(() => {
                        const physicalAssets = (ticketDetail.order?.assets || []).filter(
                          (a: CustomerAsset) => ['PHYSICAL_CARD_FRONT', 'PHYSICAL_CARD_BACK', 'PHYSICAL_CARD_INSERT'].includes(a.asset_category)
                        );
                        return physicalAssets.length > 0 ? (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label className="sn-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Physical Card Images</label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {physicalAssets.map((asset: CustomerAsset) => (
                                <div
                                  key={asset.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    padding: '0.5rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleInspectAsset(asset)}
                                  title={`Inspect ${asset.file_name}`}
                                >
                                  {asset.preview_url || asset.url ? (
                                    <img
                                      src={asset.preview_url || asset.url}
                                      alt={asset.file_name}
                                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    />
                                  ) : (
                                    <div style={{ width: '100px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                                      <ImageIcon size={24} color="var(--burgundy-rich)" />
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Scan</span>
                                    </div>
                                  )}
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy-deep)', textAlign: 'center', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {asset.asset_category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                                    <button
                                      type="button"
                                      className="btn btn-navy btn-sm"
                                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', gap: '0.2rem', flex: 1, justifyContent: 'center' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInspectAsset(asset);
                                      }}
                                    >
                                      <Eye size={10} /> Inspect
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', gap: '0.2rem', justifyContent: 'center' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadAsset(asset);
                                      }}
                                      title="Download original"
                                    >
                                      <Download size={10} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                      {ticketDetail.order?.ocr_data_json && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label className="sn-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>OCR Extracted Data</label>
                          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.75rem' }}>
                            {typeof ticketDetail.order.ocr_data_json === 'object' && ticketDetail.order.ocr_data_json !== null ? (
                              <div className="sn-form-grid-2">
                                {Object.entries(ticketDetail.order.ocr_data_json).map(([key, value]) => (
                                  <div className="sn-field" key={key}>
                                    <label className="sn-field-label">{key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</label>
                                    <div className="sn-field-value-readonly">{String(value ?? '—')}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <pre style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', margin: 0 }}>{ticketDetail.order.ocr_extracted_text || JSON.stringify(ticketDetail.order.ocr_data_json, null, 2)}</pre>
                            )}
                          </div>
                        </div>
                      )}
                      {!ticketDetail.order?.ocr_data_json && ticketDetail.order?.ocr_extracted_text && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label className="sn-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>OCR Extracted Text</label>
                          <div className="sn-field-value-readonly" style={{ alignItems: 'flex-start', paddingTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                            {ticketDetail.order.ocr_extracted_text}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── C. Occasion-Specific Requirements ── */}
                {ticketDetail.order?.occasion_requirements_json && typeof ticketDetail.order.occasion_requirements_json === 'object' && Object.keys(ticketDetail.order.occasion_requirements_json).length > 0 && (
                  <div className="sn-form-card">
                    <div className="sn-form-card-title">
                      <Layers size={16} color="var(--burgundy-rich)" />
                      Occasion-Specific Requirements
                    </div>
                    {(() => {
                      const reqJson = ticketDetail.order!.occasion_requirements_json;
                      const allEntries = Object.entries(reqJson).filter(([, v]) => v !== null && v !== undefined && v !== '');

                      // Group by prefix heuristic
                      const groupMap: Record<string, [string, unknown][]> = {};
                      allEntries.forEach(([key, value]) => {
                        let group = 'General Details';
                        const lk = key.toLowerCase();
                        if (lk.startsWith('bride') || lk.includes('bride')) group = 'Bride Details';
                        else if (lk.startsWith('groom') || lk.includes('groom')) group = 'Groom Details';
                        else if (lk.includes('ceremony') || lk.includes('venue') || lk.includes('event') || lk.includes('date') || lk.includes('time')) group = 'Ceremony Details';
                        else if (lk.includes('birthday') || lk.includes('age') || lk.includes('theme')) group = 'Celebration Details';
                        else if (lk.includes('rsvp') || lk.includes('guest') || lk.includes('gift') || lk.includes('registry')) group = 'Guest & RSVP Details';
                        if (!groupMap[group]) groupMap[group] = [];
                        groupMap[group].push([key, value]);
                      });

                      return Object.entries(groupMap).map(([groupName, entries]) => (
                        <div key={groupName} style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--burgundy-rich)', marginBottom: '0.5rem', paddingBottom: '0.3rem', borderBottom: '1px solid #f1f5f9' }}>
                            {groupName}
                          </div>
                          <div className="sn-form-grid-2">
                            {entries.map(([key, value]) => (
                              <div className="sn-field" key={key}>
                                <label className="sn-field-label">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </label>
                                <div className="sn-field-value-readonly">
                                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* ── D. Missing Fields Checklist ── */}
                {ticketDetail.order?.missing_fields_json && ticketDetail.order.missing_fields_json.length > 0 && (
                  <div className="sn-form-card" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="sn-form-card-title">
                      <AlertTriangle size={16} color="#d97706" />
                      Missing Information ({ticketDetail.order.missing_fields_json.length} field{ticketDetail.order.missing_fields_json.length > 1 ? 's' : ''})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {ticketDetail.order.missing_fields_json.map((field: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.65rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.84rem', color: '#92400e' }}>
                          <AlertTriangle size={14} color="#d97706" />
                          {field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── E. Pricing & Discount Information ── */}
                <div className="sn-form-card">
                  <div className="sn-form-card-title">
                    <DollarSign size={16} color="var(--burgundy-rich)" />
                    Pricing &amp; Discount Breakdown
                  </div>
                  <div className="sn-form-grid-2">
                    <div className="sn-field">
                      <label className="sn-field-label">Base Amount</label>
                      <div className="sn-field-value-readonly">₹{ticketDetail.order?.base_amount_inr || ticketDetail.order?.total_amount_inr || '—'}</div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Auto Discount</label>
                      <div className="sn-field-value-readonly" style={{ color: ticketDetail.order?.auto_discount_amount_inr && parseFloat(ticketDetail.order.auto_discount_amount_inr) > 0 ? '#16a34a' : undefined }}>
                        {ticketDetail.order?.auto_discount_amount_inr && parseFloat(ticketDetail.order.auto_discount_amount_inr) > 0 ? `−₹${ticketDetail.order.auto_discount_amount_inr}` : '—'}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Coupon Discount</label>
                      <div className="sn-field-value-readonly" style={{ color: ticketDetail.order?.coupon_discount_amount_inr && parseFloat(ticketDetail.order.coupon_discount_amount_inr) > 0 ? '#16a34a' : undefined }}>
                        {ticketDetail.order?.coupon_discount_amount_inr && parseFloat(ticketDetail.order.coupon_discount_amount_inr) > 0 ? `−₹${ticketDetail.order.coupon_discount_amount_inr}` : '—'}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Applied Coupon Code</label>
                      <div className="sn-field-value-readonly">
                        {ticketDetail.order?.applied_coupon_code ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ede9fe', color: '#5b21b6', padding: '0.15rem 0.55rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem' }}>
                            <Tag size={12} /> {ticketDetail.order.applied_coupon_code}
                          </span>
                        ) : '—'}
                      </div>
                    </div>
                    <div className="sn-field">
                      <label className="sn-field-label">Total Amount Charged</label>
                      <div className="sn-field-value-readonly" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--burgundy-rich)' }}>
                        ₹{ticketDetail.order?.total_amount_inr || '—'}
                      </div>
                    </div>
                  </div>
                  {ticketDetail.order?.quotation_snapshot_json && (
                    <div style={{ marginTop: '1rem' }}>
                      <label className="sn-field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Quotation Snapshot</label>
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.75rem' }}>
                        {typeof ticketDetail.order.quotation_snapshot_json === 'object' && ticketDetail.order.quotation_snapshot_json !== null ? (
                          <div className="sn-form-grid-2">
                            {Object.entries(ticketDetail.order.quotation_snapshot_json).map(([key, value]) => (
                              <div className="sn-field" key={key}>
                                <label className="sn-field-label">{key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</label>
                                <div className="sn-field-value-readonly">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(ticketDetail.order.quotation_snapshot_json, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: DESIGN STUDIO & VERSION GENERATOR */}
            {recordTab === 'studio' && (
              <div className="sn-form-card">
                <div className="sn-form-card-title">
                  <Layers size={16} color="var(--burgundy-rich)" />
                  Design Studio &amp; Protected Draft Generator
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Set artisan color palettes, watermark protection, and render new preview draft revisions for customer review.
                </p>

                <div className="sn-form-grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="sn-field">
                    <label className="sn-field-label">Primary Theme Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        style={{ width: '42px', height: '38px', padding: 0, border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="sn-field-input"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="sn-field">
                    <label className="sn-field-label">Accent Highlight Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        style={{ width: '42px', height: '38px', padding: 0, border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="sn-field-input"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="sn-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="sn-field-label">Draft Watermark Text</label>
                  <input
                    type="text"
                    className="sn-field-input"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRenderDesignVersion}
                  disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Upload size={14} /> Render &amp; Publish Next Design Version
                </button>

                {/* Rendered Versions Table */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--navy-deep)', marginBottom: '0.65rem' }}>
                    Rendered Design Versions ({ticketDetail.design_versions?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ticketDetail.design_versions?.map((ver) => (
                      <div
                        key={ver.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.65rem 1rem',
                          background: 'var(--bg-champagne)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <strong>Version {ver.version_number}</strong> &bull; Status:{' '}
                          <span className="badge badge-assigned">{ver.status}</span> &bull;{' '}
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {new Date(ver.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onOpenPreview(`/preview/${ver.preview_token}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={13} /> Open Preview
                        </button>
                      </div>
                    ))}
                    {(!ticketDetail.design_versions || ticketDetail.design_versions.length === 0) && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        No versions rendered yet. Click above to render initial draft.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ATTACHMENTS & MEDIA MANAGEMENT */}
            {recordTab === 'attachments' && (
              <div className="sn-form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-deep)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FolderOpen size={16} color="var(--burgundy-rich)" />
                    Order Attachments &amp; Customer Media ({ticketDetail.order?.assets?.length || 0})
                  </div>

                  {/* Upload Additional Asset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      className="sn-field-input"
                      value={assetCategory}
                      onChange={(e) => setAssetCategory(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px', minHeight: '34px', padding: '0 0.5rem' }}
                    >
                      <option value="COUPLE_PHOTO">Couple / Portrait Photo</option>
                      <option value="FAMILY_PHOTO">Family Photo</option>
                      <option value="BACKGROUND_AUDIO">Audio Track / Music</option>
                      <option value="LOGO_ASSET">Logo / Monogram</option>
                      <option value="DOCUMENT">Document / Brief</option>
                      <option value="OTHER">Other Media</option>
                    </select>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*/*"
                      style={{ display: 'none' }}
                      disabled={uploadingAsset}
                      onChange={handleUploadAssetFile}
                    />

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAsset}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '34px' }}
                    >
                      <Upload size={13} /> {uploadingAsset ? 'Uploading...' : 'Upload File'}
                    </button>
                  </div>
                </div>

                {/* Dense Operational Attachments Table */}
                {ticketDetail.order?.assets && ticketDetail.order.assets.length > 0 ? (
                  <div className="sn-table-container">
                    <table className="sn-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Category</th>
                          <th>Type / Ext</th>
                          <th>Size</th>
                          <th>Uploaded Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketDetail.order.assets.map((asset) => {
                          const ext = (asset.extension || asset.file_name.split('.').pop() || '').toUpperCase();
                          return (
                            <tr key={asset.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext) ? (
                                    <ImageIcon size={15} color="var(--burgundy-rich)" />
                                  ) : ['MP3', 'WAV', 'M4A'].includes(ext) ? (
                                    <Music size={15} color="#0284C7" />
                                  ) : ['MP4', 'MOV', 'WEBM'].includes(ext) ? (
                                    <Film size={15} color="#9333EA" />
                                  ) : (
                                    <FileText size={15} color="var(--gold-primary)" />
                                  )}
                                  <strong style={{ color: 'var(--navy-deep)' }}>{asset.file_name}</strong>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                                  {asset.asset_category?.replace(/_/g, ' ') || 'General'}
                                </span>
                              </td>
                              <td><span className="badge badge-assigned">{ext || 'FILE'}</span></td>
                              <td>{asset.readable_size || (asset.file_size_bytes ? `${(asset.file_size_bytes / 1024).toFixed(1)} KB` : 'N/A')}</td>
                              <td>{new Date(asset.uploaded_at).toLocaleDateString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                  <button
                                    className="btn btn-navy btn-sm"
                                    onClick={() => handleInspectAsset(asset)}
                                    title="Open in-app inspection preview"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    <Eye size={12} /> Inspect
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleDownloadAsset(asset)}
                                    title="Download original file with real filename"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    <Download size={12} /> Download
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      background: 'var(--bg-champagne)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '0.86rem',
                    }}
                  >
                    <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.4, color: 'var(--burgundy-rich)' }} />
                    <p style={{ margin: '0 0 0.5rem' }}>
                      No customer media files or attachments uploaded for this order yet.
                    </p>
                    <span style={{ fontSize: '0.78rem' }}>
                      Use the "Upload File" control above to attach customer photos, music tracks, or design assets.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: NOTES & COMMUNICATION (ServiceNow Dual Activity Inputs) */}
            {recordTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Dual Input Section */}
                <div className="sn-form-grid-2">
                  {/* BOX 1: Customer Updates (Visible to Customer) */}
                  <div className="sn-notes-customer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <Globe size={15} color="#16A34A" />
                      <strong style={{ fontSize: '0.88rem', color: '#166534' }}>
                        Customer Updates (Visible to Customer)
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#15803D', margin: '0 0 0.65rem' }}>
                      Updates posted here will appear directly on the customer's order tracking timeline.
                    </p>
                    <textarea
                      className="sn-field-input"
                      rows={4}
                      placeholder="Enter status update or note visible to customer..."
                      value={customerUpdateText}
                      onChange={(e) => setCustomerUpdateText(e.target.value)}
                      style={{ background: '#FFFFFF', marginBottom: '0.65rem', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm"
                        onClick={handlePostCustomerUpdate}
                        disabled={postingNote || !customerUpdateText.trim()}
                        style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Send size={13} /> Post Customer Update
                      </button>
                    </div>
                  </div>

                  {/* BOX 2: Work Notes (Private / Internal Engineering Only) */}
                  <div className="sn-notes-internal">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <Lock size={15} color="#B78103" />
                      <strong style={{ fontSize: '0.88rem', color: '#7A5200' }}>
                        Work Notes (Private / Engineering Team Only)
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#8D6E12', margin: '0 0 0.65rem' }}>
                      Internal audit record. Hidden from customer. Document revisions, blockers, or WIP notes.
                    </p>
                    <textarea
                      className="sn-field-input"
                      rows={4}
                      placeholder="Enter private internal engineering work notes..."
                      value={internalWorkNoteText}
                      onChange={(e) => setInternalWorkNoteText(e.target.value)}
                      style={{ background: '#FFFFFF', border: '1px solid #FFE082', marginBottom: '0.65rem', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm"
                        onClick={handlePostWorkNote}
                        disabled={postingNote || !internalWorkNoteText.trim()}
                        style={{ background: '#B88E3E', color: '#FFFFFF', border: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Send size={13} /> Post Work Note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Combined Activity Stream Journal */}
                <div className="sn-form-card">
                  <div className="sn-form-card-title">
                    <Activity size={16} color="var(--burgundy-rich)" />
                    Incident Activity Stream &amp; Chronological Journal
                  </div>

                  <div className="sn-timeline-stream">
                    {/* Status Transitions */}
                    {(ticketDetail.status_history || []).map((sh: any, idx: number) => (
                      <div key={`sh-${idx}`} className="sn-timeline-card state-change">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--navy-deep)' }}>
                            State Transition &bull; Moved to <span className="badge badge-assigned">{sh.new_status}</span>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {new Date(sh.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-body)', marginTop: '2px' }}>
                          {sh.transition_reason || 'State transitioned by engineer'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Actor: <strong>{sh.changed_by_name || 'System / Engineer'}</strong>
                        </div>
                      </div>
                    ))}

                    {/* Internal Notes & Customer Updates */}
                    {(ticketDetail.internal_notes || []).map((n) => {
                      const isCustomer = n.is_customer_visible || n.note_type === 'CUSTOMER_UPDATE';
                      return (
                        <div
                          key={n.id}
                          className={`sn-timeline-card ${isCustomer ? 'customer-update' : 'work-note'}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <strong style={{ color: isCustomer ? '#166534' : '#7A5200', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {isCustomer ? <Globe size={13} /> : <Lock size={13} />}
                              {isCustomer ? 'Customer Update' : 'Work Note'} &bull; {n.author_name}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: isCustomer ? '#16A34A' : '#8D6E12' }}>
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ color: isCustomer ? '#14532D' : '#451A03', whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                            {n.clean_note_text || n.note_text}
                          </div>
                        </div>
                      );
                    })}

                    {(!ticketDetail.status_history || ticketDetail.status_history.length === 0) &&
                      (!ticketDetail.internal_notes || ticketDetail.internal_notes.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                          No prior activity entries recorded for this record.
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: REVISIONS & AUDIT LOG */}
            {recordTab === 'revisions' && (
              <div className="sn-form-card">
                <div className="sn-form-card-title">
                  <Activity size={16} color="var(--burgundy-rich)" />
                  Revision Requests &amp; Historical Audit Trail
                </div>

                <div className="sn-table-container">
                  <table className="sn-table">
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Event Type</th>
                        <th>Actor / Author</th>
                        <th>Details / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ticketDetail.status_history || []).map((sh, idx) => (
                        <tr key={`sh-row-${idx}`}>
                          <td>{new Date(sh.created_at).toLocaleString()}</td>
                          <td><span className="badge badge-assigned">STATE_CHANGE</span></td>
                          <td>{sh.changed_by_name || 'System'}</td>
                          <td>{sh.previous_status} &rarr; <strong>{sh.new_status}</strong> ({sh.transition_reason})</td>
                        </tr>
                      ))}
                      {(ticketDetail.assignment_history || []).map((ah, idx) => (
                        <tr key={`ah-row-${idx}`}>
                          <td>{new Date(ah.created_at).toLocaleString()}</td>
                          <td><span className="badge badge-wip">ASSIGNMENT</span></td>
                          <td>{ah.assigned_by_name || 'Admin'}</td>
                          <td>Assigned to <strong>{ah.developer_name}</strong> ({ah.assignment_type})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: RESOLUTION & DELIVERABLES */}
            {recordTab === 'deliverables' && (
              <div className="sn-form-card">
                <div className="sn-form-card-title">
                  <CheckCircle2 size={16} color="#166534" />
                  Resolution Summary &amp; Live Deliverables
                </div>
                <div className="sn-form-grid-2">
                  <div className="sn-field">
                    <label className="sn-field-label">Order Fulfillment Status</label>
                    <div className="sn-field-value-readonly">
                      {ticketDetail.status === 'CLOSED' ? (
                        <span style={{ color: '#166534', fontWeight: 600 }}>Fulfilled &amp; Live</span>
                      ) : (
                        <span>Pending Completion</span>
                      )}
                    </div>
                  </div>
                  <div className="sn-field">
                    <label className="sn-field-label">Live Invitation Link</label>
                    <div className="sn-field-value-readonly">
                      {ticketDetail.order?.is_published && ticketDetail.order?.published_url ? (
                        <a
                          href={ticketDetail.order.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--burgundy-rich)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <ExternalLink size={13} /> {ticketDetail.order.published_url}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not yet published by Administrator</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              VIEW MODE 2: OPERATIONAL QUEUE LIST (DENSE 10-COLUMN SERVICENOW TABLE)
              ========================================================================= */
          <div>
            {/* Search & Filter Bar */}
            <div className="sn-filter-bar">
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="sn-field-input"
                  placeholder="Search Order ID, customer, mobile, occasion, requirements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              {/* Status Filter */}
              <select
                className="sn-field-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW_OPEN">NEW_OPEN</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS</option>
                <option value="AWAITING_CUSTOMER_RESPONSE">AWAITING_CUSTOMER</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              {/* Priority Filter */}
              <select
                className="sn-field-input"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: 'auto', minWidth: '130px' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="LOW">LOW</option>
              </select>

              {/* Occasion Filter */}
              <select
                className="sn-field-input"
                value={occasionFilter}
                onChange={(e) => {
                  setOccasionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: 'auto', minWidth: '160px' }}
              >
                <option value="ALL">All Occasions</option>
                {occasionOptions.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || occasionFilter !== 'ALL') && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setOccasionFilter('ALL');
                    setCurrentPage(1);
                  }}
                  title="Clear all filters"
                >
                  <RotateCcw size={13} /> Clear
                </button>
              )}

              {/* Claim Action Button */}
              {activeQueue === 'queue' && availableTickets.length > 0 && (
                <button
                  className="btn btn-gold btn-sm"
                  onClick={handleClaimNextOrder}
                  disabled={
                    loading ||
                    assignedTickets.filter((t) => t.status !== 'CLOSED').length >=
                      (currentUser.developer_profile?.max_active_tickets || 3)
                  }
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
                >
                  <Sparkles size={14} /> Claim Next Order
                </button>
              )}
            </div>

            {/* DENSE 10-COLUMN SERVICENOW OPERATIONAL TABLE */}
            <div className="sn-table-container">
              <table className="sn-table">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (sortBy === 'created_at') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('created_at'); setSortOrder('desc'); }
                      }}
                    >
                      Created Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (sortBy === 'ticket_number') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('ticket_number'); setSortOrder('asc'); }
                      }}
                    >
                      Order ID {sortBy === 'ticket_number' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (sortBy === 'priority') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('priority'); setSortOrder('desc'); }
                      }}
                    >
                      Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Occasion</th>
                    <th>Invitation Type</th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (sortBy === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('status'); setSortOrder('asc'); }
                      }}
                    >
                      Order Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Assigned Team</th>
                    <th>Assigned Developer</th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (sortBy === 'event_date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('event_date'); setSortOrder('asc'); }
                      }}
                    >
                      Event Date {sortBy === 'event_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ minWidth: '180px' }}>Short Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => loadTicketDetail(t.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* 1. Created Date */}
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at || t.eligible_at).toLocaleDateString()}
                      </td>

                      {/* 2. Order ID */}
                      <td>
                        <strong
                          style={{
                            color: 'var(--burgundy-rich)',
                            fontFamily: 'var(--font-serif)',
                            fontSize: '0.98rem',
                          }}
                        >
                          {t.ticket_number}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {t.order_reference}
                        </div>
                      </td>

                      {/* 3. Priority */}
                      <td>
                        <span
                          className={`badge ${
                            t.priority === 'URGENT' ? 'badge-new' : 'badge-assigned'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* 4. Occasion */}
                      <td>
                        <strong>{t.occasion_name || t.occasion}</strong>
                      </td>

                      {/* 5. Invitation Type */}
                      <td>{t.invitation_type || t.package_name || 'Digital Web'}</td>

                      {/* 6. Order Status */}
                      <td>
                        <span
                          className={`badge ${
                            t.status === 'WORK_IN_PROGRESS'
                              ? 'badge-wip'
                              : t.status === 'CLOSED'
                              ? 'badge-assigned'
                              : 'badge-new'
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.is_on_hold && (
                          <span
                            className="badge badge-new"
                            style={{
                              marginLeft: '4px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              fontSize: '0.68rem',
                            }}
                          >
                            HOLD
                          </span>
                        )}
                      </td>

                      {/* 7. Assigned Team */}
                      <td style={{ color: '#475569' }}>
                        {t.assigned_team || 'Creative Artisan Engineering'}
                      </td>

                      {/* 8. Assigned Developer */}
                      <td>
                        {t.assigned_developer_name ? (
                          <strong style={{ color: 'var(--navy-deep)' }}>
                            {t.assigned_developer_name}
                          </strong>
                        ) : (
                          <span style={{ color: '#B45309', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>

                      {/* 9. Event Date */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {t.event_date ? (
                          <span>{t.event_date}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>

                      {/* 10. Short Description */}
                      <td style={{ fontSize: '0.8rem', color: '#334155' }}>
                        {t.short_description || `${t.customer_name} — ${t.occasion_name || t.occasion}`}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {(!t.assigned_developer || t.assigned_developer !== currentUser.id) && (
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimSpecific(t.id);
                              }}
                              disabled={
                                loading ||
                                assignedTickets.filter((x) => x.status !== 'CLOSED').length >=
                                  (currentUser.developer_profile?.max_active_tickets || 3)
                              }
                              title="Assign this order to your queue"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem' }}
                            >
                              <UserIcon size={11} /> Assign
                            </button>
                          )}
                          <button
                            className="btn btn-navy btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadTicketDetail(t.id);
                            }}
                            title="Inspect complete order record"
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem' }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedTickets.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                        <Inbox size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>No orders found in this queue.</div>
                        <div style={{ fontSize: '0.8rem' }}>Adjust search queries or filter selections above.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Footer */}
              <div className="sn-pagination">
                <div>
                  Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} orders
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Rows per page:</span>
                    <select
                      className="sn-field-input"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ width: 'auto', padding: '0.2rem 0.5rem', height: '30px', minHeight: '30px' }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Previous
                    </button>
                    <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          IN-APP ATTACHMENT PREVIEW MODAL (Supporting 14 Formats: Images, Audio, Video, PDF, Docs)
          ========================================================================= */}
      {previewMedia && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewMedia(null)}
          style={{ zIndex: 1000, background: 'rgba(5, 15, 30, 0.88)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90vw',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0B1B3D',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.98rem' }}>{previewMedia.title}</strong>
                <span
                  style={{
                    marginLeft: '0.65rem',
                    fontSize: '0.72rem',
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: 'var(--gold-soft)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {previewMedia.category?.replace(/_/g, ' ') || 'MEDIA ASSET'} &bull; {previewMedia.fileSize}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <ExternalLink size={13} /> Open in Tab
                </a>

                {previewMedia.assetId && (
                  <button
                    className="btn btn-sm btn-gold"
                    onClick={() => {
                      if (previewMedia.assetId) {
                        ApiService.downloadAssetFile(previewMedia.assetId, previewMedia.title);
                      }
                    }}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <Download size={13} /> Download
                  </button>
                )}

                <button
                  onClick={() => setPreviewMedia(null)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Media Body */}
            <div
              style={{
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto',
                maxHeight: 'calc(92vh - 75px)',
                background: '#050D1A',
                minHeight: '280px',
              }}
            >
              {previewMedia.type === 'image' && (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(80vh - 50px)',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/800x600/102A43/D4AF37?text=Attachment+Photo+Preview';
                  }}
                />
              )}

              {previewMedia.type === 'audio' && (
                <div style={{ textAlign: 'center', padding: '2rem', width: '100%', maxWidth: '480px' }}>
                  <Music size={48} color="var(--gold-soft)" style={{ marginBottom: '1rem' }} />
                  <div style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '1.25rem' }}>
                    {previewMedia.title}
                  </div>
                  <audio controls autoPlay src={previewMedia.url} style={{ width: '100%' }}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {previewMedia.type === 'video' && (
                <div style={{ maxWidth: '100%', maxHeight: 'calc(80vh - 50px)' }}>
                  <video controls autoPlay src={previewMedia.url} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 'var(--radius-sm)' }}>
                    Your browser does not support HTML5 video.
                  </video>
                </div>
              )}

              {previewMedia.type === 'pdf' && (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 'var(--radius-sm)' }}
                />
              )}

              {previewMedia.type === 'doc' && (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#FFFFFF' }}>
                  <FileText size={54} color="var(--gold-soft)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    Document File Inspection
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                    {previewMedia.title} ({previewMedia.fileSize}). Click below to download the original document to your computer.
                  </p>
                  {previewMedia.assetId && (
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => {
                        if (previewMedia.assetId) {
                          ApiService.downloadAssetFile(previewMedia.assetId, previewMedia.title);
                        }
                      }}
                      style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem' }}
                    >
                      <Download size={14} /> Download Document File
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ON HOLD MODAL (ITIL Service Management)
          ========================================================================= */}
      {showHoldModal && ticketDetail && (
        <div className="modal-backdrop" onClick={() => setShowHoldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangle size={17} color="#B45309" />
                  Put Order Record On Hold
                </h3>
                <button
                  onClick={() => setShowHoldModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={17} />
                </button>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Order: <strong>{ticketDetail.ticket_number}</strong> &bull; Customer: <strong>{ticketDetail.customer_name}</strong>
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="sn-field-label required">Select On Hold Reason</label>
                <select
                  className="sn-field-input"
                  value={modalHoldReason}
                  onChange={(e) => setModalHoldReason(e.target.value)}
                >
                  {ON_HOLD_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="sn-field-label required">Explanation &amp; Blockers Work Note</label>
                <textarea
                  className="sn-field-input"
                  rows={4}
                  placeholder="Document specific customer responses needed, asset issues, or hold reasons..."
                  value={modalHoldNotes}
                  onChange={(e) => setModalHoldNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowHoldModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleConfirmOnHold}
                  disabled={loading || !modalHoldNotes.trim()}
                  style={{ background: '#B45309', color: '#FFFFFF', border: 'none' }}
                >
                  Confirm &amp; Place On Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ORDER RESOLUTION & DELIVERY MODAL
          ========================================================================= */}
      {showCloseModal && ticketDetail && (
        <div className="modal-backdrop" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={17} color="#166534" />
                  Deliver &amp; Resolve Celebration Order
                </h3>
                <button
                  onClick={() => setShowCloseModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={17} />
                </button>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Order: <strong>{ticketDetail.ticket_number}</strong> &bull; Host: <strong>{ticketDetail.customer_name}</strong>
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {closureError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-danger)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertCircle size={15} />
                  <span>{closureError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="sn-field-label required">Delivery Resolution Code</label>
                <select
                  className="sn-field-input"
                  value={closureCode}
                  onChange={(e) => setClosureCode(e.target.value)}
                >
                  <option value="Fulfilled — Invitation Delivered & Live">Fulfilled — Invitation Delivered &amp; Live</option>
                  <option value="Customer Approved & Accepted">Customer Approved &amp; Accepted</option>
                  <option value="Delivered with Custom Adjustments">Delivered with Custom Adjustments</option>
                  <option value="Cancelled by Customer Request">Cancelled by Customer Request</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="sn-field-label required">Resolution / Delivery Work Notes</label>
                <textarea
                  className="sn-field-input"
                  rows={4}
                  placeholder="Document specific deliverables delivered, finalized URL, and customer sign-off details..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  These work notes will be permanently logged into the order's immutable history.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
                  Confirm &amp; Complete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
