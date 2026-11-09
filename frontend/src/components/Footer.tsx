import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { LegalModal, PolicyType } from './LegalModal';
import { Phone, Mail, MapPin, Globe, MessageCircle, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="footer-editorial" id="contact">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2.5rem',
              alignItems: 'start',
            }}
          >
            {/* Column 1: Brand & Enterprise Profile */}
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <TechMastersLogo variant="footer" size="md" />
              </div>
              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.65,
                  color: '#94A3B8',
                  marginBottom: '1.25rem',
                }}
              >
                A premier commercial vertical of <strong>TechMasters Innovations Private Limited</strong>. Delivering bespoke multi-media digital celebration packages, responsive interactive websites, print-ready 300 DPI cards, and cinematic video invitations with ServiceNow-grade operational precision.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <a
                  href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20would%20like%20to%20enquire%20about%20a%20digital%20invitation."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-gold"
                  style={{ textDecoration: 'none' }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>

            {/* Column 2: Celebrations & Occasions */}
            <div>
              <h4>Celebrations &amp; Verticals</h4>
              <ul style={{ listStyle: 'none' }}>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Weddings &amp; Vivaha Ceremonies
                  </a>
                </li>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Naming Ceremonies (Namakarana)
                  </a>
                </li>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Milestone Birthdays &amp; Shashtipoorthi
                  </a>
                </li>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Wedding Anniversaries
                  </a>
                </li>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Engagement &amp; Ring Ceremonies
                  </a>
                </li>
                <li>
                  <a
                    href="#designs"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('designs');
                    }}
                  >
                    Bespoke Custom Celebrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform & Production Access */}
            <div>
              <h4>Service Management</h4>
              <ul style={{ listStyle: 'none' }}>
                <li>
                  <a
                    href="#wizard"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('wizard');
                    }}
                  >
                    Submit Invitation Requirements
                  </a>
                </li>
                <li>
                  <a
                    href="#tracking"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('tracking');
                    }}
                  >
                    Customer Order Tracker &amp; OTP Portal
                  </a>
                </li>
                <li>
                  <a
                    href="#designs"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('designs');
                    }}
                  >
                    Design Styles &amp; Template Gallery
                  </a>
                </li>
                <li>
                  <a
                    href="#catalog"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('catalog');
                    }}
                  >
                    Dynamic Packages &amp; Pricing Inclusions
                  </a>
                </li>
                <li>
                  <a
                    href="#dev-auth"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('dev-auth');
                    }}
                  >
                    Internal Developer Workspace &amp; FIFO Queue
                  </a>
                </li>
                <li>
                  <a
                    href="#dev-auth"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('dev-auth');
                    }}
                  >
                    Admin Operations Command Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Corporate Contact & Office */}
            <div>
              <h4>Corporate Office &amp; Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#94A3B8' }}>
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: 'var(--gold-soft)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>TechMasters Innovations Pvt. Ltd.</strong>
                    <br />
                    1st Floor, Near Guru Nanak Dev Engg College,
                    <br />
                    Mailoor Road, Bidar, Karnataka 585403, India
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <Phone size={17} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                  <div>
                    <a href="tel:+919880768222" style={{ color: '#F8FAFC', marginBottom: 0, textDecoration: 'none' }}>
                      +91 9880768222
                    </a>{' '}
                    |{' '}
                    <a href="tel:+919916354338" style={{ color: '#F8FAFC', marginBottom: 0, textDecoration: 'none' }}>
                      +91 9916354338
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <Mail size={17} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                  <a
                    href="mailto:support@techmastersinnovations.in"
                    style={{ color: '#F8FAFC', marginBottom: 0, textDecoration: 'none' }}
                  >
                    support@techmastersinnovations.in
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <Globe size={17} style={{ color: 'var(--gold-soft)', flexShrink: 0 }} />
                  <a
                    href="https://techmastersinnovations.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#F8FAFC', marginBottom: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    techmastersinnovations.in <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="footer-bottom">
            <div>
              © 2026 <strong>TechMasters Innovations Private Limited</strong>. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setActivePolicy('privacy')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => setActivePolicy('terms')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Terms &amp; Conditions
              </button>
              <span>•</span>
              <button
                onClick={() => setActivePolicy('refund')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Refund &amp; Cancellation Policy
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}>
              <ShieldCheck size={14} style={{ color: 'var(--gold-soft)' }} />
              <span>Bidar, Karnataka • ISO-grade SLA Standards</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <LegalModal policyType={activePolicy} onClose={() => setActivePolicy(null)} />
    </>
  );
};
