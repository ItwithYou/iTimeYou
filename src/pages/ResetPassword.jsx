import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Check, AlertCircle, Mail } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('reset'); // 'request' or 'reset'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
      setMode('reset');
      // Verify token
      verifyToken(tokenParam, emailParam);
    } else {
      setMode('request');
    }
  }, [searchParams]);

  const verifyToken = async (tokenParam, emailParam) => {
    try {
      const resets = await base44.entities.PasswordReset.filter({ 
        token: tokenParam,
        email: emailParam
      });
      
      if (resets.length === 0) {
        setError('Invalid or expired reset link');
        setVerified(false);
        return;
      }
      
      const reset = resets[0];
      const expiresAt = new Date(reset.expires_at);
      
      if (expiresAt < new Date()) {
        setError('Reset link has expired');
        setVerified(false);
        return;
      }
      
      if (reset.used) {
        setError('This reset link has already been used');
        setVerified(false);
        return;
      }
      
      setVerified(true);
    } catch (err) {
      setError('Failed to verify reset link');
      setVerified(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    
    try {
      const res = await base44.functions.invoke('sendPasswordResetEmail', { email });
      
      if (res.data.success) {
        toast.success('Password reset email sent! Please check your inbox.');
        setEmail('');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // Update the user's password
      await base44.auth.updateMe({ password });
      
      // Mark the reset token as used
      const resets = await base44.entities.PasswordReset.filter({ token });
      if (resets.length > 0) {
        await base44.entities.PasswordReset.update(resets[0].id, { used: true });
      }
      
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        base44.auth.logout();
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'request') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Mail size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Forgot Password?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                  autoFocus
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Mail size={16} /> Send Reset Link
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full border border-border py-3 rounded-xl font-semibold text-sm mt-3 hover:bg-muted transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => setMode('request')}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90"
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-border py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Set a new password for <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a new password"
                className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary"
                autoFocus
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your password must be at least 6 characters long.
          </p>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} /> Reset Password
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full border border-border py-3 rounded-xl font-semibold text-sm mt-3 hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}