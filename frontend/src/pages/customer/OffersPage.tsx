import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Coupon } from '../../types';
import { Tag, Copy, Check, Percent, Gift, Clock, Info, AlertCircle, Sparkles } from 'lucide-react';

interface OffersPageProps {
  onNavigate: (view: string) => void;
}

export const OffersPage: React.FC<OffersPageProps> = ({ onNavigate }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [defaultOffer, setDefaultOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getPublicCoupons();
      setDefaultOffer(data.default_offer || null);
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'PERCENTAGE') {
      return `${parseFloat(coupon.discount_value)}%`;
    }
    return `₹${parseFloat(coupon.discount_value).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--gold-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-ivory)', minHeight: '70vh' }}>
      {/* Hero Banner — Default Automatic Discount */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--navy-deep) 0%, #1a2744 60%, var(--burgundy-rich) 100%)',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative element */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '2rem',
              padding: '0.4rem 1.1rem',
              marginBottom: '1.25rem',
              fontSize: '0.78rem',
              color: 'var(--gold-primary)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <Gift size={14} />
            Automatic Discount
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 0.5rem',
              lineHeight: 1.15,
              fontFamily: 'var(--font-display)',
            }}
          >
            Flat <span style={{ color: 'var(--gold-primary)' }}>12% OFF</span> on Every Order
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '520px',
              margin: '0 auto 1.75rem',
            }}
          >
            {defaultOffer?.description ||
              'Every order automatically receives a 12% discount. No coupon code needed — the savings are applied at checkout.'}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.6rem',
              padding: '0.6rem 1.3rem',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            <Check size={15} style={{ color: '#4ADE80' }} />
            Applied automatically at checkout
          </div>
        </div>
      </section>

      {/* Coupons Section */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--navy-deep)',
              margin: '0 0 0.4rem',
              fontFamily: 'var(--font-display)',
            }}
          >
            Exclusive Coupon Codes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Use these codes at checkout for additional savings on your celebration suites
          </p>
        </div>

        {coupons.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: 'var(--bg-champagne)',
              borderRadius: '1rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Tag size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <h3 style={{ color: 'var(--navy-deep)', fontSize: '1.1rem', margin: '0 0 0.4rem' }}>
              No Active Coupons Right Now
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
              The automatic 12% discount still applies to every order. Check back for exclusive coupon codes!
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('wizard')}>
              <Sparkles size={15} style={{ color: '#F59E0B' }} />
              Create Your Invitation
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '0.85rem',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--navy-deep), #1a2744)',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {coupon.discount_type === 'PERCENTAGE' ? (
                      <Percent size={18} style={{ color: 'var(--gold-primary)' }} />
                    ) : (
                      <Tag size={18} style={{ color: 'var(--gold-primary)' }} />
                    )}
                    <span
                      style={{
                        color: '#FFFFFF',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {formatDiscount(coupon)} OFF
                    </span>
                  </div>
                  {coupon.max_discount_amount && coupon.discount_type === 'PERCENTAGE' && (
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '1rem',
                      }}
                    >
                      Max ₹{parseFloat(coupon.max_discount_amount).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.15rem 1.25rem' }}>
                  {/* Coupon Code + Copy */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-champagne)',
                      border: '1.5px dashed var(--gold-primary)',
                      borderRadius: '0.5rem',
                      padding: '0.55rem 0.85rem',
                      marginBottom: '0.9rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--navy-deep)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: copiedCode === coupon.code ? '#059669' : 'var(--navy-deep)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '0.4rem',
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check size={13} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      margin: '0 0 0.85rem',
                    }}
                  >
                    {coupon.description}
                  </p>

                  {/* Meta Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* Validity */}
                    {(coupon.start_date || coupon.end_date) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Clock size={13} style={{ flexShrink: 0 }} />
                        <span>
                          {coupon.start_date && coupon.end_date
                            ? `Valid: ${formatDate(coupon.start_date)} – ${formatDate(coupon.end_date)}`
                            : coupon.end_date
                              ? `Valid until ${formatDate(coupon.end_date)}`
                              : `From ${formatDate(coupon.start_date)}`}
                        </span>
                      </div>
                    )}

                    {/* Min Order Value */}
                    {coupon.min_order_value && parseFloat(coupon.min_order_value) > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Info size={13} style={{ flexShrink: 0 }} />
                        <span>
                          Min. order: ₹{parseFloat(coupon.min_order_value).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {/* Combinability */}
                    {coupon.can_combine_with_auto_discount && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: '#059669',
                        }}
                      >
                        <Check size={13} style={{ flexShrink: 0 }} />
                        <span>Can be combined with the automatic 12% discount</span>
                      </div>
                    )}

                    {!coupon.can_combine_with_auto_discount && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        <span>Cannot be combined with the automatic discount</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            Ready to create your celebration suite?
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('wizard')}>
            <Sparkles size={16} style={{ color: '#F59E0B' }} />
            Start Your Invitation
          </button>
        </div>
      </section>
    </div>
  );
};
