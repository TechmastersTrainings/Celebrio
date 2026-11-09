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
  const [portfolioTab, setPortfolioTab] = useState<'website' | 'card' | 'video' | 'qr'>('website');

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
          SECTION 1: EDITORIAL SPLIT-SCREEN HERO
          ========================================================================= */}
      <section className="hero-split">
        <div className="container">
          <div className="hero-grid">
            {/* Left Column: Brand Intro, Headline, CTAs */}
            <div>
              <span className="editorial-kicker">
                TECHMASTERS DIGITAL SERVICES • BIDAR, KARNATAKA
              </span>

              <h1 style={{ marginBottom: '1.25rem', color: 'var(--navy-deep)', lineHeight: 1.18 }}>
                Make Every Celebration{' '}
                <span style={{ color: 'var(--burgundy-rich)', fontStyle: 'italic' }}>
                  Unforgettable.
                </span>
              </h1>

              <p className="lead-text" style={{ marginBottom: '2rem', maxWidth: '520px' }}>
                Beautiful digital invitations and personalised celebration experiences, thoughtfully designed for life's most meaningful moments.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => onNavigate('wizard')}
                >
                  <Sparkles size={18} style={{ color: '#F59E0B' }} />
                  <span>Create Your Invitation</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => onNavigate('designs')}
                >
                  Explore Designs
                </button>
              </div>

              {/* Trust & Guarantee Markers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 500 }}>
                    2 Free Revisions Included
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 500 }}>
                    300 DPI Print Ready (PDF)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 500 }}>
                    Live RSVP &amp; Maps
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--burgundy-rich)' }} />
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-body)', fontWeight: 500 }}>
                    WhatsApp One-Tap Share
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Mockup Display (Laptop + Mobile Phone) */}
            <div>
              <div className="mockup-composition">
                {/* Laptop Mockup */}
                <div className="laptop-frame">
                  <div className="laptop-screen">
                    {/* Simulated Celebration Webpage */}
                    <div
                      style={{
                        height: '100%',
                        background: 'radial-gradient(circle at 50% 30%, #FFFDF9 0%, #F5EFEB 100%)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.62rem',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--gold-primary)',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        THE WEDDING CELEBRATION
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.6rem',
                          color: 'var(--burgundy-rich)',
                          fontWeight: 700,
                          lineHeight: 1.1,
                          marginBottom: '6px',
                        }}
                      >
                        Arjun &amp; Sneha
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Saturday, 28th November 2026 • The Leela Palace
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '8px' }}>
                        <span style={{ background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                          48 Days Left
                        </span>
                        <span style={{ background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                          Google Maps Venue
                        </span>
                        <span style={{ background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                          RSVP Open
                        </span>
                      </div>

                      <div
                        style={{
                          width: '100%',
                          height: '4px',
                          background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)',
                          marginTop: '4px',
                        }}
                      />
                    </div>
                  </div>
                  <div className="laptop-base" />
                </div>

                {/* Smartphone Mockup */}
                <div className="phone-frame">
                  <div className="phone-screen">
                    <div
                      style={{
                        padding: '1.25rem 0.85rem',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'center',
                        background: 'linear-gradient(180deg, #FAF6F0 0%, #FFFFFF 100%)',
                      }}
                    >
                      <div style={{ fontSize: '0.55rem', color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.12em' }}>
                        VIVAHA PRARTHANA
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--burgundy-rich)', fontWeight: 700 }}>
                          S &amp; A
                        </div>
                        <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Nov 28, 2026
                        </p>
                      </div>
                      <div
                        style={{
                          background: 'var(--burgundy-rich)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                        }}
                      >
                        Confirm RSVP
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: OCCASION CATEGORIES (EDITORIAL CARDS)
          ========================================================================= */}
      <section className="section" id="occasions">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <span className="editorial-kicker">PERSONALIZED CELEBRATION VERTICALS</span>
            <h2 style={{ marginBottom: '1rem' }}>Bespoke Invitations for Life's Milestones</h2>
            <p className="lead-text">
              Every occasion possesses its own rhythm, family emotion, and cultural beauty. We tailor each experience with respectful typography, interactive schedules, and custom media.
            </p>
          </div>

          <div className="grid grid-cols-3">
            {occasions.map((occ) => {
              const imgUrl = categoryImages[occ.slug] || categoryImages['marriage'];
              const startPrice = getStartingPrice(occ);

              return (
                <div key={occ.id} className="showcase-card">
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={imgUrl} alt={occ.display_name} className="showcase-card-img" />
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(13, 27, 42, 0.85)',
                        backdropFilter: 'blur(6px)',
                        color: '#F8FAFC',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.28rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Bespoke Vertical
                    </span>
                  </div>

                  <div className="showcase-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem' }}>{occ.display_name}</h3>
                      {startPrice && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>From</span>
                          <strong style={{ color: 'var(--burgundy-rich)', fontSize: '1.15rem' }}>
                            ₹{startPrice}
                          </strong>
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1, lineHeight: 1.6 }}>
                      {occ.description}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
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
          SECTION 3: 7 DEDICATED SERVICES SHOWCASE
          ========================================================================= */}
      <section className="section section-champagne" id="services">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
            <span className="editorial-kicker">COMPREHENSIVE MULTI-MEDIA SUITE</span>
            <h2 style={{ marginBottom: '1rem' }}>Seven Dimensions of Digital Hospitality</h2>
            <p className="lead-text">
              We go far beyond static graphic cards. TechMasters Digital Services delivers an end-to-end interactive guest experience engineered for every digital channel.
            </p>
          </div>

          <div className="grid grid-cols-3">
            {/* Service 1 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <Monitor size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Personalised Invitation Websites</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Custom hosted websites on clean neutral domains. Includes real-time countdown clocks, personalized event stories, photo galleries, and background music player.
              </p>
            </div>

            {/* Service 2 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <FileText size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Ultra HD Print-Ready Cards</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                300 DPI high-resolution invitation cards delivered in JPG, PNG, and vector-crisp PDF formats. Perfect for direct WhatsApp sharing and local commercial printing.
              </p>
            </div>

            {/* Service 3 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <Video size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Animated Invitation Videos</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Cinematic MP4 motion videos produced by dedicated TechMasters video specialists. Incorporates family photographs, transition titles, and curated auspicious soundtracks.
              </p>
            </div>

            {/* Service 4 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <QrCode size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>QR-Enabled Physical Cards</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Vector QR code generated for your celebration. Print it onto physical cards or wedding sweets boxes so guests can scan with any phone to open the interactive website.
              </p>
            </div>

            {/* Service 5 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <Heart size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Guest RSVP &amp; Digital Wishes</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Seamless attendee headcount collection without calling guests. Guests leave heartfelt blessings and diet preferences; hosts view responses in real-time.
              </p>
            </div>

            {/* Service 6 */}
            <div className="editorial-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--burgundy-rich)' }}>
                <MapPin size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Event Schedules &amp; Venue Maps</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Multi-day ceremony timelines (Mehendi, Sangeet, Muhurtham, Reception) with one-click Google Maps GPS navigation so out-of-town guests arrive smoothly.
              </p>
            </div>

            {/* Service 7 */}
            <div className="editorial-card" style={{ gridColumn: 'span 3', '@media (max-width: 992px)': { gridColumn: 'span 1' } } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--burgundy-rich)', flexShrink: 0 }}>
                  <Palette size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Premium Customisations &amp; Regional Language Scripting</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Full Unicode typography support in <strong>Kannada, Hindi, Telugu, Marathi, Tamil, and English</strong>. Bespoke color grading, wedding monogram crests, and auspicious Vedic verses tailored to your community traditions.
                  </p>
                </div>
                <button className="btn btn-outline-gold btn-sm" onClick={() => onNavigate('wizard')}>
                  Request Customised Package
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HOW IT WORKS (6-STEP REFINED TIMELINE)
          ========================================================================= */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 3.5rem' }}>
            <span className="editorial-kicker">SERVICENOW-GRADE PRODUCTION PRECISION</span>
            <h2 style={{ marginBottom: '1rem' }}>Six Steps to Your Celebration Reveal</h2>
            <p className="lead-text">
              We blend artisan design craftsmanship with enterprise service tracking. You inspect protected previews and approve everything before payment is required.
            </p>
          </div>

          <div className="grid grid-cols-3">
            {/* Step 1 */}
            <div className="timeline-step-card">
              <div className="timeline-number">01</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Choose Your Occasion</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Select your celebration vertical (Wedding, Naming Ceremony, Milestone Birthday, Anniversary) and preferred service tier.
              </p>
            </div>

            {/* Step 2 */}
            <div className="timeline-step-card">
              <div className="timeline-number">02</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Submit Details &amp; Assets</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Enter event dates, multi-ceremony venues, and family names. Upload high-res photographs and preferred music securely.
              </p>
            </div>

            {/* Step 3 */}
            <div className="timeline-step-card">
              <div className="timeline-number">03</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Artisan Team Designs</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Your ticket enters our FIFO production queue. Dedicated TechMasters designers craft bespoke layouts and responsive preview builds.
              </p>
            </div>

            {/* Step 4 */}
            <div className="timeline-step-card">
              <div className="timeline-number">04</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Review Protected Preview</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Inspect your live draft preview with watermarked security. Request revisions easily—two revision rounds are complimentary!
              </p>
            </div>

            {/* Step 5 */}
            <div className="timeline-step-card">
              <div className="timeline-number">05</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Approve &amp; Complete Payment</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Only when you are 100% delighted with the design do you authorize payment via secure UPI, cards, or net banking.
              </p>
            </div>

            {/* Step 6 */}
            <div className="timeline-step-card">
              <div className="timeline-number">06</div>
              <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>Receive &amp; Launch Live</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Admin publishes your final website on an elegant neutral domain, and delivers 300 DPI cards, dynamic QR codes, and MP4 video.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: REAL PORTFOLIO & WORK SHOWCASE
          ========================================================================= */}
      <section className="section section-cream" id="portfolio">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 3rem' }}>
            <span className="editorial-kicker">VERIFIED LIVE EXPERIENCES</span>
            <h2 style={{ marginBottom: '1rem' }}>Experience Actual Invitation Releases</h2>
            <p className="lead-text">
              Test drive actual published neutral invitation experiences created by our production team.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${portfolioTab === 'website' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPortfolioTab('website')}
            >
              <Monitor size={15} />
              <span>Interactive Celebration Website</span>
            </button>
            <button
              className={`btn btn-sm ${portfolioTab === 'card' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPortfolioTab('card')}
            >
              <FileText size={15} />
              <span>300 DPI Print Card</span>
            </button>
            <button
              className={`btn btn-sm ${portfolioTab === 'video' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPortfolioTab('video')}
            >
              <Video size={15} />
              <span>Animated Motion Video</span>
            </button>
            <button
              className={`btn btn-sm ${portfolioTab === 'qr' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPortfolioTab('qr')}
            >
              <QrCode size={15} />
              <span>Dynamic Smart QR</span>
            </button>
          </div>

          {/* Showcase Viewer Content */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-card)',
              maxWidth: '920px',
              margin: '0 auto',
            }}
          >
            {portfolioTab === 'website' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="editorial-kicker" style={{ marginBottom: '4px', fontSize: '0.72rem' }}>
                      ROYAL WEDDING SAMPLE
                    </span>
                    <h3 style={{ fontSize: '1.45rem', margin: 0 }}>
                      Arjun &amp; Sneha Vivaha Mahotsava
                    </h3>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onNavigate('public-invite', 'arjun-sneha-wedding-1645')}
                  >
                    <span>Open Live Website Demo</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--bg-champagne)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--burgundy-rich)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Arjun &amp; Sneha
                  </div>
                  <p style={{ fontStyle: 'italic', color: 'var(--gold-primary)', fontSize: '1.05rem', marginBottom: '1rem' }}>
                    "Two hearts, one lifelong celebration"
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    Featuring live countdown timer, interactive RSVP guestbook, Google Maps route to venue in Bidar, and curated classical instrumental audio.
                  </p>
                  <div style={{ display: 'inline-flex', gap: '1rem' }}>
                    <span className="badge badge-published">Published On Neutral Domain</span>
                    <span className="badge badge-paid">Fully Responsive</span>
                  </div>
                </div>
              </div>
            )}

            {portfolioTab === 'card' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Ultra High-Definition 300 DPI Cards</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.75rem' }}>
                  Supplied in CMYK print-ready vector PDF and sRGB high-res JPG for WhatsApp distribution without compression degradation.
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'var(--bg-ivory)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--gold-primary)',
                    boxShadow: 'var(--shadow-elevated)',
                    maxWidth: '380px',
                  }}
                >
                  <div style={{ border: '1px dashed var(--gold-primary)', padding: '2rem 1.5rem' }}>
                    <div style={{ fontSize: '1.25rem', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>卐 ॐ 卐</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--burgundy-rich)', fontWeight: 700 }}>
                      Priya &amp; Rohan
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>
                      Cordially invite you to their Ring Ceremony • ITC Windsor Bengaluru
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                      300 DPI PRINT QUALITY VERIFIED
                    </div>
                  </div>
                </div>
              </div>
            )}

            {portfolioTab === 'video' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Cinematic MP4 Invitation Video</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.75rem' }}>
                  Animated invitations with smooth typography entrance, couple story photomontage, and traditional music accompaniment.
                </p>
                <div
                  style={{
                    background: 'var(--navy-deep)',
                    color: '#FFFFFF',
                    padding: '3rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '480px',
                    margin: '0 auto',
                  }}
                >
                  <Video size={48} style={{ color: 'var(--gold-soft)', marginBottom: '1rem' }} />
                  <h4 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    1080p Full HD Motion Invite
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
                    Standard duration 45–60 seconds • Formatted for WhatsApp status &amp; direct messages
                  </p>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => onNavigate('wizard')}
                  >
                    Include Video In My Order
                  </button>
                </div>
              </div>
            )}

            {portfolioTab === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Dynamic Smart QR Codes</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.75rem' }}>
                  Connect your printed cards to your digital experience. Guests scan with any camera app to launch the live countdown and map.
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'var(--bg-champagne)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', marginBottom: '1rem' }}>
                    <QrCode size={120} style={{ color: 'var(--navy-deep)' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                    Scan to Open Arjun &amp; Sneha's Wedding
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    High-contrast SVG and PNG assets included
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: DYNAMIC PACKAGES & PRICING PREVIEW
          ========================================================================= */}
      <section className="section" id="pricing">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 3.5rem' }}>
            <span className="editorial-kicker">TRANSPARENT VALUE ARCHITECTURE</span>
            <h2 style={{ marginBottom: '1rem' }}>All-Inclusive Celebration Packages</h2>
            <p className="lead-text">
              Real packages configured through our administrative catalog. All prices include design development, 2 revision rounds, and secure hosting.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading real-time catalog pricing from server...
            </div>
          ) : occasions.length > 0 ? (
            <div className="grid grid-cols-3">
              {occasions.slice(0, 3).map((occ) => {
                const pkgs = occ.packages || [];
                const primaryPkg = pkgs[0];

                return (
                  <div key={occ.id} className="card card-gold-accent" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span className="editorial-kicker" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                        {occ.display_name}
                      </span>
                      <h3 style={{ fontSize: '1.4rem' }}>
                        {primaryPkg ? primaryPkg.name : `${occ.display_name} Package`}
                      </h3>
                    </div>

                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)' }}>
                          ₹{primaryPkg ? primaryPkg.base_price_inr : '399'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ complete service</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                        2 Revision Rounds Included Free
                      </span>
                    </div>

                    <ul style={{ listStyle: 'none', marginBottom: '2rem', flex: 1 }}>
                      <li style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                        <span>Interactive Celebration Website</span>
                      </li>
                      <li style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                        <span>High-Resolution 300 DPI Card (PDF &amp; JPG)</span>
                      </li>
                      <li style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                        <span>Real-Time RSVP &amp; Google Maps Venue</span>
                      </li>
                      <li style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                        <span>Dynamic Printable QR Code</span>
                      </li>
                      <li style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                        <span>Regional Language Unicode Typography</span>
                      </li>
                    </ul>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => onSelectOccasion(occ.id, primaryPkg?.id)}
                    >
                      <span>Select Package</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Packages Being Configured</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Our operations team is currently updating bespoke packages. Please submit an enquiry for custom pricing.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('wizard')}>
                Submit Custom Celebration Enquiry
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => onNavigate('catalog')}>
              <span>View Full Catalog &amp; Add-Ons (Videos &amp; Hosting)</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CORPORATE TRUST & BIDAR CAMPUS CALL-TO-ACTION
          ========================================================================= */}
      <section className="section section-champagne">
        <div className="container">
          <div
            style={{
              background: '#0D1B2A',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 3rem',
              boxShadow: 'var(--shadow-elevated)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: '640px', position: 'relative', zIndex: 10 }}>
              <span className="editorial-kicker" style={{ color: 'var(--gold-soft)' }}>
                TECHMASTERS INNOVATIONS PRIVATE LIMITED • BIDAR
              </span>

              <h2 style={{ color: '#FFFFFF', fontSize: '2.3rem', marginBottom: '1rem', lineHeight: 1.2 }}>
                Ready to Create an Exceptional Celebration Invitation?
              </h2>

              <p style={{ color: '#CBD5E1', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                Submit your celebration requirements in under 3 minutes. Our internal team begins crafting your bespoke preview immediately, backed by our zero-payment-until-approved commitment.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => onNavigate('wizard')}
                >
                  <Sparkles size={18} />
                  <span>Start Your Order Now</span>
                  <ArrowRight size={16} />
                </button>

                <a
                  href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20would%20like%20to%20enquire%20about%20a%20digital%20invitation."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-lg"
                  style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                >
                  <MessageCircle size={18} />
                  <span>Talk with an Artisan on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Subtle decorative emblem */}
            <div
              style={{
                position: 'absolute',
                right: '-40px',
                bottom: '-40px',
                fontSize: '18rem',
                opacity: 0.05,
                color: '#FFFFFF',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: 'var(--font-serif)',
              }}
            >
              TM
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
