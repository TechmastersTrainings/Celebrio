import React, { useEffect, useRef, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Occasion } from '../../types';
import { OFFICIAL_OCCASIONS } from '../../data/defaultCatalog';
import { Sparkles, CheckCircle2, ArrowRight, Clock, Search, ShieldCheck, MessageCircle, Smartphone, LayoutGrid } from 'lucide-react';
import { OccasionArt, OccasionIcon, isFormat, rupees } from '../../components/occasions/occasionVisuals';
import '../../styles/storefront.css';

interface CatalogPageProps {
  onSelectPackage: (occasionId: string, packageId: string) => void;
  onTrackOrder: () => void;
}

const WHATSAPP = 'https://wa.me/919880768222';
const ALL = 'ALL';

const FAQ = [
  {
    q: 'When do I pay for my invitation?',
    a: 'You pay only after you review and 100% approve your interactive watermarked draft preview. There is zero upfront financial obligation when submitting event details.',
  },
  {
    q: 'Can we customize music, family names, and photographs?',
    a: 'Yes! Every invitation is handcrafted by our creative developers. You can supply audio tracks, multiple venue locations, Muhurtham timings, dress codes, and high-resolution family photos.',
  },
  {
    q: 'How do our guests open the invitation?',
    a: 'Guests simply tap the link via WhatsApp, SMS, or scan the QR code. It opens immediately on any iPhone, Android, or laptop without needing to install any app.',
  },
];

