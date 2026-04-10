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
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#004D4A] via-[#0A7A74] to-[#006B63] overflow-hidden">
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath+OT&display=swap" rel="stylesheet" />
        <style>{`
          .lao-text { font-family: 'Phetsarath OT', 'Phetsarath', 'Noto Sans Lao', serif; }
          .loading-dots { display: flex; gap: 6px; justify-content: center; }
          .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: rgba(10,186,181,0.6); animation: pulse 1.4s ease-in-out infinite; }
          .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
          .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes pulse { 0%, 80%, 100% { opacity: 0.4; } 40% { opacity: 1; } }
        `}</style>
        <div className="text-center">
          {/* Logo */}
          <div className="mb-10">
            <div className="inline-block relative">
              <div className="w-24 h-24 border-4 border-[#0ADBB9] rounded-[45%] transform rotate-45 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform -rotate-45">
                  <div className="text-3xl">⏰</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text */}
          <h1 className="text-4xl font-black mb-2 text-white tracking-tight">
            <span>i</span><span>Time</span><span className="text-[#0ADBB9]">You</span>
          </h1>
          
          <p className="text-white/60 text-xs tracking-widest mb-1 lao-text font-semibold">ສັງຄົມ · ບ້ານ · ຈ່າຍ · ລາວ</p>
          <p className="text-white/50 text-xs tracking-widest mb-6">SOCIAL · STAY · PAY · LAOS</p>
          
          {/* Loading bar */}
          <div className="w-48 h-px bg-[#0ADBB9]/30 mb-6 mx-auto" />
          
          {/* Loading text */}
          <p className="text-white/70 text-sm mb-2 lao-text font-medium">ກຳລັງໂຫຼດ...</p>
          <p className="text-white/50 text-xs mb-4">Loading...</p>
          
          {/* Dots */}
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
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