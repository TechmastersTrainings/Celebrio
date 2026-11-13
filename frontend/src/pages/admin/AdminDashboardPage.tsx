import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  AdminMetrics,
  TicketSummary,
  CentralActivityLogItem,
  AdminUserItem,
  AdminPaymentItem,
  AdminFinancialsData,
  Coupon,
  CallbackRequest,
  OrderDetail,
} from '../../types';
import {
  Sparkles,
  RefreshCw,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  DollarSign,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  Video,
  Clock,
  Eye,
  Send,
  Sliders,
  Check,
  Trash2,
  Edit3,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  PlusCircle,
  ArrowRight,
  X,
  Gift,
  PhoneCall,
  Tag,
  Percent,
} from 'lucide-react';

type AdminTab =
  | 'tickets'
  | 'coupons'
  | 'callbacks'
  | 'users'
  | 'developers'
  | 'payments'
  | 'revenue'
  | 'pnl'
  | 'catalog'
  | 'audit';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('tickets');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [financials, setFinancials] = useState<AdminFinancialsData | null>(null);
  const [occasions, setOccasions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<CentralActivityLogItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Filters
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [auditModule, setAuditModule] = useState<string>('');

  // Ticket Status Change Modal State
  const [statusModalTicket, setStatusModalTicket] = useState<TicketSummary | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('WORK_IN_PROGRESS');
  const [statusReason, setStatusReason] = useState<string>('Admin status update');
  const [statusWorkNotes, setStatusWorkNotes] = useState<string>('');

  // Reassignment Modal State
  const [reassignTicketId, setReassignTicketId] = useState<string | null>(null);
  const [targetDevId, setTargetDevId] = useState<string>('');

  // Publishing Authorization Modal State
  const [publishOrderRef, setPublishOrderRef] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState<string>('');
  const [graceDays, setGraceDays] = useState<number>(30);

  // Manual Payment Verification Modal State
  const [showManualPayModal, setShowManualPayModal] = useState<boolean>(false);
  const [manualPayOrderRef, setManualPayOrderRef] = useState<string>('');
  const [manualPayMethod, setManualPayMethod] = useState<string>('UPI_OFFLINE');
  const [manualPayNotes, setManualPayNotes] = useState<string>('Verified bank/UPI receipt');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editPassword, setEditPassword] = useState<string>('');
  const [editMaxTickets, setEditMaxTickets] = useState<number>(3);
  const [editCanVideo, setEditCanVideo] = useState<boolean>(false);

  // Coupon Management State
  const [showCouponModal, setShowCouponModal] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponDescInput, setCouponDescInput] = useState('');
  const [couponTypeInput, setCouponTypeInput] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [couponValueInput, setCouponValueInput] = useState('15');
  const [couponMinOrderInput, setCouponMinOrderInput] = useState('0');
  const [couponMaxDiscInput, setCouponMaxDiscInput] = useState('');
  const [couponCombineAuto, setCouponCombineAuto] = useState(false);
  const [couponIsPublic, setCouponIsPublic] = useState(true);

  // Order Requirements Review Modal State
  const [reviewOrder, setReviewOrder] = useState<OrderDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // P&L Parameters
  const [devPayoutPct, setDevPayoutPct] = useState<number>(35);
  const [gatewayFeePct, setGatewayFeePct] = useState<number>(2);
  const [fixedOverhead, setFixedOverhead] = useState<number>(1500);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, t, u, devs, p, f, occs, logs, cList, cbList] = await Promise.all([
        ApiService.getAdminMetrics().catch(() => null),
        ApiService.getAdminTickets().catch(() => []),
        ApiService.getAdminUsers().catch(() => []),
        ApiService.getAdminDevelopers().catch(() => []),
        ApiService.getAdminPayments().catch(() => []),
        ApiService.getAdminFinancials(devPayoutPct, gatewayFeePct, fixedOverhead).catch(() => null),
        ApiService.getOccasions().catch(() => []),
        ApiService.getAuditLogs().catch(() => []),
        ApiService.getAdminCoupons().catch(() => []),
        ApiService.getAdminCallbacks().catch(() => []),
      ]);

      if (m) setMetrics(m as AdminMetrics);
      setTickets((t as TicketSummary[]) || []);
      setUsers((u as AdminUserItem[]) || []);
      setDevelopers((devs as any[]) || []);
      setPayments((p as AdminPaymentItem[]) || []);
      if (f) setFinancials(f as AdminFinancialsData);
      setOccasions((occs as any[]) || []);
      setAuditLogs((logs as CentralActivityLogItem[]) || []);
      setCoupons((cList as Coupon[]) || []);
      setCallbacks((cbList as CallbackRequest[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load Admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  // --- COUPON HANDLERS ---
  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponCodeInput('');
    setCouponDescInput('');
    setCouponTypeInput('PERCENTAGE');
    setCouponValueInput('15');
    setCouponMinOrderInput('0');
    setCouponMaxDiscInput('');
    setCouponCombineAuto(false);
    setCouponIsPublic(true);
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setCouponCodeInput(c.code);
    setCouponDescInput(c.description);
    setCouponTypeInput(c.discount_type);
    setCouponValueInput(c.discount_value);
    setCouponMinOrderInput(c.min_order_value);
    setCouponMaxDiscInput(c.max_discount_amount || '');
    setCouponCombineAuto(c.can_combine_with_auto_discount);
    setCouponIsPublic(c.is_public);
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setError('Coupon code is required.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        code: couponCodeInput.trim().toUpperCase(),
        description: couponDescInput.trim(),
        discount_type: couponTypeInput,
        discount_value: parseFloat(couponValueInput) || 0,
        min_order_value: parseFloat(couponMinOrderInput) || 0,
        max_discount_amount: couponMaxDiscInput ? parseFloat(couponMaxDiscInput) : null,
        can_combine_with_auto_discount: couponCombineAuto,
        is_public: couponIsPublic,
        is_active: true,
      };

      if (editingCoupon && editingCoupon.id) {
        await ApiService.updateAdminCoupon(editingCoupon.id, payload);
        setActionMsg(`Coupon ${payload.code} updated successfully.`);
      } else {
        await ApiService.createAdminCoupon(payload);
        setActionMsg(`Coupon ${payload.code} created successfully.`);
      }
      setShowCouponModal(false);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCouponActive = async (c: Coupon) => {
    try {
      setLoading(true);
      await ApiService.updateAdminCoupon(c.id, { is_active: !c.is_active });
      setActionMsg(`Coupon ${c.code} ${!c.is_active ? 'activated' : 'deactivated'}.`);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (c: Coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${c.code}?`)) return;
    try {
      setLoading(true);
      await ApiService.deleteAdminCoupon(c.id);
      setActionMsg(`Coupon ${c.code} deleted.`);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete coupon');
    } finally {
      setLoading(false);
    }
  };

  // --- CALLBACK HANDLERS ---
  const handleUpdateCallbackStatus = async (callbackId: string, status: string, notes?: string) => {
    try {
      setLoading(true);
      await ApiService.updateAdminCallback(callbackId, { status, admin_notes: notes });
      setActionMsg('Callback status updated.');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update callback status');
    } finally {
      setLoading(false);
    }
  };

  // --- ORDER REQUIREMENTS REVIEW HANDLERS ---
  const handleOpenOrderReview = async (t: TicketSummary) => {
    try {
      setReviewLoading(true);
      const orderRef = t.order_reference || t.ticket_number;
      const detail: any = await ApiService.getTicketDetail(orderRef);
      setReviewOrder(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleConfirmOrderRequirements = async (isReadyForProduction: boolean) => {
    if (!reviewOrder) return;
    try {
      setLoading(true);
      await ApiService.updateOrderMissingInfo(reviewOrder.order_reference, {
        is_information_confirmed: true,
        is_ready_for_production: isReadyForProduction,
      });
      setActionMsg(`Requirements confirmed for order ${reviewOrder.order_reference}${isReadyForProduction ? ' and approved for production' : ''}.`);
      setReviewOrder(null);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update Financials when P&L inputs change
  const reloadFinancials = async (devPct: number, gwPct: number, overhead: number) => {
    try {
      const f: any = await ApiService.getAdminFinancials(devPct, gwPct, overhead);
      if (f) setFinancials(f);
    } catch (e) {
      // ignore
    }
  };

  // --- TICKET HANDLERS ---
  const handleUpdateTicketStatus = async () => {
    if (!statusModalTicket) return;
    try {
      setLoading(true);
      const res: any = await ApiService.updateAdminTicketStatus(
        statusModalTicket.id,
        targetStatus,
        statusReason,
        statusWorkNotes
      );
      setActionMsg(res.message || `Ticket moved to ${targetStatus}`);
      setStatusModalTicket(null);
      setStatusWorkNotes('');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${ticketNumber} and its order?`)) {
      return;
    }
    try {
      setLoading(true);
      const res: any = await ApiService.deleteAdminTicket(ticketId);
      setActionMsg(res.message || 'Ticket deleted');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignTicketId || !targetDevId) return;
    try {
      setLoading(true);
      const res: any = await ApiService.reassignTicket(reassignTicketId, targetDevId);
      setActionMsg(res.message);
      setReassignTicketId(null);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Reassignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (ticketId: string) => {
    try {
      setLoading(true);
      const res: any = await ApiService.releaseTicket(ticketId);
      setActionMsg(res.message);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Release to queue failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizePublish = async () => {
    if (!publishOrderRef) return;
    try {
      setLoading(true);
      const res: any = await ApiService.authorizePublishing(publishOrderRef, customSlug || undefined, graceDays);
      setActionMsg(res.message || 'Celebration published and live!');
      setPublishOrderRef(null);
      setCustomSlug('');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Publishing authorization failed');
    } finally {
      setLoading(false);
    }
  };

  // --- USER HANDLERS ---
  const handleOpenEditUser = (u: AdminUserItem) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditActive(u.is_active);
    setEditPassword('');
    setEditMaxTickets(u.developer_profile?.max_active_tickets || 3);
    setEditCanVideo(u.developer_profile?.can_produce_video || false);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      setLoading(true);
      const payload: any = {
        role: editRole,
        is_active: editActive,
        max_active_tickets: editMaxTickets,
        can_produce_video: editCanVideo,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      const res: any = await ApiService.updateAdminUser(editingUser.id, payload);
      setActionMsg(res.message || 'User updated successfully');
      setEditingUser(null);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (u: AdminUserItem) => {
    if (!window.confirm(`Are you sure you want to delete user ${u.email || u.full_name}?`)) {
      return;
    }
    try {
      setLoading(true);
      const res: any = await ApiService.deleteAdminUser(u.id);
      setActionMsg(res.message || 'User deleted');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // --- DEVELOPER GOVERNANCE HANDLERS ---
  const handleDeveloperAction = async (userId: string, action: string, canVideo?: boolean, maxTickets?: number) => {
    try {
      setLoading(true);
      const res: any = await ApiService.updateDeveloperStatus(userId, action, canVideo, maxTickets);
      setActionMsg(res.message);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Developer action failed');
    } finally {
      setLoading(false);
    }
  };

  // --- PAYMENT HANDLERS ---
  const handleManualMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayOrderRef.trim()) return;
    try {
      setLoading(true);
      const res: any = await ApiService.markAdminPaymentPaid(
        manualPayOrderRef.trim(),
        manualPayMethod,
        manualPayNotes
      );
      setActionMsg(res.message || `Payment verified for ${manualPayOrderRef}!`);
      setShowManualPayModal(false);
      setManualPayOrderRef('');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to record manual payment');
    } finally {
      setLoading(false);
    }
  };

  // --- PRICING HANDLER ---
  const handlePriceUpdate = async (packageId: string, newPrice: number) => {
    try {
      setLoading(true);
      await ApiService.updatePackagePrice(packageId, newPrice);
      setActionMsg(`Package price updated to ₹${newPrice}!`);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Price update failed');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter === 'ALL') return true;
    return t.status === ticketStatusFilter;
  });

  // Filtered Users — EXCLUDE developers from User Management (they belong in Developer Governance)
  const nonDevUsers = users.filter(u => !['DEV_ACTIVE', 'DEV_VIDEO'].includes(u.role));
  const filteredUsers = nonDevUsers.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const q = userSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone_number && u.phone_number.includes(q));
    return matchesRole && matchesSearch;
  });

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (paymentStatusFilter === 'ALL') return true;
    return p.status === paymentStatusFilter;
  });

  // Filtered Audit Logs
  const filteredLogs = auditModule
    ? auditLogs.filter((log) => log.module === auditModule)
    : auditLogs;

  const activeDevUsers = users.filter(
    (u) =>
      u.role === 'DEV_ACTIVE' ||
      u.role === 'DEV_VIDEO' ||
      u.role === 'SUPER_ADMIN' ||
      u.role === 'OPS_ADMIN'
  );

  return (
    <div className="admin-console-wrapper">
      {/* Left Sidebar Menu */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-badge">
            <ShieldCheck size={13} style={{ color: 'var(--gold-soft)' }} />
            <span>SUPER ADMIN</span>
          </div>
          <h2 className="admin-sidebar-title">Central Governance</h2>
          <span className="admin-sidebar-user">techmastersinnovations@gmail.com</span>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-sidebar-nav">
          <button
            className={`admin-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <div className="admin-nav-icon"><Layers size={16} /></div>
            <span className="admin-nav-label">Tickets</span>
            <span className="admin-nav-badge">{tickets.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <div className="admin-nav-icon"><Gift size={16} /></div>
            <span className="admin-nav-label">Coupons &amp; Offers</span>
            <span className="admin-nav-badge">{coupons.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'callbacks' ? 'active' : ''}`}
            onClick={() => setActiveTab('callbacks')}
          >
            <div className="admin-nav-icon"><PhoneCall size={16} /></div>
            <span className="admin-nav-label">Customer Callbacks</span>
            <span className="admin-nav-badge">{callbacks.filter(c => c.status !== 'RESOLVED').length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <div className="admin-nav-icon"><Users size={16} /></div>
            <span className="admin-nav-label">User Management</span>
            <span className="admin-nav-badge">{users.filter(u => !['DEV_ACTIVE', 'DEV_VIDEO'].includes(u.role)).length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'developers' ? 'active' : ''}`}
            onClick={() => setActiveTab('developers')}
          >
            <div className="admin-nav-icon"><UserCheck size={16} /></div>
            <span className="admin-nav-label">Developer Governance</span>
            <span className="admin-nav-badge">{developers.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <div className="admin-nav-icon"><CreditCard size={16} /></div>
            <span className="admin-nav-label">Payment Operations</span>
            <span className="admin-nav-badge">{payments.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <div className="admin-nav-icon"><DollarSign size={16} /></div>
            <span className="admin-nav-label">Revenue Telemetry</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'pnl' ? 'active' : ''}`}
            onClick={() => setActiveTab('pnl')}
          >
            <div className="admin-nav-icon"><TrendingUp size={16} /></div>
            <span className="admin-nav-label">Profit &amp; Loss (P&amp;L)</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <div className="admin-nav-icon"><Sliders size={16} /></div>
            <span className="admin-nav-label">Catalog &amp; Pricing</span>
            <span className="admin-nav-badge">{occasions.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <div className="admin-nav-icon"><FileText size={16} /></div>
            <span className="admin-nav-label">Audit Trail</span>
            <span className="admin-nav-badge">{auditLogs.length}</span>
          </button>
        </nav>

        {/* Sidebar Actions */}
        <div className="admin-sidebar-footer">
          <button
            className="btn btn-navy btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
            onClick={() => setShowManualPayModal(true)}
          >
            <CreditCard size={14} /> Record Payment
          </button>
          <button
            className="btn btn-outline btn-sm"
            style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#CBD5E1', borderColor: 'rgba(255,255,255,0.15)' }}
            onClick={loadAll}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Admin Title Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span className="editorial-kicker">TECHMASTERS CENTRAL GOVERNANCE</span>
            <h1 style={{ fontSize: '1.9rem', color: 'var(--navy-deep)', margin: '0.2rem 0' }}>
              {activeTab === 'tickets' && 'Production Tickets Console'}
              {activeTab === 'coupons' && 'Coupons & Promotional Offers Management'}
              {activeTab === 'callbacks' && 'Customer Support & Callback Requests Queue'}
              {activeTab === 'users' && 'Staff & Customer User Directory'}
              {activeTab === 'developers' && 'Developer Artisan Governance'}
              {activeTab === 'payments' && 'Payment Verification & Audit'}
              {activeTab === 'revenue' && 'Revenue & Financial Telemetry'}
              {activeTab === 'pnl' && 'Profit & Loss Statement (P&L)'}
              {activeTab === 'catalog' && 'Celebration Catalog & Package Pricing'}
              {activeTab === 'audit' && 'Immutable System Activity Logs'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Enterprise Operations Control &bull; Super Admin: techmastersinnovations@gmail.com
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-navy btn-sm"
              onClick={() => setShowManualPayModal(true)}
              title="Record offline payment or verify order payment"
            >
              <CreditCard size={14} /> Record Payment
            </button>
            <button className="btn btn-outline btn-sm" onClick={loadAll} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
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

        {/* KPI Metrics Dashboard Cards */}
        {metrics && (() => {
          const nonDevUsers = users.filter(u => !['DEV_ACTIVE', 'DEV_VIDEO'].includes(u.role));
          return (
          <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Total Orders
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--navy-deep)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {metrics.total_orders}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {metrics.unassigned_fifo_queue} In Queue &bull; {metrics.closed_tickets} Delivered
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid var(--gold-primary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Customers
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {nonDevUsers.length}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Registered customer accounts
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid #0284C7' }}>
              <span style={{ fontSize: '0.75rem', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Active Developers
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0284C7', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {metrics.active_developers}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {metrics.pending_developer_approvals} Pending Approval
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid #166534' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Gross Revenue (Settled)
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#166534', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                ₹{metrics.total_revenue_inr}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {metrics.payment_done + metrics.closed_tickets} Paid Orders
              </span>
            </div>
          </div>
          );
        })()}

      {/* =========================================================================
          TAB 1: TICKET MANAGEMENT & OPERATIONS
          ========================================================================= */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['ALL', 'NEW_OPEN', 'ASSIGNED', 'WORK_IN_PROGRESS', 'AWAITING_CUSTOMER_RESPONSE', 'AWAITING_PAYMENT', 'PAYMENT_DONE', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${ticketStatusFilter === st ? 'btn-navy' : 'btn-outline'}`}
                  onClick={() => setTicketStatusFilter(st)}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket / Order</th>
                  <th>Occasion &amp; Package</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Assigned Developer</th>
                  <th>Superman Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>
                        {t.ticket_number}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.order_reference || t.ticket_number}</div>
                    </td>
                    <td>
                      <div><strong>{t.occasion_name || t.occasion}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.package_name}</div>
                    </td>
                    <td>{t.customer_name}</td>
                    <td>
                      <span className={`badge ${t.status === 'CLOSED' ? 'badge-published' : t.status === 'PAYMENT_DONE' ? 'badge-approved' : 'badge-wip'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.assigned_developer ? (
                        <strong>{t.assigned_developer_name || t.assigned_developer}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned (In Queue)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* Review Requirements & Missing Info */}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--gold-primary)', color: 'var(--burgundy-rich)' }}
                          onClick={() => handleOpenOrderReview(t)}
                          title="Review physical card, OCR extractions, and missing info"
                        >
                          <Eye size={13} /> Review Requirements
                        </button>

                        {/* Quick Change Status */}
                        <button
                          className="btn btn-navy btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setStatusModalTicket(t);
                            setTargetStatus(t.status);
                            setStatusReason('Admin manual status override');
                          }}
                          title="Override ticket status directly"
                        >
                          <Edit3 size={13} /> Change Status
                        </button>

                        {/* Reassign / Assign */}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setReassignTicketId(t.id);
                            setTargetDevId(activeDevUsers[0]?.id || '');
                          }}
                          title="Assign or reassign developer"
                        >
                          <Users size={13} /> Reassign
                        </button>

                        {/* Release if assigned */}
                        {t.assigned_developer && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#B45309' }}
                            onClick={() => handleRelease(t.id)}
                            title="Release back to open production queue"
                          >
                            Release
                          </button>
                        )}

                        {/* Authorize Publishing if Payment Done */}
                        {(t.status === 'PAYMENT_DONE' || t.status === 'CLOSED') && (
                          <button
                            className="btn btn-gold btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setPublishOrderRef(t.order_reference || t.ticket_number);
                              setCustomSlug('');
                            }}
                            title="Authorize live celebration URL and QR code"
                          >
                            <Sparkles size={13} /> Publish Live
                          </button>
                        )}

                        {/* Delete Ticket */}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.3rem 0.5rem', color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteTicket(t.id, t.ticket_number)}
                          title="Delete ticket & order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No tickets matching this status filter. Submit an order from the website to test!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1.5: COUPONS & PROMOTIONAL OFFERS MANAGEMENT
          ========================================================================= */}
      {activeTab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="editorial-kicker">PROMOTIONAL CAMPAIGNS &bull; DISCOUNT CONTROLS</span>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-deep)', margin: '0.2rem 0' }}>
                Coupons &amp; Promotional Offers
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                Configure celebration discounts, public marketing promo codes, and default percentage offers.
              </p>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreateCoupon}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={14} /> Create New Coupon
            </button>
          </div>

          {/* Default 12% Auto-Offer Info Card */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Percent size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#166534', display: 'block' }}>
                  System Default 12% Celebration Offer (Active)
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#15803D' }}>
                  Automatically applied to all eligible orders without requiring a promo code. Saved in quotation snapshot.
                </span>
              </div>
            </div>
            <span className="badge badge-approved">SYSTEM ACTIVE</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Stacking</th>
                  <th>Redemptions</th>
                  <th>Public Visibility</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Tag size={13} /> {c.code}
                      </strong>
                      {c.is_system_default_offer && (
                        <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 600 }}>Default 12% Offer</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                      {c.description || 'Celebration Promo'}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--navy-deep)' }}>
                        {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </strong>
                    </td>
                    <td>₹{c.min_order_value}</td>
                    <td>
                      <span className={`badge ${c.can_combine_with_auto_discount ? 'badge-assigned' : 'badge-new'}`}>
                        {c.can_combine_with_auto_discount ? 'Stacks with 12%' : 'Standalone'}
                      </span>
                    </td>
                    <td>
                      <strong>{c.current_usage_count || 0}</strong> {c.total_usage_limit ? `/ ${c.total_usage_limit}` : ''}
                    </td>
                    <td>
                      <span className={`badge ${c.is_public ? 'badge-published' : 'badge-assigned'}`}>
                        {c.is_public ? 'Public Website' : 'Internal Only'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${c.is_active ? 'badge-approved' : 'badge-new'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={() => handleToggleCouponActive(c)}
                        title="Click to toggle active status"
                      >
                        {c.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEditCoupon(c)}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        {!c.is_system_default_offer && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteCoupon(c)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No promotional coupons configured yet. Click "Create New Coupon" to add one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1.75: CUSTOMER CALLBACKS QUEUE
          ========================================================================= */}
      {activeTab === 'callbacks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="editorial-kicker">CUSTOMER SERVICE OPERATIONS &bull; ASSISTANCE LOGS</span>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-deep)', margin: '0.2rem 0' }}>
                Customer Callback Requests
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                Respond to customers needing help with cards, photos, packages, or order completion.
              </p>
            </div>

            <button className="btn btn-outline btn-sm" onClick={loadAll}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Customer Name</th>
                  <th>Contact Mobile</th>
                  <th>Preferred Time</th>
                  <th>Assistance Required</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.map((cb) => (
                  <tr key={cb.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(cb.created_at).toLocaleString()}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--navy-deep)' }}>{cb.customer_name}</strong>
                    </td>
                    <td>
                      <a
                        href={`tel:${cb.customer_mobile}`}
                        style={{ color: 'var(--burgundy-rich)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <PhoneCall size={12} /> {cb.customer_mobile}
                      </a>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{cb.preferred_callback_time}</td>
                    <td style={{ fontSize: '0.82rem', color: '#334155', maxWidth: '280px' }}>
                      {cb.assistance_required}
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={cb.status}
                        onChange={(e) => handleUpdateCallbackStatus(cb.id, e.target.value)}
                        style={{ height: '30px', padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="REQUESTED">REQUESTED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="FOLLOWUP_REQUIRED">FOLLOWUP_REQUIRED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`https://wa.me/91${cb.customer_mobile.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cb.customer_name)}%2C%20this%20is%20TechMasters%20Digital%20Services%20following%20up%20on%20your%20invitation%20request.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#16A34A', borderColor: '#BBF7D0' }}
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}

                {callbacks.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No callback requests pending. All customer inquiries are up to date!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: USER MANAGEMENT
          ========================================================================= */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  placeholder="Search name, email, phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '180px', fontSize: '0.85rem' }}
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
                <option value="OPS_ADMIN">Operations Administrator</option>
                <option value="AUTH_CUSTOMER">Verified Customer</option>
                <option value="ANON_GUEST">Guest User</option>
              </select>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredUsers.length} customer{filteredUsers.length !== 1 ? 's' : ''} &bull; Developers managed separately in Developer Governance
            </span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Email &amp; Mobile</th>
                  <th>Role</th>
                  <th>Staff / Superuser</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.full_name}</strong>
                    </td>
                    <td>
                      <div>{u.email || <span style={{ color: 'var(--text-muted)' }}>No Email</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone_number || ''}</div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'badge-primary' : u.role === 'DEV_ACTIVE' ? 'badge-approved' : 'badge-wip'}`}>
                        {u.role_display || u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {u.is_superuser ? 'Superuser 🛡️' : u.is_staff ? 'Staff Member' : 'Regular User'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: u.is_active ? '#166534' : 'var(--color-danger)', fontWeight: 600 }}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-navy btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit user role, active status, and password"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.3rem 0.5rem', color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteUser(u)}
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No users match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DEVELOPER GOVERNANCE & APPROVALS
          ========================================================================= */}
      {activeTab === 'developers' && (
        <div>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '1rem 1.5rem', flex: '1 1 160px', borderTop: '3px solid #166534' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#166534', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Approved</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: '#166534' }}>
                {developers.filter(d => d.developer_profile?.approval_status === 'APPROVED_ACTIVE').length}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem 1.5rem', flex: '1 1 160px', borderTop: '3px solid #B45309' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#B45309', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Pending Review</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: '#B45309' }}>
                {developers.filter(d => d.developer_profile?.approval_status === 'PENDING_APPROVAL').length}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem 1.5rem', flex: '1 1 160px', borderTop: '3px solid #DC2626' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#DC2626', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Suspended / Rejected</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: '#DC2626' }}>
                {developers.filter(d => ['SUSPENDED', 'REJECTED'].includes(d.developer_profile?.approval_status)).length}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem 1.5rem', flex: '1 1 160px' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Total Developers</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)' }}>
                {developers.length}
              </div>
            </div>
          </div>

          {/* Developer Cards Grid */}
          {developers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
              <UserCheck size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No developer applications found. When developers register, they appear here for review.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {developers.map((dev) => {
                const status = dev.developer_profile?.approval_status || 'PENDING_APPROVAL';
                const isApproved = status === 'APPROVED_ACTIVE';
                const isPending = status === 'PENDING_APPROVAL';
                const isSuspended = status === 'SUSPENDED';
                const statusColor = isApproved ? '#166534' : isPending ? '#B45309' : '#DC2626';
                const statusBg = isApproved ? '#F0FDF4' : isPending ? '#FFFBEB' : '#FEF2F2';

                return (
                  <div
                    key={dev.id}
                    className="card"
                    style={{ padding: '1.5rem', borderTop: `3px solid ${statusColor}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    {/* Developer Identity */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-deep)' }}>{dev.full_name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{dev.email}</div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                          padding: '3px 10px', borderRadius: '20px',
                          background: statusBg, color: statusColor,
                          textTransform: 'uppercase', whiteSpace: 'nowrap'
                        }}
                      >
                        {isApproved ? 'Active' : isPending ? 'Pending' : isSuspended ? 'Suspended' : 'Rejected'}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>🎨 {dev.developer_profile?.can_produce_video ? 'Video + Graphic' : 'Graphic & Web'}</span>
                      <span>📋 Max {dev.developer_profile?.max_active_tickets || 3} orders</span>
                      {dev.created_at && (
                        <span>🗓 Joined {new Date(dev.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                      {!isApproved && (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#166534', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => handleDeveloperAction(dev.id, 'APPROVE')}
                          disabled={loading}
                        >
                          <Check size={13} /> Approve
                        </button>
                      )}

                      {isApproved && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: '#B45309', borderColor: '#B45309', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                          onClick={() => handleDeveloperAction(dev.id, 'SUSPEND')}
                          disabled={loading}
                        >
                          Suspend
                        </button>
                      )}

                      {isSuspended && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: '#166534', borderColor: '#166534', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                          onClick={() => handleDeveloperAction(dev.id, 'APPROVE')}
                          disabled={loading}
                        >
                          Re-activate
                        </button>
                      )}

                      {isPending && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: '#DC2626', borderColor: '#DC2626', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                          onClick={() => handleDeveloperAction(dev.id, 'REJECT')}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--color-danger)', padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginLeft: 'auto' }}
                        onClick={() => {
                          if (window.confirm(`Delete developer ${dev.full_name}? This cannot be undone.`)) {
                            handleDeleteUser(dev);
                          }
                        }}
                        disabled={loading}
                        title="Permanently delete developer account"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: PAYMENT MANAGEMENT
          ========================================================================= */}
      {activeTab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'PAID', 'CREATED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${paymentStatusFilter === st ? 'btn-navy' : 'btn-outline'}`}
                  onClick={() => setPaymentStatusFilter(st)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              className="btn btn-navy btn-sm"
              onClick={() => setShowManualPayModal(true)}
            >
              <PlusCircle size={14} /> Record / Verify Payment
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Occasion &amp; Package</th>
                  <th>Amount (INR)</th>
                  <th>Status</th>
                  <th>Gateway Details</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)' }}>
                        {p.order_reference}
                      </strong>
                    </td>
                    <td>
                      <div><strong>{p.customer_name}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customer_email || p.customer_phone}</div>
                    </td>
                    <td>
                      <div>{p.occasion}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.package_name}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.05rem', color: p.status === 'PAID' ? '#166534' : 'inherit' }}>
                        ₹{p.amount_inr}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'PAID' ? 'badge-approved' : 'badge-pending'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}><strong>{p.gateway_provider}</strong></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Order: {p.gateway_order_id}
                        {p.gateway_payment_id && ` | Pay: ${p.gateway_payment_id}`}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No payment records found. Payments completed by users or marked via "Record Payment" appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: REVENUE TELEMETRY
          ========================================================================= */}
      {activeTab === 'revenue' && financials && (
        <div>
          <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', borderTop: '3px solid #166534' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                Total Gross Revenue
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, color: '#166534', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                ₹{financials.revenue.gross_revenue_inr}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                Collected across all completed transactions
              </span>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Paid Order Volume
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--navy-deep)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {financials.revenue.paid_orders_count}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                Orders settled via payment gateway or manual approval
              </span>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Average Order Value (AOV)
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                ₹{financials.revenue.average_order_value_inr}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                Revenue per settled celebration package
              </span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--navy-deep)' }}>
                Revenue by Occasion Category
              </h3>
              {financials.revenue.by_occasion.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {financials.revenue.by_occasion.map((item) => (
                    <div key={item.occasion} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                      <strong>{item.occasion}</strong>
                      <span style={{ fontWeight: 700, color: '#166534' }}>₹{item.amount_inr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No settled transactions recorded yet.</p>
              )}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--navy-deep)' }}>
                Revenue by Package Tier
              </h3>
              {financials.revenue.by_package.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {financials.revenue.by_package.map((item) => (
                    <div key={item.package} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                      <strong>{item.package}</strong>
                      <span style={{ fontWeight: 700, color: '#166534' }}>₹{item.amount_inr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No settled transactions recorded yet.</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--navy-deep)' }}>
              Recent Settled Transactions
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Order Reference</th>
                    <th>Customer</th>
                    <th>Occasion</th>
                    <th>Settled Amount</th>
                    <th>Verified At</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.revenue.recent_transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.gateway_payment_id}</td>
                      <td><strong>{tx.order_reference}</strong></td>
                      <td>{tx.customer_name}</td>
                      <td>{tx.occasion}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>₹{tx.amount_inr}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(tx.verified_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {financials.revenue.recent_transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: PROFIT AND LOSS (P&L) STATEMENT
          ========================================================================= */}
      {activeTab === 'pnl' && financials && (
        <div>
          {/* P&L Cost Assumption Controls */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: 'var(--bg-cream)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span className="editorial-kicker">FINANCIAL MARGIN MODELING &bull; ADJUSTABLE PARAMETERS</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => reloadFinancials(devPayoutPct, gatewayFeePct, fixedOverhead)}
              >
                Recalculate Statement
              </button>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Developer Compensation Payout (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={devPayoutPct}
                  onChange={(e) => setDevPayoutPct(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Gateway Processing Fee (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={gatewayFeePct}
                  onChange={(e) => setGatewayFeePct(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={10}
                  step={0.1}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Fixed Monthly Overhead (₹ Server/Domain)</label>
                <input
                  type="number"
                  className="form-control"
                  value={fixedOverhead}
                  onChange={(e) => setFixedOverhead(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Formal P&L Statement Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-deep)', margin: 0, fontFamily: 'var(--font-serif)' }}>
                TechMasters Digital Celebrations &bull; Profit &amp; Loss Statement
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Bidar Operations &bull; Real-time GAAP/ITIL synchronized ledger
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <tbody>
                {/* 1. REVENUE */}
                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy-deep)' }}>
                    1. GROSS OPERATING REVENUE
                  </td>
                  <td style={{ padding: '0.85rem', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: '#166534' }}>
                    ₹{financials.profit_and_loss.gross_revenue_inr}
                  </td>
                </tr>

                {/* 2. COGS */}
                <tr>
                  <td style={{ padding: '0.85rem 0.85rem 0.35rem', fontWeight: 600, color: '#B91C1C' }}>
                    2. COST OF GOODS SOLD (COGS) &bull; DIRECT DELIVERY
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.35rem 1.5rem', color: 'var(--text-muted)' }}>
                    &bull; Developer &amp; Artisan Payout ({financials.profit_and_loss.cogs.dev_payout_pct}%)
                  </td>
                  <td style={{ padding: '0.35rem 0.85rem', textAlign: 'right', color: '#B91C1C' }}>
                    - ₹{financials.profit_and_loss.cogs.developer_payouts_inr}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.35rem 1.5rem', color: 'var(--text-muted)' }}>
                    &bull; Payment Gateway Processing Fees ({financials.profit_and_loss.cogs.gateway_fee_pct}%)
                  </td>
                  <td style={{ padding: '0.35rem 0.85rem', textAlign: 'right', color: '#B91C1C' }}>
                    - ₹{financials.profit_and_loss.cogs.gateway_processing_fees_inr}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.35rem 1.5rem', color: 'var(--text-muted)' }}>
                    &bull; Cloudflare R2 Media Vault &amp; SMS Gateway Delivery (₹50/order)
                  </td>
                  <td style={{ padding: '0.35rem 0.85rem', textAlign: 'right', color: '#B91C1C' }}>
                    - ₹{financials.profit_and_loss.cogs.cloud_and_sms_delivery_inr}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.5rem 1.5rem 0.85rem', fontWeight: 600, color: 'var(--text-body)' }}>
                    Total Direct Delivery Costs (COGS)
                  </td>
                  <td style={{ padding: '0.5rem 0.85rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#B91C1C' }}>
                    - ₹{financials.profit_and_loss.cogs.total_cogs_inr}
                  </td>
                </tr>

                {/* 3. GROSS PROFIT */}
                <tr style={{ background: '#F0FDF4', borderBottom: '2px solid #BBF7D0' }}>
                  <td style={{ padding: '0.85rem', fontWeight: 700, fontSize: '1.05rem', color: '#166534' }}>
                    3. GROSS PROFIT (Gross Revenue - COGS)
                  </td>
                  <td style={{ padding: '0.85rem', textAlign: 'right', fontWeight: 700, fontSize: '1.15rem', color: '#166534' }}>
                    ₹{financials.profit_and_loss.gross_profit_inr}
                  </td>
                </tr>

                {/* 4. OPEX */}
                <tr>
                  <td style={{ padding: '0.85rem 0.85rem 0.35rem', fontWeight: 600, color: '#B91C1C' }}>
                    4. OPERATING EXPENSES (OpEx)
                  </td>
                  <td></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.35rem 1.5rem 0.85rem', color: 'var(--text-muted)' }}>
                    &bull; Vercel Server, Infrastructure, Domains &amp; Maintenance
                  </td>
                  <td style={{ padding: '0.35rem 0.85rem 0.85rem', textAlign: 'right', color: '#B91C1C' }}>
                    - ₹{financials.profit_and_loss.opex.fixed_server_and_maintenance_inr}
                  </td>
                </tr>

                {/* 5. NET PROFIT */}
                <tr style={{ background: '#EFF6FF', borderTop: '2px solid #93C5FD' }}>
                  <td style={{ padding: '1rem 0.85rem', fontWeight: 800, fontSize: '1.2rem', color: '#1E40AF' }}>
                    5. NET OPERATING PROFIT (EBITDA)
                  </td>
                  <td style={{ padding: '1rem 0.85rem', textAlign: 'right', fontWeight: 800, fontSize: '1.35rem', color: '#1E40AF' }}>
                    ₹{financials.profit_and_loss.net_profit_inr}
                  </td>
                </tr>

                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Net Profit Margin
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#1E40AF' }}>
                    {financials.profit_and_loss.net_profit_margin_pct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: CATALOG & PRICING
          ========================================================================= */}
      {activeTab === 'catalog' && (
        <div>
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            {occasions.map((occ) => (
              <div key={occ.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--navy-deep)' }}>
                    {occ.display_name}
                  </h3>
                  <span className="badge badge-primary">{occ.packages?.length || 0} Tiers</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {occ.packages?.map((pkg: any) => (
                    <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-ivory)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong>{pkg.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pkg.code} &bull; {pkg.included_revisions} revisions</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--burgundy-rich)' }}>₹{pkg.base_price_inr}</strong>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            const newPrice = prompt(`Enter new price in INR for ${pkg.name}:`, pkg.base_price_inr);
                            if (newPrice && !isNaN(parseFloat(newPrice))) {
                              handlePriceUpdate(pkg.id, parseFloat(newPrice));
                            }
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: CENTRAL AUDIT TRAIL
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {['', 'ACCOUNTS', 'ORDERS', 'TICKETS', 'ASSIGNMENTS', 'DESIGNS', 'PAYMENTS', 'PUBLISHING'].map((mod) => (
              <button
                key={mod}
                className={`btn btn-sm ${auditModule === mod ? 'btn-navy' : 'btn-outline'}`}
                onClick={() => setAuditModule(mod)}
                style={{ fontSize: '0.75rem' }}
              >
                {mod || 'ALL MODULES'}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>IP Address</th>
                  <th>Remarks / Diff</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td><span className="badge badge-wip">{log.module}</span></td>
                    <td><strong>{log.action}</strong></td>
                    <td>{log.actor_name || 'System'}</td>
                    <td><span style={{ fontSize: '0.75rem' }}>{log.actor_role}</span></td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{log.ip_address || 'Internal'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>{log.remarks || JSON.stringify(log.new_value)}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No audit events recorded for this module filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: TICKET STATUS OVERRIDE
          ========================================================================= */}
      {statusModalTicket && (
        <div className="modal-backdrop" onClick={() => setStatusModalTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)' }}>
                Admin Ticket Status Override
              </h3>
              <button onClick={() => setStatusModalTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Ticket: <strong>{statusModalTicket.ticket_number}</strong> ({statusModalTicket.customer_name})<br />
                Current Status: <span className="badge badge-wip">{statusModalTicket.status}</span>
              </p>

              <div className="form-group">
                <label className="form-label">New Target Status *</label>
                <select
                  className="form-control"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                >
                  <option value="NEW_OPEN">NEW_OPEN (New / Open)</option>
                  <option value="ASSIGNED">ASSIGNED (Assigned to Dev)</option>
                  <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS (Designing)</option>
                  <option value="INTERNAL_REVIEW">INTERNAL_REVIEW (Quality Review)</option>
                  <option value="AWAITING_CUSTOMER_RESPONSE">AWAITING_CUSTOMER_RESPONSE (Preview Ready)</option>
                  <option value="AWAITING_PAYMENT">AWAITING_PAYMENT (Design Approved)</option>
                  <option value="PAYMENT_DONE">PAYMENT_DONE (Payment Confirmed)</option>
                  <option value="CLOSED">CLOSED (Resolved &amp; Delivered)</option>
                  <option value="ON_HOLD">ON_HOLD (Clarification Needed)</option>
                  <option value="CANCELLED">CANCELLED (Order Cancelled)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Status Override</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. User approved design over phone, customer offline payment verified..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Internal Work Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Optional internal log note..."
                  value={statusWorkNotes}
                  onChange={(e) => setStatusWorkNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => setStatusModalTicket(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateTicketStatus} disabled={loading}>
                  Confirm Status Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: USER EDIT MODAL
          ========================================================================= */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)' }}>
                Edit User: {editingUser.full_name}
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">System Role *</label>
                <select
                  className="form-control"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="SUPER_ADMIN">System Super Administrator</option>
                  <option value="OPS_ADMIN">Operations Administrator</option>
                  <option value="AUTH_CUSTOMER">Verified Customer</option>
                  <option value="ANON_GUEST">Anonymous Guest</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <label htmlFor="userActiveCheck" style={{ margin: 0, fontWeight: 600 }}>
                  Account Active (Uncheck to suspend / disable user)
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Reset Password (leave empty to keep unchanged)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="New password..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveUser} disabled={loading}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: MANUAL PAYMENT RECORD MODAL
          ========================================================================= */}
      {showManualPayModal && (
        <div className="modal-backdrop" onClick={() => setShowManualPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)' }}>
                Record Manual / Offline Payment
              </h3>
              <button onClick={() => setShowManualPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualMarkPaid} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Order Reference *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TC-2026-00001"
                  value={manualPayOrderRef}
                  onChange={(e) => setManualPayOrderRef(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-control"
                  value={manualPayMethod}
                  onChange={(e) => setManualPayMethod(e.target.value)}
                >
                  <option value="UPI_OFFLINE">Direct UPI Transfer (GPay / PhonePe / Paytm)</option>
                  <option value="NEFT_IMPS">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="CASH_DIRECT">Cash Payment (Bidar Office)</option>
                  <option value="ADMIN_COMPLIMENTARY">Admin Fee Waiver / Complimentary</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference / Audit Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. UTR #1234567890 verified in bank statement..."
                  value={manualPayNotes}
                  onChange={(e) => setManualPayNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowManualPayModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Verify &amp; Advance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: REASSIGN DEVELOPER MODAL
          ========================================================================= */}
      {reassignTicketId && (
        <div className="modal-backdrop" onClick={() => setReassignTicketId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)' }}>
                Reassign Ticket to Developer
              </h3>
              <button onClick={() => setReassignTicketId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Select Target Developer *</label>
                <select
                  className="form-control"
                  value={targetDevId}
                  onChange={(e) => setTargetDevId(e.target.value)}
                >
                  <option value="">-- Choose Developer --</option>
                  {activeDevUsers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.full_name} ({dev.email}) [{dev.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => setReassignTicketId(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleReassign} disabled={loading || !targetDevId}>
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: AUTHORIZE PUBLISHING MODAL
          ========================================================================= */}
      {publishOrderRef && (
        <div className="modal-backdrop" onClick={() => setPublishOrderRef(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)' }}>
                Authorize Live Celebration Publishing
              </h3>
              <button onClick={() => setPublishOrderRef(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Authorizing publication for order: <strong>{publishOrderRef}</strong>.
                This generates the unbranded live guest invitation path and dynamic QR code pass.
              </p>

              <div className="form-group">
                <label className="form-label">Custom Slug (leave empty for auto-generated clean slug)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. anand-priya-wedding"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Live Hosting Duration (Days after ceremony)</label>
                <input
                  type="number"
                  className="form-control"
                  value={graceDays}
                  onChange={(e) => setGraceDays(parseInt(e.target.value) || 30)}
                  min={7}
                  max={365}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => setPublishOrderRef(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAuthorizePublish} disabled={loading}>
                  <Sparkles size={15} /> Authorize &amp; Launch Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: ORDER REQUIREMENTS & MISSING INFORMATION REVIEW MODAL
          ========================================================================= */}
      {reviewOrder && (
        <div className="modal-backdrop" onClick={() => setReviewOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FileText size={18} color="var(--burgundy-rich)" />
                  Requirements &amp; Missing Information Review
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Order: <strong>{reviewOrder.order_reference}</strong> &bull; Customer: <strong>{reviewOrder.customer_name}</strong>
                </span>
              </div>
              <button onClick={() => setReviewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Completeness & Card Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Completeness Score
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-deep)' }}>
                    {reviewOrder.completeness_score || 50}%
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Status: {reviewOrder.is_ready_for_production ? 'Ready for Production' : 'Information Incomplete / Pending Review'}
                  </span>
                </div>

                <div style={{ background: '#FFFDF9', border: '1px solid var(--gold-border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-accent)', textTransform: 'uppercase' }}>
                    Physical Invitation Card
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: reviewOrder.has_physical_card ? '#166534' : 'var(--navy-deep)', margin: '4px 0' }}>
                    {reviewOrder.has_physical_card ? 'YES — Uploaded Scans Available' : 'NO — Digital Only'}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {reviewOrder.physical_card_notes || 'No physical card notes recorded.'}
                  </span>
                </div>
              </div>

              {/* Uploaded Physical Card Assets */}
              {reviewOrder.assets && reviewOrder.assets.filter(a => a.asset_category?.includes('PHYSICAL_CARD')).length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Uploaded Physical Card Scans (Original Files)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {reviewOrder.assets.filter(a => a.asset_category?.includes('PHYSICAL_CARD')).map((a) => (
                      <a
                        key={a.id}
                        href={a.url || a.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                      >
                        <ExternalLink size={12} /> {a.file_name} ({a.readable_size || 'Scan'})
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted OCR Information */}
              {reviewOrder.ocr_data_json && Object.keys(reviewOrder.ocr_data_json).length > 0 && (
                <div style={{ marginBottom: '1.25rem', background: '#FAF7F2', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-deep)' }}>
                    OCR Information Extraction
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                    {Object.entries(reviewOrder.ocr_data_json).map(([k, item]: [string, any]) => (
                      <div key={k} style={{ padding: '0.35rem 0.5rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{item.label || k}</span>
                        <strong style={{ color: item.status === 'INFORMATION_MISSING' ? 'var(--color-danger)' : 'var(--navy-deep)' }}>
                          {item.value || '(Pending Customer Confirmation)'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Information Checklist */}
              {reviewOrder.missing_fields_json && reviewOrder.missing_fields_json.length > 0 && (
                <div style={{ marginBottom: '1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <strong style={{ color: 'var(--color-danger)', fontSize: '0.86rem', display: 'block', marginBottom: '0.35rem' }}>
                    Pending Missing Information:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#991B1B' }}>
                    {reviewOrder.missing_fields_json.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setReviewOrder(null)}>
                  Close
                </button>
                <button
                  className="btn btn-navy"
                  onClick={() => handleConfirmOrderRequirements(false)}
                  disabled={loading}
                >
                  <Check size={14} style={{ marginRight: '4px' }} /> Mark Information Confirmed
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleConfirmOrderRequirements(true)}
                  disabled={loading}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Confirm &amp; Approve for Production
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: CREATE / EDIT PROMOTIONAL COUPON
          ========================================================================= */}
      {showCouponModal && (
        <div className="modal-backdrop" onClick={() => setShowCouponModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-champagne)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Tag size={17} color="var(--burgundy-rich)" />
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
              </h3>
              <button onClick={() => setShowCouponModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Coupon Code * (Uppercase)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FESTIVE20 / ROYAL100"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description / Offer Details</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 15% Off across all digital celebration invitations"
                  value={couponDescInput}
                  onChange={(e) => setCouponDescInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-control"
                    value={couponTypeInput}
                    onChange={(e: any) => setCouponTypeInput(e.target.value)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Value *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 15 or 100"
                    value={couponValueInput}
                    onChange={(e) => setCouponValueInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Min Order Value (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={couponMinOrderInput}
                    onChange={(e) => setCouponMinOrderInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Discount Cap (₹, optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Leave empty for unlimited"
                    value={couponMaxDiscInput}
                    onChange={(e) => setCouponMaxDiscInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={couponCombineAuto}
                    onChange={(e) => setCouponCombineAuto(e.target.checked)}
                    style={{ accentColor: 'var(--burgundy-rich)' }}
                  />
                  <span>Can combine / stack with default 12% automatic offer</span>
                </label>

                <label style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={couponIsPublic}
                    onChange={(e) => setCouponIsPublic(e.target.checked)}
                    style={{ accentColor: 'var(--burgundy-rich)' }}
                  />
                  <span>Display in public website "Offers &amp; Coupons" section</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCouponModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveCoupon} disabled={loading || !couponCodeInput.trim()}>
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};
