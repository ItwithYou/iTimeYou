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
            className="absolute left-3 z-10 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/25"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % total); }}
            className="absolute right-3 z-10 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white active:bg-white/25"
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhotoGrid({ photos }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!photos || photos.length === 0) return null;

  const count = photos.length;

  const openLightbox = (i) => setLightboxIdx(i);

  // Single photo
  if (count === 1) {
    return (
      <>
        <div className="max-h-96 overflow-hidden cursor-zoom-in" onClick={() => openLightbox(0)}>
          <img src={photos[0]} alt="" className="w-full object-cover hover:scale-[1.02] transition-transform duration-300" />
        </div>
        {lightboxIdx !== null && <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // Two photos — side by side
  if (count === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-0.5 max-h-80 overflow-hidden">
          {photos.map((url, i) => (
            <div key={i} className="overflow-hidden cursor-zoom-in" onClick={() => openLightbox(i)}>
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300 aspect-square" />
            </div>
          ))}
        </div>
        {lightboxIdx !== null && <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // Three photos — 1 big left + 2 stacked right
  if (count === 3) {
    return (
      <>
        <div className="grid grid-cols-2 gap-0.5 max-h-80 overflow-hidden">
          <div className="row-span-2 overflow-hidden cursor-zoom-in" onClick={() => openLightbox(0)}>
            <img src={photos[0]} alt="" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300" />
          </div>
          <div className="overflow-hidden cursor-zoom-in" onClick={() => openLightbox(1)}>
            <img src={photos[1]} alt="" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300 aspect-square" />
          </div>
          <div className="overflow-hidden cursor-zoom-in" onClick={() => openLightbox(2)}>
            <img src={photos[2]} alt="" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300 aspect-square" />
          </div>
        </div>
        {lightboxIdx !== null && <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </>
    );
  }

  // Four+ photos — 1 big top + 3 bottom (with +N overlay)
  const visibleBottom = photos.slice(1, 4);
  const remaining = count - 4;

  return (
    <>
      <div className="max-h-96 overflow-hidden">
        <div className="cursor-zoom-in overflow-hidden" onClick={() => openLightbox(0)}>
          <img src={photos[0]} alt="" className="w-full h-52 object-cover hover:scale-[1.02] transition-transform duration-300" />
        </div>
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {visibleBottom.map((url, i) => (
            <div key={i} className="relative overflow-hidden cursor-zoom-in aspect-square" onClick={() => openLightbox(i + 1)}>
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300" />
              {i === 2 && remaining > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{remaining}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {lightboxIdx !== null && <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  );
}