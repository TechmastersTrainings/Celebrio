import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { AdminMetrics, TicketSummary, CentralActivityLogItem } from '../../types';

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

  return (
    <div>
      {/* Admin Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>
            Operations Command Center & Governance
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            TechMasters Innovations Private Limited • Complete operational visibility, queue balance, and audit logs.
          </p>
        </div>

        <button className="btn btn-sm btn-outline" onClick={loadAll}>
          🔄 Refresh Operations
        </button>
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

      {/* KPI Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Enquiries & Orders</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{metrics.total_orders}</div>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <div style={{ fontSize: '0.8rem', color: '#92400E', textTransform: 'uppercase' }}>Unassigned FIFO Queue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B45309' }}>{metrics.unassigned_fifo_queue}</div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ready for Publishing</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-info)' }}>{metrics.payment_done}</div>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div style={{ fontSize: '0.8rem', color: '#166534', textTransform: 'uppercase' }}>Verified Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803D' }}>₹{parseFloat(metrics.total_revenue_inr).toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setActiveTab('queue')}
        >
          Queue & Ticket Dispatch ({tickets.length})
        </button>

        <button
          className={`btn ${activeTab === 'developers' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setActiveTab('developers')}
        >
          Developer Governance ({developers.length})
        </button>

        <button
          className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setActiveTab('catalog')}
        >
          Dynamic Pricing Configurator
        </button>

        <button
          className={`btn ${activeTab === 'audit' ? 'btn-gold' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setActiveTab('audit')}
        >
          Immutable Central Audit ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Queue & Ticket Management */}
      {activeTab === 'queue' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
            All Active ServiceNow-Style Tickets
          </h3>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket Ref</th>
                  <th>Customer</th>
                  <th>Occasion</th>
                  <th>Package</th>
                  <th>Assigned Dev</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.ticket_number}</strong></td>
                    <td>{t.customer_name}</td>
                    <td>{t.occasion_name}</td>
                    <td>{t.package_name}</td>
                    <td>{t.assigned_developer_name || <span style={{ color: 'var(--color-text-muted)' }}>Unassigned (Queue)</span>}</td>
                    <td><span className="badge badge-wip">{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {t.status === 'PAYMENT_DONE' && (
                          <button
                            className="btn btn-sm btn-gold"
                            onClick={() => {
                              setPublishOrderRef(t.ticket_number);
                              setCustomSlug(`${t.customer_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-celebration`);
                            }}
                          >
                            Authorize Publishing 🚀
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setReassignTicketId(t.id)}
                        >
                          Reassign
                        </button>

                        {t.assigned_developer && (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleRelease(t.id)}
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

      {/* TAB 2: Developer Governance */}
      {activeTab === 'developers' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Internal Developer Roster & Approval Management
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Only approved developers have access to customer orders and the FIFO queue. Video production tasks require explicit permission grants.
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Developer Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Approval Status</th>
                  <th>Video Specialist?</th>
                  <th>Workload Cap</th>
                  <th>Admin Governance Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.full_name}</strong></td>
                    <td>{d.email}</td>
                    <td><code>{d.role}</code></td>
                    <td>
                      <span className={`badge ${d.developer_profile?.approval_status === 'APPROVED_ACTIVE' ? 'badge-closed' : 'badge-hold'}`}>
                        {d.developer_profile?.approval_status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {d.developer_profile?.can_produce_video ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓ Yes (Video Specialist)</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>No</span>
                      )}
                    </td>
                    <td>{d.developer_profile?.max_active_tickets || 3} Tickets</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {d.developer_profile?.approval_status !== 'APPROVED_ACTIVE' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleDeveloperAction(d.id, 'APPROVE')}
                          >
                            Approve Access
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: 'var(--color-danger)', borderColor: '#FECDD3' }}
                            onClick={() => handleDeveloperAction(d.id, 'SUSPEND')}
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDeveloperAction(d.id, 'APPROVE', !d.developer_profile?.can_produce_video)}
                        >
                          {d.developer_profile?.can_produce_video ? 'Revoke Video' : 'Grant Video Perm'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Dynamic Price Configurator */}
      {activeTab === 'catalog' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Dynamic Service & Package Price Governance
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            No pricing rules are hardcoded. Modify package base prices here; changes take effect immediately for new customer orders.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {occasions.map((occ) => (
              <div key={occ.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>{occ.display_name}</h4>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {occ.packages.map((pkg: any) => (
                    <div key={pkg.id} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{pkg.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{pkg.code}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>₹</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '90px', padding: '4px 8px' }}
                          defaultValue={parseFloat(pkg.base_price_inr).toFixed(0)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              handlePriceUpdate(pkg.id, val);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Central Immutable Audit Explorer */}
      {activeTab === 'audit' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                Immutable Central Audit Ledger
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Guaranteed append-only audit trail capturing actor, role, module, action, and JSON state diffs.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control"
                style={{ width: '180px' }}
                value={auditModule}
                onChange={(e) => {
                  setAuditModule(e.target.value);
                  ApiService.getAuditLogs(e.target.value || undefined).then((data: any) => setAuditLogs(data));
                }}
              >
                <option value="">All Modules</option>
                <option value="ORDERS">ORDERS</option>
                <option value="TICKETS">TICKETS</option>
                <option value="ASSIGNMENTS">ASSIGNMENTS</option>
                <option value="DESIGNS">DESIGNS</option>
                <option value="PAYMENTS">PAYMENTS</option>
                <option value="PUBLISHING">PUBLISHING</option>
                <option value="ACCOUNTS">ACCOUNTS</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor (Role)</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Target Record</th>
                  <th>State Delta (Diff)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <div><strong>{log.actor_name}</strong></div>
                      <span className="badge badge-assigned" style={{ fontSize: '0.65rem' }}>{log.actor_role}</span>
                    </td>
                    <td><code>{log.action}</code></td>
                    <td><span className="badge badge-new">{log.module}</span></td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.record_id}</td>
                    <td style={{ fontSize: '0.75rem', maxWidth: '280px', overflowX: 'auto' }}>
                      <pre style={{ margin: 0 }}>{JSON.stringify(log.new_value, null, 1)}</pre>
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'SUCCESS' ? 'badge-closed' : 'badge-hold'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignTicketId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              Manual Ticket Reassignment
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Select target approved developer to reallocate this order ticket.
            </p>

            <div className="form-group">
              <label className="form-label">Assign to Developer</label>
              <select className="form-control" value={targetDevId} onChange={(e) => setTargetDevId(e.target.value)}>
                <option value="">-- Choose Developer --</option>
                {developers.filter((d) => d.developer_profile?.approval_status === 'APPROVED_ACTIVE').map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.role})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => setReassignTicketId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReassign} disabled={!targetDevId || loading}>
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publishing Authorization Modal */}
      {publishOrderRef && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Authorize Live Celebration Publishing
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Confirm quality compliance and assign the neutral URL path for order <strong>{publishOrderRef}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">Neutral Custom Slug Path</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>neutral-domain/</span>
                <input
                  type="text"
                  className="form-control"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. rahul-sneha-wedding"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Post-Event Grace Period (Hosting Days)</label>
              <input
                type="number"
                className="form-control"
                value={graceDays}
                onChange={(e) => setGraceDays(parseInt(e.target.value) || 30)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setPublishOrderRef(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleAuthorizePublish} disabled={loading}>
                Authorize & Activate Live URL 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

