import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Occasion } from '../../types';
import { OFFICIAL_OCCASIONS } from '../../data/defaultCatalog';
import {
  Sparkles,
  ArrowRight,
  Monitor,
  Video,
  QrCode,
  Heart,
  MapPin,
  CheckCircle2,
  FileText,
  Palette,
  Tag,
  Gift,
  Percent,
  Smartphone,
  Clapperboard,
  MessageCircle,
  CalendarCheck,
} from 'lucide-react';
import { OccasionArt, isFormat, rupees, startingPrice } from '../../components/occasions/occasionVisuals';
import '../../styles/storefront.css';

interface HomePageProps {
  onSelectOccasion: (occId: string, pkgId?: string) => void;
  onNavigate: (view: string, param?: string) => void;
}

const SERVICES = [
  { icon: Monitor, title: 'Personalised Invitation Websites', text: 'Custom hosted websites on clean neutral domains with countdown clocks, couple stories, photo galleries, and music players.' },
  { icon: FileText, title: 'Ultra HD Print-Ready Cards', text: '300 DPI high-resolution invitation cards in JPG, PNG, and vector-crisp PDF. Ideal for WhatsApp and physical printing.' },
  { icon: Smartphone, title: 'Instagram-Ready Formats', text: 'Every card in Instagram Story (1080×1920) and Post (1080×1080) sizes, and videos in vertical 9:16 for Reels and WhatsApp Status.' },
  { icon: Video, title: 'Animated Invitation Videos', text: 'Motion videos produced with family photos, motion typography, and curated classical/devotional audio.' },
  { icon: QrCode, title: 'QR-Enabled Physical Cards', text: 'Dynamic printable vector QR code for cards and sweet boxes. Guests scan with any phone to open the interactive website.' },
  { icon: Heart, title: 'Guest RSVP & Digital Wishes', text: 'Automated attendee headcount collection. Guests submit heartfelt blessings and diet preferences tracked in your portal.' },
  { icon: MapPin, title: 'Schedules & Google Maps GPS', text: 'Multi-day ceremony timelines (Mehendi, Sangeet, Muhurtham) with direct one-tap Google Maps navigation for guests.' },
];

const STEPS = [
  { title: 'Choose Occasion', text: 'Pick your celebration or invitation format and select a package tier.' },
  { title: 'Submit Details', text: 'Enter event dates, venues, family names, and upload high-res photos.' },
  { title: 'Artisan Designs', text: 'Your order is assigned to a dedicated designer who crafts bespoke previews.' },
  { title: 'Review Preview', text: 'Inspect the live draft preview and request adjustments before approval.' },
  { title: 'Approve & Pay', text: 'Authorise payment via UPI or cards only after you 100% approve.' },
  { title: 'Launch Live', text: 'Receive your published website, 300 DPI card PDFs, Instagram-ready files, and printable QR codes.' },
];

