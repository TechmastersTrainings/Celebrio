import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { Occasion, Addon } from '../../types';

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
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem', animation: 'pulse 1.5s infinite' }}>✨</div>
        <div style={{ color: 'var(--gold-pure)', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
          Loading Royal Celebration Packages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', borderColor: 'rgba(212, 175, 55, 0.4)', background: 'var(--midnight-card)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👑</div>
        <h3 style={{ color: 'var(--gold-pure)', marginBottom: '0.5rem' }}>Connecting to Catalog</h3>
        <p style={{ color: 'var(--silver-muted)', margin: '1rem 0 1.5rem', fontSize: '0.92rem' }}>
          {error}
        </p>
        <button className="btn btn-luxury-gold" onClick={loadCatalog}>
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero Header */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1.5rem 3.5rem',
        background: 'radial-gradient(circle at center, rgba(123, 44, 191, 0.25) 0%, rgba(9, 15, 36, 0.6) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--silver-border)',
        marginBottom: '3.5rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="badge-luxury" style={{ marginBottom: '1.25rem' }}>
          ✨ TECHMASTERS DIGITAL CELEBRATIONS • BESPOKE PACKAGES
        </div>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>
          Personalized Digital <span className="text-gradient-gold">Celebration Invitations</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--silver-pure)', maxWidth: '750px', margin: '0 auto 2rem', lineHeight: 1.7, opacity: 0.9 }}>
          Handcrafted by professional internal artisans. Submit your requirements, review watermarked interactive draft previews with <strong>2 free revision rounds</strong>, pay only after you approve, and receive a neutral live website, dynamic QR code pass, and HD cards.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#packages" className="btn btn-luxury-gold">
            <span>Explore Packages & Pricing</span>
          </a>
          <button className="btn btn-luxury-silver" onClick={onTrackOrder}>
            <span>Track Existing Order / Enter OTP →</span>
          </button>
        </div>
      </section>

      {/* Occasion Categories & Packages */}
      <section id="packages">
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div className="section-eyebrow">CURATED OCCASIONS</div>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
            Choose Your Sacred Milestone
          </h2>
          <p style={{ color: 'var(--silver-muted)', fontSize: '1.05rem' }}>
            All packages include mobile-responsive web invitations, ceremonial itineraries, Google Maps integration, and regional multilingual text support.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {occasions.map((occ) => (
            <div key={occ.id} className="card" style={{ padding: '2.25rem', background: 'var(--midnight-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--silver-border)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.6rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🎉</span> {occ.display_name}
                  </h3>
                  <p style={{ color: 'var(--silver-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                    {occ.description}
                  </p>
                </div>
              </div>

              {/* Package Cards Grid */}
              <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                {occ.packages.map((pkg) => {
                  const isPremium = pkg.code.includes('PREMIUM') || parseFloat(pkg.base_price_inr) > 500;
                  return (
                    <div
                      key={pkg.id}
                      style={{
                        border: isPremium ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid var(--silver-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.75rem',
                        background: isPremium ? 'linear-gradient(135deg, rgba(33, 4, 56, 0.6) 0%, rgba(15, 23, 56, 0.8) 100%)' : 'rgba(9, 15, 36, 0.6)',
                        boxShadow: isPremium ? '0 8px 25px rgba(212, 175, 55, 0.15)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'transform 0.2s',
                      }}
                    >
                      {isPremium && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '16px',
                          background: 'linear-gradient(135deg, #D4AF37, #A67C1E)',
                          color: '#070B19',
                          padding: '3px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}>
                          👑 Grand Signature
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                          {pkg.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', margin: '0.75rem 0 1rem' }}>
                          <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gold-pure)', fontFamily: 'var(--font-serif)' }}>
                            ₹{parseFloat(pkg.base_price_inr).toFixed(0)}
                          </span>
                          <span style={{ color: 'var(--silver-muted)', fontSize: '0.85rem' }}>
                            / celebration
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span>✓</span> {pkg.included_revisions} Free Creative Revisions Included
                        </div>

                        <div style={{ color: 'var(--silver-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          {pkg.description || 'Full mobile invitation website, Google Maps location, RSVP management, and dynamic digital QR pass.'}
                        </div>
                      </div>

                      <button
                        className={isPremium ? 'btn btn-luxury-gold' : 'btn btn-primary'}
                        style={{ width: '100%' }}
                        onClick={() => onSelectPackage(occ.id, pkg.id)}
                      >
                        <span>Select & Customize →</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons section */}
      {addons.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div className="section-eyebrow">PREMIUM ENHANCEMENTS</div>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '0.5rem' }}>
              Optional Add-on Customizations
            </h2>
            <p style={{ color: 'var(--silver-muted)' }}>
              Add cinematic animated videos, custom domains, or physical print cards to any package.
            </p>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
            {addons.map((add) => (
              <div key={add.id} className="card" style={{ padding: '1.5rem', background: 'var(--midnight-card)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                  {add.name}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-pure)', fontFamily: 'var(--font-serif)', margin: '0.5rem 0' }}>
                  +₹{parseFloat(add.price_inr).toFixed(0)}
                </div>
                <p style={{ color: 'var(--silver-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {add.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
