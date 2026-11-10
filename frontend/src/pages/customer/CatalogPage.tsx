import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Addon } from '../../types';
import { OFFICIAL_OCCASIONS, OFFICIAL_ADDONS } from '../../data/defaultCatalog';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Video,
  Clock,
  Search,
  ShieldCheck,
  MessageCircle,
  Smartphone,
  MapPin,
  Heart,
  Calendar,
  Gift,
  HelpCircle,
} from 'lucide-react';

interface CatalogPageProps {
  onSelectPackage: (occasionId: string, packageId: string) => void;
  onTrackOrder: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onSelectPackage, onTrackOrder }) => {
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);
  const [addons, setAddons] = useState<Addon[]>(OFFICIAL_ADDONS);
  const [loading, setLoading] = useState(false);
  const [selectedOccasionFilter, setSelectedOccasionFilter] = useState<string>('ALL');

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [occData, addonData] = await Promise.all([
        ApiService.getOccasions(),
        ApiService.getAddons(),
      ]);
      if (Array.isArray(occData) && occData.length > 0) {
        setOccasions(occData);
      }
      if (Array.isArray(addonData) && addonData.length > 0) {
        setAddons(addonData);
      }
    } catch (err: any) {
      console.warn('Using official fallback catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const displayedOccasions =
    selectedOccasionFilter === 'ALL'
      ? occasions
      : occasions.filter((o) => o.id === selectedOccasionFilter || o.slug === selectedOccasionFilter);

  const getOccasionIcon = (slug: string) => {
    switch (slug) {
      case 'marriage':
        return <Heart size={16} />;
      case 'naming-ceremony':
        return <Gift size={16} />;
      case 'birthday':
        return <Sparkles size={16} />;
      case 'anniversary':
        return <Calendar size={16} />;
      case 'engagement':
        return <Heart size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  return (
    <div className="catalog-page-container" style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Editorial Hero Banner */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
          <span className="editorial-kicker">TECHMASTERS DIGITAL SERVICES</span>
          <h1
            style={{
              marginBottom: '1rem',
              fontSize: 'clamp(2.1rem, 5vw, 2.9rem)',
              lineHeight: 1.2,
              color: 'var(--navy-deep)',
            }}
          >
            Celebration Packages &amp; Transparent Pricing
          </h1>
          <p
            className="lead-text"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
              color: 'var(--text-body)',
              maxWidth: '720px',
              margin: '0 auto 1.5rem',
            }}
          >
            All-inclusive, handcrafted digital invitations for your family milestones. Inspect your watermarked interactive preview with family, request fine-tuning, and authorize payment only after 100% satisfaction.
          </p>

          {/* Quick Actions & Trust Pill Group */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <button className="btn btn-navy btn-sm" onClick={onTrackOrder}>
              <Search size={14} />
              <span>Track Existing Order</span>
            </button>
            <a
              href="https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20have%20a%20question%20about%20your%20invitation%20packages."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <MessageCircle size={14} style={{ color: '#16A34A' }} />
              <span>WhatsApp Consultation</span>
            </a>
          </div>

          {/* 4 Guarantees Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
              padding: '0.75rem 1.25rem',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              maxWidth: '780px',
              margin: '1.5rem auto 0',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--burgundy-rich)' }} />
              <strong>Pay After 100% Approval</strong>
            </span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} style={{ color: 'var(--burgundy-rich)' }} />
              <span>24–48h Fast Turnaround</span>
            </span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Smartphone size={14} style={{ color: 'var(--burgundy-rich)' }} />
              <span>Mobile-First Web App</span>
            </span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--burgundy-rich)' }} />
              <span>300 DPI Print-Ready PDF</span>
            </span>
          </div>
        </div>

        {/* Occasion Filter Tabs Bar (Horizontal & Touch Scrollable) */}
        <div
          className="occasion-filter-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            padding: '0.5rem 0.25rem 1rem',
            marginBottom: '2.5rem',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setSelectedOccasionFilter('ALL')}
            className={`btn btn-sm ${selectedOccasionFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0.5rem 1.15rem',
              fontSize: '0.86rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            All Occasions ({occasions.length})
          </button>
          {occasions.map((occ) => {
            const isActive = selectedOccasionFilter === occ.id || selectedOccasionFilter === occ.slug;
            return (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasionFilter(occ.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.86rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {getOccasionIcon(occ.slug)}
                <span>{occ.display_name}</span>
              </button>
            );
          })}
        </div>

        {/* Occasion Categories & Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '4rem' }}>
          {displayedOccasions.map((occ) => (
            <div
              key={occ.id}
              className="editorial-card occasion-pricing-card"
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #DCE5EE',
                boxShadow: '0 6px 20px rgba(13, 27, 42, 0.05)',
              }}
            >
              {/* Occasion Section Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ maxWidth: '780px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        color: 'var(--gold-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getOccasionIcon(occ.slug)}
                    </span>
                    <span
                      className="editorial-kicker"
                      style={{ fontSize: '0.74rem', marginBottom: 0, color: 'var(--gold-primary)' }}
                    >
                      OFFICIAL CELEBRATION TIER
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                      color: 'var(--navy-deep)',
                      margin: '0 0 0.35rem',
                    }}
                  >
                    {occ.display_name}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
                    {occ.description}
                  </p>
                </div>
              </div>

              {/* Package Grid: Responsive 2-column or 1-column on mobile */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                  gap: '1.75rem',
                }}
              >
                {occ.packages.map((pkg) => {
                  const price = parseFloat(String(pkg.base_price_inr)) || 0;
                  const isPremium = pkg.code.includes('PREMIUM') || pkg.code.includes('GRAND') || price >= 499;

                  return (
                    <div
                      key={pkg.id}
                      className="package-pricing-box"
                      style={{
                        border: isPremium ? '2px solid var(--gold-primary)' : '1px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        padding: 'clamp(1.25rem, 3vw, 2rem)',
                        background: isPremium ? 'linear-gradient(180deg, #FCFBF7 0%, #FFFFFF 100%)' : '#FFFFFF',
                        boxShadow: isPremium ? '0 10px 25px rgba(184, 142, 62, 0.15)' : 'var(--shadow-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
                      {isPremium && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-13px',
                            right: '20px',
                            background: 'linear-gradient(135deg, #B88E3E 0%, #D4AF37 100%)',
                            color: '#FFFFFF',
                            fontSize: '0.70rem',
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            boxShadow: '0 2px 8px rgba(184, 142, 62, 0.4)',
                          }}
                        >
                          ★ Recommended Suite
                        </div>
                      )}

                      <div>
                        {/* Title & Price Header */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            paddingBottom: '1rem',
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)',
                                color: 'var(--text-heading)',
                                margin: 0,
                                fontWeight: 700,
                              }}
                            >
                              {pkg.name}
                            </h3>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Bespoke Artisan Production
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
                                fontWeight: 800,
                                color: 'var(--burgundy-rich)',
                                fontFamily: 'var(--font-serif)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1,
                              }}
                            >
                              ₹{price.toFixed(2)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>
                              Fixed Commercial Rate
                            </span>
                          </div>
                        </div>

                        {/* Guarantee Feature Badge */}
                        <div
                          style={{
                            padding: '0.5rem 0.85rem',
                            background: isPremium ? 'rgba(184, 142, 62, 0.1)' : 'var(--bg-champagne)',
                            borderRadius: 'var(--radius-xs)',
                            marginBottom: '1.25rem',
                            fontSize: '0.84rem',
                            color: 'var(--burgundy-rich)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                          }}
                        >
                          <ShieldCheck size={16} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                          <span>Pay only after 100% design preview approval</span>
                        </div>

                        {/* Inclusions List */}
                        <div style={{ marginBottom: '1.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--text-muted)',
                              display: 'block',
                              marginBottom: '0.75rem',
                            }}
                          >
                            Everything Included in this Suite:
                          </span>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {(pkg.features_json && pkg.features_json.length > 0
                              ? pkg.features_json
                              : [
                                  'Personalized Digital Invitation Website',
                                  '300 DPI Print-Ready Card (JPG & PDF)',
                                  'Interactive RSVP Headcount & Guest Wishes',
                                  'Multi-day Event Itinerary & Google Maps GPS',
                                  'WhatsApp Instant Share Pass',
                                  'Cloud Hosting Included',
                                ]
                            ).map((feat, fIdx) => (
                              <li
                                key={fIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.65rem',
                                  fontSize: '0.90rem',
                                  marginBottom: '0.65rem',
                                  color: 'var(--text-body)',
                                  lineHeight: 1.45,
                                }}
                              >
                                <CheckCircle2
                                  size={16}
                                  style={{
                                    color: isPremium ? 'var(--gold-primary)' : 'var(--burgundy-rich)',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Package Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
                        <button
                          className={isPremium ? 'btn btn-primary btn-lg' : 'btn btn-outline btn-lg'}
                          onClick={() => onSelectPackage(occ.id, pkg.id)}
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            fontWeight: 600,
                            padding: '0.85rem 1.25rem',
                          }}
                        >
                          <Sparkles size={16} style={{ color: isPremium ? '#F59E0B' : 'currentColor' }} />
                          <span>Select {pkg.name}</span>
                          <ArrowRight size={16} />
                        </button>

                        <a
                          href={`https://wa.me/919880768222?text=Hello%20TechMasters%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(
                            pkg.name
                          )}%20package.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textAlign: 'center',
                            fontSize: '0.80rem',
                            color: '#16A34A',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0',
                          }}
                        >
                          <MessageCircle size={13} />
                          <span>Ask a question about this package</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add-Ons & Creative Enhancements Suite */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A192F 0%, #0F284E 50%, #08162B 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            color: '#FFFFFF',
            marginBottom: '4rem',
            boxShadow: '0 12px 30px rgba(10, 25, 47, 0.25)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
            <span className="editorial-kicker" style={{ color: '#F59E0B' }}>
              CREATIVE ADD-ONS &amp; MOTION ENHANCEMENTS
            </span>
            <h2 style={{ color: '#FFFFFF', fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: '0.75rem' }}>
              Elevate Your Celebration Suite
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.98rem', lineHeight: 1.6 }}>
              Add cinematic motion graphics video invitations, status teasers, and express delivery to any package tier during order customization.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '1.5rem',
            }}
          >
            {addons.map((add) => (
              <div
                key={add.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h4 style={{ color: '#FFFFFF', fontSize: '1.15rem', margin: 0, fontWeight: 600 }}>
                      {add.name}
                    </h4>
                    <span
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        color: '#F59E0B',
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      +₹{parseFloat(String(add.price_inr)).toFixed(2)}
                    </span>
                  </div>
                  <p style={{ color: '#CBD5E1', fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }}>
                    {add.description ||
                      'Custom configured add-on asset produced by authorized TechMasters video developers.'}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: '#94A3B8',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Video size={13} style={{ color: '#F59E0B' }} />
                    HD Video / Fast Pass
                  </span>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>Selectable in Step 2</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparent FAQ & Service Questions */}
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="editorial-kicker">COMMERCIAL TRANSPARENCY</span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', color: 'var(--navy-deep)' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-deep)', marginBottom: '0.5rem', fontWeight: 600 }}>
                When do I pay for my invitation?
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                You pay <strong>only after</strong> you review and 100% approve your interactive watermarked draft preview. There is zero upfront financial obligation when submitting event details.
              </p>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-deep)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Can we customize music, family names, and photographs?
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                Yes! Every invitation is handcrafted by our creative developers. You can supply audio tracks, multiple venue locations, Muhurtham timings, dress codes, and high-resolution family photos.
              </p>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-deep)', marginBottom: '0.5rem', fontWeight: 600 }}>
                How do our guests open the invitation?
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                Guests simply tap the link via WhatsApp, SMS, or scan the QR code. It opens immediately on any iPhone, Android, or laptop without needing to install any app.
              </p>
            </div>
          </div>

          {/* Bottom CTA Box */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '3.5rem',
              padding: '2.5rem',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #DCE5EE',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h3 style={{ fontSize: '1.6rem', color: 'var(--navy-deep)', marginBottom: '0.5rem' }}>
              Ready to Craft Your Celebration Invitation?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginBottom: '1.75rem' }}>
              Choose your occasion, submit your event details, and inspect your custom preview within 24–48 hours.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onSelectPackage(occasions[0]?.id || 'occ-marriage', occasions[0]?.packages[0]?.id || 'pkg-marriage-standard')}
              style={{ padding: '0.9rem 2rem' }}
            >
              <Sparkles size={16} style={{ color: '#F59E0B' }} />
              <span>Begin Your Invitation Order</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
