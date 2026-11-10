import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Occasion } from '../../types';
import {
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Video,
  QrCode,
  Heart,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  MessageCircle,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Layers,
  Palette
} from 'lucide-react';

interface HomePageProps {
  onSelectOccasion: (occId: string, pkgId?: string) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectOccasion, onNavigate }) => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOccasions();
  }, []);

  const loadOccasions = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getOccasions();
      setOccasions(data || []);
    } catch (err) {
      console.error('Failed to load occasions catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStartingPrice = (occ: Occasion) => {
    if (!occ.packages || occ.packages.length === 0) return null;
    const prices = occ.packages.map((p) => parseFloat(String(p.base_price_inr)) || 0).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  // Occasions image mapping
  const categoryImages: Record<string, string> = {
    marriage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    engagement: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
    birthday: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    'naming-ceremony': 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
    anniversary: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  };

  return (
    <div>
      {/* =========================================================================
          SECTION 1: EDITORIAL SPLIT-SCREEN HERO (COMPACT & SLEEK)
          ========================================================================= */}
      <section className="hero-split">
        <div className="container">
          <div className="hero-grid">
            {/* Left Column: Brand Intro, Headline, CTAs */}
            <div>
              <span className="editorial-kicker" style={{ marginBottom: '0.4rem', display: 'block' }}>
                TECHMASTERS DIGITAL SERVICES • BIDAR, KARNATAKA
              </span>

              <h1 style={{ marginBottom: '0.75rem', color: 'var(--navy-deep)', lineHeight: 1.15, fontSize: '2.45rem' }}>
                Make Every Celebration{' '}
                <span style={{ color: 'var(--burgundy-rich)', fontStyle: 'italic' }}>
                  Unforgettable.
                </span>
              </h1>

              <p className="lead-text" style={{ marginBottom: '1.25rem', maxWidth: '520px', fontSize: '1.02rem', lineHeight: 1.55 }}>
                Beautiful digital invitations and personalised celebration experiences, thoughtfully designed for life's most meaningful moments.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => onNavigate('wizard')}
                >
                  <Sparkles size={17} style={{ color: '#F59E0B' }} />
                  <span>Create Your Invitation</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  className="btn btn-outline"
                  onClick={() => onNavigate('designs')}
                >
                  Explore Designs
                </button>
              </div>

              {/* Sleek Tight Horizontal Trust & Guarantee Markers */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.85rem',
                  fontSize: '0.80rem',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>
                    2 Free Revisions
                  </span>
                </div>
                <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>
                    300 DPI Print PDF
                  </span>
                </div>
                <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>
                    Live RSVP &amp; Maps
                  </span>
                </div>
                <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>
                    WhatsApp Share
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic MacBook Pro and iPhone 16 Pro Displays */}
            <div>
              <div className="mockup-composition">
                {/* Authentic MacBook Pro Housing */}
                <div className="macbook-housing">
                  {/* MacBook Center Notch */}
                  <div className="macbook-notch">
                    <div className="macbook-camera-lens" />
                  </div>

                  {/* MacBook Retina Screen */}
                  <div className="macbook-screen">
                    {/* macOS Safari Browser Toolbar */}
                    <div className="macbook-toolbar">
                      <div className="macbook-traffic-lights">
                        <span className="traffic-light traffic-light-close" />
                        <span className="traffic-light traffic-light-minimize" />
                        <span className="traffic-light traffic-light-expand" />
                      </div>
                      <div className="macbook-url-bar">
                        🔒 celebrio.in/invitation/preview
                      </div>
                    </div>

                    {/* Celebration Webpage Preview */}
                    <div
                      style={{
                        flex: 1,
                        background: 'radial-gradient(circle at 50% 25%, #FFFDF9 0%, #F5EFEB 100%)',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', marginBottom: '2px' }}>✨</span>
                      <div
                        style={{
                          fontSize: '0.58rem',
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: 'var(--gold-primary)',
                          fontWeight: 700,
                          marginBottom: '2px',
                        }}
                      >
                        DIGITAL INVITATION EXPERIENCE
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.4rem',
                          color: 'var(--burgundy-rich)',
                          fontWeight: 700,
                          lineHeight: 1.1,
                          marginBottom: '4px',
                        }}
                      >
                        Grand Celebration
                      </div>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Custom Web Invitation &bull; Interactive RSVP &bull; Venue Maps
                      </p>

                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '8px' }}>
                        <span style={{ background: '#FFFFFF', padding: '2px 7px', borderRadius: '4px', fontSize: '0.62rem', border: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--navy-deep)' }}>
                          Live Countdown
                        </span>
                        <span style={{ background: '#FFFFFF', padding: '2px 7px', borderRadius: '4px', fontSize: '0.62rem', border: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--navy-deep)' }}>
                          Google Maps Venue
                        </span>
                        <span style={{ background: 'var(--burgundy-rich)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 600 }}>
                          Confirm RSVP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MacBook Aluminum Lower Deck with Thumb Notch */}
                  <div className="macbook-base">
                    <div className="macbook-thumb-groove" />
                  </div>
                </div>

                {/* Authentic iPhone 16 Pro Mockup */}
                <div className="iphone-housing">
                  {/* Dynamic Island */}
                  <div className="iphone-dynamic-island">
                    <div className="iphone-island-lens" />
                  </div>

                  {/* iPhone Screen */}
                  <div className="iphone-screen">
                    {/* Status Bar */}
                    <div
                      style={{
                        padding: '18px 12px 4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.52rem',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      <span>9:41</span>
                      <span style={{ letterSpacing: '1px' }}>📶 🔋</span>
                    </div>

                    {/* Mobile Celebration Invitation View */}
                    <div
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'center',
                        background: 'linear-gradient(180deg, #FAF6F0 0%, #FFFFFF 100%)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.50rem', color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.12em', marginTop: '6px' }}>
                          DIGITAL CARD &bull; RSVP
                        </div>
                      </div>

                      <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--burgundy-rich)', fontWeight: 700, lineHeight: 1.15 }}>
                          Save The Date
                        </div>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Personalised Celebration
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'var(--burgundy-rich)',
                          color: '#FFFFFF',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.58rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 6px rgba(107, 23, 40, 0.25)',
                        }}
                      >
                        Confirm RSVP
                      </div>
                    </div>

                    {/* Home Indicator Bar */}
                    <div className="iphone-home-bar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: OCCASION CATEGORIES (WARM CHAMPAGNE AMBER)
          ========================================================================= */}
      <section
        className="section"
        id="occasions"
        style={{
          padding: '3.75rem 0',
          background: 'linear-gradient(180deg, #F9F4EB 0%, #F5ECE0 100%)',
          borderTop: '1px solid #E8DDD0',
          borderBottom: '1px solid #E8DDD0',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.75rem' }}>
            <span className="editorial-kicker" style={{ color: '#92400E', fontWeight: 700 }}>
              PERSONALIZED CELEBRATIONS
            </span>
            <h2 style={{ marginBottom: '0.75rem', color: '#0A192F' }}>
              Invitations for Life's Milestones
            </h2>
            <p className="lead-text" style={{ color: '#475569' }}>
              Every occasion possesses its own rhythm, family emotion, and cultural beauty. We tailor each experience with respectful typography, interactive schedules, and custom media.
            </p>
          </div>

          <div className="grid grid-cols-3">
            {occasions.map((occ) => {
              const imgUrl = categoryImages[occ.slug] || categoryImages['marriage'];
              const startPrice = getStartingPrice(occ);

              return (
                <div key={occ.id} className="showcase-card" style={{ background: '#FFFFFF', border: '1px solid #E5D9CC' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={imgUrl} alt={occ.display_name} className="showcase-card-img" />
                  </div>

                  <div className="showcase-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <h3 style={{ fontSize: '1.32rem', margin: 0, color: '#0A192F' }}>{occ.display_name}</h3>
                      {startPrice && (
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                          <span className="card-price-value">
                            <span className="card-price-currency">₹</span>
                            <span className="card-price-amount">{Math.floor(parseFloat(String(startPrice)))}</span>
                            <span className="card-price-decimals">.00</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem', flex: 1, lineHeight: 1.6 }}>
                      {occ.description}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #E8DDD0', paddingTop: '1rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, color: '#0A192F', borderColor: '#CBD5E1', background: '#FFFFFF' }}
                        onClick={() => onNavigate('designs')}
                      >
                        Explore Designs
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => onSelectOccasion(occ.id)}
                      >
                        <span>Customise</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: 7 DEDICATED SERVICES SHOWCASE (ROYAL MIDNIGHT NAVY)
          ========================================================================= */}
      <section
        className="section section-navy"
        id="services"
        style={{
          padding: '4.5rem 0',
          background: 'linear-gradient(135deg, #0A192F 0%, #0F284E 50%, #08162B 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.75rem' }}>
            <span className="editorial-kicker" style={{ color: '#F59E0B', fontWeight: 700 }}>
              COMPREHENSIVE MULTI-MEDIA SUITE
            </span>
            <h2 style={{ marginBottom: '0.75rem', color: '#FFFFFF' }}>
              Seven Dimensions of Digital Hospitality
            </h2>
            <p className="lead-text" style={{ color: '#CBD5E1' }}>
              We go far beyond static graphic cards. TechMasters Digital Services delivers an end-to-end interactive guest experience engineered for every digital channel.
            </p>
          </div>

          {/* Symmetrical 6-Box Horizontal Capability Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Service 1 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <Monitor size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>Personalised Invitation Websites</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  Custom hosted websites on clean neutral domains with countdown clocks, couple stories, photo galleries, and music players.
                </p>
              </div>
            </div>

            {/* Service 2 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>Ultra HD Print-Ready Cards</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  300 DPI high-resolution invitation cards in JPG, PNG, and vector-crisp PDF. Ideal for WhatsApp and physical printing.
                </p>
              </div>
            </div>

            {/* Service 3 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <Video size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>Animated Invitation Videos</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  Cinematic MP4 motion videos produced with family photos, motion typography, and curated classical/devotional audio.
                </p>
              </div>
            </div>

            {/* Service 4 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <QrCode size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>QR-Enabled Physical Cards</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  Dynamic printable vector QR code for cards and sweet boxes. Guests scan with any phone to open the interactive website.
                </p>
              </div>
            </div>

            {/* Service 5 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <Heart size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>Guest RSVP &amp; Digital Wishes</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  Automated attendee headcount collection. Guests submit heartfelt blessings and diet preferences tracked in your portal.
                </p>
              </div>
            </div>

            {/* Service 6 */}
            <div className="editorial-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>Schedules &amp; Google Maps GPS</h3>
                <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
                  Multi-day ceremony timelines (Mehendi, Sangeet, Muhurtham) with direct one-tap Google Maps navigation for guests.
                </p>
              </div>
            </div>
          </div>

          {/* Dimension 7: Horizontal Multilingual Typography Banner */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <Palette size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', margin: '0 0 3px', color: '#FFFFFF' }}>
                  Regional Language Unicode Typography
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#E2E8F0', margin: 0 }}>
                  Full native script support in <strong style={{ color: '#F59E0B' }}>Kannada (ಕನ್ನಡ), Hindi (हिन्दी), Telugu (తెలుగు), Marathi (मराठी), Tamil (தமிழ்), and English</strong>.
                </p>
              </div>
            </div>

            <button
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700, padding: '0.5rem 1.1rem' }}
              onClick={() => onNavigate('wizard')}
            >
              Request Customised Package
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HOW IT WORKS (CRISP PLATINUM SLATE)
          ========================================================================= */}
      <section
        className="section"
        id="how-it-works"
        style={{
          padding: '3.75rem 0',
          background: 'linear-gradient(180deg, #F0F4FA 0%, #E6EDF6 100%)',
          borderTop: '1px solid #DCE5EE',
          borderBottom: '1px solid #DCE5EE',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 2.75rem' }}>
            <span className="editorial-kicker" style={{ color: '#1E3A8A', fontWeight: 700 }}>
              SERVICENOW-GRADE PRODUCTION PRECISION
            </span>
            <h2 style={{ marginBottom: '0.75rem', color: '#0A192F' }}>
              Six Steps to Your Celebration Reveal
            </h2>
            <p className="lead-text" style={{ color: '#475569' }}>
              We blend artisan craftsmanship with enterprise service tracking. Inspect protected previews and approve everything before payment.
            </p>
          </div>

          {/* Connected Horizontal Timeline Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem 1.25rem',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  01
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 1
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Choose Occasion
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Pick Wedding, Naming Ceremony, Birthday, or Anniversary &amp; select tier.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  02
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 2
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Submit Details
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Enter event dates, venues, family names, and upload high-res photos.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  03
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 3
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Artisan Designs
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Ticket enters FIFO queue. TechMasters designers craft bespoke previews.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  04
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 4
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Review Preview
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Inspect live draft preview. 2 free revision rounds are included free.
              </p>
            </div>

            {/* Step 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  05
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 5
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Approve &amp; Pay
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Authorize payment via UPI or cards only after you 100% approve.
              </p>
            </div>

            {/* Step 6 */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                  06
                </span>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 600 }}>
                  Step 6
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.35rem', color: '#0A192F' }}>
                Launch Live
              </h4>
              <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Receive published website, 300 DPI card PDFs, and printable QR codes.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.25rem' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ background: '#6B1728', color: '#FFFFFF' }}
              onClick={() => onNavigate('wizard')}
            >
              <Sparkles size={16} style={{ color: '#F59E0B' }} />
              <span>Create Your Invitation</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
