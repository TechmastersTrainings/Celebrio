import React, { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Occasion } from '../../types';
import { OFFICIAL_OCCASIONS } from '../../data/defaultCatalog';
import { ArrowRight, ExternalLink, Laptop, LayoutGrid, MessageCircle, Smartphone, Sparkles, X } from 'lucide-react';
import { SAMPLE_DESIGNS, type SampleDesign } from '../samples/sampleDesigns';
import { DesignPoster, ScaledFrame } from '../../components/designs/DesignPoster';
import { Mandala, Toran } from '../../components/motifs/IndianMotifs';
import { OccasionIcon, rupees, startingPrice } from '../../components/occasions/occasionVisuals';
import '../../styles/storefront.css';

interface DesignsPageProps {
  onSelectDesign: (occasionId: string, packageId?: string) => void;
  onNavigate: (view: string) => void;
}

const ALL = 'ALL';
const WHATSAPP = 'https://wa.me/919880768222';

export const DesignsPage: React.FC<DesignsPageProps> = ({ onSelectDesign, onNavigate }) => {
  const [occasions, setOccasions] = useState<Occasion[]>(OFFICIAL_OCCASIONS);
  const [collection, setCollection] = useState(ALL);
  const [preview, setPreview] = useState<SampleDesign | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    ApiService.getOccasions()
      .then((d) => Array.isArray(d) && d.length > 0 && setOccasions(d))
      .catch(() => undefined);
  }, []);

  const occBySlug = useMemo(() => new Map(occasions.map((o) => [o.slug, o])), [occasions]);
  const collections = useMemo(() => {
    const seen = new Map<string, { name: string; slug: string; count: number }>();
    SAMPLE_DESIGNS.forEach((d) => {
      const c = seen.get(d.collection) || { name: d.collection, slug: d.occasionSlug, count: 0 };
      c.count += 1;
      seen.set(d.collection, c);
    });
    return [...seen.values()];
  }, []);
  const shown = collection === ALL ? SAMPLE_DESIGNS : SAMPLE_DESIGNS.filter((d) => d.collection === collection);

  const openPreview = (d: SampleDesign) => {
    setDevice(window.innerWidth < 760 ? 'mobile' : 'desktop');
    setPreview(d);
  };

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPreview(null);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [preview]);

  const chooseDesign = (d: SampleDesign) => {
    const occ = occBySlug.get(d.occasionSlug);
    if (occ) onSelectDesign(occ.id);
    else onNavigate('wizard');
  };

  const priceFor = (d: SampleDesign) => {
    const occ = occBySlug.get(d.occasionSlug);
    return occ ? startingPrice(occ) : null;
  };

  return (
    <div className="sf">
      {/* Festive header */}
      <section className="sf-festive-hero">
        <Toran className="sf-toran" />
        <Mandala className="sf-hero-mandala sf-hero-mandala-l" />
        <Mandala className="sf-hero-mandala sf-hero-mandala-r" />
        <div className="sf-wrap sf-festive-inner">
          <span className="sf-kicker">Curated Invitation Experiences</span>
          <h1>Invitation Design Gallery</h1>
          <p>
            Explore live sample invitations crafted for Indian celebrations — tap any design to see it as your guests will, on a laptop and on a phone.
          </p>
        </div>
      </section>

      <div className="sf-wrap sf-cat">
        <nav className="sf-menu" aria-label="Design collections">
          <div className="sf-menu-title">Collections</div>
          <ul>
            <li>
              <button type="button" className={`sf-menu-item ${collection === ALL ? 'is-active' : ''}`} aria-current={collection === ALL ? 'true' : undefined} onClick={() => setCollection(ALL)}>
                <LayoutGrid size={15} />
                <span>All Designs</span>
                <span className="sf-menu-count">{SAMPLE_DESIGNS.length}</span>
              </button>
            </li>
            {collections.map((c) => (
              <li key={c.name}>
                <button type="button" className={`sf-menu-item ${collection === c.name ? 'is-active' : ''}`} aria-current={collection === c.name ? 'true' : undefined} onClick={() => setCollection(c.name)}>
                  <OccasionIcon slug={c.slug} size={15} />
                  <span>{c.name}</span>
                  <span className="sf-menu-count">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="sf-menu-sep" />
          <div className="sf-menu-cta">
            <strong><Sparkles size={14} /> Want something unique?</strong>
            <span>Our artisans create custom themes for your culture and family.</span>
            <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm sf-btn-block" onClick={() => onNavigate('wizard')}>Request a Custom Design</button>
          </div>
        </nav>

        <div className="sf-cat-main">
          <div className="dz-grid">
            {shown.map((d) => {
              const from = priceFor(d);
              return (
                <article key={d.slug} className="dz-card">
                  <button type="button" className="dz-card-poster" onClick={() => openPreview(d)} aria-label={`Preview ${d.title}`}>
                    <DesignPoster design={d} />
                    <span className="dz-card-hover"><Laptop size={16} /> <Smartphone size={14} /> View Mockup</span>
                  </button>
                  <div className="dz-card-body">
                    <div className="dz-card-top">
                      <div>
                        <span className="dz-card-aesthetic">{d.aesthetic}</span>
                        <h3>{d.title}</h3>
                      </div>
                      {from !== null && <span className="sf-price"><small>from</small>{rupees(from)}</span>}
                    </div>
                    <p>{d.description}</p>
                    <div className="dz-tags">
                      {d.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}
                    </div>
                    <div className="sf-occ-actions">
                      <button type="button" className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => openPreview(d)}>View Mockup</button>
                      <button type="button" className="sf-btn sf-btn-primary sf-btn-sm" onClick={() => chooseDesign(d)}>Use Design <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mockup viewer */}
      {preview && (
        <div className="dz-modal-backdrop" onClick={() => setPreview(null)}>
          <div className="dz-modal" role="dialog" aria-modal="true" aria-labelledby="dz-modal-title" onClick={(e) => e.stopPropagation()}>
            <header className="dz-modal-head">
              <div className="dz-modal-title">
                <span className="dz-card-aesthetic">{preview.aesthetic} · Live sample</span>
                <h2 id="dz-modal-title">{preview.title}</h2>
              </div>
              <div className="dz-seg" role="tablist" aria-label="Device">
                <button type="button" role="tab" aria-selected={device === 'desktop'} className={device === 'desktop' ? 'is-on' : ''} onClick={() => setDevice('desktop')}>
                  <Laptop size={15} /> Website
                </button>
                <button type="button" role="tab" aria-selected={device === 'mobile'} className={device === 'mobile' ? 'is-on' : ''} onClick={() => setDevice('mobile')}>
                  <Smartphone size={15} /> Mobile
                </button>
              </div>
              <a className="sf-btn sf-btn-ghost sf-btn-sm dz-open-full" href={`/sample/${preview.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Open full screen
              </a>
              <button type="button" className="dz-close" onClick={() => setPreview(null)} aria-label="Close preview"><X size={18} /></button>
            </header>

            <div className={`dz-stage is-${device}`}>
              {device === 'desktop' ? (
                <div className="dz-laptop">
                  <div className="dz-laptop-screen">
                    <div className="dz-browser-bar">
                      <span className="dz-dots"><i /><i /><i /></span>
                      <span className="dz-url">techmastersdesigns.online/sample/{preview.slug}</span>
                    </div>
                    <ScaledFrame key={`d-${preview.slug}`} src={`/sample/${preview.slug}`} width={1366} height={854} title={`${preview.title} — website view`} className="dz-laptop-frame" fill onEscape={() => setPreview(null)} />
                  </div>
                  <div className="dz-laptop-base" />
                </div>
              ) : (
                <div className="dz-phone">
                  <span className="dz-phone-island" />
                  <ScaledFrame key={`m-${preview.slug}`} src={`/sample/${preview.slug}`} width={390} height={844} title={`${preview.title} — mobile view`} className="dz-phone-frame" fill onEscape={() => setPreview(null)} />
                </div>
              )}
            </div>

            <footer className="dz-modal-foot">
              <span className="dz-hint">Tap “Tap to open” inside the preview to explore the full invitation.</span>
              <div className="dz-foot-actions">
                {priceFor(preview) !== null && <span className="sf-price">from {rupees(priceFor(preview)!)}</span>}
                <a className="sf-btn sf-btn-ghost sf-btn-sm" href={`${WHATSAPP}?text=${encodeURIComponent(`Hello TechMasters, I like the "${preview.title}" design.`)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} style={{ color: '#16a34a' }} /> Ask on WhatsApp
                </a>
                <button type="button" className="sf-btn sf-btn-primary sf-btn-sm" onClick={() => chooseDesign(preview)}>
                  Use This Design <ArrowRight size={14} />
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
