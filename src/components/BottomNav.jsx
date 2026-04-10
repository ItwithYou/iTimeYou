import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Calendar, Wallet, MessageCircle } from 'lucide-react';

export default function BottomNav({ t, lang }) {
  const location = useLocation();

  const items = [
    { to: '/feed', icon: Home, label: t.feed },
    { to: '/explore', icon: Compass, label: t.explore },
    { to: '/bookings', icon: Calendar, label: t.trips },
    { to: '/wallet', icon: Wallet, label: t.wallet },
    { to: '/messages', icon: MessageCircle, label: lang === 'lo' ? 'ແຊັດ' : 'Chat' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-pb" style={{ WebkitTapHighlightColor: 'transparent' }} role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-around h-16 px-2" role="tablist">
        {items.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-all"
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
                <item.icon
                  size={22}
                  className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                  aria-hidden="true"
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors leading-none ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}