import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

  // Update activity timestamp every 30 seconds
  useEffect(() => {
    if (currentUser) {
      base44.functions.invoke('updateUserActivity', {});
      const interval = setInterval(() => {
        base44.functions.invoke('updateUserActivity', {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#004D4A] via-[#006864] to-[#00827D] overflow-hidden" style={{ minHeight: '600px' }}>
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath+OT&display=swap" rel="stylesheet" />
        <style>{`
          .lao-text { font-family: 'Phetsarath OT', 'Phetsarath', 'Noto Sans Lao', serif; }
          .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(10,186,181,0.16); animation: ripple 3.4s ease-out infinite; }
          .ring:nth-child(1) { width: 160px; height: 160px; animation-delay: 0s; }
          .ring:nth-child(2) { width: 290px; height: 290px; animation-delay: 0.65s; }
          .ring:nth-child(3) { width: 420px; height: 420px; animation-delay: 1.3s; }
          .ring:nth-child(4) { width: 550px; height: 550px; animation-delay: 1.95s; }
          @keyframes ripple { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        `}</style>
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0ADBB9] to-[#008B7C] flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl">⏰</div>
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/80 text-sm font-semibold mt-4 lao-text">ກຳລັງໂຫຼດ...</p>
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
        <BottomNav t={t} lang={lang} />
        <div className="hidden md:block">
          <Footer t={t} lang={lang} />
        </div>
      </div>
    </AppContext.Provider>
  );
}