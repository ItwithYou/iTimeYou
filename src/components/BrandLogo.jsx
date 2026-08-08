// iTimeYou brand — from the official brand kit.
// Mark: one-stroke time spiral, entry at 12 o'clock. Never rotate, never
// recolour outside the palette, never change stroke weight.
// Palette: Mekong Teal #0ADBB9 · Sunset Gold #FFB020 · Ink #06231F · Deep #04302A

const SPIRAL = 'M50 16 A33 33 0 0 1 82 50 A31 31 0 0 1 50 80 A29 29 0 0 1 22 50 A27 27 0 0 1 50 24 A25 25 0 0 1 74 50';
const TAIL = 'M50 24 A25 25 0 0 1 74 50';

// The spiral mark. Below 24px the kit says one colour only (mono).
export function BrandMark({ size = 32, color = '#0ADBB9', tail = '#FFB020', className = '' }) {
  const mono = size < 24;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="iTimeYou" className={className}>
      <path d={SPIRAL} stroke={color} strokeWidth={mono ? 11 : 9} strokeLinecap="round" />
      {!mono && <path d={TAIL} stroke={tail} strokeWidth="9" strokeLinecap="round" />}
    </svg>
  );
}

// Horizontal lockup: mark + wordmark (Outfit — i/You light, "Time" semibold teal).
// reversed: for dark/photo backgrounds (white text, white spiral, gold tail).
export function BrandLockup({ markSize = 30, textSize = 22, reversed = false, tagline = false, className = '' }) {
  const ink = reversed ? '#FFFFFF' : 'var(--brand-ink, #06231F)';
  const time = reversed ? '#0ADBB9' : '#0A9E88';
  return (
    <span className={`inline-flex items-center gap-[0.45em] ${className}`} style={{ lineHeight: 1 }}>
      <BrandMark size={markSize} color={reversed ? '#FFFFFF' : '#0ADBB9'} tail="#FFB020" />
      <span className="flex flex-col" style={{ gap: tagline ? '0.32em' : 0 }}>
        <span
          className="brand-word"
          style={{ fontSize: textSize, letterSpacing: '-0.025em', color: ink, fontWeight: 300, whiteSpace: 'nowrap' }}
        >
          i<span style={{ fontWeight: 600, color: time }}>Time</span>You
        </span>
        {tagline && (
          <span
            style={{
              fontSize: Math.max(7, Math.round(textSize * 0.21)),
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: reversed ? 'rgba(255,255,255,0.65)' : '#6E8B83',
              fontWeight: 400,
            }}
          >
            Connect · Share · Laos
          </span>
        )}
      </span>
    </span>
  );
}

export default BrandLockup;
