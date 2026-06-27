import { useState, useRef, useEffect } from 'react';
import { ImagePlus, User, Building2, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateDropdownButton({ lang }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="ml-2 sm:ml-4 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#8a6b1c] text-white flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 hover:shadow-lg hover:shadow-[#d4af37]/40 transition-all hover:scale-105 active:scale-95 border border-[#eed077]/30"
        aria-label="Create Post"
      >
        <ImagePlus size={16} strokeWidth={2.5} className={open ? "scale-110 transition-transform" : "transition-transform"} />
        <span className="text-[11px] sm:text-xs font-bold tracking-wide">
          {lang === 'lo' ? 'ໂພສໃໝ່' : 'Post'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            to="/create?type=personal"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {lang === 'lo' ? 'ສ່ວນບຸກຄົນ' : 'Personal'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {lang === 'lo' ? 'ໂພສບໍລິການ ຫຼື ຄໍາຮ້ອງຂໍ' : 'Service or Request'}
              </span>
            </div>
          </Link>

          <Link
            to="/create?type=business"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#8B7355]/10 text-[#8B7355] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {lang === 'lo' ? 'ທຸລະກິດ' : 'Business'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {lang === 'lo' ? 'ລົງລາຍການທີ່ພັກ/ທົວ' : 'Listing or Tour'}
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
