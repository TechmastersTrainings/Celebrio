import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { LegalModal, PolicyType } from './LegalModal';
import { Phone, Mail, MapPin, Globe, MessageCircle, ExternalLink, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="footer-editorial" style={{ padding: '3.25rem 0 1.75rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Main 3-Column Architectural Grid */}
          <div className="footer-grid">
            {/* Column 1: Brand & Direct Concierge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <TechMastersLogo variant="footer" size="md" />
              <p
                style={{
                  color: '#94A3B8',
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  marginTop: '1.1rem',
                  marginBottom: '1.25rem',
                  maxWidth: '340px',
                }}
              >
                Artisan digital celebration suites, bespoke wedding invitations &amp; high-resolution 300 DPI print stationery.
              </p>

              {/* WhatsApp Action Button */}
              <a
                href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20would%20like%20to%20enquire%20about%20a%20digital%20invitation."
                target="_blank"
                rel="noopener noreferrer"
                className="footer-whatsapp-pill"
              >
                <MessageCircle size={16} />
                <span>WhatsApp Us</span>
              </a>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <div className="footer-col-title">
                <span>Navigation</span>
              </div>
              <nav className="footer-nav-list">
                <button className="footer-nav-link" onClick={() => onNavigate('home')}>
                  <ArrowRight size={13} style={{ color: 'var(--gold-soft)', opacity: 0.7 }} />
                  <span>Home</span>
                </button>
                <button className="footer-nav-link" onClick={() => onNavigate('designs')}>
                  <ArrowRight size={13} style={{ color: 'var(--gold-soft)', opacity: 0.7 }} />
                  <span>Invitation Designs</span>
                </button>
                <button className="footer-nav-link" onClick={() => onNavigate('catalog')}>
                  <ArrowRight size={13} style={{ color: 'var(--gold-soft)', opacity: 0.7 }} />
                  <span>Packages &amp; Pricing</span>
                </button>
                <button className="footer-nav-link" onClick={() => onNavigate('tracking')}>
                  <ArrowRight size={13} style={{ color: 'var(--gold-soft)', opacity: 0.7 }} />
                  <span>Track Order</span>
                </button>
                <button className="footer-nav-link" onClick={() => onNavigate('offers')}>
                  <ArrowRight size={13} style={{ color: 'var(--gold-soft)', opacity: 0.7 }} />
                  <span>Offers &amp; Deals</span>
                </button>
                <button className="footer-nav-link accent" onClick={() => onNavigate('wizard')}>
                  <Sparkles size={13} style={{ color: 'var(--gold-soft)' }} />
                  <span>Create Invitation</span>
                </button>
              </nav>
            </div>

            {/* Column 3: Studio & Contact Coordinates */}
            <div>
              <div className="footer-col-title">
                <span>Studio &amp; Contact</span>
              </div>
              <div className="footer-contact-list">
                {/* Physical Location */}
                <div className="footer-contact-item">
                  <MapPin size={16} style={{ color: 'var(--gold-soft)', flexShrink: 0, marginTop: '3px' }} />
                  <span>Mailoor Road, Near GND College, Bidar, Karnataka 585403</span>
                </div>

                {/* Telephone */}
                <div className="footer-contact-item">
                  <Phone size={15} style={{ color: 'var(--gold-soft)', flexShrink: 0, marginTop: '3px' }} />
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <a href="tel:+919880768222">+91 9880768222</a>
                    <span style={{ color: '#475569' }}>|</span>
                    <a href="tel:+919916354338">+91 9916354338</a>
                  </div>
                </div>

                {/* Email */}
                <div className="footer-contact-item">
                  <Mail size={15} style={{ color: 'var(--gold-soft)', flexShrink: 0, marginTop: '3px' }} />
                  <a href="mailto:support@techmastersinnovations.in">
                    support@techmastersinnovations.in
                  </a>
                </div>

                {/* Corporate Website */}
                <div className="footer-contact-item">
                  <Globe size={15} style={{ color: 'var(--gold-soft)', flexShrink: 0, marginTop: '3px' }} />
                  <a
                    href="https://techmastersinnovations.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    techmastersinnovations.in <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Legal Policies */}
          <div className="footer-bottom-bar">
            <div>
              &copy; 2026 <strong>TechMasters Digital Services</strong>. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="footer-policy-link" onClick={() => setActivePolicy('privacy')}>
                Privacy Policy
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button className="footer-policy-link" onClick={() => setActivePolicy('terms')}>
                Terms &amp; Conditions
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <button className="footer-policy-link" onClick={() => setActivePolicy('refund')}>
                Refund Policy
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8' }}>
                <ShieldCheck size={13} style={{ color: 'var(--gold-soft)' }} />
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
