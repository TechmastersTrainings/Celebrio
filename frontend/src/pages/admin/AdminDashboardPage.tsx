import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { AdminMetrics, TicketSummary, CentralActivityLogItem } from '../../types';
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
  Check
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'developers' | 'catalog' | 'audit'>('queue');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<CentralActivityLogItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Reassignment Modal State
  const [reassignTicketId, setReassignTicketId] = useState<string | null>(null);
  const [targetDevId, setTargetDevId] = useState<string>('');

  // Publishing Authorization Modal State
  const [publishOrderRef, setPublishOrderRef] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState<string>('');
  const [graceDays, setGraceDays] = useState<number>(30);

  // Audit filter state
  const [auditModule, setAuditModule] = useState<string>('');

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, t, devs, occs, logs] = await Promise.all([
        ApiService.getAdminMetrics(),
        ApiService.getAdminTickets(),
        ApiService.getAdminDevelopers(),
        ApiService.getOccasions(),
        ApiService.getAuditLogs(),
      ]);
      setMetrics(m as AdminMetrics);
      setTickets(t as TicketSummary[]);
      setDevelopers(devs as any[]);
      setOccasions(occs as any[]);
      setAuditLogs(logs as CentralActivityLogItem[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load Admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

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
      setActionMsg(res.message);
      setPublishOrderRef(null);
      setCustomSlug('');
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Publishing authorization failed');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredLogs = auditModule
    ? auditLogs.filter((log) => log.module === auditModule)
    : auditLogs;

  return (
    <div style={{ maxWidth: '1240px', margin: '3rem auto 5rem', padding: '0 1.5rem' }}>
      {/* Admin Title Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span className="editorial-kicker">TECHMASTERS INNOVATIONS &bull; CENTRAL GOVERNANCE</span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--navy-deep)' }}>
            Admin Operations Command Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '2px' }}>
            Bidar Operations &bull; Real-time queue supervision, developer approval, and immutable audit telemetry.
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadAll}>
          <RefreshCw size={14} /> Refresh Telemetry
        </button>
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
      {metrics && (
        <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Total Orders
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--navy-deep)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
              {metrics.total_orders}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {metrics.unassigned_fifo_queue} Unassigned &bull; {metrics.work_in_progress} In Progress
            </span>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-cream)', borderTop: '3px solid var(--gold-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              Unassigned FIFO Queue
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
              {metrics.unassigned_fifo_queue}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Available for developer self-claim
            </span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Ready for Publication
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
              {metrics.payment_done}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Payment completed; requires Admin authorization
            </span>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              Verified Revenue
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#15803D', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
              ₹{parseFloat(metrics.total_revenue_inr).toFixed(0)}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#166534', marginTop: '4px', display: 'block' }}>
              {metrics.active_developers} Active Developers on duty
            </span>
          </div>
        </div>
      )}

      {/* Admin Module Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => setActiveTab('queue')}
        >
          Queue &amp; Ticket Operations ({tickets.length})
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'developers' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => setActiveTab('developers')}
        >
          Developer Governance &amp; Approvals ({developers.length})
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => setActiveTab('catalog')}
        >
          Catalog &amp; Dynamic Pricing
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          onClick={() => setActiveTab('audit')}
        >
          Central Immutable Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: QUEUE & TICKET OPERATIONS
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket / Order Ref</th>
                  <th>Occasion</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Assigned Artisan</th>
                  <th>Actions &amp; Authorization</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
                        {t.ticket_number}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.order_reference || t.ticket_number}</div>
                    </td>
                    <td>{t.occasion_name || t.occasion}</td>
                    <td>{t.customer_name}</td>
                    <td>
                      <span className={`badge ${t.status === 'DELIVERED' ? 'badge-published' : 'badge-wip'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.assigned_developer ? (
                        <strong>{t.assigned_developer}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned (In FIFO)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {/* Authorize publication if payment done */}
                        {t.status === 'PAYMENT_DONE' && (
                          <button
                            className="btn btn-gold btn-sm"
                            onClick={() => {
                              setPublishOrderRef(t.order_reference || t.ticket_number);
                              setCustomSlug(t.customer_name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-celebration');
                            }}
                          >
                            Authorize Publication
                          </button>
                        )}

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setReassignTicketId(t.id);
                            const firstDev = developers.find((d) => d.is_approved);
                            if (firstDev) setTargetDevId(firstDev.id);
                          }}
                        >
                          Reassign
                        </button>

                        {t.assigned_developer && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRelease(t.id)}
                            title="Return ticket to available FIFO queue"
                          >
                            Release
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DEVELOPER GOVERNANCE & APPROVALS
          ========================================================================= */}
      {activeTab === 'developers' && (
        <div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Developer Name</th>
                  <th>Email</th>
                  <th>Approval Status</th>
                  <th>Active Tickets</th>
                  <th>Video Production</th>
                  <th>Administrative Controls</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((dev) => (
                  <tr key={dev.id}>
                    <td>
                      <strong>{dev.full_name}</strong>
                    </td>
                    <td>{dev.email}</td>
                    <td>
                      <span className={`badge ${dev.is_approved ? 'badge-published' : 'badge-awaiting'}`}>
                        {dev.approval_status || (dev.is_approved ? 'APPROVED' : 'PENDING')}
                      </span>
                    </td>
                    <td>
                      {dev.active_tickets_count} / {dev.max_active_tickets || 3}
                    </td>
                    <td>
                      <span className={`badge ${dev.can_produce_video ? 'badge-published' : 'badge-closed'}`}>
                        {dev.can_produce_video ? 'Authorized' : 'Restricted'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {!dev.is_approved ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDeveloperAction(dev.id, 'APPROVE')}
                          >
                            <UserCheck size={14} /> Approve Access
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDeveloperAction(dev.id, 'SUSPEND')}
                            >
                              <UserX size={14} /> Suspend
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDeveloperAction(dev.id, 'TOGGLE_VIDEO', !dev.can_produce_video)}
                            >
                              <Video size={14} /> {dev.can_produce_video ? 'Revoke Video' : 'Grant Video'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CATALOG & DYNAMIC PRICING CONFIGURATION
          ========================================================================= */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <span className="editorial-kicker">PRICING GOVERNANCE</span>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Dynamic Package Pricing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Prices are never hardcoded. Changes take effect instantly in the customer order wizard with immutable audit tracking.
            </p>
          </div>

          <div className="grid grid-cols-2">
            {occasions.map((occ) => (
              <div key={occ.id} className="editorial-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-deep)', marginBottom: '1.25rem' }}>
                  {occ.display_name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {occ.packages?.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        background: 'var(--bg-champagne)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <strong>{pkg.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                          Code: {pkg.code}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--burgundy-rich)' }}>
                          ₹{pkg.base_price_inr}
                        </span>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const newP = prompt(`Enter new price in INR for ${pkg.name}:`, String(pkg.base_price_inr));
                            if (newP && !isNaN(Number(newP))) {
                              handlePriceUpdate(pkg.id, Number(newP));
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
          TAB 4: CENTRAL IMMUTABLE AUDIT TRAIL
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="editorial-kicker">DATABASE-LEVEL IMMUTABLE LOG</span>
              <h3 style={{ fontSize: '1.35rem' }}>Audit Telemetry</h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['', 'CATALOG', 'TICKETS', 'ASSIGNMENT', 'ACCOUNTS', 'PUBLISHING', 'PAYMENT'].map((mod) => (
                <button
                  key={mod}
                  className={`btn btn-sm ${auditModule === mod ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAuditModule(mod)}
                >
                  {mod || 'All Modules'}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Remarks &amp; State Diff</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <strong>{log.actor_name || log.actor_email}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{log.actor_role}</span>
                    </td>
                    <td>
                      <span className="badge badge-assigned">{log.module}</span>
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td style={{ fontSize: '0.86rem', color: 'var(--text-body)' }}>
                      {log.remarks}
                      {log.new_value && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Diff: <code>{JSON.stringify(log.new_value)}</code>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Publishing Authorization Modal */}
      {publishOrderRef && (
        <div className="modal-backdrop" onClick={() => setPublishOrderRef(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-cream)' }}>
              <span className="editorial-kicker">FINAL RELEASE GATE</span>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Authorize Public Invitation Release</h3>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Authorizing publication for order <strong>{publishOrderRef}</strong> will generate the live public invitation URL on your neutral host and unlock print-ready 300 DPI deliverables.
              </p>

              <div className="form-group">
                <label className="form-label">Custom Invitation Slug</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. sachin-ananya-wedding"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Post-Event Expiration Grace Period (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={graceDays}
                  onChange={(e) => setGraceDays(parseInt(e.target.value) || 30)}
                  min={7}
                  max={180}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setPublishOrderRef(null)}>
                  Cancel
                </button>
                <button className="btn btn-gold btn-sm" onClick={handleAuthorizePublish} disabled={loading}>
                  <Check size={14} /> Authorize &amp; Publish Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Ticket Modal */}
      {reassignTicketId && (
        <div className="modal-backdrop" onClick={() => setReassignTicketId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-cream)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Reassign Ticket to Developer</h3>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <div className="form-group">
                <label className="form-label">Select Target Artisan / Developer</label>
                <select
                  className="form-control"
                  value={targetDevId}
                  onChange={(e) => setTargetDevId(e.target.value)}
                >
                  {developers
                    .filter((d) => d.is_approved)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.active_tickets_count} active tickets)
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setReassignTicketId(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleReassign} disabled={loading}>
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
