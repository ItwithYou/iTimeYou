import { createContext, useContext, useState, useEffect } from 'react';
import { auth, base44 } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';
import { useLang } from '@/hooks/useLang';

export const AppContext = createContext(null);

export function AppContextProvider({ children }) {
  const { lang, setLang, t } = useLang();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          first_name: firebaseUser.displayName?.split(' ')[0] || 'User',
          last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          photo_url: firebaseUser.photoURL || '',
        };
        setCurrentUser(user);
        try {
          const profiles = await base44.entities.UserProfile.filter({ user_email: firebaseUser.email });
          if (profiles.length > 0) {
            setProfile(profiles[0]);
          } else {
            const newProfile = await base44.entities.UserProfile.create({
              user_email: firebaseUser.email,
              first_name: user.first_name,
              last_name: user.last_name,
              photo_url: user.photo_url,
              trust_stars: 0,
              is_verified: false,
              friends: [],
            });
            setProfile(newProfile);
          }
        } catch (e) { console.warn('Profile init:', e.message); }
      } else {
        setCurrentUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, profile, setProfile, t, lang, setLang, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
