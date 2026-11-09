import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Occasion } from '../../types';

interface HomePageProps {
  onSelectOccasion: (occasionId: string, packageId?: string) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectOccasion, onNavigate }) => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'wedding' | 'ceremony' | 'milestone'>('all');

  useEffect(() => {
    let isMounted = true;
    ApiService.getOccasions()
      .then((data) => {
        if (isMounted) {
          setOccasions(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic catalog on homepage, using default showcase:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const occasionCards = [
    {
      slug: 'marriage',
      title: 'Weddings & Marriages',
      icon: '💍',
      tag: 'Most Cherished',
      startingPrice: '₹499',
      tagline: 'Royal elegance crafted for your eternal sacred union',
      features: ['Multi-Ceremony Schedules', 'Google Maps Navigation', 'Interactive RSVP', 'Photo Memories Wall', 'Traditional Background Music'],
      accentColor: '#D4AF37',
    },
    {
      slug: 'engagement',
      title: 'Engagement Ceremonies',
      icon: '✨',
      tag: 'Trending',
      startingPrice: '₹399',
      tagline: 'Celebrate the prelude to forever with modern opulence',
      features: ['Countdown to Ring Exchange', 'Couple Story Timeline', 'Venue Pinpoint', 'Digital QR Cards'],
      accentColor: '#9D4EDD',
    },
    {
      slug: 'naming-ceremony',
      title: 'Naming Ceremony (Namakarana)',
      icon: '👶',
      tag: 'Sacred Blessing',
      startingPrice: '₹399',
      tagline: 'Welcoming your little blessing with joy and tradition',
      features: ['Baby Photo Reveal', 'Auspicious Muhurtham Clock', 'Family Blessings Section', 'Regional Language Scripts'],
      accentColor: '#E2E8F0',
    },
    {
      slug: 'birthday',
      title: 'Milestone Birthdays',
      icon: '🎂',
      tag: 'Joyous Vibe',
      startingPrice: '₹299',
      tagline: 'Spectacular themes for 1st, 16th, 50th, and milestone birthdays',
      features: ['Animated Theme Layouts', 'Party Schedule & Dress Code', 'WhatsApp One-Tap RSVP', 'High-Res Download Cards'],
      accentColor: '#F59E0B',
    },
    {
      slug: 'anniversary',
      title: 'Wedding Anniversaries',
      icon: '🥂',
      tag: 'Everlasting Love',
      startingPrice: '₹399',
      tagline: 'Honor decades of love with nostalgic digital craftsmanship',
      features: ['Golden/Silver Jubilee Themes', 'Then & Now Memory Carousel', 'Celebration Venue Directions', 'Guest Wishes Book'],
      accentColor: '#D4AF37',
    },
  ];

  const handleOccasionClick = (slug: string) => {
    const matched = occasions.find((o) => o.slug.toLowerCase() === slug.toLowerCase());
    if (matched) {
      onSelectOccasion(matched.id, matched.packages?.[0]?.id);
    } else {
      onNavigate('catalog');
    }
  };

  return (
    <div className="home-container">
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-ambient-glow" />
        <div className="hero-content">
          <div className="badge-luxury">
            <span className="badge-sparkle">✨</span>
            <span>TECHMASTERS INNOVATIONS • LUXURY DIGITAL CELEBRATIONS</span>
          </div>

          <h1 className="hero-title">
            Where Life's Greatest Milestones Become <span className="text-gradient-gold">Immortal Digital Experiences</span>
          </h1>

          <p className="hero-subtitle">
            Bespoke interactive invitation websites, dynamic QR-coded ceremonial cards, and animated celebration videos. Meticulously handcrafted by internal artisans with ServiceNow-grade operational precision.
          </p>

          <div className="hero-cta-group">
            <button className="btn btn-luxury-gold" onClick={() => onNavigate('wizard')}>
              <span className="btn-icon">👑</span>
              <span>Create Celebration Invitation</span>
            </button>
            <button className="btn btn-luxury-silver" onClick={() => onNavigate('catalog')}>
              <span>Explore Packages & Pricing</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>

          <div className="hero-stats-strip">
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Occasion Verticals</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Handcrafted by Artisans</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">300 DPI</div>
              <div className="stat-label">Print-Ready Deliverables</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">Zero-Spam</div>
              <div className="stat-label">Protected Draft Previews</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LIVE INVITATION INTERACTIVE DEMO STRIP --- */}
      <section className="preview-showcase-section">
        <div className="section-header">
          <div className="section-eyebrow">SIGNATURE CRAFTSMANSHIP</div>
          <h2 className="section-title">The Three Pillars of Your Celebration Suite</h2>
          <p className="section-subtitle">
            Every order receives a multi-format digital celebration package tailored to modern smartphones, physical ceremonies, and WhatsApp sharing.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, rgba(75, 22, 111, 0.4), rgba(123, 44, 191, 0.2))' }}>
              <span style={{ fontSize: '2rem' }}>🌐</span>
            </div>
            <div className="pillar-badge">FORMAT 1 • INTERACTIVE WEB</div>
            <h3 className="pillar-title">Personalized Celebration Website</h3>
            <p className="pillar-desc">
              A private neutral URL with live ceremonial countdown, multi-event schedules, Google Maps one-tap navigation, photo galleries, background melodies, and live RSVP.
            </p>
            <ul className="pillar-feature-list">
              <li>✓ Live countdown timer to auspicious muhurtham</li>
              <li>✓ Interactive Google Maps venue route</li>
              <li>✓ WhatsApp one-tap instant invite dispatch</li>
              <li>✓ Regional language multilingual typography</li>
            </ul>
          </div>

          <div className="pillar-card pillar-featured">
            <div className="featured-ribbon">HIGH DEMAND</div>
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.35), rgba(179, 135, 40, 0.15))' }}>
              <span style={{ fontSize: '2rem' }}>📇</span>
            </div>
            <div className="pillar-badge" style={{ color: '#F3E5AB' }}>FORMAT 2 • PRINT & DIGITAL</div>
            <h3 className="pillar-title">Ultra HD Invitation Cards & QR</h3>
            <p className="pillar-desc">
              Studio-grade 1200×1800 PNG image cards and print-ready multi-slide PDF documents with dynamic SVG QR code passes for envelopes and WhatsApp forwards.
            </p>
            <ul className="pillar-feature-list">
              <li>✓ 300 DPI high-resolution for professional printing</li>
              <li>✓ Embedded vector QR code linking to your live site</li>
              <li>✓ Formatted for vertical WhatsApp & Instagram stories</li>
              <li>✓ Available for immediate high-speed download</li>
            </ul>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box" style={{ background: 'linear-gradient(135deg, rgba(13, 21, 41, 0.6), rgba(30, 45, 90, 0.4))' }}>
              <span style={{ fontSize: '2rem' }}>🎬</span>
            </div>
            <div className="pillar-badge">FORMAT 3 • CINEMATIC VIDEO</div>
            <h3 className="pillar-title">Animated Video Invitations</h3>
            <p className="pillar-desc">
              Dynamic celebration videos orchestrated by certified video specialists. Features romantic transitions, motion typography, and celebratory music.
            </p>
            <ul className="pillar-feature-list">
              <li>✓ Full 1080p HD animated MP4 format</li>
              <li>✓ Tailored background soundtrack</li>
              <li>✓ Dedicated video production queue gating</li>
              <li>✓ Add-on or premium package inclusion</li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- OCCASIONS & PACKAGES SHOWCASE --- */}
      <section className="occasions-section">
        <div className="section-header">
          <div className="section-eyebrow">CHOOSE YOUR CELEBRATION</div>
          <h2 className="section-title">Bespoke Packages Tailored to Every Life Milestone</h2>
          <p className="section-subtitle">
            Transparent pricing with zero hidden fees. Select your milestone to begin personalizing event schedules, photo themes, and music.
          </p>
        </div>

        <div className="occasion-cards-grid">
          {occasionCards.map((occ) => (
            <div key={occ.slug} className="occasion-card">
              <div className="card-top-bar">
                <span className="occ-icon">{occ.icon}</span>
                <span className="occ-tag">{occ.tag}</span>
              </div>
              <h3 className="occ-title">{occ.title}</h3>
              <p className="occ-tagline">{occ.tagline}</p>
              
              <div className="occ-price-box">
                <span className="price-label">Starting at</span>
                <span className="price-value">{occ.startingPrice}</span>
              </div>

              <div className="occ-divider" />

              <div className="occ-features">
                {occ.features.map((f, idx) => (
                  <div key={idx} className="feature-pill">
                    <span className="pill-check">✦</span> {f}
                  </div>
                ))}
              </div>

              <button
                className="btn btn-card-cta"
                onClick={() => handleOccasionClick(occ.slug)}
              >
                <span>Customize Invitation</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button className="btn btn-luxury-silver" onClick={() => onNavigate('catalog')}>
            <span>View All Packages, Add-ons & Full Pricing Details →</span>
          </button>
        </div>
      </section>

      {/* --- HOW IT WORKS: SERVICENOW-GRADE WORKFLOW --- */}
      <section className="workflow-section">
        <div className="section-header">
          <div className="section-eyebrow">OPERATIONAL EXCELLENCE</div>
          <h2 className="section-title">ServiceNow-Grade Delivery in 4 Simple Steps</h2>
          <p className="section-subtitle">
            Every celebration order generates a trackable ticket reference (`TC-2026-XXXXX`), managed by our FIFO queue with zero duplicate claims and complete transparency.
          </p>
        </div>

        <div className="workflow-steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h4 className="step-title">Submit Requirements</h4>
            <p className="step-desc">
              Choose your occasion, fill in ceremony details, venue address, and upload photos. No mandatory upfront registration required.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <h4 className="step-title">Handcrafted in Studio</h4>
            <p className="step-desc">
              Our verified internal creative team claims your ticket via atomic FIFO assignment to personalize themes, typography, and music.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <h4 className="step-title">Review Protected Draft</h4>
            <p className="step-desc">
              Open your private preview link. Inspect layouts on your phone, request revisions, and approve with a single tap.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">04</div>
            <h4 className="step-title">Pay & Publish Live</h4>
            <p className="step-desc">
              Complete secure payment via Razorpay. Admin authorises publishing, instantly unlocking your neutral live link, HD card, and QR code.
            </p>
          </div>
        </div>

        <div className="track-order-banner">
          <div className="banner-text">
            <h4>Already placed an order with TechMasters?</h4>
            <p>Track your artisan's progress, inspect design drafts, or download your finalized cards anytime.</p>
          </div>
          <button className="btn btn-gold" onClick={() => onNavigate('tracking')}>
            <span>Track Order with Reference ID →</span>
          </button>
        </div>
      </section>

      {/* --- CORPORATE ASSURANCE FOOTER BANNER --- */}
      <section className="assurance-section">
        <div className="assurance-box">
          <div className="assurance-logo">✨ TECHMASTERS INNOVATIONS PRIVATE LIMITED</div>
          <h3 className="assurance-heading">Enterprise Reliability for Life’s Most Intimate Moments</h3>
          <p className="assurance-text">
            Unlike public drag-and-drop generators that flood guests with third-party ads and trackers, TechMasters Digital Celebrations operates on enterprise-grade infrastructure. Your invitation is published on clean neutral slugs with zero advertisements, bank-grade payment encryption, and strict data privacy compliance.
          </p>
          <div className="assurance-badges">
            <span className="assure-pill">🛡️ Zero Ads or Watermarks on Published Invites</span>
            <span className="assure-pill">⚡ 99.9% Uptime CDN Delivery</span>
            <span className="assure-pill">🔒 Razorpay Verified Gateways</span>
            <span className="assure-pill">⏰ Automated Grace Expiry Management</span>
          </div>
        </div>
      </section>
    </div>
  );
};
