import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { ArrowUp, ArrowDown, Send, ArrowDownLeft, Shield, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import WalletActionModal from '../components/wallet/WalletActionModal';
import AdminWalletRequests from '../components/wallet/AdminWalletRequests';
import { getTotalLakBalance } from '../utils/wallet';

const typeConfig = {
  topup:    { icon: '⬆️', color: 'text-success', sign: '+' },
  received: { icon: '📥', color: 'text-success', sign: '+' },
  withdraw: { icon: '⬇️', color: 'text-destructive', sign: '' },
  payment:  { icon: '🏠', color: 'text-destructive', sign: '' },
  send:     { icon: '📤', color: 'text-destructive', sign: '' },
};

const statusLabelMap = {
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Done',
  rejected: 'Rejected',
};

export default function Wallet() {
  const { profile, currentUser, t, lang, refreshProfile } = useAppContext();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profilesByEmail, setProfilesByEmail] = useState({});
  const [actionType, setActionType] = useState('');
  const [exchangeRates, setExchangeRates] = useState({
    usdBuy: 22072,
    usdSell: 22183,
    usdtBuy: 22072,
    usdtSell: 22183,
    updatedAt: '',
  });
  const lakBalance = profile?.wallet_balance_lak || 0;
  const usdBalance = profile?.wallet_balance_usd || 0;
  const usdtBalance = profile?.wallet_balance_usdt || 0;
  const usdReferenceRate = exchangeRates.usdBuy || 22072;
  const usdtReferenceRate = exchangeRates.usdtBuy || usdReferenceRate;
  const totalLak = getTotalLakBalance(profile, exchangeRates);

  const loadTx = async () => {
    if (currentUser) {
      const mine = await base44.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30);
      setTransactions(mine);
      if (currentUser.role === 'admin') {
        const [allTx, allBookings, allProfiles] = await Promise.all([
          base44.entities.WalletTransaction.list('-created_date', 100),
          base44.entities.Booking.list('-created_date', 100),
          base44.entities.UserProfile.list('-created_date', 200),
        ]);
        setAllTransactions(allTx);
        setBookings(allBookings);
        const map = {};
        allProfiles.forEach((item) => { map[item.user_email] = `${item.first_name} ${item.last_name}`.trim(); });
        setProfilesByEmail(map);
      }
    }
  };

  useEffect(() => { loadTx(); }, [currentUser]);

  const loadExchangeRates = async () => {
    try {
      const response = await fetch('https://www.bcel.com.la:8083/exchange.php?langid');
      const html = await response.text();

      const findRate = (code) => {
        // Match table row with currency code and extract BUY and SELL rates
        const rowMatch = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?<td[^>]*>.*?${code}[\\s\\S]*?<\\/td>[\\s\\S]*?<td[^>]*>\\s*([0-9,\\.]+)\\s*<\\/td>[\\s\\S]*?<td[^>]*>\\s*([0-9,\\.]+)\\s*<\\/td>`, 'i'));
        if (!rowMatch) return null;
        return {
          buy: Number(rowMatch[1].replace(/,/g, '')),
          sell: Number(rowMatch[2].replace(/,/g, '')),
        };
      };

      const usdRate = findRate('USD');
      // USDT uses same rate as USD since BCEL doesn't list USDT separately
      const usdtRate = usdRate;

      if (usdRate) {
        setExchangeRates({
          usdBuy: usdRate.buy,
          usdSell: usdRate.sell,
          usdtBuy: usdtRate.buy,
          usdtSell: usdtRate.sell,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  useEffect(() => {
    loadExchangeRates();
    const interval = setInterval(loadExchangeRates, 300000);
    return () => clearInterval(interval);
  }, []);

  const requireVerified = () => {
    if (!profile?.is_verified) {
      toast.error(t.needsVerify);
      navigate(`/profile/${profile?.id}`);
      return false;
    }
    return true;
  };


  if (currentUser?.role === 'admin') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold mb-4">{t.walletTitle}</h1>
        <AdminWalletRequests
          currentUser={currentUser}
          transactions={allTransactions}
          bookings={bookings}
          lang={lang}
          onUpdated={() => { refreshProfile(); loadTx(); }}
        />
      </div>
    );
  }

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
      <div className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c6b5f] via-[#09594f] to-[#06483f] p-7 text-white shadow-[0_20px_50px_rgba(4,51,44,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_32%)]" />
        <div className="relative">
          <p className="mb-2 text-[15px] font-semibold text-white/80">{t.balance}</p>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <p className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[30px] break-all">{totalLak.toLocaleString()}</p>
            <span className="pb-1 text-base font-semibold tracking-wide text-white/80 sm:text-lg">LAK</span>
          </div>
          <div className="mb-6">
            <p className="text-base font-bold leading-tight">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-sm text-white/65">{currentUser?.email}</p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0 rounded-[32px] border border-white/15 bg-white/10 px-5 py-4 shadow-inner shadow-black/5 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">LAK</p>
              <p className="mt-1 break-all text-[13px] font-medium leading-[1.55] tracking-[-0.01em] text-white/95 sm:text-[14px]">{lakBalance.toLocaleString()}</p>
            </div>
            <div className="min-w-0 rounded-[32px] border border-white/15 bg-white/10 px-5 py-4 shadow-inner shadow-black/5 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">USD</p>
              <p className="mt-1 break-all text-[13px] font-medium leading-[1.55] tracking-[-0.01em] text-white/95 sm:text-[14px]">{usdBalance.toLocaleString()}</p>
            </div>
            <div className="min-w-0 rounded-[32px] border border-white/15 bg-white/10 px-5 py-4 shadow-inner shadow-black/5 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">USDT</p>
              <p className="mt-1 break-all text-[13px] font-medium leading-[1.55] tracking-[-0.01em] text-white/95 sm:text-[14px]">{usdtBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-7 flex items-center justify-between gap-4 rounded-3xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            <div>
              <p className="font-bold text-white">BCEL live rates</p>
              <p className="mt-0.5 text-white/75">USD Buy {exchangeRates.usdBuy.toLocaleString()} · Sell {exchangeRates.usdSell.toLocaleString()}</p>
              <p className="text-white/75">USDT Buy {exchangeRates.usdtBuy.toLocaleString()} · Sell {exchangeRates.usdtSell.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { loadExchangeRates(); refreshProfile(); }}
                className="inline-flex items-center gap-1 self-start pt-1 font-bold text-white hover:opacity-80 transition-opacity"
                title="Refresh rates"
              >
                <RefreshCw size={13} />
              </button>
              <a href="https://www.bcel.com.la/bcel/exchange-rate.html?lang=en" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-start pt-1 font-bold text-white underline underline-offset-2">
                BCEL <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: ArrowUp, label: t.topUp, action: () => { if (requireVerified()) setActionType('topup'); } },
              { icon: ArrowDown, label: t.withdraw, action: () => { if (requireVerified()) setActionType('withdraw'); } },
              { icon: Send, label: t.send, action: () => { if (requireVerified()) setActionType('send'); } },
              { icon: ArrowDownLeft, label: t.receive, action: () => { if (requireVerified()) setActionType('receive'); } },
              { icon: RefreshCw, label: lang === 'lo' ? 'ແລກປ່ຽນ' : 'Exchange', action: () => { if (requireVerified()) setActionType('exchange'); } },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="flex flex-col items-center gap-2.5 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/14 backdrop-blur-sm transition-colors hover:bg-white/22">
                  <btn.icon size={22} />
                </div>
                <span className="text-xs font-semibold text-white/90">{btn.label}</span>
              </button>
            ))}
          </div>
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
            <p className={`font-semibold text-[13px] sm:text-[14px] tracking-[-0.02em] leading-tight break-all ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
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
                    <p className="text-xs mt-1 text-muted-foreground">
                      Status: <span className={tx.status === 'rejected' ? 'text-destructive font-semibold' : tx.status === 'approved' || tx.status === 'completed' ? 'text-success font-semibold' : 'text-amber-600 font-semibold'}>{statusLabelMap[tx.status] || tx.status}</span>
                    </p>
                    {tx.reject_reason && (
                      <p className="text-xs text-destructive mt-1">Reason: {tx.reject_reason}</p>
                    )}
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${cfg.color}`}>
                    {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount)} {tx.currency || 'USD'}
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

      {actionType && (
        <WalletActionModal
          type={actionType}
          currentUser={currentUser}
          profile={profile}
          lang={lang}
          onClose={() => setActionType('')}
          onSubmitted={() => { refreshProfile(); loadTx(); }}
        />
      )}
    </div>
  );
}