import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'rgba(5, 8, 20, 0.95)',
      color: '#94A3B8',
      padding: '3rem 1.5rem 1.75rem',
      marginTop: 'auto',
      borderTop: '1px solid rgba(212, 175, 55, 0.25)',
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2.5rem' }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}>
              TechMasters Digital Celebrations
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#94A3B8' }}>
            A premier business vertical of <strong style={{ color: '#F8FAFC' }}>TechMasters Innovations Private Limited</strong>.
            Delivering bespoke multi-media digital celebration packages, responsive interactive websites, print-ready HD cards, and animated celebration videos with ServiceNow-grade operational precision.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#D4AF37', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
            Celebrations
          </h4>
          <ul style={{ listStyle: 'none', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#CBD5E1' }}>
            <li>💍 Weddings & Marriages</li>
            <li>✨ Engagement Ceremonies</li>
            <li>👶 Naming Ceremonies (Namakarana)</li>
            <li>🎂 Milestone Birthdays</li>
            <li>🥂 Wedding Anniversaries</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#D4AF37', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
            Platform Portals
          </h4>
          <ul style={{ listStyle: 'none', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#CBD5E1' }}>
            <li>🔍 Customer Order Tracker & OTP</li>
            <li>⚡ FIFO Developer Assignment Queue</li>
            <li>🎬 Video Specialist Render Worker</li>
            <li>🛡️ Admin Command Center & Central Audit</li>
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '2.5rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(226, 232, 240, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        fontSize: '0.82rem',
        color: '#64748B',
        gap: '1rem'
      }}>
        <div>© 2026 TechMasters Innovations Private Limited. All rights reserved.</div>
        <div style={{ color: '#94A3B8' }}>
          Midnight Blue × Royal Purple × Silver × Gold • Engineered with zero duplicate claims & server-verified publishing.
        </div>
      </div>
    </footer>
  );
};