export const CatalogPage: React.FC<CatalogPageProps> = ({ onSelectPackage, onTrackOrder }) => {
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);
  const [selected, setSelected] = useState<string>(ALL);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiService.getOccasions()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setOccasions(data);
      })
      .catch((err) => console.warn('Using official fallback catalog data:', err));
  }, []);

  const celebrations = occasions.filter((o) => !isFormat(o));
  const formats = occasions.filter(isFormat);
  const shown = selected === ALL ? occasions : occasions.filter((o) => o.id === selected);

  const choose = (id: string) => {
    setSelected(id);
    const top = mainRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollBy({ top: top - 90, behavior: 'smooth' });
  };

  const menuItem = (o: Occasion) => (
    <li key={o.id}>
      <button
        type="button"
        className={`sf-menu-item ${selected === o.id ? 'is-active' : ''}`}
        aria-current={selected === o.id ? 'true' : undefined}
        onClick={() => choose(o.id)}
      >
        <OccasionIcon slug={o.slug} size={15} />
        <span>{o.display_name}</span>
        <span className="sf-menu-count">{o.packages.length}</span>
      </button>
    </li>
  );

  return (
    <div className="sf">
      <section className="sf-cat-hero">
        <div className="sf-wrap">
          <span className="sf-kicker">TechMasters Digital Services</span>
          <div className="sf-cat-hero-row">
            <div>
              <h1>Celebration Packages &amp; Transparent Pricing</h1>
              <p>
                All-inclusive, handcrafted digital invitations for your family milestones. Inspect your watermarked interactive preview with family, request fine-tuning, and authorize payment only after 100% satisfaction.
              </p>
            </div>
            <div className="sf-cat-actions">
              <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm" onClick={onTrackOrder}>
                <Search size={14} /> Track Existing Order
              </button>
              <a
                className="sf-btn sf-btn-ghost sf-btn-sm"
                href={`${WHATSAPP}?text=${encodeURIComponent('Hello TechMasters, I have a question about your invitation packages.')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} style={{ color: '#16A34A' }} /> WhatsApp Consultation
              </a>
            </div>
          </div>
          <div className="sf-trust sf-cat-trust">
            <span><ShieldCheck size={14} /> Pay After 100% Approval</span>
            <span><Clock size={14} /> 24–48h Fast Turnaround</span>
            <span><Smartphone size={14} /> Mobile-First Web App</span>
            <span><CheckCircle2 size={14} /> 300 DPI Print-Ready PDF</span>
          </div>
        </div>
      </section>

      <div className="sf-wrap sf-cat">
        {/* Left occasion menu */}
        <nav className="sf-menu" aria-label="Occasions">
          <div className="sf-menu-title">Occasions</div>
          <ul>
            <li>
              <button
                type="button"
                className={`sf-menu-item ${selected === ALL ? 'is-active' : ''}`}
                aria-current={selected === ALL ? 'true' : undefined}
                onClick={() => choose(ALL)}
              >
                <LayoutGrid size={15} />
                <span>All Occasions</span>
                <span className="sf-menu-count">{occasions.length}</span>
              </button>
            </li>
            {celebrations.map(menuItem)}
          </ul>
          {formats.length > 0 && (
            <>
              <div className="sf-menu-sep" />
              <div className="sf-menu-title">Invitation Formats</div>
              <ul>{formats.map(menuItem)}</ul>
            </>
          )}
        </nav>

        {/* Packages */}
        <div className="sf-cat-main" ref={mainRef}>
          {shown.map((occ) => {
            const maxPrice = Math.max(...occ.packages.map((p) => parseFloat(String(p.base_price_inr)) || 0));
            return (
              <section key={occ.id} className="sf-cat-occ" aria-labelledby={`occ-${occ.id}`}>
                <div className="sf-cat-occ-head">
                  <OccasionArt occasion={occ} />
                  <div>
                    <h2 id={`occ-${occ.id}`}>{occ.display_name}</h2>
                    <p>{occ.description}</p>
                  </div>
                </div>
                <div className="sf-pkgs">
                  {occ.packages.map((pkg) => {
                    const price = parseFloat(String(pkg.base_price_inr)) || 0;
                    const isTop = occ.packages.length > 1 && price === maxPrice;
                    return (
                      <article key={pkg.id} className={`sf-pkg ${isTop ? 'is-top' : ''}`}>
                        {isTop && <span className="sf-pkg-badge">★ Recommended</span>}
                        <div className="sf-pkg-top">
                          <div>
                            <h3>{pkg.name}</h3>
                            <div className="sf-pkg-meta">{pkg.included_revisions} revisions included</div>
                          </div>
                          <div className="sf-pkg-price">{rupees(price)}</div>
                        </div>
                        <ul>
                          {(pkg.features_json || []).map((f) => (
                            <li key={f}><CheckCircle2 size={14} /> <span>{f}</span></li>
                          ))}
                        </ul>
                        <div className="sf-pkg-actions">
                          <button
                            type="button"
                            className={`sf-btn sf-btn-sm sf-btn-block ${isTop ? 'sf-btn-primary' : 'sf-btn-ghost'}`}
                            onClick={() => onSelectPackage(occ.id, pkg.id)}
                          >
                            Select Package <ArrowRight size={14} />
                          </button>
                          <a
                            className="sf-pkg-ask"
                            href={`${WHATSAPP}?text=${encodeURIComponent(`Hello TechMasters, I am interested in the ${pkg.name} package.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle size={13} /> Ask about this package
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* FAQ */}
          <section className="sf-cat-occ" aria-labelledby="faq-title">
            <div className="sf-cat-occ-head">
              <div>
                <span className="sf-kicker">Commercial Transparency</span>
                <h2 id="faq-title">Frequently Asked Questions</h2>
              </div>
            </div>
            <div className="sf-faq">
              {FAQ.map((f) => (
                <div key={f.q} className="sf-faq-item">
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
            <div className="sf-final">
              <h2>Ready to Craft Your Celebration Invitation?</h2>
              <p>Choose your occasion, submit your event details, and inspect your custom preview within 24–48 hours.</p>
              <button
                type="button"
                className="sf-btn sf-btn-gold"
                onClick={() => {
                  const occ = shown[0] || occasions[0];
                  if (occ?.packages[0]) onSelectPackage(occ.id, occ.packages[0].id);
                }}
              >
                <Sparkles size={16} /> Begin Your Invitation Order <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
