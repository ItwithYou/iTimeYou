import { useState } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';

export default function PasswordSetupForm({ onSuccess, onCancel, lang }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error(lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº•à»‰àº­àº‡àº¡àºµàº¢à»ˆàº²àº‡à»œà»‰àº­àº 6 àº•àº»àº§àº­àº±àºàºªàº­àº™' : 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºšà»à»ˆàºàº»àº‡àºàº±àº™' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      await firebaseClient.auth.updateMe({ password });
      onSuccess();
    } catch (error) {
      toast.error(error.message || (lang === 'lo' ? 'àºšà»à»ˆàºªàº²àº¡àº²àº”àº•àº±à»‰àº‡àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»„àº”à»‰' : 'Failed to set password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          {lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Password'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'lo' ? 'à»ƒàºªà»ˆàº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Create a password'}
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
          {lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Confirm Password'}
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Confirm your password'}
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
        {lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºˆàº°àº–àº·àºà»€àºàº±àºšà»„àº§à»‰àº¢à»ˆàº²àº‡àº›àº­àº”à»„àºž à»àº¥àº° à»ƒàºŠà»‰àºªàº³àº¥àº±àºšàºàº²àº™à»€àº‚àº»à»‰àº²àºªàº¹à»ˆàº„àº±à»‰àº‡àº•à»à»ˆà»„àº›' : 'Your password will be stored securely and used for future logins'}
      </p>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-border py-2.5 rounded-xl font-semibold text-sm hover:bg-muted transition-colors"
        >
          {lang === 'lo' ? 'àº‚à»‰àº²àº¡' : 'Skip'}
        </button>
        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={16} /> {lang === 'lo' ? 'àº•àº±à»‰àº‡àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Set Password'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}