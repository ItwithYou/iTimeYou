import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, Compass, Calendar, Wallet, MessageCircle, Bell, LogOut, Menu, X, User } from 'lucide-react';
import LangToggle from './LangToggle';
import { base44 } from '@/api/base44Client';

export default function Navbar({ profile, t, lang, setLang }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => base44.auth.logout();

  const navItems = [
    { to: '/feed', icon: Home, label: t.feed },
    { to: '/explore', icon: Compass, label: t.explore },
    { to: '/bookings', icon: Calendar, label: t.trips },
    { to: '/wallet', icon: Wallet, label: t.wallet },
    { to: '/messages', icon: MessageCircle, label: t.messages },
    { to: '/notifications', icon: Bell, label: t.notifications },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl flex-shrink-0">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-tiffany to-deep-green flex items-center justify-center text-white text-base">⏰</span>
          <span className="text-primary font-black tracking-tight hidden sm:block">iTimeYou</span>
        </Link>

        {/* Desktop search */}
        <Link to="/explore" className="hidden md:flex items-center bg-muted rounded-full px-4 py-2 flex-1 max-w-xs mx-6 border border-border hover:border-primary transition-colors">
          <Search size={15} className="text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t.searchPlaceholder}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === item.to
                  ? 'text-primary bg-primary/8 font-semibold'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <item.icon size={18} />
              <span className="hidden lg:inline text-xs">{item.label}</span>
            </Link>
          ))}

          <Link to={`/profile/${profile?.id || ''}`} className="ml-1">
            <img
              src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-border object-cover hover:border-primary transition-colors"
            />
          </Link>

          <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors ml-1">
            <LogOut size={16} />
          </button>

          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <Link to="/notifications" className="relative p-2">
            <Bell size={20} className={location.pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'} />
          </Link>
          <Link to={`/profile/${profile?.id || ''}`}>
            <img
              src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-border object-cover"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}