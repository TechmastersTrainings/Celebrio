import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Addon } from '../../types';
import { Sparkles, CheckCircle2, ArrowRight, Video, RefreshCw, Clock, Search, ShieldCheck } from 'lucide-react';

interface CatalogPageProps {
  onSelectPackage: (occasionId: string, packageId: string) => void;
  onTrackOrder: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onSelectPackage, onTrackOrder }) => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const [occData, addonData] = await Promise.all([
        ApiService.getOccasions(),
        ApiService.getAddons(),
      ]);
      setOccasions(Array.isArray(occData) ? occData : []);
      setAddons(Array.isArray(addonData) ? addonData : []);
    } catch (err: any) {
      console.error('Catalog load error:', err);
      setError(err.message || 'Failed to connect to catalog services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>✨</div>
        <div style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>
          Loading Celebration Packages &amp; Pricing...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
        <h3 style={{ color: 'var(--burgundy-rich)', marginBottom: '0.5rem' }}>Connecting to Catalog</h3>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0 1.5rem', fontSize: '0.92rem' }}>
          {error}
        </p>
        <button className="btn btn-primary" onClick={loadCatalog}>
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Filter video add-ons separately as requested by prompt
  const videoAddons = addons.filter((a) => a.addon_type === 'VIDEO');
  const serviceAddons = addons.filter((a) => a.addon_type !== 'VIDEO');

  return (
    <div style={{ padding: '3.5rem 0 5rem' }}>
      <div className="container">
        {/* Editorial Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <span className="editorial-kicker">TECHMASTERS DIGITAL SERVICES</span>
          <h1 style={{ marginBottom: '1rem', fontSize: '2.75rem' }}>
            Celebration Packages &amp; Pricing
          </h1>
          <p className="lead-text">
            Transparent, all-inclusive packages. Submit your requirements, inspect watermarked interactive previews with <strong>2 complimentary revision rounds</strong>, pay only after customer approval, and receive high-resolution deliverables.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.75rem' }}>
            <button className="btn btn-navy btn-sm" onClick={onTrackOrder}>
              <Search size={14} />
              <span>Track Existing Order / Enter OTP</span>
            </button>
          </div>
        </div>

        {/* Occasion Categories & Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '4rem' }}>
          {occasions.map((occ) => (
            <div key={occ.id} className="editorial-card" style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                <div>
                  <span className="editorial-kicker" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                    CELEBRATION VERTICAL
                  </span>
                  <h2 style={{ fontSize: '1.9rem', color: 'var(--navy-deep)' }}>
                    {occ.display_name}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '0.35rem' }}>
                    {occ.description}
                  </p>
                </div>
              </div>

              {/* Package Grid for this Occasion */}
              <div className="grid grid-cols-2" style={{ gap: '1.75rem' }}>
                {occ.packages.map((pkg) => {
                  const isPremium = pkg.code.includes('PREMIUM') || parseFloat(String(pkg.base_price_inr)) > 500;

                  return (
                    <div
                      key={pkg.id}
                      style={{
                        border: isPremium ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2rem',
                        background: isPremium ? 'var(--bg-cream)' : '#FFFFFF',
                        boxShadow: isPremium ? 'var(--shadow-card)' : 'var(--shadow-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                    >
                      {isPremium && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '20px',
                            background: 'var(--gold-primary)',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                          <h3 style={{ fontSize: '1.45rem', color: 'var(--text-heading)' }}>
                            {pkg.name}
                          </h3>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)' }}>
                              ₹{pkg.base_price_inr}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Fixed Commercial Rate
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-champagne)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--burgundy-rich)', fontWeight: 600 }}>
                          ✓ Includes {pkg.included_revisions} Free Revision Rounds &bull; 90-Day Hosting
                        </div>

                        {/* Inclusions */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.65rem' }}>
                            Package Inclusions:
                          </span>
                          <ul style={{ listStyle: 'none' }}>
                            {(pkg.features_json && pkg.features_json.length > 0
                              ? pkg.features_json
                              : [
                                  'Personalized Digital Invitation Website',
                                  '300 DPI Print-Ready Card (JPG & PDF)',
                                  'Interactive RSVP Headcount & Guest Wishes',
                                  'Multi-day Event Itinerary & Google Maps GPS',
                                  'WhatsApp Instant Share Pass',
                                  'Multilingual Kannada, Hindi, English Typography',
                                ]
                            ).map((feat: string, idx: number) => (
                              <li
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.55rem',
                                  fontSize: '0.88rem',
                                  marginBottom: '0.45rem',
                                  color: 'var(--text-body)',
                                }}
                              >
                                <CheckCircle2 size={16} style={{ color: 'var(--burgundy-rich)', flexShrink: 0, marginTop: '3px' }} />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={() => onSelectPackage(occ.id, pkg.id)}
                      >
                        <span>Choose Package &amp; Enter Details</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Dedicated Animated Video Packages Section */}
        {videoAddons.length > 0 && (
          <div className="section section-champagne" style={{ borderRadius: 'var(--radius-md)', padding: '3rem 2.5rem', marginBottom: '3.5rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--burgundy-rich)', marginBottom: '0.5rem' }}>
                <Video size={20} />
                <span className="editorial-kicker" style={{ marginBottom: 0 }}>MOTION MEDIA SPECIALISTS</span>
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Animated Video Invitation Packages
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
                Elevate your WhatsApp invitation with motion graphics, personalized soundtracks, and photographic transitions.
              </p>
            </div>

            <div className="grid grid-cols-3">
              {videoAddons.map((addon) => (
                <div key={addon.id} className="card" style={{ background: '#FFFFFF', textAlign: 'center', padding: '2rem 1.5rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-champagne)', color: 'var(--burgundy-rich)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Video size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{addon.name}</h3>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
                    +₹{addon.price_inr}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                    {addon.description || 'Full HD MP4 video formatted for WhatsApp status and direct family messages.'}
                  </p>
                  <span className="badge badge-assigned">Can be added during order</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Add-Ons Section */}
        {serviceAddons.length > 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="editorial-kicker">OPTIONAL SERVICE ADD-ONS</span>
              <h2 style={{ fontSize: '1.8rem' }}>Customisation &amp; Extension Add-Ons</h2>
            </div>

            <div className="grid grid-cols-3">
              {serviceAddons.map((addon) => (
                <div key={addon.id} className="editorial-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-heading)' }}>{addon.name}</h4>
                    <strong style={{ color: 'var(--burgundy-rich)', fontSize: '1.15rem' }}>
                      +₹{addon.price_inr}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {addon.description || 'Configurable service extension managed by TechMasters production.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
