import { useState, useEffect } from 'react';
import { base44, auth } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function friendlyError(err) {
  const code = err?.code || '';
  const msg = err?.message || '';
  if (code.includes('unauthorized-domain'))
    return 'This website domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.';
  if (code.includes('operation-not-allowed'))
    return 'This sign-in method is disabled. Enable it in Firebase → Authentication → Sign-in method.';
  if (code.includes('popup-blocked'))
    return 'Popup was blocked by the browser. Please allow popups and try again.';
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request'))
    return 'Google sign-in was cancelled.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Invalid email or password.';
  if (code.includes('email-already-in-use'))
    return 'This email is already registered — try logging in instead.';
  if (code.includes('weak-password'))
    return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email'))
    return 'Please enter a valid email address.';
  if (code.includes('too-many-requests'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('network-request-failed'))
    return 'Network error. Check your internet connection.';
  return msg.replace('Firebase:', '').replace(/\(auth.*\)\.?/, '').trim() || 'Something went wrong. Please try again.';
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already signed in, skip the login screen.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) navigate('/feed'); });
    return unsub;
  }, [navigate]);

  const go = () => navigate('/feed');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'login') {
        await base44.auth.login({ email: email.trim(), password });
      } else {
        await base44.auth.register({ email: email.trim(), password, full_name: name.trim() });
      }
      go();
    } catch (err) {
      setError(friendlyError(err));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setInfo(''); setLoading(true);
    try { await base44.auth.loginWithGoogle(); go(); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Enter your email above first, then tap “Forgot password”.'); return; }
    try {
      await base44.auth.resetPassword(email.trim());
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) { setError(friendlyError(err)); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-primary tracking-tight mb-1">iTimeYou</div>
          <div className="text-sm text-muted-foreground">ເຊື່ອມຕໍ່ · ແບ່ງປັນ · ສຳຜັດ</div>
          <div className="text-xs text-muted-foreground">Connect · Share · Experience Laos</div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex mb-6 bg-muted rounded-xl p-1">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>

            {error && <div className="text-red-600 dark:text-red-400 text-xs leading-relaxed bg-red-50 dark:bg-red-950/20 rounded-lg py-2.5 px-3">{error}</div>}
            {info && <div className="text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed bg-emerald-50 dark:bg-emerald-950/20 rounded-lg py-2.5 px-3">{info}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity mt-1">
              {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>

            {mode === 'login' && (
              <button type="button" onClick={handleForgot}
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center">
                Forgot password?
              </button>
            )}
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full py-3 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-muted-foreground mt-4 leading-relaxed">
            By continuing you agree to iTimeYou's Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
