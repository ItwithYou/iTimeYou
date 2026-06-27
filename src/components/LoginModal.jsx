import { useState, useEffect, useRef } from 'react';
import { base44, auth } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, User, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

function friendlyError(err) {
  console.error('Auth error:', err?.code, err?.message, err);
  const code = err?.code || '';
  const msg = err?.message || '';
  if (code.includes('api-key-not-valid')) return 'App is misconfigured (invalid Firebase API key).';
  if (code.includes('configuration-not-found')) return 'Sign-in is not configured yet.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Invalid credentials.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment.';
  if (code.includes('invalid-phone-number')) return 'Please enter a valid phone number (e.g. +856...)';
  if (code.includes('invalid-verification-code')) return 'Invalid code. Please check and try again.';
  if (code.includes('operation-not-allowed')) return 'Phone Sign-in is not enabled in Firebase Authentication.';
  const cleaned = msg.replace('Firebase:', '').replace(/\(auth.*\)\.?/, '').trim();
  if (!cleaned || cleaned.toLowerCase() === 'error') return code || 'Something went wrong. Please try again.';
  return cleaned;
}

const COUNTRY_CODES = [
  { code: '+856', label: '🇱🇦' },
  { code: '+66', label: '🇹🇭' },
  { code: '+84', label: '🇻🇳' },
  { code: '+855', label: '🇰🇭' },
  { code: '+86', label: '🇨🇳' },
  { code: '+1', label: '🇺🇸' },
  { code: '+44', label: '🇬🇧' },
];

export default function LoginModal({ isOpen, onClose }) {
  const [step, setStep] = useState('initial'); // 'initial', 'phone', 'otp', 'username'
  const [countryCode, setCountryCode] = useState('+856');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      if (u && isOpen) {
        if (step === 'initial') go();
      }
    });
    return unsub;
  }, [navigate, step, isOpen]);

  const go = () => {
    onClose?.();
    if (location.pathname === '/') navigate('/feed');
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { 
      await base44.auth.loginWithGoogle(); 
      go();
    } catch (err) { 
      setError(friendlyError(err)); 
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      const appVerifier = base44.auth.setupRecaptcha('recaptcha-container');
      const confResult = await base44.auth.loginWithPhone(fullNumber, appVerifier);
      setConfirmationResult(confResult);
      setStep('otp');
    } catch (err) {
      setError(friendlyError(err));
      // Reset recaptcha if error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const userObj = await base44.auth.confirmOTP(confirmationResult, otp);
      
      // Check if user has a name, if not, prompt for it
      const dbUser = await base44.entities.User.get(userObj.id);
      if (!dbUser?.full_name || dbUser.full_name === 'User' || dbUser.full_name.includes('@')) {
        setStep('username');
        setLoading(false);
      } else {
        go();
      }
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Please enter a name'); return; }
    setError(''); setLoading(true);
    try {
      await base44.auth.updateMe({ full_name: fullName.trim() });
      await base44.entities.User.update(auth.currentUser.uid, { full_name: fullName.trim() });
      go();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md px-4 py-10 overflow-y-auto">
      
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tiffany/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 animate-in zoom-in-95 fade-in duration-300">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-md">
          <X size={20} />
        </button>
        <div className="bg-card/60 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-primary/10 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

          <div className="text-center mb-8">
            <div className="text-5xl font-black text-primary tracking-tight mb-1">iTimeYou</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-2">Log In or Sign Up</div>
          </div>

          {step === 'initial' && (
            <div className="space-y-4">
              <button onClick={handleGoogle} disabled={loading}
                className="w-full py-3.5 bg-background border border-border rounded-2xl text-sm font-bold hover:bg-muted transition-all flex items-center justify-center gap-3 disabled:opacity-60 group shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <button onClick={() => setStep('phone')} disabled={loading}
                className="w-full py-3.5 bg-foreground text-background rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-lg shadow-foreground/10">
                <Phone className="w-5 h-5" />
                Continue with Phone
              </button>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep('initial')} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-bold text-sm">Enter your phone number</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">We'll send you a code to verify your identity.</p>
              
              <div className="flex gap-2">
                <select 
                  value={countryCode} 
                  onChange={e => setCountryCode(e.target.value)}
                  className="px-2 py-3.5 rounded-2xl border border-border bg-background/50 text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium min-w-[70px] text-center"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="20 xxxx xxxx" required autoFocus
                  className="flex-1 px-4 py-3.5 rounded-2xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium tracking-wide" />
              </div>
              
              <div id="recaptcha-container" className="my-2 flex justify-center"></div>

              {error && <div className="text-red-500 text-xs font-medium px-1">{error}</div>}

              <button type="submit" disabled={loading || !phoneNumber}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyCode} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-bold text-sm">Verify your number</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">Enter the 6-digit code sent to <span className="font-medium text-foreground">{phoneNumber}</span></p>
              
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="000000" required autoFocus maxLength={6}
                className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background/50 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold" />

              {error && <div className="text-red-500 text-xs font-medium px-1">{error}</div>}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {step === 'username' && (
            <form onSubmit={handleSaveUsername} className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={28} />
                </div>
              </div>
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">Welcome to iTimeYou!</h3>
                <p className="text-xs text-muted-foreground mt-1">What should other users call you?</p>
              </div>
              
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Enter your username" required autoFocus
                className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-center" />

              {error && <div className="text-red-500 text-xs font-medium px-1">{error}</div>}

              <button type="submit" disabled={loading || !fullName}
                className="w-full py-3.5 bg-foreground text-background rounded-2xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity shadow-lg shadow-foreground/20">
                {loading ? 'Saving...' : 'Start Exploring'}
              </button>
            </form>
          )}

        </div>
        
        {step === 'initial' && (
          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed font-medium px-4">
            By continuing, you agree to iTimeYou's Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}
