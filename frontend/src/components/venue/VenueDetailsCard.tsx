import React from 'react';
import { MapPin, ShieldCheck, PenLine, Globe, ExternalLink, Phone, Home } from 'lucide-react';
import type { OrderEvent } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  HOME: 'Home Sweet Home',
  FUNCTION_HALL: 'Function Hall / Convention Hall',
  HOTEL_RESORT: 'Hotel / Resort',
  RESTAURANT_BANQUET: 'Restaurant / Banquet',
  OUTDOOR: 'Outdoor Venue',
  OTHER: 'Other Venue',
};

function sourceBadge(ev: Partial<OrderEvent>) {
  if (ev.venue_source === 'VERIFIED_DIRECTORY') {
    return (
      <span className="vs-badge vs-badge-verified">
        <ShieldCheck size={11} /> Verified directory
      </span>
    );
  }
  if (ev.venue_source === 'EXTERNAL_PROVIDER') {
    return (
      <span className="vs-badge vs-badge-unverified">
        <Globe size={11} /> Google Maps listing (unverified)
      </span>
    );
  }
  if (ev.venue_source === 'CUSTOMER_PROVIDED') {
    return (
      <span className="vs-badge vs-badge-manual">
        {ev.venue_type === 'HOME' ? <Home size={11} /> : <PenLine size={11} />} Customer provided
      </span>
    );
  }
  return <span className="vs-badge">Free-text (legacy)</span>;
}

/**
 * Read-only venue summary for Admin and Developer portals.
 * Prefers the frozen snapshot captured at order time.
 */
export const VenueDetailsCard: React.FC<{ event: Partial<OrderEvent>; compact?: boolean }> = ({ event, compact }) => {
  const snap = event.venue_snapshot_json || {};
  const name = snap.name || event.venue_name || 'Venue not specified';
  const typeLabel = event.venue_type_label || TYPE_LABELS[event.venue_type || ''] || snap.category_label || null;
  const locality = snap.locality || event.venue_locality || '';
  const city = snap.city || event.venue_city || '';
  const address = snap.full_address || event.venue_address || '';
  const maps = event.google_maps_url || snap.google_maps_url || '';
  const phone = event.venue_contact_phone || snap.contact_phone || '';

  return (
    <div className={`vs-details ${compact ? 'is-compact' : ''}`}>
      <div className="vs-option-title">
        <MapPin size={14} color="var(--gold-accent, #B8860B)" aria-hidden />
        <strong>{name}</strong>
        {typeLabel && <span className="vs-badge">{typeLabel}</span>}
        {sourceBadge(event)}
      </div>
      <dl className="vs-details-grid">
        {(locality || city) && (
          <>
            <dt>Locality</dt>
            <dd>{[locality, city].filter(Boolean).join(', ')}</dd>
          </>
        )}
        {address && (
          <>
            <dt>Address</dt>
            <dd>{address}</dd>
          </>
        )}
        {phone && (
          <>
            <dt>Contact</dt>
            <dd>
              <Phone size={11} aria-hidden /> {phone}
              {event.venue_source !== 'VERIFIED_DIRECTORY' && <span className="vs-muted"> (unverified)</span>}
            </dd>
          </>
        )}
        {maps && (
          <>
            <dt>Maps</dt>
            <dd>
              <a href={maps} target="_blank" rel="noopener noreferrer">
                Open in Google Maps <ExternalLink size={11} aria-hidden />
              </a>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
};

export default VenueDetailsCard;
