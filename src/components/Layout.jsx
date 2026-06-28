import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
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
  { path: '/', PageComponent: Home },
  { path: '/feed', PageComponent: Feed },
  { path: '/explore', PageComponent: Explore },
  { path: '/bookings', PageComponent: Bookings },
  { path: '/wallet', PageComponent: Wallet },
  { path: '/messages', PageComponent: Messages },
];
const TAB_PATHS = TAB_PAGES.map(t => t.path);
// Tab pages that require a real account. Guests are sent to /login.
const PROTECTED_TABS = ['/bookings', '/wallet', '/messages'];

export default function Layout() {
  const { lang, setLang, t } = useLang();
  const { profile, currentUser, loading, refreshProfile } = useProfile();
  const location = useLocation();
  const isTabPath = TAB_PATHS.includes(location.pathname);



  // Track visited tab paths for persistent mounting
  const [visitedPaths, setVisitedPaths] = useState(() => new Set([location.pathname]));
  
  const [exchangeRates, setExchangeRates] = useState({ usdBuy: 22000, usdSell: 22000, usdtBuy: 22000, usdtSell: 22000 });

  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const items = await firebaseClient.entities.ExchangeRateSettings.list('-updated_date', 1);
        const item = items[0];
        if (item) {
          setExchangeRates({
            usdBuy: item.usd_buy || 22000,
            usdSell: item.usd_sell || 22000,
            usdtBuy: item.usdt_buy || item.usd_buy || 22000,
            usdtSell: item.usdt_sell || item.usd_sell || 22000,
          });
        }
      } catch (err) {
        console.error('Failed to load exchange rates', err);
      }
    };
    loadExchangeRates();
  }, []);

  // One-time migration to transfer demo data to Admin
  useEffect(() => {
    const migrateDemoToAdmin = async () => {
      if (localStorage.getItem('demo_transferred_to_admin_v2')) return;
      localStorage.setItem('demo_transferred_to_admin_v2', 'true');
      
      try {
        const posts = await firebaseClient.entities.Post.filter({ author_name: 'Premium User' });
        for (const p of posts) {
          await firebaseClient.entities.Post.update(p.id, {
            author_email: 'norecord88@gmail.com',
            author_name: 'iTimeYou Admin',
          });
        }
        const listings = await firebaseClient.entities.Listing.filter({ host_name: 'Premium Host' });
        for (const l of listings) {
          await firebaseClient.entities.Listing.update(l.id, {
            host_email: 'norecord88@gmail.com',
            host_name: 'iTimeYou Admin',
          });
        }
        console.log("Demo data transferred to Admin successfully");
      } catch (err) {
        console.error("Migration failed", err);
      }
    };
    migrateDemoToAdmin();
  }, []);

  useEffect(() => {
    if (TAB_PATHS.includes(location.pathname)) {
      setVisitedPaths(prev => {
        if (prev.has(location.pathname)) return prev;
        return new Set([...prev, location.pathname]);
      });
    }
  }, [location.pathname]);

  const preferredCurrency = profile?.preferred_currency || profile?.wallet_currency || 'LAK';
  const contextValue = { profile, currentUser, t, lang, setLang, refreshProfile, exchangeRates, preferredCurrency };

  // Update activity timestamp every 30 seconds only on visible tabs
  useEffect(() => {
    if (!currentUser) return;

    const sendActivity = () => {
      if (document.visibilityState === 'visible') {
        firebaseClient.functions.invoke('updateUserActivity', {});
      }
    };

    sendActivity();
    const interval = setInterval(sendActivity, 30000);
    document.addEventListener('visibilitychange', sendActivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', sendActivity);
    };
  }, [currentUser]);

  // Guests can browse everything except the login-gated tabs.
  // Must be called before any early returns to satisfy React Hooks rules!
  useEffect(() => {
    if (!loading && !currentUser && PROTECTED_TABS.includes(location.pathname)) {
      window.dispatchEvent(new Event('open-login'));
    }
  }, [loading, currentUser, location.pathname]);

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
            <span className="text-6xl text-white brand-logo drop-shadow-lg">iTimeYou</span>
          </div>
          
          <p className="text-white/60 text-xs tracking-widest mb-1 lao-text font-semibold">ສັງຄົມ · ທ່ຽວ · ວັດທະນະທໍາ · ທີ່ພັກ</p>
          <p className="text-white/50 text-xs tracking-widest mb-6">SOCIAL · TRAVEL · CULTURE · STAY</p>
          
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

  if (!currentUser && PROTECTED_TABS.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`min-h-screen bg-background ${lang === 'lo' ? 'font-lao' : 'font-inter'}`}>
        <Navbar profile={profile} currentUser={currentUser} t={t} lang={lang} setLang={setLang} />
        <MobileHeader t={t} lang={lang} />
        <main className="pb-20 md:pb-0">
          {/* Persistent tab pages — hidden via CSS, stay mounted to preserve state/scroll */}
          {TAB_PAGES.map(({ path, PageComponent }) =>
            visitedPaths.has(path) ? (
              <div key={path} className={location.pathname === path ? 'block' : 'hidden'}>
                <PageComponent />
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