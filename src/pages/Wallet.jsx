import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { ArrowUp, ArrowDown, Send, ArrowDownLeft, Shield, ChevronRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import WalletActionModal from '../components/wallet/WalletActionModal';
import AdminWalletRequests from '../components/wallet/AdminWalletRequests';

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
  const totalLak = lakBalance + (usdBalance * usdReferenceRate) + (usdtBalance * usdtReferenceRate);

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

  useEffect(() => {
    const loadExchangeRates = async () => {
      const response = await fetch('https://www.bcel.com.la:8083/exchange.php?langid');
      const html = await response.text();

      const findRate = (code) => {
        const rowMatch = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?<td[^>]*>\\s*${code}\\s*<\\/td>[\\s\\S]*?<td[^>]*>\\s*([0-9,\\.]+)\\s*<\\/td>[\\s\\S]*?<td[^>]*>\\s*([0-9,\\.]+)\\s*<\\/td>`, 'i'));
        if (!rowMatch) return null;
        return {
          buy: Number(rowMatch[1].replace(/,/g, '')),
          sell: Number(rowMatch[2].replace(/,/g, '')),
        };
      };

      const usdRate = findRate('USD');
      const usdtRate = findRate('USDT') || usdRate;

      setExchangeRates({
        usdBuy: usdRate?.buy || 22072,
        usdSell: usdRate?.sell || 22183,
        usdtBuy: usdtRate?.buy || usdRate?.buy || 22072,
        usdtSell: usdtRate?.sell || usdRate?.sell || 22183,
        updatedAt: new Date().toISOString(),
      });
    };

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
          profilesByEmail={profilesByEmail}
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
      <div className="relative bg-gradient-to-br from-[#1a6b62] via-[#134f44] to-[#0d3d2e] rounded-3xl p-6 text-white overflow-hidden mb-5 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/6" />
        <p className="text-sm opacity-75 font-medium mb-1">{t.balance}</p>
        <div className="mb-1 max-w-full overflow-hidden">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight break-words whitespace-normal">
            {totalLak.toLocaleString()} <span className="text-xl sm:text-2xl font-bold opacity-90">LAK</span>
          </p>
        </div>
        <div className="mb-4">
          <p className="text-xs opacity-80 font-semibold">{profile?.first_name} {profile?.last_name}</p>
          <p className="text-xs opacity-60">{currentUser?.email}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
            <p className="text-[10px] opacity-70">LAK</p>
            <p className="text-sm font-bold">{lakBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
            <p className="text-[10px] opacity-70">USD</p>
            <p className="text-sm font-bold">{usdBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
            <p className="text-[10px] opacity-70">USDT</p>
            <p className="text-sm font-bold">{usdtBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
            <p className="text-[10px] opacity-70">Total</p>
            <p className="text-sm font-bold">{totalLak.toLocaleString()} LAK</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-6 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 text-xs">
          <div>
            <p className="font-semibold">BCEL live rates</p>
            <p className="opacity-75">USD Buy {exchangeRates.usdBuy.toLocaleString()} · Sell {exchangeRates.usdSell.toLocaleString()}</p>
            <p className="opacity-75">USDT Buy {exchangeRates.usdtBuy.toLocaleString()} · Sell {exchangeRates.usdtSell.toLocaleString()}</p>
          </div>
          <a href="https://www.bcel.com.la/bcel/exchange-rate.html?lang=en" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            BCEL <ExternalLink size={12} />
          </a>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: ArrowUp, label: t.topUp, action: () => { if (requireVerified()) setActionType('topup'); } },
            { icon: ArrowDown, label: t.withdraw, action: () => { if (requireVerified()) setActionType('withdraw'); } },
            { icon: Send, label: t.send, action: () => { if (requireVerified()) setActionType('send'); } },
            { icon: ArrowDownLeft, label: t.receive, action: () => { if (requireVerified()) setActionType('receive'); } },
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