export const HomePage: React.FC<HomePageProps> = ({ onSelectOccasion, onNavigate }) => {
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);

  useEffect(() => {
    ApiService.getOccasions()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setOccasions(data);
      })
      .catch((err) => console.error('Failed to load occasions catalog:', err));
  }, []);

  const celebrations = occasions.filter((o) => !isFormat(o));
  const formats = occasions.filter(isFormat);

  return (
    <div className="sf">
      {/* ================= HERO ================= */}
      <section className="sf-hero">
        <div className="sf-wrap sf-hero-grid">
          <div>
            <button type="button" className="sf-offer" onClick={() => onNavigate('offers')}>
              <span className="sf-offer-dot"><Percent size={12} /></span>
              Default 12% Savings Applied Automatically
              <span className="sf-offer-link">View Offers →</span>
            </button>
            <span className="sf-kicker">TechMasters Digital Services • Bidar, Karnataka</span>
            <h1>
              Make Every Celebration <em>Unforgettable.</em>
            </h1>
            <p className="sf-lead">
              Beautiful digital invitations and personalised celebration experiences, thoughtfully designed for life's most meaningful moments.
            </p>
            <div className="sf-cta">
              <button type="button" className="sf-btn sf-btn-primary" onClick={() => onNavigate('wizard')}>
                <Sparkles size={17} /> Create Your Invitation <ArrowRight size={15} />
              </button>
              <button type="button" className="sf-btn sf-btn-ghost" onClick={() => onNavigate('designs')}>
                Explore Designs
              </button>
            </div>
            <div className="sf-trust">
              <span><CheckCircle2 size={14} /> 100% Approval Guarantee</span>
              <span><CheckCircle2 size={14} /> 300 DPI Print PDF</span>
              <span><CheckCircle2 size={14} /> Live RSVP &amp; Maps</span>
              <span><CheckCircle2 size={14} /> Instagram &amp; WhatsApp Ready</span>
            </div>
          </div>

          {/* Decorative preview of a story-format invitation */}
          <div className="sf-visual" aria-hidden>
            <div className="sf-phone">
              <div className="sf-phone-screen">
                <span className="sf-phone-island" />
                <div className="sf-story-bars"><span /><span /><span /></div>
                <div className="sf-story-body">
                  <span className="sf-story-orn">✦ ✦ ✦</span>
                  <span className="sf-story-kicker">YOU ARE INVITED</span>
                  <span className="sf-story-title">Save the Date</span>
                  <span className="sf-story-sub">Personalised celebration<br />invitation</span>
                  <span className="sf-story-cta">Confirm RSVP</span>
                </div>
              </div>
            </div>
            <div className="sf-chip-float sf-chip-a">
              <span className="sf-chip-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}><Clapperboard size={16} /></span>
              <span><strong>Reels &amp; Stories</strong><small>9:16 vertical format</small></span>
            </div>
            <div className="sf-chip-float sf-chip-b">
              <span className="sf-chip-icon" style={{ background: '#16a34a' }}><MessageCircle size={16} /></span>
              <span><strong>WhatsApp share</strong><small>One tap for guests</small></span>
            </div>
            <div className="sf-chip-float sf-chip-c">
              <span className="sf-chip-icon" style={{ background: 'var(--burgundy-rich)' }}><CalendarCheck size={16} /></span>
              <span><strong>RSVP &amp; Maps</strong><small>Built into the invite</small></span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OCCASIONS ================= */}
      <section className="sf-section sf-occ-band" id="occasions">
        <div className="sf-wrap">
          <div className="sf-head">
            <span className="sf-kicker">Celebrations</span>
            <h2>Invitations for Life's Milestones</h2>
            <p>
              Every occasion possesses its own rhythm, family emotion, and cultural beauty. We tailor each experience with respectful typography, interactive schedules, and custom media.
            </p>
          </div>

          <div className="sf-occ-grid">
            {celebrations.map((occ) => {
              const from = startingPrice(occ);
              return (
                <article key={occ.id} className="sf-occ">
                  <OccasionArt occasion={occ} />
                  <div className="sf-occ-body">
                    <div className="sf-occ-top">
                      <h3>{occ.display_name}</h3>
                      {from !== null && (
                        <span className="sf-price"><small>from</small>{rupees(from)}</span>
                      )}
                    </div>
                    <p>{occ.description}</p>
                    <div className="sf-occ-actions">
                      <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => onNavigate('designs')}>
                        Explore Designs
                      </button>
                      <button type="button" className="sf-btn sf-btn-primary sf-btn-sm" onClick={() => onSelectOccasion(occ.id)}>
                        Customise <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {formats.length > 0 && (
            <>
              <div className="sf-subhead">
                <h3>Invitation Formats</h3>
                <p>For any occasion — pick the format your guests will love.</p>
              </div>
              <div className="sf-formats">
                {formats.map((occ) => {
                  const from = startingPrice(occ);
                  return (
                    <article key={occ.id} className="sf-format">
                      <OccasionArt occasion={occ} />
                      <div>
                        <h3>{occ.display_name}</h3>
                        <p>{occ.description}</p>
                        <div className="sf-format-row">
                          {from !== null && <span className="sf-price">from {rupees(from)}</span>}
                          <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => onSelectOccasion(occ.id)}>
                            Customise <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="sf-section sf-dark" id="services">
        <div className="sf-wrap">
          <div className="sf-head">
            <span className="sf-kicker">What you receive</span>
            <h2>Seven Dimensions of Digital Hospitality</h2>
            <p>We go far beyond static graphic cards. TechMasters Digital Services delivers an end-to-end interactive guest experience engineered for every digital channel.</p>
          </div>
          <div className="sf-svc-grid">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="sf-svc">
                <span className="sf-svc-icon"><Icon size={19} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="sf-lang">
            <div style={{ display: 'flex', gap: '0.9em', alignItems: 'center' }}>
              <span className="sf-svc-icon" style={{ marginBottom: 0 }}><Palette size={19} /></span>
              <div>
                <h3>Regional Language Unicode Typography</h3>
                <p>Full native script support in <strong>Kannada (ಕನ್ನಡ), Hindi (हिन्दी), Telugu (తెలుగు), Marathi (मराठी), Tamil (தமிழ்), and English</strong>.</p>
              </div>
            </div>
            <button type="button" className="sf-btn sf-btn-gold sf-btn-sm" onClick={() => onNavigate('wizard')}>
              Request Customised Package
            </button>
          </div>
        </div>
      </section>

      {/* ================= OFFER ================= */}
      <section className="sf-section sf-offer-band" id="offers-banner">
        <div className="sf-wrap">
          <div className="sf-offer-card">
            <div>
              <span className="sf-kicker"><Gift size={13} /> Transparent Celebration Savings</span>
              <h2>Flat 12% Default Discount on All Digital Orders</h2>
              <p>
                Every milestone order automatically receives a 12% system discount calculated instantly in your quotation breakdown. Additional seasonal promo codes can be stacked or combined during order creation.
              </p>
              <div className="sf-ticks">
                <span><CheckCircle2 size={15} /> No coupon code required for 12%</span>
                <span><CheckCircle2 size={15} /> Real-time rupee breakdown</span>
                <span><CheckCircle2 size={15} /> Pay only after 100% draft approval</span>
              </div>
            </div>
            <div className="sf-offer-actions">
              <button type="button" className="sf-btn sf-btn-primary" onClick={() => onNavigate('offers')}>
                <Tag size={15} /> Explore Offers &amp; Deals
              </button>
              <button type="button" className="sf-btn sf-btn-ghost" onClick={() => onNavigate('wizard')}>
                Start Your Order
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="sf-section sf-steps-band" id="how-it-works">
        <div className="sf-wrap">
          <div className="sf-head">
            <span className="sf-kicker">How it works</span>
            <h2>Six Steps to Your Celebration Reveal</h2>
            <p>We blend artisan craftsmanship with enterprise service tracking. Inspect protected previews and approve everything before payment.</p>
          </div>
          <ol className="sf-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="sf-step">
                <span className="sf-step-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="sf-center">
            <button type="button" className="sf-btn sf-btn-primary" onClick={() => onNavigate('wizard')}>
              <Sparkles size={16} /> Create Your Invitation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
