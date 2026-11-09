import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { OrderDetail } from '../../types';
import {
  Search,
  Phone,
  ShieldCheck,
  Eye,
  Edit3,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Calendar,
  Languages
} from 'lucide-react';

interface OrderTrackingPageProps {
  initialOrderRef?: string;
  onOpenPreview: (previewUrl: string) => void;
  onOpenDeliverables: (orderRef: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderRef,
  onOpenPreview,
  onOpenDeliverables,
}) => {
  const [orderRef, setOrderRef] = useState(initialOrderRef || '');
  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revision modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleLookup = async (refToLookup?: string) => {
    const targetRef = refToLookup || orderRef;
    if (!targetRef) {
      setError('Please enter your Order Reference (e.g. TC-2026-00001).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data: any = await ApiService.lookupOrder(targetRef);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Order not found. Please verify your reference.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Please enter your registered mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.requestCustomerOTP(phone);
      setChallengeId(res.challenge_id);
      if (res.dev_otp_hint) {
        setDevHint(res.dev_otp_hint);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!challengeId || !otpCode) {
      setError('Please enter the 6-digit OTP code received.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.verifyCustomerOTP(challengeId, otpCode);
      if (res.orders && res.orders.length > 0) {
        // Automatically fetch details for the first active order
        await handleLookup(res.orders[0].order_reference);
        setOtpMode(false);
      } else {
        setError('No active celebration orders found for this mobile number.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!order) return;
    if (!window.confirm('Are you delighted with this design? Approving locks the preview and advances to payment.')) {
      return;
    }

    try {
      setLoading(true);
      await ApiService.approveDesign(order.order_reference);
      await handleLookup(order.order_reference);
    } catch (err: any) {
      setError(err.message || 'Failed to approve design.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !revisionFeedback) return;

    try {
      setRevisionSubmitting(true);
      await ApiService.requestRevision(order.order_reference, revisionFeedback);
      setShowRevisionModal(false);
      setRevisionFeedback('');
      await handleLookup(order.order_reference);
    } catch (err: any) {
      setError(err.message || 'Failed to submit revision request.');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!order) return;

    try {
      setPaymentProcessing(true);
      await ApiService.initiateMockPayment(order.order_reference, order.total_amount_inr);
      setShowPaymentModal(false);
      await handleLookup(order.order_reference);
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '3.5rem auto 5rem', padding: '0 1rem' }}>
      {/* Editorial Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="editorial-kicker">CUSTOMER SERVICE MANAGEMENT</span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--navy-deep)' }}>
          Order Tracker &amp; Celebration Hub
        </h1>
        <p className="lead-text" style={{ maxWidth: '620px', margin: '0 auto' }}>
          Inspect your real-time design progress, launch protected draft previews, submit revision feedback, or download completed deliverables.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="card" style={{ padding: '2rem 2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <button
            className={`btn btn-sm ${!otpMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setOtpMode(false); setError(null); }}
          >
            <Search size={14} /> Search by Order Reference
          </button>
          <button
            className={`btn btn-sm ${otpMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setOtpMode(true); setError(null); }}
          >
            <Phone size={14} /> Look Up with Mobile OTP
          </button>
        </div>

        {!otpMode ? (
          <div>
            <label className="form-label">Order Reference (e.g. TC-2026-00001)</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your Order Reference..."
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
                style={{ flex: 1, minWidth: '220px' }}
              />
              <button className="btn btn-primary" onClick={() => handleLookup()} disabled={loading}>
                {loading ? 'Finding Order...' : 'Track Order'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="form-label">Customer Mobile Number</label>
            {!challengeId ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter registered mobile (e.g. +91 98860 12345)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <button className="btn btn-primary" onClick={handleSendOTP} disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-control"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ flex: 1, minWidth: '180px' }}
                  />
                  <button className="btn btn-gold" onClick={handleVerifyOTP} disabled={loading}>
                    Verify OTP &amp; Open
                  </button>
                </div>
                {devHint && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-success)', background: '#F0FDF4', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)' }}>
                    [Local Dev Mode Hint] Dispatched OTP: <strong>{devHint}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1.25rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Details Display */}
      {order && (
        <div className="card card-gold-accent" style={{ padding: '2.5rem' }}>
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <span className="editorial-kicker" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                ORDER REFERENCE: {order.order_reference}
              </span>
              <h2 style={{ fontSize: '1.85rem', color: 'var(--navy-deep)' }}>
                {order.customer_name}'s {order.occasion_name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
                Tier: <strong>{order.package_name}</strong> &bull; Regional Script: <strong>{order.selected_language}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Current Milestone
              </span>
              <span className={`badge ${order.status === 'DELIVERED' ? 'badge-published' : 'badge-wip'}`} style={{ fontSize: '0.84rem', padding: '0.35rem 0.85rem' }}>
                {order.customer_facing_status}
              </span>
            </div>
          </div>

          {/* Status Explanation Box */}
          <div
            style={{
              background: 'var(--bg-champagne)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Production Status Note:
            </h4>
            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {order.customer_facing_explanation}
            </p>
          </div>

          {/* Actions Based on Lifecycle Status */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.75rem', background: '#FFFFFF', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              Available Customer Actions
            </h3>

            {/* Condition 1: Preview is ready for review */}
            {order.has_active_preview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '1.25rem', borderRadius: 'var(--radius-sm)', color: '#92400E', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  ✨ <strong>Your celebration draft preview is ready!</strong> Please launch the protected preview below. You can inspect all ceremonies, test the countdown, suggest revisions (2 rounds included free), or approve the design to unlock final delivery.
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                  {order.preview_url && (
                    <button className="btn btn-outline" onClick={() => onOpenPreview(order.preview_url!)}>
                      <Eye size={16} />
                      <span>Launch Protected Preview</span>
                    </button>
                  )}

                  <button className="btn btn-outline" onClick={() => setShowRevisionModal(true)}>
                    <Edit3 size={16} />
                    <span>Request Changes (Revisions)</span>
                  </button>

                  <button className="btn btn-gold" onClick={handleApproveDesign} disabled={loading}>
                    <CheckCircle2 size={16} />
                    <span>Approve Final Design</span>
                  </button>
                </div>
              </div>
            )}

            {/* Condition 2: Design Approved, Awaiting Payment */}
            {order.ticket_status === 'AWAITING_PAYMENT' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ color: '#166534', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Design Approved! Proceed to Secure Payment
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#166534', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Total invoice payable: <strong>₹{order.total_amount_inr}</strong>.
                  Upon payment verification and publication authorization by our Admin, your live public celebration link and 300 DPI deliverables will be activated.
                </p>
                <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard size={16} />
                  <span>Pay ₹{order.total_amount_inr} via Payment Gateway</span>
                </button>
              </div>
            )}

            {/* Condition 3: Payment Done, Finalizing Publishing */}
            {order.ticket_status === 'PAYMENT_DONE' && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.5rem', borderRadius: 'var(--radius-sm)', color: '#1E40AF' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                  Payment Verified — Finalizing Live Publication
                </h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Our Operations Administrator is performing final quality verification and authorizing live publishing on your custom neutral path. You will receive an SMS and WhatsApp update as soon as the live link is ready!
                </p>
              </div>
            )}

            {/* Condition 4: Published & Delivered */}
            {order.is_published && (
              <div style={{ background: 'var(--bg-champagne)', border: '1px solid var(--gold-primary)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ color: 'var(--burgundy-rich)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  🌟 Your Celebration is Live &amp; Published!
                </h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Your invitation website is active. Access your public neutral URL, dynamic QR code, and print-ready card assets in your deliverables vault.
                </p>
                <button className="btn btn-primary" onClick={() => onOpenDeliverables(order.order_reference)}>
                  <Download size={16} />
                  <span>Open Deliverables Vault &amp; WhatsApp Share</span>
                </button>
              </div>
            )}
          </div>

          {/* Support Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--gold-primary)' }} />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                TechMasters Digital Services &bull; Bidar Campus Support
              </span>
            </div>

            <a
              href={`https://wa.me/919880768222?text=Hello%20TechMasters%2C%20regarding%20my%20Order%20${order.order_reference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <MessageCircle size={15} />
              <span>Contact Artisan Support on WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="modal-backdrop" onClick={() => setShowRevisionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-cream)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Request Design Revisions</h3>
              <button onClick={() => setShowRevisionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendRevision} style={{ padding: '1.75rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Describe the specific changes you need (timing adjustments, spelling updates, photograph substitutions). Two revision rounds are included free in your package!
              </p>

              <div className="form-group">
                <label className="form-label">Revision Details *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="e.g. Please update Muhurtham time to 10:45 AM and swap the second photo for the high-res family portrait..."
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowRevisionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={revisionSubmitting}>
                  {revisionSubmitting ? 'Submitting...' : 'Submit Revision to Creative Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {showPaymentModal && order && (
        <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-cream)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>TechMasters Secure Payment Gateway</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <div style={{ background: 'var(--bg-champagne)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Order Reference:</span>
                  <strong>{order.order_reference}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Payable Amount:</span>
                  <strong style={{ fontSize: '1.3rem', color: 'var(--burgundy-rich)' }}>
                    ₹{order.total_amount_inr}
                  </strong>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Simulating verified instant payment via UPI, Debit/Credit Card, or Net Banking. Production mode routes through authorized Indian payment gateway with webhook verification.
              </p>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleSimulatePayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? 'Processing Transaction...' : `Authorize Payment of ₹${order.total_amount_inr}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
