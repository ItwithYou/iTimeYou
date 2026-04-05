import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowUp, ArrowDown, Send, ArrowDownLeft, Shield, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const typeConfig = {
  topup:    { icon: '⬆️', color: 'text-success', sign: '+' },
  received: { icon: '📥', color: 'text-success', sign: '+' },
  withdraw: { icon: '⬇️', color: 'text-destructive', sign: '' },
  payment:  { icon: '🏠', color: 'text-destructive', sign: '' },
  send:     { icon: '📤', color: 'text-destructive', sign: '' },
};

export default function Wallet() {
  const { profile, currentUser, t, lang, refreshProfile } = useOutletContext();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  const loadTx = () => {
    if (currentUser) {
      base44.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30).then(setTransactions);
    }
  };

  useEffect(() => { loadTx(); }, [currentUser]);

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
    await base44.entities.UserProfile.update(profile.id, { wallet_balance: (profile.wallet_balance || 0) + 500 });
    await base44.entities.WalletTransaction.create({ user_email: currentUser.email, description: 'Top up $500', description_lao: 'ເຕີມເງິນ $500', amount: 500, type: 'topup' });
    refreshProfile(); loadTx();
    toast.success(t.topupSuccess + ' +$500');
  };

  const handleWithdraw = async () => {
    if (!requireVerified()) return;
    if ((profile?.wallet_balance || 0) < 100) { toast.error(t.insufficientBalance); return; }
    await base44.entities.UserProfile.update(profile.id, { wallet_balance: (profile.wallet_balance || 0) - 100 });
    await base44.entities.WalletTransaction.create({ user_email: currentUser.email, description: 'Withdrawal $100', description_lao: 'ຖອນເງິນ $100', amount: -100, type: 'withdraw' });
    refreshProfile(); loadTx();
    toast.success(t.withdrawSuccess + ' -$100');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-4">{t.walletTitle}</h1>

      {/* Verification banner */}
      {!profile?.is_verified && (
        <Link to={`/profile/${profile?.id}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 group hover:bg-amber-100 transition-colors">
          <Shield size={22} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{lang === 'lo' ? 'ຢືນຢັນຕົວຕົນເພື່ອໃຊ້ງານ' : 'Verify identity to use wallet'}</p>
            <p className="text-xs text-amber-600">{t.needsVerify}</p>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </Link>
      )}

      {/* Balance card */}
      <div className="relative bg-gradient-to-br from-[#0ABAB5] via-[#08A8A4] to-[#2E7D5E] rounded-3xl p-6 text-white overflow-hidden mb-5 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/6" />
        <p className="text-sm opacity-75 font-medium mb-1">{t.balance}</p>
        <p className="text-5xl font-black tracking-tight mb-1">${(profile?.wallet_balance || 0).toLocaleString()}</p>
        <p className="text-xs opacity-60 mb-6">{currentUser?.email}</p>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: ArrowUp, label: t.topUp, action: handleTopUp },
            { icon: ArrowDown, label: t.withdraw, action: handleWithdraw },
            { icon: Send, label: t.send, action: () => { if (requireVerified()) toast.info(lang === 'lo' ? 'ເລືອກຜູ້ຮັບ' : 'Select recipient'); } },
            { icon: ArrowDownLeft, label: t.receive, action: () => { if (requireVerified()) toast.info(lang === 'lo' ? 'ແບ່ງປັນ QR' : 'Share QR'); } },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/20">
                <btn.icon size={20} />
              </div>
              <span className="text-[10px] font-semibold opacity-85 text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: lang === 'lo' ? 'ການໄຫຼເຂົ້າ' : 'Money In', value: `+$${transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)}`, color: 'text-success' },
          { label: lang === 'lo' ? 'ການໄຫຼອອກ' : 'Money Out', value: `-$${Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))}`, color: 'text-destructive' },
          { label: lang === 'lo' ? 'ທຸລະກຳ' : 'Transactions', value: transactions.length, color: 'text-foreground' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-3 text-center border border-border shadow-sm">
            <p className={`font-bold text-base ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm">{t.history}</h3>
        </div>
        {transactions.length > 0 ? (
          <div className="divide-y divide-border">
            {transactions.map(tx => {
              const cfg = typeConfig[tx.type] || { icon: '💱', color: 'text-foreground', sign: '' };
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {lang === 'lo' && tx.description_lao ? tx.description_lao : tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{moment(tx.created_date).fromNow()}</p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${cfg.color}`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}