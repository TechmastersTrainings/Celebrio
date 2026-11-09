import React from 'react';

interface TechMastersLogoProps {
  variant?: 'light' | 'dark' | 'header' | 'footer';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const TechMastersLogo: React.FC<TechMastersLogoProps> = ({
  variant = 'header',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const isDark = variant === 'dark' || variant === 'footer';

  const iconSizes = {
    sm: { box: 32, icon: 18, radius: 8 },
    md: { box: 42, icon: 22, radius: 11 },
    lg: { box: 52, icon: 28, radius: 14 },
  };

  const currentSize = iconSizes[size];

  return (
    <div
      className={`techmasters-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '0.6rem' : '0.85rem',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* Authentic TechMasters Innovations Icon Mark: Blue, Orange & Metallic Grey */}
      <div
        style={{
          width: `${currentSize.box}px`,
          height: `${currentSize.box}px`,
          borderRadius: `${currentSize.radius}px`,
          background: 'linear-gradient(135deg, #0A192F 0%, #1E3A8A 55%, #0B132B 100%)',
          border: '1.5px solid rgba(148, 163, 184, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
            : '0 4px 12px rgba(10, 25, 47, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Metallic Grey + Radiant Orange Code Mark */}
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left code bracket in orange */}
          <path
            d="M8 6L2 12L8 18"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right code bracket in orange */}
          <path
            d="M16 6L22 12L16 18"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Metallic Grey Accent Slash */}
          <path
            d="M14 4L10 20"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: TechMasters Digital Services */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 900,
              fontSize: size === 'sm' ? '1.05rem' : size === 'lg' ? '1.65rem' : '1.35rem',
              letterSpacing: '-0.02em',
              color: isDark ? '#FFFFFF' : '#0D1B2A',
            }}
          >
            TechMasters
          </span>
        </div>

        {showSubtitle && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: size === 'sm' ? '0.62rem' : size === 'lg' ? '0.78rem' : '0.70rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#D97706', // Vibrant corporate amber/orange
              }}
            >
              DIGITAL SERVICES
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: size === 'sm' ? '0.52rem' : '0.58rem',
                letterSpacing: '0.04em',
                color: isDark ? '#94A3B8' : '#64748B', // Metallic grey
              }}
            >
              TechMasters Innovations Pvt. Ltd.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

