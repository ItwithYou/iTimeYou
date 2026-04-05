import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowUp, ArrowDown, Send, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function Wallet() {
  const { profile, currentUser, t, lang, refreshProfile } = useOutletContext();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (currentUser) {
      base44.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30).then(setTransactions);
    }
  }, [currentUser]);

  const requireVerified = () => {
    if (!profile?.is_verified) {
      toast.error(t.needsVerify);
      navigate(`/profile/${profile?.id}`);
      return false;
    }
    return true;
  };

  const handleTopUp = async () => {
    if (!requireVerified()) return;
    await base44.entities.UserProfile.update(profile.id, {
      wallet_balance: (profile.wallet_balance || 0) + 500,
    });
    await base44.entities.WalletTransaction.create({
      user_email: currentUser.email,
      description: 'Top up',
      description_lao: 'ເຕີມເງິນ',
      amount: 500,
      type: 'topup',
    });
    refreshProfile();
    base44.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30).then(setTransactions);
    toast.success(t.topupSuccess + ' +$500');
  };

  const handleWithdraw = async () => {
    if (!requireVerified()) return;
    if ((profile?.wallet_balance || 0) < 100) { toast.error(t.insufficientBalance); return; }
    await base44.entities.UserProfile.update(profile.id, {
      wallet_balance: (profile.wallet_balance || 0) - 100,
    });
    await base44.entities.WalletTransaction.create({
      user_email: currentUser.email,
      description: 'Withdrawal',
      description_lao: 'ຖອນເງິນ',
      amount: -100,
      type: 'withdraw',
    });
    refreshProfile();
    base44.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30).then(setTransactions);
    toast.success(t.withdrawSuccess + ' -$100');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">💰 {t.walletTitle}</h1>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-primary-foreground relative overflow-hidden mb-6">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <p className="text-sm opacity-80">{t.balance}</p>
        <p className="text-4xl font-extrabold mt-1">${(profile?.wallet_balance || 0).toLocaleString()}</p>
        <div className="flex gap-3 mt-6 flex-wrap">
          <button onClick={handleTopUp} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
            <ArrowUp size={16} /> {t.topUp}
          </button>
          <button onClick={handleWithdraw} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
            <ArrowDown size={16} /> {t.withdraw}
          </button>
          <button onClick={() => { if (requireVerified()) toast.info(lang === 'lo' ? 'ເລືອກຜູ້ຮັບ' : 'Select a recipient'); }} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
            <Send size={16} /> {t.send}
          </button>
          <button onClick={() => { if (requireVerified()) toast.info(lang === 'lo' ? 'ແບ່ງປັນ QR' : 'Share your QR code'); }} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
            <ArrowDownLeft size={16} /> {t.receive}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-semibold mb-4">{t.history}</h3>
        <div className="space-y-1">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">
                  {lang === 'lo' && tx.description_lao ? tx.description_lao : tx.description}
                </p>
                <p className="text-xs text-muted-foreground">{moment(tx.created_date).format('MMM D, YYYY')}</p>
              </div>
              <span className={`font-semibold text-sm ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}