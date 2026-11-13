import React from 'react';
import { Heart, Gift, Cake, Gem, CalendarHeart, Home, Baby, Flame, Monitor, Image as ImageIcon, Clapperboard, Sparkles, type LucideIcon } from 'lucide-react';
import type { Occasion } from '../../types';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;

interface Visual {
  /** Free Unsplash photo; occasions without a verified photo use the gradient art tile. */
  image?: string;
  icon: LucideIcon;
  /** Two colours for the gradient art tile and accents. */
  tint: [string, string];
}

const VISUALS: Record<string, Visual> = {
  marriage: { image: img('photo-1583939003579-730e3918a45a'), icon: Heart, tint: ['#7a1d33', '#c0884a'] },
  'naming-ceremony': { image: img('photo-1519689680058-324335c77eba'), icon: Gift, tint: ['#8a5a2b', '#e2b86b'] },
  birthday: { image: img('photo-1530103862676-de8c9debad1d'), icon: Cake, tint: ['#b4235a', '#f59e0b'] },
  engagement: { image: img('photo-1532712938310-34cb3982ef74'), icon: Gem, tint: ['#5b2a86', '#d4a5c9'] },
  anniversary: { image: img('photo-1534447677768-be436bb09401'), icon: CalendarHeart, tint: ['#8c2f39', '#e9a87c'] },
  'house-warming': { icon: Home, tint: ['#9a3412', '#f6c453'] },
  'baby-shower': { icon: Baby, tint: ['#be5a83', '#f5c6a5'] },
  'religious-cultural': { image: img('photo-1577083753695-e010191bacb5'), icon: Flame, tint: ['#9a3412', '#f59e0b'] },
  'digital-invitation-websites': { image: img('photo-1680016661694-1cd3faf31c3a'), icon: Monitor, tint: ['#1e3a8a', '#60a5fa'] },
  'digital-invitation-cards': { icon: ImageIcon, tint: ['#6b1728', '#d8b26e'] },
  'animated-invitation-videos': { image: img('photo-1764664281859-36f1b637b6a8'), icon: Clapperboard, tint: ['#7c3aed', '#ec4899'] },
};

const FALLBACK: Visual = { icon: Sparkles, tint: ['#6b1728', '#b88e3e'] };

/** Invitation products (rather than life events). */
export const FORMAT_SLUGS = ['digital-invitation-websites', 'digital-invitation-cards', 'animated-invitation-videos'];
export const isFormat = (o: Pick<Occasion, 'slug'>) => FORMAT_SLUGS.includes(o.slug);

export const occasionVisual = (slug: string): Visual => VISUALS[slug] || FALLBACK;

export function OccasionIcon({ slug, size = 16 }: { slug: string; size?: number }) {
  const Icon = occasionVisual(slug).icon;
  return <Icon size={size} />;
}

/** Photo when a verified one exists, otherwise a designed gradient tile with the occasion icon. */
export function OccasionArt({ occasion, className = '' }: { occasion: Pick<Occasion, 'slug' | 'display_name'>; className?: string }) {
  const v = occasionVisual(occasion.slug);
  const Icon = v.icon;
  const style = { '--tint-a': v.tint[0], '--tint-b': v.tint[1] } as React.CSSProperties;
  return (
    <div className={`occ-art ${v.image ? 'has-photo' : 'is-tile'} ${className}`} style={style}>
      {v.image ? (
        <img src={v.image} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="occ-art-icon" aria-hidden>
          <Icon size={44} />
        </span>
      )}
    </div>
  );
}

export function startingPrice(o: Occasion): number | null {
  const prices = (o.packages || []).map((p) => parseFloat(String(p.base_price_inr)) || 0).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export const rupees = (v: number | string) => `₹${Math.round(parseFloat(String(v)) || 0)}`;
