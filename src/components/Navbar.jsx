import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, Compass, Calendar, Wallet, MessageCircle, Bell, LogOut, Menu, X } from 'lucide-react';
import LangToggle from './LangToggle';
import { base44 } from '@/api/base44Client';

export default function Navbar({ profile, t, lang, setLang }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { to: '/feed', icon: Home, label: t.feed },
    { to: '/explore', icon: Compass, label: t.explore },
    { to: '/bookings', icon: Calendar, label: t.trips },
    { to: '/wallet', icon: Wallet, label: t.wallet },
    { to: '/messages', icon: MessageCircle, label: '' },
    { to: '/notifications', icon: Bell, label: '' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl">
          <span className="text-2xl">⏰</span>
          <span className="text-primary">iTimeYou</span>
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex items-center bg-muted rounded-full px-4 py-2 flex-1 max-w-xs mx-6 border border-border">
          <Search size={16} className="text-muted-foreground" />
          <Link to="/explore" className="ml-2 text-sm text-muted-foreground">{t.searchPlaceholder}</Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === item.to
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <item.icon size={18} />
              {item.label && <span className="hidden lg:inline">{item.label}</span>}
            </Link>
          ))}
          
          <Link to={`/profile/${profile?.id || ''}`} className="ml-1">
            <img
              src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-border object-cover hover:border-primary transition-colors"
            />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={16} />
          </button>

          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border p-4 space-y-1 animate-in slide-in-from-top-2">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                location.pathname === item.to ? 'text-primary bg-primary/5' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={18} />
              {item.label || item.to.slice(1)}
            </Link>
          ))}
          <Link
            to={`/profile/${profile?.id || ''}`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground"
          >
            <img
              src={profile?.photo_url || profile?.avatar_url || ''}
              alt="" className="w-5 h-5 rounded-full"
            />
            {t.profile}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground w-full"
          >
            <LogOut size={18} />
            {t.logout}
          </button>
        </div>
      )}
    </nav>
  );
}