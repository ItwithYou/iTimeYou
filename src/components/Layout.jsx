import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import useLang from '../hooks/useLang';
import useProfile from '../hooks/useProfile';
import MobileHeader from './MobileHeader';
import { AppContext } from '../lib/AppContext';
import Home from '../pages/Home';
import Feed from '../pages/Feed';
import Explore from '../pages/Explore';
import Bookings from '../pages/Bookings.jsx';
import Wallet from '../pages/Wallet';
import Messages from '../pages/Messages';

const TAB_PAGES = [
  { path: '/', Component: Home },
  { path: '/feed', Component: Feed },
  { path: '/explore', Component: Explore },
  { path: '/bookings', Component: Bookings },
  { path: '/wallet', Component: Wallet },
  { path: '/messages', Component: Messages },
];
const TAB_PATHS = TAB_PAGES.map(t => t.path);

export default function Layout() {
  const { lang, setLang, t } = useLang();
  const { profile, currentUser, loading, refreshProfile } = useProfile();
  const location = useLocation();
  const isTabPath = TAB_PATHS.includes(location.pathname);

  const [visitedPaths, setVisitedPaths] = useState(() => new Set([location.pathname]));
  useEffect(() => {
    if (TAB_PATHS.includes(location.pathname)) {
      setVisitedPaths(prev => new Set([...prev, location.pathname]));
    }
  }, [location.pathname]);

  const contextValue = { profile, currentUser, t, lang, setLang, refreshProfile };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tiffany to-deep-green flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">⏰</div>
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`min-h-screen bg-background ${lang === 'lo' ? 'font-lao' : 'font-inter'}`}>
        <Navbar profile={profile} currentUser={currentUser} t={t} lang={lang} setLang={setLang} />
        <MobileHeader t={t} />
        <main className="pb-20 md:pb-0">
          {/* Persistent tab pages — hidden via CSS, not unmounted */}
          {TAB_PAGES.map(({ path, Component }) =>
            visitedPaths.has(path) ? (
              <div key={path} style={{ display: location.pathname === path ? 'block' : 'none' }}>
                <Component />
              </div>
            ) : null
          )}
          {/* Non-tab routes rendered via Outlet with slide animation */}
          {!isTabPath && (
            <div key={location.pathname} className="page-transition">
              <Outlet context={contextValue} />
            </div>
          )}
        </main>
        <BottomNav t={t} />
        <div className="hidden md:block">
          <Footer t={t} />
        </div>
      </div>
    </AppContext.Provider>
  );
}