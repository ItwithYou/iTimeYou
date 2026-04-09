import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const CHILD_ROUTES = ['/listing/', '/notifications', '/profile/'];

export default function MobileHeader({ t }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isChild = CHILD_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div
      className="md:hidden sticky top-0 z-50 flex items-center h-12 px-3 bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {isChild ? (
        <>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-primary font-semibold text-sm select-none"
          >
            <ChevronLeft size={20} />
            {t?.back || 'Back'}
          </button>
          <div className="flex-1 text-center font-bold text-sm text-foreground">iTimeYou</div>
          <div className="w-14" />
        </>
      ) : (
        <Link to="/" className="flex items-center gap-2 mx-auto select-none">
          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-tiffany to-deep-green flex items-center justify-center text-white text-sm">⏰</span>
          <span className="text-primary font-black tracking-tight text-base">iTimeYou</span>
        </Link>
      )}
    </div>
  );
}