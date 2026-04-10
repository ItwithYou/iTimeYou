import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Auto-redirect to Base44 login
      navigateToLogin();
      return null;
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