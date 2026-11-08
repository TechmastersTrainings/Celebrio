import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';

interface PreviewReviewPageProps {
  previewToken: string;
  onBack: () => void;
  onApprove: (orderRef: string) => void;
  onRequestRevision: (orderRef: string) => void;
}

export const PreviewReviewPage: React.FC<PreviewReviewPageProps> = ({
  previewToken,
  onBack,
  onApprove,
  onRequestRevision,
}) => {
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreview() {
      try {
        setLoading(true);
        const data = await ApiService.getPreviewInvitation(previewToken);
        setPreviewData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [previewToken]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '2rem' }}>✨</div>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Loading draft preview...</p>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-danger)' }}>Preview Unavailable</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>{error || 'Invalid or expired preview token.'}</p>
        <button className="btn btn-outline" onClick={onBack}>← Back to Tracker</button>
      </div>
    );
  }

  const theme = previewData.theme || {};
  const primaryColor = theme.theme_color || '#7C182A';
  const accentColor = theme.accent_color || '#CFA043';

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Top Banner with Actions */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <button className="btn btn-sm btn-outline" onClick={onBack} style={{ marginBottom: '0.25rem' }}>
            ← Back to Order
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Draft Version <strong>v{previewData.version_number}</strong> • Order: <strong>{previewData.order_reference}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onRequestRevision(previewData.order_reference)}
          >
            ✏️ Request Changes
          </button>
          <button
            className="btn btn-sm btn-gold"
            onClick={() => onApprove(previewData.order_reference)}
          >
            ✓ Approve Final Design
          </button>
        </div>
      </div>

      {/* Watermarked Interactive Preview Card */}
      <div
        className="card"
        style={{
          position: 'relative',
          padding: 0,
          overflow: 'hidden',
          border: '2px solid var(--color-border)',
          background: '#FFFDF9',
        }}
      >
        {/* Dynamic Watermark Overlay */}
        <div className="preview-watermark-overlay">
          <div className="preview-watermark-text">
            {previewData.watermark_text}
          </div>
        </div>

        {/* Invitation Preview Canvas */}
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: accentColor, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {previewData.occasion}
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', color: primaryColor, marginBottom: '1rem', lineHeight: 1.2 }}>
            {previewData.customer_name}
          </h1>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Together with our families, we cordially invite you to grace the auspicious celebration with your presence and blessings.
          </p>

          {/* Events Itinerary */}
          <div style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: primaryColor, textAlign: 'center', marginBottom: '0.5rem' }}>
              Ceremonial Schedule
            </h3>

            {previewData.events?.map((ev: any, i: number) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.15rem', color: primaryColor }}>{ev.event_title}</h4>
                  <span className="badge badge-assigned">{ev.event_date} • {ev.start_time}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                  📍 {ev.venue_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {ev.venue_address}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            This is a protected draft preview rendered on TechMasters staging storage. High-resolution print-ready cards and live neutral invitation links are generated post-payment.
          </div>
        </div>
      </div>
    </div>
  );
};

