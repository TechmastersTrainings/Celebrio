import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, MapPin, Navigation, Share2, Sparkles, Clock, Heart } from 'lucide-react';
import { Mandala, Toran, Kalash, Gopuram, Diya, CornerFiligree, Divider, Rings, Cradle } from '../../components/motifs/IndianMotifs';
import { findSample, SAMPLE_DESIGNS, type SampleDesign } from './sampleDesigns';
import './samples.css';

interface Props {
  slug: string;
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
const longDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00+05:30` : iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const mapsEmbed = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;

function gcalLink(s: SampleDesign) {
  const start = new Date(s.date);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const title = s.names.length > 1 ? `${s.names[0]} & ${s.names[1]} — ${s.kicker}` : `${s.kicker} — ${s.names[0]}`;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmt(start)}/${fmt(end)}`, location: `${s.venue.name}, ${s.venue.address}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    mins: Math.floor(diff / 60000) % 60,
    secs: Math.floor(diff / 1000) % 60,
    done: diff === 0,
  };
}

/** Adds .is-in to [data-reveal] elements as they scroll into view. */
function useReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && (en.target.classList.add('is-in'), io.unobserve(en.target))),
      { threshold: 0.15 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [enabled]);
}

export function HeroArt({ s }: { s: Pick<SampleDesign, 'motif'> }) {
  switch (s.motif) {
    case 'royal':
    case 'jubilee':
    case 'lotus':
    case 'floral':
      return <Mandala className="si-hero-mandala" petals={s.motif === 'floral' ? 12 : 16} />;
    case 'temple':
      return <Gopuram className="si-hero-gopuram" />;
    case 'rings':
      return <Rings className="si-hero-emblem" />;
    case 'cradle':
      return <Cradle className="si-hero-emblem" />;
    case 'kalash':
      return <Kalash className="si-hero-emblem" />;
    case 'diya':
      return (
        <div className="si-diyas">
          <Diya /> <Diya /> <Diya />
        </div>
      );
    default:
      return null;
  }
}

export const SampleInvitation: React.FC<Props> = ({ slug }) => {
  const s = findSample(slug) || SAMPLE_DESIGNS[0];
  const embedded = typeof window !== 'undefined' && window.self !== window.top;
  const [opened, setOpened] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const cd = useCountdown(s.date);
  const topRef = useRef<HTMLDivElement>(null);
  useReveal(opened);

  useEffect(() => {
    document.title = `${s.title} · Sample Invitation · TechMasters`;
  }, [s.title]);

  const vars = {
    '--si-bg': s.theme.bg,
    '--si-bg2': s.theme.bg2,
    '--si-surface': s.theme.surface,
    '--si-ink': s.theme.ink,
    '--si-text': s.theme.text,
    '--si-accent': s.theme.accent,
    '--si-accent2': s.theme.accent2,
    '--si-gate': s.theme.gate,
  } as React.CSSProperties;

  const shareText = `${s.names.join(s.joiner ? ` ${s.joiner} ` : ' ')} — ${s.kicker}. ${longDate(s.date)} at ${s.venue.name}.`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${typeof window !== 'undefined' ? window.location.href : ''}`)}`;
  const petals = ['royal', 'temple', 'floral', 'lotus', 'kalash'].includes(s.motif);
  const confetti = s.motif === 'confetti';

  const open = () => {
    setOpened(true);
    window.setTimeout(() => topRef.current?.focus(), 900);
  };

  return (
    <div className={`si si-theme-${s.motif} ${opened ? 'is-open' : ''}`} style={vars}>
      {/* Sample ribbon */}
      <div className="si-ribbon">
        <span><Sparkles size={13} /> Sample design · TechMasters</span>
        <a href="/wizard" target="_top" rel="noopener">Get this design →</a>
      </div>

      {/* Tap-to-open gate */}
      <div className="si-gate" aria-hidden={opened}>
        <div className="si-door si-door-l"><Mandala className="si-door-art" /></div>
        <div className="si-door si-door-r"><Mandala className="si-door-art" /></div>
        <button type="button" className="si-gate-btn" onClick={open} aria-label="Tap to open the invitation">
          <span className="si-gate-ring"><b>{s.names.map((n) => n.charAt(0)).join(s.names.length > 1 ? ' · ' : '')}</b></span>
          <span className="si-gate-label">Tap to open</span>
          <Divider className="si-gate-div" />
        </button>
      </div>

      {petals && opened && (
        <div className="si-petals" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 1.3}s`, animationDuration: `${9 + (i % 5)}s` }} />)}
        </div>
      )}
      {confetti && opened && (
        <div className="si-confetti" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => <span key={i} style={{ left: `${(i * 4.3) % 100}%`, animationDelay: `${(i % 8) * 0.7}s` }} />)}
        </div>
      )}

      <main className="si-main" ref={topRef} tabIndex={-1}>
        {/* Hero */}
        <section className="si-hero">
          {s.motif === 'kalash' && <Toran className="si-toran" />}
          <CornerFiligree className="si-corner si-corner-tl" />
          <CornerFiligree className="si-corner si-corner-tr" />
          <CornerFiligree className="si-corner si-corner-bl" />
          <CornerFiligree className="si-corner si-corner-br" />
          <div className="si-hero-inner">
            {s.invocation && <p className="si-invocation" data-reveal>{s.invocation}</p>}
            <div className="si-hero-art" data-reveal><HeroArt s={s} /></div>
            <p className="si-kicker" data-reveal>{s.kicker}</p>
            <h1 className="si-names" data-reveal>
              {s.names.length > 1 ? (
                <>
                  <span>{s.names[0]}</span>
                  <em>{s.joiner || '&'}</em>
                  <span>{s.names[1]}</span>
                </>
              ) : (
                <span>{s.names[0]}</span>
              )}
            </h1>
            <p className="si-subtitle" data-reveal>{s.subtitle}</p>
            <Divider className="si-divider" />
            <p className="si-date" data-reveal>{longDate(s.date)}</p>
            <p className="si-venue-line" data-reveal><MapPin size={14} /> {s.venue.name}, Bidar</p>

            <div className="si-countdown" data-reveal aria-label="Countdown to the celebration">
              {cd.done ? (
                <strong>The celebration has begun!</strong>
              ) : (
                ([['Days', cd.days], ['Hours', cd.hours], ['Mins', cd.mins], ['Secs', cd.secs]] as [string, number][]).map(([l, v]) => (
                  <div key={l} className="si-cd-cell">
                    <b>{l === 'Days' ? v : pad(v)}</b>
                    <span>{l}</span>
                  </div>
                ))
              )}
            </div>
            <div className="si-hero-actions" data-reveal>
              <a className="si-btn" href={gcalLink(s)} target="_blank" rel="noopener noreferrer"><CalendarPlus size={15} /> Save the date</a>
              <a className="si-btn si-btn-ghost" href={mapsSearch(`${s.venue.name}, ${s.venue.address}`)} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Directions</a>
            </div>
          </div>
        </section>

        {/* Invitation message & families */}
        <section className="si-section si-alt">
          <div className="si-narrow" data-reveal>
            <h2>With joy in our hearts</h2>
            <p className="si-message">{s.message}</p>
            {s.families && (
              <div className="si-families">
                {s.families.map((f) => (
                  <div key={f.title + f.names} className="si-family">
                    <span>{f.title}</span>
                    <strong>{f.names}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Events */}
        <section className="si-section">
          <div className="si-wrap">
            <h2 data-reveal>{s.events.length > 1 ? 'Celebration Schedule' : 'The Celebration'}</h2>
            <ol className="si-events">
              {s.events.map((e) => (
                <li key={e.name + e.date} className="si-event" data-reveal>
                  <div className="si-event-date">
                    <b>{shortDate(e.date).split(' ')[0]}</b>
                    <span>{shortDate(e.date).split(' ')[1]}</span>
                  </div>
                  <div className="si-event-body">
                    <h3>{e.name}</h3>
                    <p><Clock size={13} /> {e.time} · {longDate(e.date).split(',')[0]}</p>
                    <p><MapPin size={13} /> {e.venue}</p>
                    {e.note && <p className="si-event-note">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Gallery */}
        {s.photos.length > 0 && (
          <section className="si-section si-alt">
            <div className="si-wrap">
              <h2 data-reveal>Moments</h2>
              <div className={`si-gallery n${Math.min(s.photos.length, 3)}`}>
                {s.photos.map((src, i) => (
                  <figure key={src} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </figure>
                ))}
              </div>
              <p className="si-fineprint">Sample photos — your invitation features your own family photographs.</p>
            </div>
          </section>
        )}

        {/* Venue */}
        <section className="si-section">
          <div className="si-wrap si-venue">
            <div data-reveal>
              <h2>Venue</h2>
              <p className="si-venue-name">{s.venue.name}</p>
              <p>{s.venue.address}</p>
              <a className="si-btn" href={mapsSearch(`${s.venue.name}, ${s.venue.address}`)} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Open in Google Maps</a>
            </div>
            <div className="si-map" data-reveal>
              {opened && <iframe title={`Map of ${s.venue.name}`} src={mapsEmbed(`${s.venue.name}, ${s.venue.address}`)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section className="si-section si-alt">
          <div className="si-narrow" data-reveal>
            <h2>Kindly RSVP</h2>
            <p>Please let us know by {longDate(s.rsvpBy).split(', ').slice(1).join(', ')}.</p>
            {rsvpDone ? (
              <div className="si-rsvp-done" role="status">
                <Heart size={18} /> This is a sample — on your invitation, every RSVP arrives instantly in your order dashboard.
              </div>
            ) : (
              <form
                className="si-rsvp"
                onSubmit={(e) => {
                  e.preventDefault();
                  setRsvpDone(true);
                }}
              >
                <label>
                  <span>Your name</span>
                  <input required placeholder="Your name" />
                </label>
                <label>
                  <span>Guests</span>
                  <select defaultValue="2">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
                  </select>
                </label>
                <div className="si-rsvp-choice" role="radiogroup" aria-label="Attending">
                  <label><input type="radio" name="att" defaultChecked /> Joyfully attending</label>
                  <label><input type="radio" name="att" /> Sending blessings</label>
                </div>
                <button type="submit" className="si-btn">Send RSVP</button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="si-footer">
          {s.hashtag && <p className="si-hashtag">{s.hashtag}</p>}
          <p>We look forward to celebrating with you.</p>
          <div className="si-hero-actions">
            <a className="si-btn" href={whatsapp} target="_blank" rel="noopener noreferrer"><Share2 size={15} /> Share on WhatsApp</a>
          </div>
          <div className="si-made">
            Sample design crafted by <strong>TechMasters Digital Services</strong>
            {!embedded && <> · <a href="/designs">See all designs</a></>}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default SampleInvitation;
