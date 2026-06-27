import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GRADIENT_IMG, reliablePhoto } from '../utils/img';

function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [loaded, setLoaded] = useState(false);
  const total = photos.length;

  const go = useCallback((d) => { setLoaded(false); setIdx((i) => (i + d + total) % total); }, [total]);

  // Lock background scroll + keyboard navigation (Esc / arrows) — smooth & FB-like.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && total > 1) go(1);
      else if (e.key === 'ArrowLeft' && total > 1) go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [go, onClose, total]);

  // Basic swipe support on touch devices.
  const [touchX, setTouchX] = useState(null);
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50 && total > 1) go(dx < 0 ? 1 : -1);
    setTouchX(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-[fadeIn_.15s_ease]"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button onClick={onClose} aria-label="Close"
        className="absolute top-4 right-4 z-10 w-11 h-11 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/30">
        <X size={20} />
      </button>

      {total > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous"
            className="absolute left-2 sm:left-4 z-10 w-11 h-11 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/30">
            <ChevronLeft size={24} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next"
            className="absolute right-2 sm:right-4 z-10 w-11 h-11 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/30">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {!loaded && <div className="absolute w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />}

      <img
        key={idx}
        src={photos[idx]}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={(e) => { const f = reliablePhoto(photos[idx] || idx); if (e.currentTarget.src !== f) { e.currentTarget.src = f; } else { e.currentTarget.onerror = null; e.currentTarget.src = GRADIENT_IMG; } setLoaded(true); }}
        className={`max-w-[96vw] max-h-[88vh] rounded-xl object-contain shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
          {total <= 12 ? photos.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setLoaded(false); setIdx(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
          )) : (
            <span className="text-white text-xs font-semibold">{idx + 1} / {total}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({ src, onClick, className = '', overlay }) {
  return (
    <div className={`relative overflow-hidden cursor-zoom-in ${className}`} onClick={onClick}>
      <img
        src={src}
        alt=""
        onError={(e) => { const f = reliablePhoto(src || Math.random()); if (e.currentTarget.src !== f) { e.currentTarget.src = f; } else { e.currentTarget.onerror = null; e.currentTarget.src = GRADIENT_IMG; } }}
        className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">+{overlay}</span>
        </div>
      )}
    </div>
  );
}

export default function PhotoGrid({ photos }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!photos || photos.length === 0) return null;

  const count = photos.length;
  const open = (i) => setLightboxIdx(i);
  const remaining = count > 5 ? count - 5 : 0;

  return (
    <>
      {/* 1 photo — full width */}
      {count === 1 && (
        <div className="max-h-96 overflow-hidden">
          <Tile src={photos[0]} onClick={() => open(0)} className="aspect-video" />
        </div>
      )}

      {/* 2 photos — side by side */}
      {count === 2 && (
        <div className="grid grid-cols-2 gap-0.5 max-h-72 overflow-hidden">
          <Tile src={photos[0]} onClick={() => open(0)} className="aspect-square" />
          <Tile src={photos[1]} onClick={() => open(1)} className="aspect-square" />
        </div>
      )}

      {/* 3 photos — 1 big left + 2 stacked right */}
      {count === 3 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-72 overflow-hidden">
          <Tile src={photos[0]} onClick={() => open(0)} className="row-span-2" />
          <Tile src={photos[1]} onClick={() => open(1)} />
          <Tile src={photos[2]} onClick={() => open(2)} />
        </div>
      )}

      {/* 4 photos — 1 big top + 3 equal bottom */}
      {count === 4 && (
        <div className="grid grid-rows-2 gap-0.5 h-80 overflow-hidden">
          <Tile src={photos[0]} onClick={() => open(0)} />
          <div className="grid grid-cols-3 gap-0.5">
            <Tile src={photos[1]} onClick={() => open(1)} />
            <Tile src={photos[2]} onClick={() => open(2)} />
            <Tile src={photos[3]} onClick={() => open(3)} />
          </div>
        </div>
      )}

      {/* 5+ photos — 2 top + 3 bottom, overlay on 5th if more */}
      {count >= 5 && (
        <div className="grid grid-rows-2 gap-0.5 h-80 overflow-hidden">
          <div className="grid grid-cols-2 gap-0.5">
            <Tile src={photos[0]} onClick={() => open(0)} />
            <Tile src={photos[1]} onClick={() => open(1)} />
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <Tile src={photos[2]} onClick={() => open(2)} />
            <Tile src={photos[3]} onClick={() => open(3)} />
            <Tile
              src={photos[4]}
              onClick={() => open(4)}
              overlay={remaining > 0 ? remaining : undefined}
            />
          </div>
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}