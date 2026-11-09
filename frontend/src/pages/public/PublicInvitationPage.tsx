import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  Send,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface PublicInvitationPageProps {
  slug: string;
}

export const PublicInvitationPage: React.FC<PublicInvitationPageProps> = ({ slug }) => {
  const [data, setData] = useState<any | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Music toggle
  const [isPlaying, setIsPlaying] = useState(false);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [wishes, setWishes] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [submittedWishesList, setSubmittedWishesList] = useState<Array<{ name: string; message: string; date: string }>>([]);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    async function loadPublicInvite() {
      try {
        setLoading(true);
        const res: any = await ApiService.getPublicInvitation(slug);
        if (res.is_expired) {
          setIsExpired(true);
          setData(res.data);
        } else {
          setData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Invitation not found');
      } finally {
        setLoading(false);
      }
    }
    loadPublicInvite();
  }, [slug]);

  // Countdown clock calculation
  useEffect(() => {
    if (!data?.events || data.events.length === 0) return;

    const eventDateStr = data.events[0].event_date;
    const targetDate = new Date(`${eventDateStr}T09:00:00`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName) return;

    if (wishes) {
      setSubmittedWishesList([
        { name: rsvpName, message: wishes, date: 'Just now' },
        ...submittedWishesList,
      ]);
    }
    setRsvpSubmitted(true);
  };

  const handleShareWhatsApp = () => {
    const text = `You are cordially invited to celebrate ${data?.customer_name}'s ${data?.occasion}! View the invitation and RSVP here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 1.5rem', fontFamily: 'var(--font-serif)', background: 'var(--bg-ivory)', minHeight: '100vh' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>✨</div>
        <h2 style={{ color: 'var(--burgundy-rich)', fontSize: '1.8rem' }}>Opening Sacred Celebration...</h2>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-ivory)' }}>
        <div className="card" style={{ maxWidth: '580px', textAlign: 'center', padding: '3.5rem 2.5rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕊️</div>
          <span className="editorial-kicker">MOMENT CONCLUDED</span>
          <h2 style={{ fontSize: '2rem', color: 'var(--burgundy-rich)', marginBottom: '0.75rem' }}>
            Celebration Concluded
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            {data?.message || 'This celebration has joyfully concluded. Thank you for your warm presence, thoughtful prayers, and heartfelt blessings!'}
          </p>
          <div style={{ fontSize: '0.92rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
            {data?.celebrants} &bull; {data?.occasion}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'var(--bg-ivory)', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--color-danger)', fontSize: '2rem', marginBottom: '0.75rem' }}>Celebration Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          {error || 'This celebration URL does not exist or has passed its scheduled public validity.'}
        </p>
      </div>
    );
  }

  const theme = data.theme || {};
  const primaryColor = theme.theme_color || 'var(--burgundy-rich)';
  const accentColor = theme.accent_color || 'var(--gold-primary)';

  return (
    <div style={{ background: 'var(--bg-ivory)', minHeight: '100vh', paddingBottom: '5rem', color: 'var(--text-body)' }}>
      {/* Floating Controls Bar: Music & Share */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '0.65rem',
        }}
      >
        <button
          className="btn btn-sm btn-outline"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            borderRadius: 'var(--radius-full)',
            borderColor: 'var(--border-subtle)',
            padding: '0.45rem 0.85rem',
          }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Volume2 size={16} style={{ color: 'var(--burgundy-rich)' }} /> : <VolumeX size={16} />}
          <span style={{ fontSize: '0.78rem' }}>{isPlaying ? 'Music On' : 'Music Off'}</span>
        </button>

        <button
          className="btn btn-sm btn-primary"
          style={{
            boxShadow: '0 4px 14px rgba(107, 23, 40, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 0.85rem',
          }}
          onClick={handleShareWhatsApp}
        >
          <Share2 size={15} />
          <span style={{ fontSize: '0.78rem' }}>Share</span>
        </button>
      </div>

      {/* Hero Invitation Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '6.5rem 1.5rem 4rem',
          maxWidth: '880px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--gold-primary)' }}>
          卐 ॐ 卐
        </div>

        <span className="editorial-kicker" style={{ fontSize: '0.85rem', letterSpacing: '0.22em' }}>
          {data.occasion}
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '3.6rem',
            color: 'var(--burgundy-rich)',
            marginBottom: '1.25rem',
            lineHeight: 1.15,
            fontWeight: 700,
          }}
        >
          {data.customer_name}
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-body)',
            maxWidth: '640px',
            margin: '0 auto 3rem',
            lineHeight: 1.75,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          "Together with our families, we joyfully invite you to grace this auspicious celebration with your loving presence, prayers, and blessings."
        </p>

        {/* Live Countdown Clock */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}
        >
          {[
            { val: timeLeft.days, unit: 'Days' },
            { val: timeLeft.hours, unit: 'Hours' },
            { val: timeLeft.minutes, unit: 'Minutes' },
            { val: timeLeft.seconds, unit: 'Seconds' },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.5rem',
                minWidth: '95px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--burgundy-rich)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {c.val}
              </div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.35rem', letterSpacing: '0.08em', fontWeight: 600 }}>
                {c.unit}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ceremonial Itinerary Section */}
      <section style={{ maxWidth: '780px', margin: '0 auto 4.5rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="editorial-kicker">CEREMONIAL ITINERARY</span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--navy-deep)' }}>Schedule of Celebrations</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {data.events?.map((ev: any, idx: number) => (
            <div
              key={idx}
              className="editorial-card"
              style={{
                padding: '2rem',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--burgundy-rich)' }}>
                  {ev.event_title}
                </h3>
                <span className="badge badge-assigned" style={{ fontSize: '0.8rem' }}>
                  {ev.event_date} &bull; {ev.start_time}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--text-body)' }}>
                <MapPin size={18} style={{ color: 'var(--gold-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.98rem' }}>{ev.venue_name}</strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {ev.venue_address}
                  </p>
                </div>
              </div>

              {ev.dress_code && (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Attire: {ev.dress_code}
                </div>
              )}

              {ev.google_maps_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={ev.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                  >
                    <MapPin size={14} />
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Guest RSVP & Wishes Section */}
      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="card card-gold-accent" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="editorial-kicker">GUEST BLESSINGS &amp; ATTENDANCE</span>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--navy-deep)', marginBottom: '0.5rem' }}>
              Confirm Your Attendance &amp; Send Wishes
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Let the host know you are coming and leave your heartfelt blessings.
            </p>
          </div>

          {!rsvpSubmitted ? (
            <form onSubmit={handleRsvpSubmit}>
              <div className="form-group">
                <label className="form-label">Your Name / Family Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Anand Sharma & Family"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Attending Guests</label>
                <select
                  className="form-control"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Heartfelt Wishes / Blessings</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Wishing you a lifetime of joy, togetherness, and auspicious blessings..."
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Send size={15} />
                <span>Submit RSVP &amp; Send Wishes</span>
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>RSVP Received with Gratitude!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Thank you, <strong>{rsvpName}</strong>. The host has been notified of your attendance.
              </p>
            </div>
          )}

          {/* Submitted Wishes Feed */}
          {submittedWishesList.length > 0 && (
            <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--burgundy-rich)' }}>
                Recent Guest Blessings ({submittedWishesList.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {submittedWishesList.map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-champagne)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-heading)' }}>{w.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.date}</span>
                    </div>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-body)', margin: 0 }}>"{w.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Subtle Unbranded Footnote */}
      <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
        Crafted with digital elegance for {data.customer_name} &bull; Hosted on TechMasters Secure Cloud
      </div>
    </div>
  );
};
