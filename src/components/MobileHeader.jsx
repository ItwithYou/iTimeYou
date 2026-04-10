import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const ROOT_PATHS = ['/', '/feed', '/explore', '/bookings', '/wallet', '/messages'];

export default function MobileHeader({ t, lang }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_PATHS.includes(location.pathname);

  return (
    <div className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center h-12 px-3">
        {isRoot ? (
          <div className="flex items-center gap-2.5">
            <img
              src="https://media.base44.com/images/public/69d24b2d55b4f5275f81d6df/5910b1767_image.png"
              alt="iTimeYou"
              className="h-7 w-auto"
            />
            <span className="font-bold text-sm tracking-tight">iTimeYou</span>
          </div>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-semibold text-foreground min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft size={22} />
            <span>{lang === 'lo' ? 'ກັບຄືນ' : 'Back'}</span>
          </button>
        )}
      </div>
    </div>
  );
}