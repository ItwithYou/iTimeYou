import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';

export default function PasswordSettings() {
  const { profile, currentUser, t, lang } = useAppContext();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error(lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº•à»‰àº­àº‡àº¡àºµàº¢à»ˆàº²àº‡à»œà»‰àº­àº 6 àº•àº»àº§àº­àº±àºàºªàº­àº™' : 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàºšà»à»ˆàºàº»àº‡àºàº±àº™' : 'New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update password using firebaseClient auth
      await firebaseClient.auth.updateMe({
        password: newPassword,
        currentPassword: currentPassword || undefined
      });

      toast.success(lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº–àº·àºàº­àº±àºšà»€àº”àº”à»àº¥à»‰àº§ âœ…' : 'Password updated successfully âœ…');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Navigate back to profile
      navigate(`/profile/${profile?.id}`);
    } catch (error) {
      toast.error(error.message || (lang === 'lo' ? 'àºšà»à»ˆàºªàº²àº¡àº²àº”àº­àº±àºšà»€àº”àº”àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»„àº”à»‰' : 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">{lang === 'lo' ? 'àº•àº±à»‰àº‡àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Password Settings'}</h1>
      <p className="text-muted-foreground text-sm mb-6">{lang === 'lo' ? 'àºˆàº±àº”àºàº²àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºšàº±àº™àºŠàºµàº‚àº­àº‡àº—à»ˆàº²àº™' : 'Manage your account password'}</p>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div>
            

            
            <div className="relative">
              





              
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              {lang === 'lo' ? 'àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={lang === 'lo' ? 'à»ƒàºªà»ˆàº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ' : 'Enter new password'}
                className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary" />
              
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {lang === 'lo' ? 'àº¢à»ˆàº²àº‡à»œà»‰àº­àº 6 àº•àº»àº§àº­àº±àºàºªàº­àº™' : 'At least 6 characters'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              {lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ' : 'Confirm new password'}
                className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary" />
              
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/profile/${profile?.id}`)}
            className="flex-1 border border-border py-3 rounded-xl font-semibold text-sm hover:bg-muted transition-colors">
            
            {lang === 'lo' ? 'àºàº»àºà»€àº¥àºµàº' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            
            {loading ?
            <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> :

            <>
                <Check size={16} /> {lang === 'lo' ? 'àºšàº±àº™àº—àº¶àº' : 'Save'}
              </>
            }
          </button>
        </div>
      </form>

      {/* Password tips */}
      <div className="mt-6 bg-muted/50 rounded-2xl p-4 border border-border">
        <h3 className="font-semibold text-sm mb-2">{lang === 'lo' ? 'àº„àº³à»àº™àº°àº™àº³àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™' : 'Password Tips'}</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>â€¢ {lang === 'lo' ? 'à»ƒàºŠà»‰àº¢à»ˆàº²àº‡à»œà»‰àº­àº 6 àº•àº»àº§àº­àº±àºàºªàº­àº™' : 'Use at least 6 characters'}</li>
          <li>â€¢ {lang === 'lo' ? 'àº›àº°àºªàº»àº¡àº•àº»àº§àº­àº±àºàºªàº­àº™ à»àº¥àº° àº•àº»àº§à»€àº¥àº' : 'Mix letters and numbers'}</li>
          <li>â€¢ {lang === 'lo' ? 'àº«àº¼àºµàºàº¥à»ˆàº½àº‡àº‚à»à»‰àº¡àº¹àº™àºªà»ˆàº§àº™àº•àº»àº§' : 'Avoid personal information'}</li>
          <li>â€¢ {lang === 'lo' ? 'àºšà»à»ˆà»àºšà»ˆàº‡àº›àº±àº™àºàº±àºšàºœàº¹à»‰àº­àº·à»ˆàº™' : 'Do not share with others'}</li>
        </ul>
      </div>
    </div>);

}