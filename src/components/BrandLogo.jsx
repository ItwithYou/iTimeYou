import { useState, useEffect } from 'react';

// iTimeYou brand — from the official brand kit.
// Mark: one-stroke time spiral, entry at 12 o'clock. Never rotate, never
// recolour outside the palette, never change stroke weight.
// Palette: Mekong Teal #0ADBB9 · Sunset Gold #FFB020 · Ink #06231F · Deep #04302A
//
// LIVE CLOCK: the gold tail is a real clock — it sweeps around the inner
// coil to show the current hour (12-hour cycle, minutes included).

const SPIRAL = 'M50 16 A33 33 0 0 1 82 50 A31 31 0 0 1 50 80 A29 29 0 0 1 22 50 A27 27 0 0 1 50 24 A25 25 0 0 1 74 50';

// Inner coil geometry (the spiral's last arc): centre (50,49), r 25, top (50,24).
export function hourTailPath(date = new Date()) {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  let deg = ((h + m / 60) / 12) * 360;
  if (deg < 14) deg = 14; // keep the gold entry visible around 12 o'clock
  if (deg > 350) deg = 350; // avoid a full-circle arc collapsing to nothing
  const rad = (deg * Math.PI) / 180;
  const x = 50 + 25 * Math.sin(rad);
  const y = 49 - 25 * Math.cos(rad);
  const large = deg > 180 ? 1 : 0;
  return `M50 24 A25 25 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

// The spiral mark. Below 24px the kit says one colour only (mono).
// The gold tail follows the real hour and refreshes every minute.
export function BrandMark({ size = 32, color = '#0ADBB9', tail = '#FFB020', className = '' }) {
  const mono = size < 24;
  const [tailD, setTailD] = useState(() => hourTailPath());
  useEffect(() => {
    if (mono) return;
    const tick = () => setTailD(hourTailPath());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [mono]);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="iTimeYou" className={className}>
      <path d={SPIRAL} stroke={color} strokeWidth={mono ? 11 : 9} strokeLinecap="round" />
      {!mono && <path d={tailD} stroke={tail} strokeWidth="9" strokeLinecap="round" />}
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

// Live favicon: redraws the browser-tab icon so the gold arc shows the real
// hour. Call once at app root. (Home-screen PNG icons are fixed by the OS.)
export function useLiveFavicon() {
  useEffect(() => {
    const draw = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.scale(0.64, 0.64);
        ctx.lineCap = 'round';
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#0ADBB9';
        ctx.stroke(new Path2D(SPIRAL));
        ctx.strokeStyle = '#FFB020';
        ctx.stroke(new Path2D(hourTailPath()));
        let link = document.querySelector('link[rel="icon"][type="image/svg+xml"]') || document.querySelector('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = c.toDataURL('image/png');
      } catch { /* non-fatal — static favicon stays */ }
    };
    draw();
    const id = setInterval(draw, 60000);
    return () => clearInterval(id);
  }, []);
}

export default BrandLockup;
