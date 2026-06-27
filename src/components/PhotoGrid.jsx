import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const total = photos.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/25"
      >
        <X size={20} />
      </button>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + total) % total); }}
            className="absolute left-3 z-10 w-12 h-12 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/30"
            style={{ touchAction: 'manipulation' }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % total); }}
            className="absolute right-3 z-10 w-12 h-12 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/30"
            style={{ touchAction: 'manipulation' }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={photos[idx]}
        alt=""
        className="max-w-[95vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
          {total <= 12 ? photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          )) : (
            <span className="text-white text-xs font-semibold">{idx + 1} / {total}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({ src, onClick, className = '', overlay, onRemove, index }) {
  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      onClick={onClick}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      role="button"
      tabIndex={0}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover active:scale-[0.98] transition-transform duration-200"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <span className="text-white text-2xl font-bold">+{overlay}</span>
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-black/80 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function PhotoGrid({ photos, onRemove }) {
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
          <Tile src={photos[0]} index={0} onRemove={onRemove} onClick={() => open(0)} className="aspect-video" />
        </div>
      )}

      {/* 2 photos — side by side */}
      {count === 2 && (
        <div className="grid grid-cols-2 gap-0.5 max-h-72 overflow-hidden">
          <Tile src={photos[0]} index={0} onRemove={onRemove} onClick={() => open(0)} className="aspect-square" />
          <Tile src={photos[1]} index={1} onRemove={onRemove} onClick={() => open(1)} className="aspect-square" />
        </div>
      )}

      {/* 3 photos — 1 big left + 2 stacked right */}
      {count === 3 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-72 overflow-hidden">
          <Tile src={photos[0]} index={0} onRemove={onRemove} onClick={() => open(0)} className="row-span-2" />
          <Tile src={photos[1]} index={1} onRemove={onRemove} onClick={() => open(1)} />
          <Tile src={photos[2]} index={2} onRemove={onRemove} onClick={() => open(2)} />
        </div>
      )}

      {/* 4 photos — 1 big top + 3 equal bottom */}
      {count === 4 && (
        <div className="grid grid-rows-2 gap-0.5 h-80 overflow-hidden">
          <Tile src={photos[0]} index={0} onRemove={onRemove} onClick={() => open(0)} />
          <div className="grid grid-cols-3 gap-0.5">
            <Tile src={photos[1]} index={1} onRemove={onRemove} onClick={() => open(1)} />
            <Tile src={photos[2]} index={2} onRemove={onRemove} onClick={() => open(2)} />
            <Tile src={photos[3]} index={3} onRemove={onRemove} onClick={() => open(3)} />
          </div>
        </div>
      )}

      {/* 5+ photos — 2 top + 3 bottom, overlay on 5th if more */}
      {count >= 5 && (
        <div className="grid grid-rows-2 gap-0.5 h-80 overflow-hidden">
          <div className="grid grid-cols-2 gap-0.5">
            <Tile src={photos[0]} index={0} onRemove={onRemove} onClick={() => open(0)} />
            <Tile src={photos[1]} index={1} onRemove={onRemove} onClick={() => open(1)} />
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <Tile src={photos[2]} index={2} onRemove={onRemove} onClick={() => open(2)} />
            <Tile src={photos[3]} index={3} onRemove={onRemove} onClick={() => open(3)} />
            <Tile
              src={photos[4]}
              index={4}
              onRemove={onRemove}
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