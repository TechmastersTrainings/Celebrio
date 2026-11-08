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

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [occData, addonData] = await Promise.all([
          ApiService.getOccasions(),
          ApiService.getAddons(),
        ]);
        setOccasions(occData);
        setAddons(addonData);
      } catch (err: any) {
        setError(err.message || 'Failed to load catalog');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading celebration packages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', borderColor: '#FECDD3', background: '#FFF1F2' }}>
        <h3 style={{ color: 'var(--color-danger)' }}>Error Loading Catalog</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1rem 3.5rem', background: 'radial-gradient(circle at center, rgba(207, 160, 67, 0.12) 0%, transparent 70%)', borderRadius: 'var(--radius-lg)', marginBottom: '3rem' }}>
        <div className="badge badge-assigned" style={{ marginBottom: '1rem', background: 'rgba(124, 24, 42, 0.08)', color: 'var(--color-primary)', borderColor: 'rgba(124, 24, 42, 0.2)' }}>
          ✨ TechMasters Digital Celebrations
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
          Personalized Digital Celebration Invitations
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', maxWidth: '750px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Handcrafted by professional internal designers. You submit requirements, review protected draft previews with <strong>2 free revision rounds</strong>, pay only after you approve the design, and receive an unbranded live celebration link, dynamic QR code pass, and HD cards.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#packages" className="btn btn-primary">
            Explore Celebration Packages
          </a>
          <button className="btn btn-outline" onClick={onTrackOrder}>
            Track Existing Order / Enter OTP
          </button>
        </div>
      </section>

      {/* Occasion Categories & Packages */}
      <section id="packages">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            Choose Your Occasion
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            All packages include mobile-responsive web invitations, ceremonial itineraries, Google Maps integration, and mult-lingual regional text support.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {occasions.map((occ) => (
            <div key={occ.id} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🎉</span> {occ.display_name}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                    {occ.description}
                  </p>
                </div>
              </div>

              {/* Package Cards Grid */}
              <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                {occ.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      background: pkg.code.includes('PREMIUM') ? '#FDFBF7' : '#FFFFFF',
                      borderColor: pkg.code.includes('PREMIUM') ? 'var(--color-accent)' : 'var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {pkg.code.includes('PREMIUM') && (
                      <div style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--color-accent)', color: '#1A1A1A', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Most Popular
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {pkg.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0 1rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                          ₹{parseFloat(pkg.base_price_inr).toFixed(0)}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          / celebration
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>✓</span> {pkg.included_revisions} Free Creative Revisions Included
                      </div>

                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '1.75rem' }}>
                        {pkg.features_json.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--color-accent-dark)', fontWeight: 'bold' }}>✦</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className={`btn ${pkg.code.includes('PREMIUM') ? 'btn-gold' : 'btn-primary'}`}
                      style={{ width: '100%' }}
                      onClick={() => onSelectPackage(occ.id, pkg.id)}
                    >
                      Select {pkg.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons Overview */}
      <section style={{ marginTop: '3.5rem' }}>
        <h3 style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
          Available Add-On Enhancements
        </h3>
        <div className="grid grid-cols-3">
          {addons.map((add) => (
            <div key={add.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{add.name}</h4>
                <span className="badge badge-paid">+₹{parseFloat(add.price_inr).toFixed(0)}</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                {add.description || 'Configurable celebration add-on managed through Admin control.'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

