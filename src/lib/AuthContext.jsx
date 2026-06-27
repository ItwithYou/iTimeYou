import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // authError stays null — guests are allowed to browse freely.
  const [authError] = useState(null);

  useEffect(() => {
    // Safety net: never hang on the splash. If Firebase is slow/unreachable
    // (e.g. flaky mobile network), show the app as a guest after a few seconds.
    const failSafe = setTimeout(() => setIsLoadingAuth(false), 4000);

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(failSafe);
      if (firebaseUser) {
        const userIdentifier = firebaseUser.email || firebaseUser.phoneNumber || firebaseUser.uid;
        setUser({
          id: firebaseUser.uid,
          email: userIdentifier,
          full_name: firebaseUser.displayName || userIdentifier.split('@')[0] || 'User',
          first_name: firebaseUser.displayName?.split(' ')[0] || 'User',
          last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          photo_url: firebaseUser.photoURL || '',
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });
    return () => { clearTimeout(failSafe); unsub(); };
  }, []);

  const logout = () => {
    import('firebase/auth').then(({ signOut }) => signOut(auth)).then(() => {
      window.location.href = '/';
    });
  };

  const navigateToLogin = () => { window.location.href = '/login'; };

  // Helper for gated actions: returns true if allowed, else sends user to /login.
  const requireAuth = () => {
    if (isAuthenticated) return true;
    window.location.href = '/login';
    return false;
  };

  const checkAppState = () => {};

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, requireAuth, checkAppState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
