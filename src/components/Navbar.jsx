import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, Compass, Calendar, Wallet, MessageCircle, Bell, LogOut, Menu, X, User, ShieldCheck, HelpCircle } from 'lucide-react';
import LangToggle from './LangToggle';
import { base44 } from '@/api/base44Client';

export default function Navbar({ profile, currentUser, t, lang, setLang }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => base44.auth.logout();

  const navItems = [
  { to: '/feed', icon: Home, label: t.feed },
  { to: '/explore', icon: Compass, label: t.explore },
  { to: '/bookings', icon: Calendar, label: t.trips },
  { to: '/wallet', icon: Wallet, label: t.wallet },
  { to: '/messages', icon: MessageCircle, label: t.messages },
  { to: '/notifications', icon: Bell, label: t.notifications }];

  const secondaryNavItems = [
  { to: '/help', icon: HelpCircle, label: lang === 'lo' ? 'ສູນຊ່ວຍເຫຼືອ' : 'Help Center' }];



  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm" role="navigation" aria-label="Top navigation" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0" aria-label="iTimeYou Home">
          <img src="https://media.base44.com/images/public/69d24b2d55b4f5275f81d6df/5910b1767_image.png" alt="iTimeYou" className="h-9 w-auto" />
        </Link>

        {/* Desktop search */}
        <Link to="/explore" className="hidden md:flex items-center bg-muted rounded-full px-4 py-2 flex-1 max-w-xs mx-6 border border-border hover:border-primary transition-colors">
          <Search size={15} className="text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t.searchPlaceholder}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) =>
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
            location.pathname === item.to ?
            'text-primary bg-primary/8 font-semibold' :
            'text-muted-foreground hover:text-primary hover:bg-primary/5'}`
            }>
            
              <item.icon size={18} />
              <span className="hidden lg:inline text-xs">{item.label}</span>
            </Link>
          )}

          <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border">
            {secondaryNavItems.map((item) => null








            )}

            <Link to={`/profile/${profile?.id || ''}`} className="flex items-center gap-2">
              <img
                src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-border object-cover hover:border-primary transition-colors" />
              
              <span className="hidden xl:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                {profile?.first_name || 'User'}
              </span>
            </Link>

            {currentUser?.role === 'admin' &&
            <Link to="/admin/verification" className={`flex items-center gap-1 px-2 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/admin/verification' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                <ShieldCheck size={18} />
              </Link>
            }

            


            
          </div>

          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-2 md:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <Link to="/help" className="p-2" aria-label="Help Center">
            <HelpCircle size={20} className={location.pathname === '/help' ? 'text-primary' : 'text-muted-foreground'} aria-hidden="true" />
          </Link>
          <Link to="/notifications" className="relative p-2" aria-label="Notifications">
            <Bell size={20} className={location.pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'} aria-hidden="true" />
          </Link>
          <Link to={`/profile/${profile?.id || ''}`} aria-label="Your profile">
            <img
              src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt="Profile photo"
              className="w-8 h-8 rounded-full border-2 border-border object-cover" />
            
          </Link>
        </div>
      </div>
    </nav>);

}