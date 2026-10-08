import React, { useId } from 'react';

/**
 * Campus Link mark: two chain links interlocked on a blue tile.
 * Link A is redrawn over link B in the upper half only, so the links pass
 * over-then-under like a real chain rather than simply overlapping.
 *
 * `animated` draws the strokes in (used on the splash screen).
 */
export const BrandMark = ({ size = 40, animated = false, className = '', title = 'Campus Link' }) => {
  const uid = useId().replace(/:/g, '');
  const ids = { shine: `cl-shine-${uid}`, cutA: `cl-cut-a-${uid}`, cutB: `cl-cut-b-${uid}`, top: `cl-top-${uid}`, bottom: `cl-bot-${uid}` };
  const draw = animated ? 'brand-draw' : undefined;
  // Link geometry, in the rotated (-45°) frame.
  const A = { x: 4.5, y: 11, width: 14.5, height: 10, rx: 5 };
  const B = { x: 13, y: 11, width: 14.5, height: 10, rx: 5 };
  const stroke = { fill: 'none', stroke: '#fff', strokeWidth: 2.6, strokeLinecap: 'round' };

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title} className={`brand-mark flex-shrink-0 ${className}`}>
      <defs>
        <linearGradient id={ids.shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.top}>
          <rect x="-8" y="-8" width="48" height="24" />
        </clipPath>
        <clipPath id={ids.bottom}>
          <rect x="-8" y="16" width="48" height="24" />
        </clipPath>
        {/* Real gaps (not painted ones): A is cut where B passes over it (lower crossing),
            B is cut where A passes over it (upper crossing) → the links interlock. */}
        <mask id={ids.cutA} maskUnits="userSpaceOnUse" x="-8" y="-8" width="48" height="48">
          <rect x="-8" y="-8" width="48" height="48" fill="#fff" />
          <rect {...B} fill="none" stroke="#000" strokeWidth="5.4" clipPath={`url(#${ids.bottom})`} />
        </mask>
        <mask id={ids.cutB} maskUnits="userSpaceOnUse" x="-8" y="-8" width="48" height="48">
          <rect x="-8" y="-8" width="48" height="48" fill="#fff" />
          <rect {...A} fill="none" stroke="#000" strokeWidth="5.4" clipPath={`url(#${ids.top})`} />
        </mask>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0071E3" />
      {/* soft light from above, like an app icon */}
      <rect width="32" height="32" rx="9" fill={`url(#${ids.shine})`} />
      <g transform="rotate(-45 16 16)">
        <g className="brand-link-a" mask={`url(#${ids.cutA})`}>
          <rect {...A} pathLength="100" className={draw} style={stroke} />
        </g>
        <g className="brand-link-b" mask={`url(#${ids.cutB})`}>
          <rect {...B} pathLength="100" className={draw} style={{ ...stroke, animationDelay: animated ? '160ms' : undefined }} />
        </g>
      </g>
    </svg>
  );
};

/** "Campus Link" set as a wordmark: tight tracking, "Link" in brand blue. */
export const Wordmark = ({ className = '', size = 'md' }) => {
  const sizes = { sm: 'text-[15px]', md: 'text-[17px]', lg: 'text-[22px]', xl: 'text-[30px]' };
  return (
    <span className={`whitespace-nowrap font-semibold leading-none tracking-[-0.025em] text-gray-900 ${sizes[size]} ${className}`}>
      Campus <span className="text-blue-600">Link</span>
    </span>
  );
};

/** Mark + wordmark lockup. */
export const BrandLockup = ({ size = 'md', className = '' }) => {
  const mark = { sm: 26, md: 32, lg: 40, xl: 56 }[size];
  return (
    <span className={`brand-lockup inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={mark} />
      <Wordmark size={size} />
    </span>
  );
};
