import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';

interface DeliverablesPageProps {
  orderRef: string;
  onBack: () => void;
  onOpenPublicLink: (slug: string) => void;
}

export const DeliverablesPage: React.FC<DeliverablesPageProps> = ({
  orderRef,
  onBack,
  onOpenPublicLink,
}) => {
  const [deliverables, setDeliverables] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDeliverables() {
      try {
        setLoading(true);
        const data = await ApiService.getDeliverables(orderRef);
        setDeliverables(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load deliverables');
      } finally {
        setLoading(false);
      }
    }
    loadDeliverables();
  }, [orderRef]);

  const handleCopyLink = () => {
    if (!deliverables?.full_public_url) return;
    navigator.clipboard.writeText(deliverables.full_public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!deliverables?.whatsapp_share_text) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(deliverables.whatsapp_share_text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '2rem' }}>✨</div>
        <p style={{ color: 'var(--color-text-muted)' }}>Retrieving your celebration deliverables...</p>
      </div>
    );
  }

  if (error || !deliverables) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-danger)' }}>Deliverables Locked</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>{error}</p>
        <button className="btn btn-outline" onClick={onBack}>← Back to Order</button>
      </div>
    );
  }

  const slug = deliverables.neutral_url.replace('/invite/', '');

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌟</div>
        <h2 style={{ fontSize: '2.2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
          Your Deliverables Vault
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Order <strong>{orderRef}</strong> is fully verified, authorized, and published live on our neutral domain.
        </p>
      </div>

      {/* Live Neutral Link Card */}
      <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--color-accent-light)', background: '#FDFBF7' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
          🌐 Live Celebration Website (Neutral Domain)
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          Share this unbranded, mobile-first invitation with your guests. It includes countdown, music, ceremonial schedule, and RSVP.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
          <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--color-primary-dark)', wordBreak: 'break-all' }}>
            {deliverables.full_public_url}
          </span>
          <button className="btn btn-sm btn-outline" onClick={handleCopyLink}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => onOpenPublicLink(slug)}>
            Open Live Site ↗
          </button>
        </div>

        <button className="btn btn-gold" onClick={handleWhatsAppShare} style={{ width: '100%' }}>
          💬 Share Directly to WhatsApp
        </button>
      </div>

      {/* QR Code & High-Res Downloads Grid */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Dynamic QR Code Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Dynamic QR Code Pass
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Scan to directly open your celebration website. Perfect for physical print cards or welcome banners!
          </p>

          {deliverables.qr_code_svg && (
            <div
              style={{
                width: '180px',
                height: '180px',
                margin: '0 auto 1.25rem',
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
              }}
              dangerouslySetInnerHTML={{ __html: deliverables.qr_code_svg }}
            />
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <a
              href={`data:image/svg+xml;utf8,${encodeURIComponent(deliverables.qr_code_svg || '')}`}
              download={`qr-${orderRef}.svg`}
              className="btn btn-sm btn-outline"
            >
              Download SVG
            </a>
          </div>
        </div>

        {/* Download Deliverables Suite */}
        <div className="card">
          <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            High-Resolution Card Files
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Unwatermarked print-ready invitations crafted for print and digital messaging.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {deliverables.downloads?.map((item: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: '#F8FAFC',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.title}</div>
                  <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>{item.format}</span>
                </div>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => alert(`Deliverable downloaded: ${item.title}`)}
                >
                  Download ↓
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Hosting active until <strong>{new Date(deliverables.expires_at).toLocaleDateString()}</strong>.
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Order Dashboard
        </button>
      </div>
    </div>
  );
};

