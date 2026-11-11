import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { LegalModal, PolicyType } from './LegalModal';
import { Phone, Mail, MapPin, Globe, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="footer-editorial" style={{ padding: '2rem 0 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Top Row: Brand Lockup + Horizontal Navigation + Direct WhatsApp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Brand Logo with Authentic 3D Hexagon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <TechMastersLogo variant="footer" size="sm" />
            </div>

            {/* Horizontal Quick Links Bar */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                className="footer-link-btn"
                onClick={() => onNavigate('home')}
                style={{ fontSize: '0.84rem' }}
              >
                Home
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button
                className="footer-link-btn"
                onClick={() => onNavigate('designs')}
                style={{ fontSize: '0.84rem' }}
              >
                Invitation Designs
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button
                className="footer-link-btn"
                onClick={() => onNavigate('catalog')}
                style={{ fontSize: '0.84rem' }}
              >
                Packages &amp; Pricing
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button
                className="footer-link-btn"
                onClick={() => onNavigate('tracking')}
                style={{ fontSize: '0.84rem' }}
              >
                Track Order
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button
                className="footer-link-btn"
                onClick={() => onNavigate('wizard')}
                style={{ fontSize: '0.84rem', color: 'var(--gold-soft)' }}
              >
                Create Invitation
              </button>
            </nav>

            {/* WhatsApp Contact Action */}
            <a
              href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20would%20like%20to%20enquire%20about%20a%20digital%20invitation."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-gold"
              style={{ textDecoration: 'none', padding: '0.4rem 0.9rem', fontSize: '0.80rem' }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp Us</span>
            </a>
          </div>

          {/* Middle Row: Contact & Corporate Coordinates (Horizontal Bar) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.25rem 0',
              fontSize: '0.80rem',
              color: '#94A3B8',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={14} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
              <span>Mailoor Road, Near GND College, Bidar, Karnataka 585403</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Phone size={13} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                <a href="tel:+919880768222" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
                  +91 9880768222 | +91 9916354338
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Mail size={13} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                <a href="mailto:support@techmastersinnovations.in" style={{ color: '#E2E8F0', textDecoration: 'none' }}>
                  support@techmastersinnovations.in
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Globe size={13} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                <a
                  href="https://techmastersinnovations.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#E2E8F0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  techmastersinnovations.in <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>



          {/* Bottom Bar: Copyright + Legal Policies */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '1rem',
              fontSize: '0.76rem',
              color: '#64748B',
            }}
          >
            <div>
              &copy; 2026 <strong>TechMasters Digital Services</strong>. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActivePolicy('privacy')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.76rem', padding: 0 }}
              >
                Privacy Policy
              </button>
              <span>&bull;</span>
              <button
                onClick={() => setActivePolicy('terms')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.76rem', padding: 0 }}
              >
                Terms &amp; Conditions
              </button>
              <span>&bull;</span>
              <button
                onClick={() => setActivePolicy('refund')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.76rem', padding: 0 }}
              >
                Refund Policy
              </button>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8' }}>
                <ShieldCheck size={12} style={{ color: 'var(--gold-soft)' }} />
                Bidar, Karnataka
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <LegalModal policyType={activePolicy} onClose={() => setActivePolicy(null)} />
    </>
  );
};
