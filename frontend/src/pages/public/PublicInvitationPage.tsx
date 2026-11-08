import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: 'var(--font-serif)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
        <p style={{ color: 'var(--color-accent-dark)' }}>Opening celebration invitation...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '580px', textAlign: 'center', padding: '3.5rem 2rem', background: '#FFFDF9', border: '2px solid var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕊️</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            Celebration Concluded
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {data?.message || 'This celebration has concluded. Thank you for your warm wishes, prayers, and heartfelt blessings!'}
          </p>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-accent-dark)', fontWeight: 600 }}>
            {data?.celebrants} • {data?.occasion}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>Invitation Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>{error || 'This celebration URL does not exist or has expired.'}</p>
      </div>
    );
  }

  const theme = data.theme || {};
  const primaryColor = theme.theme_color || '#7C182A';
  const accentColor = theme.accent_color || '#CFA043';

  return (
    <div style={{ background: '#FFFDF9', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Background Audio Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <button
          className="btn btn-sm btn-outline"
          style={{ background: '#FFFFFF', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-full)', borderColor: accentColor }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '🔊 Music Playing' : '🎵 Play Music'}
        </button>
      </div>

      {/* Hero Header Section */}
      <section style={{ textAlign: 'center', padding: '5rem 1.5rem 3rem', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ fontSize: '1rem', color: accentColor, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {data.occasion}
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.4rem', color: primaryColor, marginBottom: '1.25rem', lineHeight: 1.15 }}>
          {data.customer_name}
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#4B5563', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: 1.7, fontStyle: 'italic' }}>
          Together with our families, we cordially invite you to join us in celebrating this joyous milestone.
        </p>

        {/* Live Countdown Clock */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {[
            { val: timeLeft.days, unit: 'Days' },
            { val: timeLeft.hours, unit: 'Hours' },
            { val: timeLeft.minutes, unit: 'Mins' },
            { val: timeLeft.seconds, unit: 'Secs' },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${accentColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                minWidth: '85px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: primaryColor, lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{c.unit}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ceremonial Itinerary Section */}
      <section style={{ maxWidth: '750px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: primaryColor, textAlign: 'center', marginBottom: '2rem' }}>
          Ceremony & Celebration Schedule
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {data.events?.map((ev: any, idx: number) => (
            <div
              key={idx}
              className="card"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-md)',
                background: '#FFFFFF',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.45rem', color: primaryColor }}>{ev.event_title}</h3>
                <span className="badge badge-assigned" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                  📅 {ev.event_date} • ⏰ {ev.start_time}
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1F2937', marginBottom: '0.4rem' }}>
                📍 {ev.venue_name}
              </div>

              <div style={{ fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {ev.venue_address}
              </div>

              {ev.dress_code && (
                <div style={{ fontSize: '0.85rem', color: accentColor, fontWeight: 600, marginBottom: '1.25rem' }}>
                  👗 Dress Code: {ev.dress_code}
                </div>
              )}

              {ev.google_maps_url && (
                <a
                  href={ev.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ width: '100%', borderColor: accentColor }}
                >
                  🗺️ Open Venue in Google Maps ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Guest RSVP & Warm Wishes */}
      <section style={{ maxWidth: '650px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ padding: '2.5rem', background: '#FFFFFF', border: `2px solid ${accentColor}`, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: primaryColor, marginBottom: '0.5rem' }}>
            RSVP & Send Warm Blessings
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Kindly let the host know if you can grace the occasion.
          </p>

          {rsvpSubmitted ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: '#047857' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💌</div>
              <h4>Thank You, {rsvpName}!</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Your RSVP and heartfelt blessings have been delivered to the host family.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (rsvpName.trim()) setRsvpSubmitted(true);
              }}
              style={{ textAlign: 'left' }}
            >
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Ramesh & Family"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Attending Guests</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="form-control"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warm Wishes & Blessings</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Share a heartfelt blessing or message for the celebrants..."
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '0.5rem' }}>
                Confirm RSVP & Send Wishes ✨
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

