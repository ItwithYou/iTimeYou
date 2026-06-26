import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          first_name: firebaseUser.displayName?.split(' ')[0] || 'User',
          last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          photo_url: firebaseUser.photoURL || '',
        });
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
      setIsLoadingAuth(false);
    });
    return unsub;
  }, []);

  const logout = () => {
    import('firebase/auth').then(({ signOut }) => signOut(auth)).then(() => {
      window.location.href = '/login';
    });
  };

  const navigateToLogin = () => { window.location.href = '/login'; };
  const checkAppState = () => {};

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, checkAppState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
