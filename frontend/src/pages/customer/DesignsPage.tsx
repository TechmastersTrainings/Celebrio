import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Occasion } from '../../types';
import { Search, Sparkles, Smartphone, Monitor, Eye, ArrowRight, X, Heart, Calendar, MapPin } from 'lucide-react';

interface DesignsPageProps {
  onSelectDesign: (occasionId: string, packageId?: string) => void;
  onNavigate: (view: string) => void;
}

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  occasionId: string;
  startingPrice: number;
  aesthetic: string;
  imageUrl: string;
  description: string;
  tags: string[];
  mockCouple: string;
  mockDate: string;
  mockVenue: string;
}

export const DesignsPage: React.FC<DesignsPageProps> = ({ onSelectDesign, onNavigate }) => {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getOccasions();
      setOccasions(data || []);
    } catch (err) {
      console.error('Failed to load occasions for gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find occasion IDs dynamically from backend
  const weddingOcc = occasions.find((o) => o.slug.includes('marr') || o.slug.includes('wed'));
  const engagementOcc = occasions.find((o) => o.slug.includes('engag'));
  const birthdayOcc = occasions.find((o) => o.slug.includes('birth'));
  const namingOcc = occasions.find((o) => o.slug.includes('nam') || o.slug.includes('cradle'));
  const anniversaryOcc = occasions.find((o) => o.slug.includes('anniv'));

  const getLowestPrice = (occ?: Occasion) => {
    if (!occ || !occ.packages || occ.packages.length === 0) return 399;
    const prices = occ.packages.map((p) => parseFloat(String(p.base_price_inr)) || 0).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 399;
  };

  // Curated gallery items linked strictly to backend occasions and packages
  const galleryItems: GalleryItem[] = [
    {
      id: 'des-01',
      title: 'Royal Mysore Vivaha',
      category: 'TRADITIONAL_WEDDING',
      occasionId: weddingOcc?.id || '',
      startingPrice: getLowestPrice(weddingOcc),
      aesthetic: 'Traditional Indian Wedding',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      description: 'Opulent crimson and antique gold filigree motifs with auspicious Sanskrit mantras, interactive muhurtham schedule, and devotional shehnai audio.',
      tags: ['Royal Crimson', 'Sanskrit Shlokas', 'Audio Embedded', 'Interactive RSVP'],
      mockCouple: 'Dr. Aditi & Srihari',
      mockDate: 'December 12, 2026',
      mockVenue: 'The Leela Palace, Bengaluru',
    },
    {
      id: 'des-02',
      title: 'Kalyana Mandapam Elegance',
      category: 'WEDDING',
      occasionId: weddingOcc?.id || '',
      startingPrice: getLowestPrice(weddingOcc),
      aesthetic: 'Traditional Heritage',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
      description: 'Rich temple gopuram line-art, jasmine garlands, multi-day ceremony timelines (Haldi, Mehendi, Sangeet), and direct Google Maps navigation.',
      tags: ['Temple Architecture', 'Multi-day Timeline', 'Google Maps'],
      mockCouple: 'Sneha & Arjun',
      mockDate: 'November 28, 2026',
      mockVenue: 'Shree Krishna Kalyana Mantapa, Bidar',
    },
    {
      id: 'des-03',
      title: 'Champagne Minimalist',
      category: 'MODERN_WEDDING',
      occasionId: weddingOcc?.id || '',
      startingPrice: getLowestPrice(weddingOcc),
      aesthetic: 'Modern & Minimalist',
      imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      description: 'Clean typographic sophistication on soft champagne paper, delicate deckle-edge borders, and contemporary editorial photography grid.',
      tags: ['Editorial Typography', 'Champagne Palette', 'Photo Gallery'],
      mockCouple: 'Natasha & Vikram',
      mockDate: 'January 18, 2027',
      mockVenue: 'Taj West End, Race Course Road',
    },
    {
      id: 'des-04',
      title: 'Imperial Nizam Gold',
      category: 'LUXURY_HERITAGE',
      occasionId: weddingOcc?.id || '',
      startingPrice: getLowestPrice(weddingOcc),
      aesthetic: 'Luxury Heritage',
      imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=800&q=80',
      description: 'Gilded palace chandeliers, ornate arches inspired by royal Deccan architecture, dynamic QR check-in, and WhatsApp share buttons.',
      tags: ['Deccan Architecture', 'QR-Enabled', 'VIP Portal'],
      mockCouple: 'Zoya & Farhan',
      mockDate: 'February 14, 2027',
      mockVenue: 'Chowmahalla Palace Courtyard',
    },
    {
      id: 'des-05',
      title: 'Rose Gold Ring Ceremony',
      category: 'ENGAGEMENT',
      occasionId: engagementOcc?.id || '',
      startingPrice: getLowestPrice(engagementOcc),
      aesthetic: 'Engagement & Ring Ceremony',
      imageUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
      description: 'Warm blush florals, shimmering rose gold rings emblem, live guest countdown timer, and couple love story milestones.',
      tags: ['Blush Rose', 'Countdown Clock', 'Love Story'],
      mockCouple: 'Priya & Rohan',
      mockDate: 'October 24, 2026',
      mockVenue: 'ITC Windsor Manor, Sankey Road',
    },
    {
      id: 'des-06',
      title: 'Little Prince & Princess Namakarana',
      category: 'NAMING_CEREMONY',
      occasionId: namingOcc?.id || '',
      startingPrice: getLowestPrice(namingOcc),
      aesthetic: 'Naming Ceremony (Namakarana)',
      imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
      description: 'Soft pastels, floral cradle illustration, family lineage blessings, regional Kannada/English script support, and baby gift registry guide.',
      tags: ['Cradle Motif', 'Multilingual Script', 'Family Tree'],
      mockCouple: 'Baby Aarav',
      mockDate: 'September 15, 2026',
      mockVenue: 'Ananda Nilaya, Mailoor, Bidar',
    },
    {
      id: 'des-07',
      title: 'Golden Jubilee 50th Anniversary',
      category: 'ANNIVERSARY',
      occasionId: anniversaryOcc?.id || '',
      startingPrice: getLowestPrice(anniversaryOcc),
      aesthetic: 'Wedding Anniversary',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      description: 'A half-century of love celebrated with gold foil accents, retrospective couple timeline (1976–2026), and guest digital memory book.',
      tags: ['50 Years Jubilee', 'Memory Book', 'Timeline'],
      mockCouple: 'Smt. Shanta & Sri. Ramesh Kulkarni',
      mockDate: 'November 05, 2026',
      mockVenue: 'Grand Magrath Hall, Bengaluru',
    },
    {
      id: 'des-08',
      title: 'Milestone 1st Birthday Wonderland',
      category: 'BIRTHDAY',
      occasionId: birthdayOcc?.id || '',
      startingPrice: getLowestPrice(birthdayOcc),
      aesthetic: 'Milestone Birthday',
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
      description: 'Enchanted celebration with playful confetti animations, photo month-by-month memories, party theme styling, and instant RSVP tracking.',
      tags: ['Playful Confetti', '1st Year Milestones', 'Party Theme'],
      mockCouple: 'Master Reyansh (Turns One!)',
      mockDate: 'August 20, 2026',
      mockVenue: 'Country Club Pavilion, Bidar',
    },
  ];

  const categories = [
    { key: 'ALL', label: 'All Designs' },
    { key: 'WEDDING', label: 'Wedding Invitations' },
    { key: 'TRADITIONAL_WEDDING', label: 'Traditional Indian Wedding' },
    { key: 'MODERN_WEDDING', label: 'Modern & Minimalist' },
    { key: 'LUXURY_HERITAGE', label: 'Luxury Royal Heritage' },
    { key: 'ENGAGEMENT', label: 'Engagement Ceremony' },
    { key: 'NAMING_CEREMONY', label: 'Naming Ceremony' },
    { key: 'ANNIVERSARY', label: 'Anniversary Celebrations' },
    { key: 'BIRTHDAY', label: 'Milestone Birthdays' },
  ];

  const filteredItems = galleryItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aesthetic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: '3.5rem 0 5rem' }}>
      <div className="container">
        {/* Editorial Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <span className="editorial-kicker">CURATED INVITATION EXPERIENCES</span>
          <h1 style={{ marginBottom: '1rem', fontSize: '2.6rem' }}>
            Invitation Design Gallery
          </h1>
          <p className="lead-text">
            Explore our artisan-crafted digital invitation designs. Every experience includes interactive websites, high-resolution 300 DPI print-ready cards, dynamic QR codes, and animated invitations.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by aesthetic, occasion, or style (e.g. Royal, Minimalist, Namakarana, Gold)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.6rem' }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`btn btn-sm ${selectedCategory === c.key ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="showcase-card">
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={item.imageUrl} alt={item.title} className="showcase-card-img" />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(13, 27, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#F8FAFC',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.28rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.aesthetic}
                </span>

                <button
                  onClick={() => setPreviewItem(item)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                    color: 'var(--navy-deep)',
                  }}
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>

              <div className="showcase-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.28rem', color: 'var(--text-heading)' }}>
                    {item.title}
                  </h3>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>From</span>
                    <strong style={{ color: 'var(--burgundy-rich)', fontSize: '1.1rem' }}>
                      ₹{item.startingPrice}
                    </strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1, lineHeight: 1.6 }}>
                  {item.description}
                </p>

                {/* Feature Tags */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.70rem',
                        background: 'var(--bg-champagne)',
                        color: 'var(--text-body)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setPreviewItem(item)}
                  >
                    View Mockup
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1.2 }}
                    onClick={() => onSelectDesign(item.occasionId)}
                  >
                    <span>Customise</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1.5rem',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
              No invitation designs found matching "{searchQuery}".
            </p>
            <button className="btn btn-outline btn-sm" onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Live Interactive Invitation Preview Modal */}
      {previewItem && (
        <div className="modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', height: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-cream)',
              }}
            >
              <div>
                <span className="editorial-kicker" style={{ marginBottom: '2px', fontSize: '0.72rem' }}>
                  {previewItem.aesthetic} PREVIEW
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                  {previewItem.title}
                </h3>
              </div>

              {/* Viewport switch: Desktop vs Mobile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px', display: 'flex' }}>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    style={{
                      background: previewDevice === 'desktop' ? 'var(--burgundy-rich)' : 'transparent',
                      color: previewDevice === 'desktop' ? '#FFFFFF' : 'var(--text-muted)',
                      border: 'none',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <Monitor size={14} /> Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    style={{
                      background: previewDevice === 'mobile' ? 'var(--burgundy-rich)' : 'transparent',
                      color: previewDevice === 'mobile' ? '#FFFFFF' : 'var(--text-muted)',
                      border: 'none',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                </div>

                <button
                  onClick={() => setPreviewItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body: Device Simulation */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                background: '#F1EDE6',
                padding: '2rem 1rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: previewDevice === 'mobile' ? '375px' : '100%',
                  maxWidth: previewDevice === 'mobile' ? '375px' : '760px',
                  background: 'var(--bg-ivory)',
                  borderRadius: previewDevice === 'mobile' ? '28px' : '12px',
                  border: previewDevice === 'mobile' ? '8px solid #1E293B' : '1px solid var(--border-medium)',
                  boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'width 0.3s ease',
                }}
              >
                {/* Simulated Invitation Hero */}
                <div
                  style={{
                    padding: '3rem 2rem 2.5rem',
                    textAlign: 'center',
                    background: 'radial-gradient(circle at 50% 20%, #FFFDF9 0%, #F5EFEB 100%)',
                    borderBottom: '1px solid var(--border-subtle)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--gold-primary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    Cordially Invite You To Celebrate
                  </p>
                  <h2 style={{ fontSize: '2.1rem', color: 'var(--burgundy-rich)', marginBottom: '0.75rem' }}>
                    {previewItem.mockCouple}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                    Join us as two families unite in love, culture, and timeless celebration.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '1.5rem',
                      marginTop: '1.5rem',
                      fontSize: '0.88rem',
                      color: 'var(--text-body)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={15} style={{ color: 'var(--gold-primary)' }} />
                      <span>{previewItem.mockDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={15} style={{ color: 'var(--gold-primary)' }} />
                      <span>{previewItem.mockVenue}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Features Section */}
                <div style={{ padding: '2rem' }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '1.25rem',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      CEREMONY COUNTDOWN
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                      <div style={{ background: 'var(--bg-champagne)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ fontSize: '1.25rem', color: 'var(--burgundy-rich)' }}>48</strong>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>DAYS</span>
                      </div>
                      <div style={{ background: 'var(--bg-champagne)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ fontSize: '1.25rem', color: 'var(--burgundy-rich)' }}>14</strong>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>HOURS</span>
                      </div>
                      <div style={{ background: 'var(--bg-champagne)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ fontSize: '1.25rem', color: 'var(--burgundy-rich)' }}>32</strong>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>MINS</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Interactive RSVP • Google Maps Venue Navigation • Multilingual Wishes
                    </p>
                    <span className="badge badge-published">
                      300 DPI Print Card &amp; Animated Video Included
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Package Starting Price:</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--burgundy-rich)' }}>
                  ₹{previewItem.startingPrice}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setPreviewItem(null)}>
                  Close
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setPreviewItem(null);
                    onSelectDesign(previewItem.occasionId);
                  }}
                >
                  <Sparkles size={15} style={{ color: '#F59E0B' }} />
                  <span>Choose This Design</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

