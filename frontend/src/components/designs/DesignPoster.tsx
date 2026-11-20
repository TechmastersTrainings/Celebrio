import React, { useEffect, useRef, useState } from 'react';
import { HeroArt } from '../../pages/samples/SampleInvitation';
import type { SampleDesign } from '../../pages/samples/sampleDesigns';
import { CornerFiligree, Divider, Toran } from '../motifs/IndianMotifs';

const posterDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/** Lightweight themed miniature of a sample invitation's opening screen. */
export const DesignPoster: React.FC<{ design: SampleDesign }> = ({ design: s }) => {
  const style = {
    '--si-bg': s.theme.bg,
    '--si-ink': s.theme.ink,
    '--si-text': s.theme.text,
    '--si-accent': s.theme.accent,
    '--si-accent2': s.theme.accent2,
  } as React.CSSProperties;
  return (
    <div className={`dz-poster dz-poster-${s.motif}`} style={style} aria-hidden>
      {s.motif === 'kalash' && <Toran className="dz-poster-toran" />}
      <CornerFiligree className="dz-pc dz-pc-tl" />
      <CornerFiligree className="dz-pc dz-pc-tr" />
      <div className="dz-poster-inner">
        {s.invocation && <span className="dz-poster-inv">{s.invocation}</span>}
        <div className="dz-poster-art"><HeroArt s={s} /></div>
        <span className="dz-poster-kicker">{s.kicker}</span>
        <span className="dz-poster-names">
          {s.names.length > 1 ? (
            <>
              {s.names[0]} <em>{s.joiner || '&'}</em> {s.names[1]}
            </>
          ) : (
            s.names[0]
          )}
        </span>
        <Divider className="dz-poster-div" />
        <span className="dz-poster-date">{posterDate(s.date)}</span>
      </div>
    </div>
  );
};

/**
 * Renders a page at its true size (e.g. 1366×854 desktop or 390×844 phone)
 * inside an iframe, scaled down to fit the available box.
 */
export const ScaledFrame: React.FC<{ src: string; width: number; height: number; title: string; className?: string; fill?: boolean; onEscape?: () => void }> = ({
  src,
  width,
  height,
  title,
  className = '',
  fill = false,
  onEscape,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [frameH, setFrameH] = useState(height);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (fill) {
        // Fit the width and extend the page height to fill the screen (no letterboxing).
        const sc = Math.min(r.width / width, 1);
        setScale(sc);
        setFrameH(Math.round(r.height / sc));
      } else {
        setScale(Math.min(r.width / width, r.height / height, 1));
        setFrameH(height);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, fill]);

  return (
    <div ref={boxRef} className={`dz-frame-box ${className}`}>
      <div className="dz-frame-viewport" style={{ width: width * scale, height: frameH * scale }}>
        <iframe
          title={title}
          src={src}
          style={{ width, height: frameH, transform: `scale(${scale})` }}
          loading="lazy"
          onLoad={(e) => {
            // Same-origin preview: let Escape inside the preview close the viewer.
            try {
              e.currentTarget.contentWindow?.addEventListener('keydown', (ev) => ev.key === 'Escape' && onEscape?.());
            } catch {
              /* cross-origin: ignore */
            }
          }}
        />
      </div>
    </div>
  );
};
