import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw } from 'lucide-react';

export type PolicyType = 'privacy' | 'terms' | 'refund' | null;

interface LegalModalProps {
  policyType: PolicyType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-cream)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {policyType === 'privacy' && <ShieldCheck size={22} className="text-burgundy" />}
            {policyType === 'terms' && <FileText size={22} className="text-burgundy" />}
            {policyType === 'refund' && <RefreshCw size={22} className="text-burgundy" />}
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              {policyType === 'privacy' && 'Privacy Policy'}
              {policyType === 'terms' && 'Terms and Conditions'}
              {policyType === 'refund' && 'Refund & Cancellation Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.75rem', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-body)' }}>
          {policyType === 'privacy' && (
            <div>
              <p style={{ marginBottom: '1rem' }}>
                <strong>TechMasters Digital Services</strong> is committed to protecting the privacy and personal media of our customers and celebration guests.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>1. Information Collected</h4>
              <p style={{ marginBottom: '1rem' }}>
                We collect personal event information (names, event dates, venues, schedules, itineraries), customer contact credentials (email and mobile phone number for OTP authentication), and customer-uploaded media assets (photographs, audio tracks).
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>2. Use of Media & Assets</h4>
              <p style={{ marginBottom: '1rem' }}>
                Uploaded photographs and media are strictly used for artisan composition, design layout, video rendering, and website generation. Customer assets are never sold, rented, or repurposed for external marketing without explicit consent.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>3. Data Retention & Expiration</h4>
              <p style={{ marginBottom: '1rem' }}>
                Published celebration websites remain active for the duration of the selected package hosting period (typically 60 to 90 days following event completion). After the expiration grace period, public web links automatically expire while payment and invoice records remain securely archived.
              </p>
            </div>
          )}

          {policyType === 'terms' && (
            <div>
              <p style={{ marginBottom: '1rem' }}>
                By engaging <strong>TechMasters Digital Services</strong>, you agree to these Terms and Conditions.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>1. Service Delivery & Workflow</h4>
              <p style={{ marginBottom: '1rem' }}>
                Our digital celebration service operates under an artisan production model. Upon order submission, an internal TechMasters developer creates your design draft. You will receive protected watermarked previews for inspection and feedback.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>2. Design Adjustments & Polish</h4>
              <p style={{ marginBottom: '1rem' }}>
                We work closely with you during the draft review phase to incorporate your text amendments, photograph adjustments, and schedule updates prior to your final approval and payment.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>3. Customer Design Approval & Payment</h4>
              <p style={{ marginBottom: '1rem' }}>
                Final payment is required only after you review and approve the watermarked design preview. Once payment is verified and Admin publication is authorized, high-resolution 300 DPI deliverables, MP4 video files, and the live public celebration website are published.
              </p>
            </div>
          )}

          {policyType === 'refund' && (
            <div>
              <p style={{ marginBottom: '1rem' }}>
                At <strong>TechMasters Digital Services</strong>, we pride ourselves on exceptional customer satisfaction. Because custom digital design is personalized to your celebration, our refund policy is designed for fairness.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>1. Pre-Approval Order Rejection</h4>
              <p style={{ marginBottom: '1rem' }}>
                Because payment is only collected <em>after</em> you inspect and approve the initial watermarked design preview, you carry zero payment risk if the preliminary design concept does not meet your celebration requirements.
              </p>
              <h4 style={{ fontSize: '1rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>2. Post-Payment & Post-Publication</h4>
              <p style={{ marginBottom: '1rem' }}>
                Once a design has been approved by the customer, payment completed, and the final 300 DPI files or live celebration website generated, fees are non-refundable as digital production is irreversible. In case of unexpected technical downtime, our engineering team provides priority SLA remedies within 4 business hours.
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

