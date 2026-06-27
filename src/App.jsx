import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';

const LoginModal = React.lazy(() => import('./components/LoginModal'));
const AdminVerification = React.lazy(() => import('./pages/AdminVerification'));
const ListingDetail = React.lazy(() => import('./pages/ListingDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const PasswordSettings = React.lazy(() => import('./pages/PasswordSettings'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-7 h-7 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

// Guard for non-tab pages that need a real account.
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      window.dispatchEvent(new Event('open-login'));
    }
  }, [isLoadingAuth, isAuthenticated]);

  if (isLoadingAuth) return <LazyFallback />;
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  // Brief splash only while Firebase resolves the session.
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Everyone (guests included) can browse. Protected tabs (wallet/bookings/
  // messages) are gated inside Layout; non-tab pages are gated here.
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Public tab pages (rendered by Layout) */}
          <Route path="/" element={null} />
          <Route path="/feed" element={null} />
          <Route path="/explore" element={null} />
          {/* Login-gated tab pages (gated inside Layout) */}
          <Route path="/wallet" element={null} />
          <Route path="/bookings" element={null} />
          <Route path="/messages" element={null} />

          {/* Public detail pages */}
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Login-gated detail pages */}
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/profile/:id/password" element={<RequireAuth><PasswordSettings /></RequireAuth>} />
          <Route path="/admin/verification" element={<RequireAuth><AdminVerification /></RequireAuth>} />

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const GlobalLoginModal = () => {
  const { showLoginModal, setShowLoginModal } = useAuth();
  return <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
            <GlobalLoginModal />
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
