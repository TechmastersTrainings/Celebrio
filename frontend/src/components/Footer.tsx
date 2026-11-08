import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#12141A', color: '#94A3B8', padding: '2.5rem 1.5rem 1.5rem', marginTop: 'auto', borderTop: '1px solid #1E293B' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem' }}>
        <div style={{ maxWidth: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: '#FFFFFF', letterSpacing: '0.5px' }}>
              TechMasters Digital Celebrations
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748B' }}>
            A business vertical of <strong>TechMasters Innovations Private Limited</strong>.
            Delivering bespoke multi-media digital celebration packages, responsive interactive websites, print-ready cards, and animated videos with ServiceNow-grade operational precision.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#E2E8F0', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Celebrations
          </h4>
          <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>Weddings & Marriages</li>
            <li>Naming Ceremonies (Namakarana)</li>
            <li>Milestone Birthdays</li>
            <li>Wedding Anniversaries</li>
            <li>Engagement Ceremonies</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#E2E8F0', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Platform Portals
          </h4>
          <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>Customer Order Tracker & OTP</li>
            <li>FIFO Developer Assignment Queue</li>
            <li>Video Specialist Render Worker</li>
            <li>Admin Command Center & Central Audit</li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '2rem auto 0', paddingTop: '1.25rem', borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B' }}>
        <div>© 2026 TechMasters Innovations Private Limited. All rights reserved.</div>
        <div>Engineered for high-reliability, zero duplicate claims, and server-side verified publishing.</div>
      </div>
    </footer>
  );
};

