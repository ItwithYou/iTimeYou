import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useLang from '../hooks/useLang';
import useProfile from '../hooks/useProfile';

export default function Layout() {
  const { lang, setLang, t } = useLang();
  const { profile, currentUser, loading, refreshProfile } = useProfile();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${lang === 'lo' ? 'font-lao' : 'font-inter'}`}>
      <Navbar profile={profile} t={t} lang={lang} setLang={setLang} />
      <main>
        <Outlet context={{ profile, currentUser, t, lang, setLang, refreshProfile }} />
      </main>
      <Footer t={t} />
    </div>
  );
}