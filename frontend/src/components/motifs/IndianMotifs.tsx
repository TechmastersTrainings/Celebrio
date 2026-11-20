import React from 'react';

/**
 * Original decorative SVG motifs drawn in code (no third-party artwork).
 * All use currentColor or the passed colours so themes can recolour them.
 */

type SvgProps = React.SVGProps<SVGSVGElement>;

/** Radial mandala: rings of petals around a lotus centre. */
export const Mandala: React.FC<SvgProps & { petals?: number }> = ({ petals = 16, ...props }) => {
  const ring = (n: number, r: number, w: number, h: number, key: string, opacity = 1) =>
    Array.from({ length: n }, (_, i) => (
      <ellipse
        key={`${key}${i}`}
        cx="100"
        cy={100 - r}
        rx={w}
        ry={h}
        transform={`rotate(${(360 / n) * i} 100 100)`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity={opacity}
      />
    ));
  return (
    <svg viewBox="0 0 200 200" aria-hidden {...props}>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.6" />
      {ring(petals * 2, 74, 6, 14, 'o', 0.75)}
      {ring(petals, 52, 9, 20, 'm')}
      {ring(petals, 30, 6, 13, 'i')}
      <circle cx="100" cy="100" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="6" fill="currentColor" opacity="0.8" />
    </svg>
  );
};

/** Marigold-and-mango-leaf toran garland; tiles horizontally. */
export const Toran: React.FC<SvgProps & { marigold?: string; marigold2?: string; leaf?: string }> = ({
  marigold = '#f59e0b',
  marigold2 = '#ea580c',
  leaf = '#3f7d3a',
  ...props
}) => (
  <svg viewBox="0 0 120 46" preserveAspectRatio="none" aria-hidden {...props}>
    <path d="M0 6 Q30 18 60 6 T120 6" fill="none" stroke={marigold2} strokeWidth="2" />
    {[10, 30, 50, 70, 90, 110].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy={i % 2 ? 11 : 9} r="5.2" fill={i % 2 ? marigold2 : marigold} />
        <circle cx={x} cy={i % 2 ? 11 : 9} r="2.2" fill="#fde68a" opacity="0.8" />
      </g>
    ))}
    {[20, 60, 100].map((x) => (
      <path key={x} d={`M${x} 12 q-6 14 0 30 q6 -16 0 -30z`} fill={leaf} />
    ))}
    {[40, 80].map((x) => (
      <g key={x}>
        <circle cx={x} cy="20" r="3.6" fill={marigold} />
        <circle cx={x} cy="28" r="3.6" fill={marigold2} />
        <circle cx={x} cy="36" r="3.2" fill={marigold} />
      </g>
    ))}
  </svg>
);

/** Kalash (sacred pot) with coconut and mango leaves. */
export const Kalash: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 100 120" aria-hidden {...props}>
    <path d="M50 8c-8 0-13 7-13 14 0 3 1 5 2 7h22c1-2 2-4 2-7 0-7-5-14-13-14z" fill="currentColor" opacity="0.85" />
    {[-34, -18, 0, 18, 34].map((a) => (
      <path key={a} d="M50 30 q-5 -18 0 -26 q5 8 0 26z" fill="currentColor" opacity="0.55" transform={`rotate(${a} 50 30)`} />
    ))}
    <rect x="34" y="29" width="32" height="6" rx="2" fill="currentColor" />
    <path d="M36 35c-14 8-20 24-16 40 4 18 18 28 30 28s26-10 30-28c4-16-2-32-16-40z" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M24 66h52" stroke="currentColor" strokeWidth="2" />
    <path d="M27 76h46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
    <path d="M50 52l4 7-4 7-4-7z" fill="currentColor" />
    <rect x="38" y="103" width="24" height="7" rx="2" fill="currentColor" opacity="0.8" />
  </svg>
);

/** South-Indian temple gopuram silhouette. */
export const Gopuram: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 160 200" aria-hidden {...props}>
    <path d="M80 6l4 10h-8z M76 16h8v6h-8z" fill="currentColor" />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const w = 40 + i * 20;
      const y = 22 + i * 26;
      return (
        <g key={i}>
          <rect x={80 - w / 2} y={y} width={w} height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: 2 + i }, (_, k) => (
            <rect key={k} x={80 - w / 2 + 6 + k * ((w - 12) / (2 + i))} y={y + 6} width="5" height="10" rx="2.5" fill="currentColor" opacity="0.6" />
          ))}
        </g>
      );
    })}
    <path d="M60 178v-14a20 20 0 0 1 40 0v14" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <rect x="16" y="178" width="128" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

/** Lit clay diya. */
export const Diya: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 80 60" aria-hidden {...props}>
    <path d="M40 4c6 8 8 14 4 20-2 3-6 3-8 0-4-6-2-12 4-20z" fill="#f59e0b" />
    <path d="M40 12c3 4 4 8 2 11-1 1-3 1-4 0-2-3-1-7 2-11z" fill="#fde68a" />
    <path d="M6 30h68c-2 14-16 24-34 24S8 44 6 30z" fill="currentColor" />
    <path d="M14 36h52" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
  </svg>
);

/** Filigree corner ornament (rotate for other corners). */
export const CornerFiligree: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 120 120" aria-hidden {...props}>
    <path d="M4 116V40C4 20 20 4 40 4h76" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M14 116V46c0-18 14-32 32-32h70" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
    <path d="M30 30c10-2 18 2 20 10-8 2-14-2-20-10zM30 30c-2 10 2 18 10 20 2-8-2-14-10-20z" fill="currentColor" opacity="0.85" />
    <circle cx="30" cy="30" r="3" fill="currentColor" />
    {[56, 72, 88].map((x) => <circle key={x} cx={x} cy="9" r="1.6" fill="currentColor" />)}
    {[56, 72, 88].map((y) => <circle key={y} cx="9" cy={y} r="1.6" fill="currentColor" />)}
  </svg>
);

/** Ornamental divider: lines with a central lotus. */
export const Divider: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 240 24" aria-hidden {...props}>
    <path d="M4 12h86M150 12h86" stroke="currentColor" strokeWidth="1" />
    <path d="M96 12c8-8 16-8 24-2 8-6 16-6 24 2-8 8-16 8-24 2-8 6-16 6-24-2z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="120" cy="12" r="2.6" fill="currentColor" />
    <circle cx="88" cy="12" r="1.8" fill="currentColor" />
    <circle cx="152" cy="12" r="1.8" fill="currentColor" />
  </svg>
);

/** Interlocked rings. */
export const Rings: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 120 80" aria-hidden {...props}>
    <circle cx="46" cy="46" r="26" fill="none" stroke="currentColor" strokeWidth="4" />
    <circle cx="74" cy="46" r="26" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    <path d="M40 18l6-10 6 10-6 6z" fill="currentColor" />
  </svg>
);

/** Cradle with moon and stars. */
export const Cradle: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 120 100" aria-hidden {...props}>
    <path d="M86 10a16 16 0 1 0 10 28 18 18 0 1 1-10-28z" fill="currentColor" opacity="0.8" />
    {[[20, 16], [36, 6], [58, 18]].map(([x, y]) => (
      <path key={`${x}`} d={`M${x} ${y - 5}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z`} fill="currentColor" />
    ))}
    <path d="M18 52h84c0 18-18 30-42 30S18 70 18 52z" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M30 82l-8 12M90 82l8 12M14 94h92" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 52c4-14 18-22 30-20" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
