import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Download,
  QrCode,
  FileText,
  Video,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

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
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving your celebration deliverables...</p>
      </div>
    );
  }

  if (error || !deliverables) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }}>Deliverables Locked</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'Deliverables will be unlocked once payment is verified and Admin publication is authorized.'}
        </p>
        <button className="btn btn-outline" onClick={onBack}>
          &larr; Back to Order Tracker
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '3.5rem auto 5rem', padding: '0 1rem' }}>
      <button className="btn btn-sm btn-outline" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Order Tracker
      </button>

      {/* Header Banner */}
      <div className="card card-gold-accent" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <span className="editorial-kicker">DELIVERABLES VAULT</span>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--navy-deep)', marginBottom: '0.75rem' }}>
          Your Celebration Assets Are Ready!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '650px', marginBottom: '2rem' }}>
          Order <strong>{deliverables.order_reference}</strong> has been published by TechMasters Innovations. Your live neutral invitation link, high-resolution 300 DPI cards, dynamic QR code, and video assets are listed below.
        </p>

        {/* Live Public URL Card */}
        <div
          style={{
            background: 'var(--bg-champagne)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            LIVE NEUTRAL INVITATION URL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              readOnly
              value={deliverables.full_public_url || ''}
              className="form-control"
              style={{ flex: 1, minWidth: '240px', background: '#FFFFFF', fontWeight: 600 }}
            />
            <button className="btn btn-outline btn-sm" onClick={handleCopyLink}>
              {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            {deliverables.slug && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenPublicLink(deliverables.slug)}
              >
                <ExternalLink size={14} />
                <span>Open Live Website</span>
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp One-Click Sharing */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" onClick={handleWhatsAppShare}>
            <Share2 size={16} />
            <span>Share Invitation on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Media Deliverables Grid */}
      <div className="grid grid-cols-2">
        {/* Deliverable 1: 300 DPI Print Card */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--bg-champagne)', color: 'var(--burgundy-rich)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Print-Ready Cards</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>300 DPI Ultra HD (PDF &amp; JPG)</span>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            CMYK vector PDF for local professional offset printing, and high-res sRGB JPG formatted for direct messaging.
          </p>
          {deliverables.card_download_url ? (
            <a
              href={deliverables.card_download_url}
              download
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              <Download size={14} />
              <span>Download 300 DPI Card</span>
            </a>
          ) : (
            <span className="badge badge-assigned">Asset Available In Archive</span>
          )}
        </div>

        {/* Deliverable 2: Dynamic QR Code Pass */}
        <div className="editorial-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--bg-champagne)', color: 'var(--burgundy-rich)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Dynamic Smart QR</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vector SVG &amp; PNG Pass</span>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Vector QR code linked to your live invitation website. Print on cards or sweets boxes for instant guest scanning.
          </p>
          {deliverables.qr_code_url ? (
            <a
              href={deliverables.qr_code_url}
              download
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              <Download size={14} />
              <span>Download Vector QR Code</span>
            </a>
          ) : (
            <span className="badge badge-assigned">QR Generated In Cloud</span>
          )}
        </div>
      </div>
    </div>
  );
};
