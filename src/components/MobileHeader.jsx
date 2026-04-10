import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const CHILD_ROUTES = ['/listing/', '/notifications', '/profile/', '/admin/', '/help', '/reset-password'];
const ROUTE_TITLES = {
  '/notifications': { en: 'Notifications', lo: 'ການແຈ້ງເຕືອນ' },
  '/help': { en: 'Help Center', lo: 'ສູນຊ່ວຍເຫຼືອ' },
  '/admin/verification': { en: 'Verification', lo: 'ການຢືນຢັນ' },
};

export default function MobileHeader({ t, lang }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isChild = CHILD_ROUTES.some((r) => location.pathname.startsWith(r));

  // Main tabs — show logo bar
  if (!isChild) {
    return (
      <div className="md:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <span className="font-bold text-sm tracking-tight">
            i<span className="text-primary">Time</span>You
          </span>
        </div>
      </div>
    );
  }

  // Child routes — show back button
  const titleEntry = Object.entries(ROUTE_TITLES).find(([path]) => location.pathname.startsWith(path));
  const title = titleEntry ? titleEntry[1][lang || 'en'] : '';

  return (
    <div className="md:hidden sticky top-0 z-30 bg-card border-b border-border px-2 py-2 flex items-center gap-1">
      <button
        onClick={() => navigate(-1)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full active:bg-muted transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      {title && <span className="font-semibold text-sm">{title}</span>}
    </div>
  );
}