import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Loading screen with retry option
const LoadingScreen = ({ onRetry }) => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
      {showRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Taking too long? Click to retry
        </button>
      )}
    </div>
  );
};
// Add page imports here
import Layout from './components/Layout';
import Bookings from './pages/Bookings';
import AdminVerification from './pages/AdminVerification';
import ListingDetail from './pages/ListingDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import PasswordSettings from './pages/PasswordSettings';
import ResetPassword from './pages/ResetPassword';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkAppState } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen onRetry={checkAppState} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Show login screen with button instead of auto-redirect
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏰</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to iTimeYou</h1>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Please sign in to continue exploring local services and experiences.
            </p>
            <div className="space-y-3">
              <button
                onClick={navigateToLogin}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity w-full block"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Render the main app
  return (
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
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App