import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

const Login = React.lazy(() => import('./pages/Login'));
const Bookings = React.lazy(() => import('./pages/Bookings'));
const AdminVerification = React.lazy(() => import('./pages/AdminVerification'));
const ListingDetail = React.lazy(() => import('./pages/ListingDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Messages = React.lazy(() => import('./pages/Messages'));
const PasswordSettings = React.lazy(() => import('./pages/PasswordSettings'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-7 h-7 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={null} />
          <Route path="/feed" element={null} />
          <Route path="/explore" element={null} />
          <Route path="/wallet" element={null} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile/:id/password" element={<PasswordSettings />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
