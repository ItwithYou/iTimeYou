import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import useLang from '../hooks/useLang';
import useProfile from '../hooks/useProfile';
import MobileHeader from './MobileHeader';

export default function Layout() {
  const { lang, setLang, t } = useLang();
  const { profile, currentUser, loading, refreshProfile } = useProfile();

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
    <div className={`min-h-screen bg-background ${lang === 'lo' ? 'font-lao' : 'font-inter'}`}>
      <Navbar profile={profile} t={t} lang={lang} setLang={setLang} />
      <MobileHeader t={t} />
      <main className="pb-20 md:pb-0">
        <div className="page-transition">
          <Outlet context={{ profile, currentUser, t, lang, setLang, refreshProfile }} />
        </div>
      </main>
      <BottomNav t={t} />
      <div className="hidden md:block">
        <Footer t={t} />
      </div>
    </div>
  );
}