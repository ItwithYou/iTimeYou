import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { ArrowUp, ArrowDown, Send, ArrowDownLeft, Shield, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import WalletActionModal from '../components/wallet/WalletActionModal';
import AdminWalletRequests from '../components/wallet/AdminWalletRequests';
import { getTotalLakBalance } from '../utils/wallet';
import { formatTimestampDMY } from '../utils/dateUtils';

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
    usdBuy: 0,
    usdSell: 0,
    usdtBuy: 0,
    usdtSell: 0,
    updatedAt: '',
  });
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const lakBalance = profile?.wallet_balance_lak || 0;
  const usdBalance = profile?.wallet_balance_usd || 0;
  const usdtBalance = profile?.wallet_balance_usdt || 0;
  const usdReferenceRate = exchangeRates.usdBuy || 22072;
  const usdtReferenceRate = exchangeRates.usdtBuy || usdReferenceRate;
  const totalLak = getTotalLakBalance(profile, exchangeRates);

  const loadTx = async () => {
    if (currentUser) {
      const mine = await firebaseClient.entities.WalletTransaction.filter({ user_email: currentUser.email }, '-created_date', 30);
      setTransactions(mine);
      if (currentUser.role === 'admin') {
        const [allTx, allBookings, allProfiles] = await Promise.all([
          firebaseClient.entities.WalletTransaction.list('-created_date', 100),
          firebaseClient.entities.Booking.list('-created_date', 100),
          firebaseClient.entities.UserProfile.list('-created_date', 200),
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
      const items = await firebaseClient.entities.ExchangeRateSettings.list('-updated_date', 1);
      const item = items[0];
      if (item) {
        setExchangeRates({
          usdBuy: item.usd_buy || 0,
          usdSell: item.usd_sell || 0,
          usdtBuy: item.usdt_buy || item.usd_buy || 0,
          usdtSell: item.usdt_sell || item.usd_sell || 0,
          updatedAt: item.updated_date || '',
        });
        setRatesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const requireVerified = () => {
    if (!profile?.is_verified && !profile?.is_pro) {
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

  const actions = [
    { icon: ArrowUp, label: t.topUp, key: 'topup' },
    { icon: ArrowDown, label: t.withdraw, key: 'withdraw' },
    { icon: Send, label: t.send, key: 'send' },
    { icon: ArrowDownLeft, label: t.receive, key: 'receive' },
    { icon: RefreshCw, label: lang === 'lo' ? 'ແລກປ່ຽນ' : 'Exchange', key: 'exchange' },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-4">{t.walletTitle}</h1>

      {/* Verification banner */}
      {(!profile?.is_verified && !profile?.is_pro) && (
        <Link to={`/profile/${profile?.id}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 group hover:bg-amber-100 transition-colors">
          <Shield size={22} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{lang === 'lo' ? 'ຢືນຢັນຕົວຕົນເພື່ອໃຊ້ງານ' : 'Verify identity to use wallet'}</p>
            <p className="text-xs text-amber-600">{t.needsVerify}</p>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </Link>
      )}

      {/* Premium wallet card */}
      <div className="relative mb-6 overflow-hidden rounded-[30px] p-6 text-white shadow-[0_30px_80px_-24px_rgba(2,30,26,0.85)] bg-gradient-to-br from-[#0d4339] via-[#0a2e2a] to-[#05201d]">
        {/* gold inner hairline + glows */}
        <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-amber-200/15" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-400/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-amber-300/10 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_42%)]" />

        <div className="relative">
          {/* Brand row */}
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[19px] font-black tracking-tight">
              <span className="text-amber-300">i</span>TimeYou
            </span>
          </div>

          {/* Chip + balance label */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_10px_rgba(217,119,6,0.3)] ring-1 ring-amber-500/50">
              <span className="text-[10px] font-extrabold tracking-widest text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                iTimeYou
              </span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">{t.balance}</p>
          </div>

          {/* Big balance number — premium tabular font */}
          <div className="flex items-end gap-2">
            <span className="wallet-num bg-gradient-to-r from-white via-white to-amber-100 bg-clip-text text-[44px] font-extrabold leading-none text-transparent break-all">
              {totalLak.toLocaleString()}
            </span>
            <span className="pb-2 text-sm font-bold text-amber-200/80">LAK</span>
          </div>


          {/* Owner + masked number */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/85">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="wallet-num text-[12px] tracking-[0.28em] text-white/35">•••• 2026</p>
          </div>

          {/* Currency pills */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { code: 'LAK', val: lakBalance },
              { code: 'USD', val: usdBalance },
              { code: 'USDT', val: usdtBalance },
            ].map((c) => (
              <div key={c.code} className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.07] px-3.5 py-3 backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200/70">{c.code}</p>
                <p className="wallet-num mt-1 break-all text-[14px] font-bold leading-tight text-white">{(c.val || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between px-1">
        {actions.map((btn) => (
          <button
            key={btn.key}
            onClick={() => { if (requireVerified()) setActionType(btn.key); }}
            className="group flex flex-col items-center gap-2.5"
          >
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[18px] bg-card border border-border shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-1 group-active:scale-95 group-active:translate-y-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <btn.icon size={20} className="text-emerald-600 relative z-10" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-foreground/80 leading-tight text-center tracking-wide">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Exchange rates strip */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">{lang === 'lo' ? 'ອັດຕາແລກປ່ຽນ' : 'Exchange Rates'}</p>
          {ratesLoaded ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              USD {exchangeRates.usdBuy.toLocaleString()} · USDT {exchangeRates.usdtBuy.toLocaleString()}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{lang === 'lo' ? 'ກຳລັງໂຫລດ...' : 'Loading...'}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => { loadExchangeRates(); refreshProfile(); }} className="text-muted-foreground hover:text-primary transition-colors" title="Refresh rates">
            <RefreshCw size={15} />
          </button>
          <a href="https://www.bcel.com.la/bcel/exchange-rate.html?lang=en" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
            BCEL <ExternalLink size={12} />
          </a>
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
            <p className={`wallet-num font-bold text-[13px] sm:text-[14px] tracking-[-0.02em] leading-tight break-all ${stat.color}`}>{stat.value}</p>
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
                    <p className="text-xs text-muted-foreground">{formatTimestampDMY(tx.created_date)}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Status: <span className={tx.status === 'rejected' ? 'text-destructive font-semibold' : tx.status === 'approved' || tx.status === 'completed' ? 'text-success font-semibold' : 'text-amber-600 font-semibold'}>{statusLabelMap[tx.status] || tx.status}</span>
                    </p>
                    {tx.reject_reason && (
                      <p className="text-xs text-destructive mt-1">Reason: {tx.reject_reason}</p>
                    )}
                  </div>
                  <span className={`wallet-num font-bold text-sm flex-shrink-0 ${cfg.color}`}>
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