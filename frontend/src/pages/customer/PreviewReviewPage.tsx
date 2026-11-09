import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { ArrowLeft, CheckCircle2, Edit3, ShieldAlert, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';

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
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Rendering protected draft preview...</p>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }}>Preview Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Invalid or expired preview token.'}</p>
        <button className="btn btn-outline" onClick={onBack}>
          &larr; Back to Order Tracker
        </button>
      </div>
    );
  }

  const theme = previewData.theme || {};
  const primaryColor = theme.theme_color || 'var(--burgundy-rich)';
  const accentColor = theme.accent_color || 'var(--gold-primary)';

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto 5rem', padding: '0 1rem' }}>
      {/* Top Banner with Actions */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div>
          <button className="btn btn-sm btn-outline" onClick={onBack} style={{ marginBottom: '0.35rem' }}>
            <ArrowLeft size={14} /> Back to Tracker
          </button>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Draft Version <strong>v{previewData.version_number}</strong> &bull; Order: <strong>{previewData.order_reference}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onRequestRevision(previewData.order_reference)}
          >
            <Edit3 size={15} />
            <span>Request Changes</span>
          </button>
          <button
            className="btn btn-sm btn-gold"
            onClick={() => onApprove(previewData.order_reference)}
          >
            <CheckCircle2 size={15} />
            <span>Approve Final Design</span>
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
          border: '2px solid var(--border-medium)',
          background: 'var(--bg-ivory)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Dynamic Watermark Overlay */}
        <div className="preview-watermark-overlay">
          <div className="preview-watermark-text">
            {previewData.watermark_text}
          </div>
        </div>

        {/* Invitation Preview Canvas */}
        <div style={{ padding: '4.5rem 2rem', textAlign: 'center' }}>
          <span className="editorial-kicker" style={{ color: accentColor, marginBottom: '0.75rem' }}>
            {previewData.occasion}
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '3.2rem',
              color: primaryColor,
              marginBottom: '1.25rem',
              lineHeight: 1.2,
            }}
          >
            {previewData.customer_name}
          </h1>

          <p
            style={{
              color: 'var(--text-body)',
              fontSize: '1.1rem',
              maxWidth: '620px',
              margin: '0 auto 3rem',
              lineHeight: 1.75,
              fontStyle: 'italic',
            }}
          >
            "Together with our families, we cordially invite you to grace the auspicious celebration with your presence and blessings."
          </p>

          {/* Events Itinerary */}
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: primaryColor, textAlign: 'center', marginBottom: '0.5rem' }}>
              Ceremonial Schedule
            </h3>

            {previewData.events?.map((ev: any, i: number) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.2rem', color: primaryColor }}>{ev.event_title}</h4>
                  <span className="badge badge-assigned">{ev.event_date} &bull; {ev.start_time}</span>
                </div>
                <div style={{ fontSize: '0.94rem', color: 'var(--text-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--gold-primary)' }} />
                  <span>{ev.venue_name}</span>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: '22px' }}>
                  {ev.venue_address}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This is a protected draft preview rendered on TechMasters staging storage. High-resolution 300 DPI print-ready cards and live neutral invitation links are generated post-payment.
          </div>
        </div>
      </div>
    </div>
  );
};
