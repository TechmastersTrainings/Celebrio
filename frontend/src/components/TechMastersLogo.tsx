import React from 'react';
import techMastersLogo from '../assets/techmasters-logo.png';

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
    sm: { width: 32, height: 35 },
    md: { width: 42, height: 46 },
    lg: { width: 54, height: 59 },
  };

  const currentSize = iconSizes[size];

  return (
    <div
      className={`techmasters-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '0.65rem' : '0.85rem',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* Authentic TechMasters Innovations Corporate 3D Hexagon Mark */}
      <div
        style={{
          width: `${currentSize.width}px`,
          height: `${currentSize.height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={techMastersLogo}
          alt="TechMasters Innovations"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: isDark
              ? 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.45)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))'
              : 'drop-shadow(0 2px 6px rgba(10, 25, 47, 0.12))',
          }}
        />
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
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: size === 'sm' ? '0.65rem' : size === 'lg' ? '0.82rem' : '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D97706', // Vibrant corporate amber/orange
              marginTop: '1px',
            }}
          >
            DIGITAL SERVICES
          </span>
        )}
      </div>
    </div>
  );
};
