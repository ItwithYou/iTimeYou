import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Calendar, Wallet, MessageCircle, Bell, ShieldCheck, HelpCircle } from 'lucide-react';
import LangToggle from './LangToggle';
import ThemeToggle from './ThemeToggle';
import { firebaseClient } from '@/api/firebaseClient';
import CreateDropdownButton from './CreateDropdownButton';

export default function Navbar({ profile, currentUser, t, lang, setLang }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => firebaseClient.auth.logout();

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
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm" role="navigation" aria-label="Top navigation" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo and Premium Button */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/" className="flex items-center flex-shrink-0" aria-label="iTimeYou Home">
            <span className="text-xl text-primary brand-logo">iTimeYou</span>
          </Link>
          <CreateDropdownButton lang={lang} />
        </div>

        {/* Desktop search */}
        


        

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

            {currentUser ? (
              <Link to={`/profile/${profile?.id || ''}`} className="flex items-center gap-2">
                <img
                  src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-border object-cover hover:border-primary transition-colors" />

                <span className="hidden xl:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                  {profile?.first_name || 'User'}
                </span>
              </Link>
            ) : (
              <button onClick={() => window.dispatchEvent(new Event('open-login'))} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                {lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ' : 'Login'}
              </button>
            )}

            {currentUser?.role === 'admin' &&
            <Link to="/admin/verification" className={`flex items-center gap-1 px-2 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/admin/verification' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                <ShieldCheck size={18} />
              </Link>
            }

            


            
          </div>

          <ThemeToggle />
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LangToggle lang={lang} setLang={setLang} />
          <Link to="/help" className="p-2" aria-label="Help Center">
            <HelpCircle size={20} className={location.pathname === '/help' ? 'text-primary' : 'text-muted-foreground'} aria-hidden="true" />
          </Link>
          <Link to="/notifications" className="relative p-2" aria-label="Notifications">
            <Bell size={20} className={location.pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'} aria-hidden="true" />
          </Link>
          {currentUser?.role === 'admin' && (
            <Link to="/admin/verification" className="relative p-2" aria-label="Admin verification">
              <ShieldCheck size={20} className={location.pathname === '/admin/verification' ? 'text-primary' : 'text-emerald-600'} aria-hidden="true" />
            </Link>
          )}
          {currentUser ? (
            <Link to={`/profile/${profile?.id || ''}`} aria-label="Your profile">
              <img
                src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                alt="Profile photo"
                className="w-8 h-8 rounded-full border-2 border-border object-cover" />
            </Link>
          ) : (
            <button onClick={() => window.dispatchEvent(new Event('open-login'))} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
              {lang === 'lo' ? 'ເຂົ້າ' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </nav>);

}