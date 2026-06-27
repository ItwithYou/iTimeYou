import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageLightbox({ src, onClose }) {
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (zoomed && containerRef.current) {
      const el = containerRef.current;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [zoomed]);

  if (!src) return null;
  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md overflow-auto ${zoomed ? 'block' : 'flex items-center justify-center'}`}
      onMouseDown={e => { if (e.target === e.currentTarget && !zoomed) onClose(); }}
      onTouchEnd={e => { if (e.target === e.currentTarget && !zoomed) onClose(); }}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[101] w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white backdrop-blur-lg transition-colors shadow-lg"
      >
        <X size={20} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
        className="fixed bottom-6 right-6 z-[101] w-14 h-14 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white backdrop-blur-lg transition-colors shadow-lg"
      >
        {zoomed ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
      </button>

      <div className={`relative ${zoomed ? 'w-fit h-fit min-w-full min-h-full p-4 flex items-center justify-center' : ''}`}>
        <img
          src={src}
          alt=""
          className={`transition-transform duration-300 rounded-2xl shadow-2xl ${zoomed ? 'max-w-none h-[150vh] sm:h-[150vh] w-auto object-cover cursor-zoom-out m-auto' : 'max-w-[95vw] max-h-[90vh] object-contain cursor-zoom-in'}`}
          onClick={e => {
            e.stopPropagation();
            setZoomed(!zoomed);
          }}
        />
      </div>
    </div>
  );
}