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
  const [selectedOccasionFilter, setSelectedOccasionFilter] = useState<string>('ALL');

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

  const displayedOccasions = selectedOccasionFilter === 'ALL'
    ? occasions
    : occasions.filter(o => o.id === selectedOccasionFilter);

  return (
    <div style={{ padding: '3.5rem 0 5rem' }}>
      <div className="container">
        {/* Editorial Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem' }}>
          <span className="editorial-kicker">TECHMASTERS DIGITAL SERVICES</span>
          <h1 style={{ marginBottom: '1rem', fontSize: '2.6rem' }}>
            Celebration Packages &amp; Pricing
          </h1>
          <p className="lead-text">
            Transparent, all-inclusive packages. Submit requirements, inspect watermarked interactive previews with <strong>2 complimentary revision rounds</strong>, pay only after approval, and receive high-resolution deliverables.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-navy btn-sm" onClick={onTrackOrder}>
              <Search size={14} />
              <span>Track Existing Order / Enter OTP</span>
            </button>
          </div>
        </div>

        {/* Sleek Horizontal Occasion Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            flexWrap: 'wrap',
            marginBottom: '2.75rem',
          }}
        >
          <button
            onClick={() => setSelectedOccasionFilter('ALL')}
            className={`btn btn-sm ${selectedOccasionFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', fontSize: '0.84rem' }}
          >
            All Occasions ({occasions.length})
          </button>
          {occasions.map((occ) => (
            <button
              key={occ.id}
              onClick={() => setSelectedOccasionFilter(occ.id)}
              className={`btn btn-sm ${selectedOccasionFilter === occ.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', fontSize: '0.84rem' }}
            >
              {occ.display_name}
            </button>
          ))}
        </div>

        {/* Occasion Categories & Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '3.5rem' }}>
          {displayedOccasions.map((occ) => (
            <div key={occ.id} className="editorial-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
                <div>
                  <span className="editorial-kicker" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                    CELEBRATION OCCASION
                  </span>
                  <h2 style={{ fontSize: '1.75rem', color: 'var(--navy-deep)' }}>
                    {occ.display_name}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.90rem', marginTop: '0.25rem' }}>
                    {occ.description}
                  </p>
                </div>
              </div>

              {/* Package Grid for this Occasion */}
              <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                {occ.packages.map((pkg) => {
                  const isPremium = pkg.code.includes('PREMIUM') || parseFloat(String(pkg.base_price_inr)) > 500;

                  return (
                    <div
                      key={pkg.id}
                      style={{
                        border: isPremium ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.75rem',
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
                          <h3 style={{ fontSize: '1.35rem', color: 'var(--text-heading)' }}>
                            {pkg.name}
                          </h3>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
                              ₹{parseFloat(String(pkg.base_price_inr)).toFixed(2)}
                            </div>
                            <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                              Fixed Commercial Rate
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '0.35rem 0.65rem', background: 'var(--bg-champagne)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--burgundy-rich)', fontWeight: 600 }}>
                          ✓ Includes {pkg.included_revisions} Free Revisions &bull; 90-Day Hosting
                        </div>

                        {/* Inclusions */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
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
                                ]
                            ).map((feat, fIdx) => (
                              <li
                                key={fIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.55rem',
                                  fontSize: '0.84rem',
                                  marginBottom: '0.45rem',
                                  color: 'var(--text-body)',
                                }}
                              >
                                <CheckCircle2 size={14} style={{ color: 'var(--burgundy-rich)', flexShrink: 0 }} />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <button
                        className={isPremium ? 'btn btn-primary' : 'btn btn-outline'}
                        onClick={() => onSelectPackage(occ.id, pkg.id)}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        <Sparkles size={15} style={{ color: isPremium ? '#F59E0B' : 'currentColor' }} />
                        <span>Select {pkg.name}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
