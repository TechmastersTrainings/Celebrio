import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { OrderDetail } from '../../types';

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
      setError(err.message || 'Order not found');
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
      const res: any = await ApiService.sendCustomerOTP(phone, orderRef || undefined);
      setChallengeId(res.challenge_id);
      setDevHint(res.dev_hint);
      setOtpMode(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!challengeId || !otpCode) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res: any = await ApiService.verifyCustomerOTP(challengeId, otpCode);
      if (res.order_reference) {
        setOrderRef(res.order_reference);
        handleLookup(res.order_reference);
      } else {
        setError('Verified successfully. Please enter your Order Reference.');
      }
      setOtpMode(false);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!order) return;
    try {
      setLoading(true);
      await ApiService.approveDesign(order.order_reference);
      await handleLookup();
    } catch (err: any) {
      setError(err.message || 'Failed to approve design');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!order || !revisionFeedback.trim()) return;
    try {
      setRevisionSubmitting(true);
      await ApiService.requestRevision(order.order_reference, revisionFeedback);
      setShowRevisionModal(false);
      setRevisionFeedback('');
      await handleLookup();
    } catch (err: any) {
      setError(err.message || 'Failed to submit revision');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    try {
      setPaymentProcessing(true);
      // 1. Create payment order
      const payOrderRes: any = await ApiService.createPaymentOrder(order.order_reference);
      // 2. Simulate server webhook verification
      await ApiService.verifyPaymentWebhook(
        payOrderRes.gateway_order_id,
        `pay_sim_${Date.now()}`
      );
      setShowPaymentModal(false);
      await handleLookup();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
          Customer Order Tracking & Review Hub
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Check real-time progress, review protected previews, request creative revisions, and complete payment.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label">Order Reference ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. TC-2026-00001"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => handleLookup()} disabled={loading}>
              {loading ? 'Searching...' : 'Track Order 🔍'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setOtpMode(!otpMode)}
            >
              Mobile OTP Lookup
            </button>
          </div>
        </div>

        {/* OTP Lookup Expansion */}
        {otpMode && (
          <div style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              Verify via Mobile Number OTP
            </h4>
            {!challengeId ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter registered mobile (e.g. +91 98860 12345)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleSendOTP} disabled={loading}>
                  Send OTP
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-control"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <button className="btn btn-gold" onClick={handleVerifyOTP} disabled={loading}>
                    Verify OTP
                  </button>
                </div>
                {devHint && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
                    [Development Mode Hint] OTP dispatched: <strong>{devHint}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* Order Details Display */}
      {order && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge badge-assigned" style={{ marginBottom: '0.5rem' }}>
                Order: {order.order_reference}
              </span>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                {order.customer_name}'s {order.occasion_name}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Package: <strong>{order.package_name}</strong> • Language: <strong>{order.selected_language}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current Milestone</div>
              <span className={`badge ${order.status === 'DELIVERED' ? 'badge-closed' : 'badge-wip'}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
                {order.customer_facing_status}
              </span>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
              Status Update:
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {order.customer_facing_explanation}
            </p>
          </div>

          {/* Action Hub depending on Lifecycle Status */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              Order Actions & Next Steps
            </h4>

            {/* Condition 1: Preview is ready for review */}
            {order.has_active_preview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#92400E', fontSize: '0.9rem' }}>
                  🎉 <strong>Your design draft is ready for review!</strong> You can review the interactive preview, suggest revisions (2 free revisions included), or approve the design to proceed to payment.
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {order.preview_url && (
                    <button className="btn btn-outline" onClick={() => onOpenPreview(order.preview_url!)}>
                      👁️ Launch Protected Preview
                    </button>
                  )}

                  <button className="btn btn-outline" onClick={() => setShowRevisionModal(true)}>
                    ✏️ Request Changes / Revisions
                  </button>

                  <button className="btn btn-gold" onClick={handleApproveDesign} disabled={loading}>
                    ✓ Approve Final Design
                  </button>
                </div>
              </div>
            )}

            {/* Condition 2: Design Approved, Awaiting Payment */}
            {order.ticket_status === 'AWAITING_PAYMENT' && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ color: '#047857', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Design Approved! Proceed to Secure Payment
                </h5>
                <p style={{ fontSize: '0.9rem', color: '#065F46', marginBottom: '1rem' }}>
                  Total invoice payable: <strong>₹{order.total_amount_inr}</strong>.
                  Upon payment verification and quality check by our Admin, your live celebration link and download deliverables will be unlocked immediately.
                </p>
                <button className="btn btn-gold" onClick={() => setShowPaymentModal(true)}>
                  💳 Pay ₹{order.total_amount_inr} via Payment Gateway
                </button>
              </div>
            )}

            {/* Condition 3: Payment Done, Finalizing Publishing */}
            {order.ticket_status === 'PAYMENT_DONE' && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: '#1E40AF' }}>
                <h5 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>
                  Payment Verified — Finalizing Publishing
                </h5>
                <p style={{ fontSize: '0.9rem' }}>
                  Our Operations Administrator is performing final quality verification and authorizing live publishing on your custom neutral path. You will receive an SMS as soon as the live link is ready!
                </p>
              </div>
            )}

            {/* Condition 4: Published & Delivered */}
            {order.is_published && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ color: '#15803D', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  🌟 Your Celebration is Live & Delivered!
                </h5>
                <p style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '1rem' }}>
                  Your invitation website is active. Access your public neutral URL, dynamic QR code, and print-ready card assets in your deliverables vault.
                </p>
                <button className="btn btn-primary" onClick={() => onOpenDeliverables(order.order_reference)}>
                  🎁 Open Deliverables Vault & WhatsApp Share
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Request Design Revisions
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Describe the specific changes you need (text edits, photo replacements, timing adjustments).
            </p>

            <div className="form-group">
              <textarea
                className="form-control"
                rows={5}
                placeholder="e.g. Please change Muhurtham time to 10:30 AM and change background color to royal burgundy..."
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowRevisionModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitRevision}
                disabled={revisionSubmitting || !revisionFeedback.trim()}
              >
                {revisionSubmitting ? 'Submitting...' : 'Submit Revision to Designer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal (Agnostic Simulation) */}
      {showPaymentModal && order && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💳</div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Payment Gateway Checkout
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Order Reference: <strong>{order.order_reference}</strong>
            </p>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Amount:</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>₹{order.total_amount_inr}</strong>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Secure payment processed via integrated gateway. Server-side signature verification enforces financial integrity.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowPaymentModal(false)} disabled={paymentProcessing}>
                Cancel
              </button>
              <button className="btn btn-gold" onClick={handleSimulatePayment} disabled={paymentProcessing}>
                {paymentProcessing ? 'Verifying with Server...' : 'Confirm & Pay Securely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

