import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { Shield, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import WalletActionModal from '../components/wallet/WalletActionModal';
import AdminWalletRequests from '../components/wallet/AdminWalletRequests';
import { getTotalLakBalance } from '../utils/wallet';
import { formatTimestampDMY } from '../utils/dateUtils';

const typeConfig = {
  topup:    { iconKey: 'topup',    color: 'text-success',     bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  received: { iconKey: 'received', color: 'text-success',     bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  withdraw: { iconKey: 'withdraw', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-900/20' },
  payment:  { iconKey: 'payment',  color: 'text-destructive', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  send:     { iconKey: 'send',     color: 'text-destructive', bg: 'bg-orange-50 dark:bg-orange-900/20' },
};

// Clean minimal SVG icons
const TxIcon = ({ iconKey, className = '' }) => {
  const base = `w-5 h-5 ${className}`;
  if (iconKey === 'topup' || iconKey === 'received')
    return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
  if (iconKey === 'withdraw')
    return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
  if (iconKey === 'send')
    return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
  if (iconKey === 'payment')
    return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>;
  return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM8 12h8M14 9l3 3-3 3"/></svg>;
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
    usdBuy: 0, usdSell: 0,
    thbBuy: 0, thbSell: 0,
    cnyBuy: 0, cnySell: 0,
    updatedAt: '',
  });
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const lakBalance = profile?.wallet_balance_lak || 0;
  const usdBalance = profile?.wallet_balance_usd || 0;
  const thbBalance = profile?.wallet_balance_thb || 0;
  const cnyBalance = profile?.wallet_balance_cny || 0;
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
          thbBuy: item.thb_buy || 0,
          thbSell: item.thb_sell || 0,
          cnyBuy: item.cny_buy || 0,
          cnySell: item.cny_sell || 0,
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

  // Clean minimal SVG action icons
  const actionDefs = [
    {
      key: 'topup',
      label: t.topUp,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>,
    },
    {
      key: 'withdraw',
      label: t.withdraw,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>,
    },
    {
      key: 'send',
      label: t.send,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
    },
    {
      key: 'receive',
      label: t.receive,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2v14"/><path d="M5 10l7 7 7-7"/><path d="M2 20h20"/></svg>,
    },
    {
      key: 'exchange',
      label: lang === 'lo' ? 'ແລກປ່ຽນ' : 'Exchange',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
    },
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
      <div className="relative mb-6 overflow-hidden rounded-[30px] p-6 text-white shadow-[0_30px_80px_-24px_rgba(10,186,181,0.65)] bg-gradient-to-br from-[#12E2DC] via-[#0ABAB5] to-[#088F8A]">
        {/* Subtle inner hairline + glows */}
        <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/20" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-white/10 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_42%)]" />

        <div className="relative">
          {/* Brand row — User Left, Fancy Brand Right */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-2 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm flex-shrink-0">
                <span className="text-[13px] font-medium text-white leading-none">
                  {(profile?.first_name?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] font-light tracking-[0.1em] uppercase text-white/90 max-w-[120px] truncate leading-none mt-0.5">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <span className="text-[18px] font-serif italic tracking-wider text-white drop-shadow-sm opacity-95">
              iTimeYou
            </span>
          </div>

          {/* Balance label */}
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[10px] font-normal uppercase tracking-[0.25em] text-white/60">{t.balance}</p>
          </div>

          {/* Big balance number — premium tabular font */}
          <div className="flex items-end gap-1.5 mb-1">
            <span className="wallet-num text-[28px] sm:text-[34px] font-[200] leading-none text-white/95 break-all tracking-tight drop-shadow-none">
              {totalLak.toLocaleString()}
            </span>
            <span className="pb-1 text-[10px] sm:text-xs font-light text-white/70 tracking-widest">LAK</span>
          </div>


          {/* Masked number only */}
          <div className="mt-6 flex items-center justify-end">
            <p className="wallet-num text-[10px] tracking-[0.3em] text-white/40">•••• 2026</p>
          </div>

          {/* Currency pills */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[
              { code: 'LAK', val: lakBalance },
              { code: 'USD', val: usdBalance },
              { code: 'THB', val: thbBalance },
              { code: 'CNY', val: cnyBalance },
            ].map((c) => (
              <div key={c.code} className="min-w-0 rounded-[14px] border border-white/20 bg-white/[0.08] px-2 py-2.5 backdrop-blur-md">
                <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-white/70">{c.code}</p>
                <p className="wallet-num mt-1 break-all text-[11px] sm:text-[13px] font-light tracking-wide leading-tight text-white drop-shadow-sm">{(c.val || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between px-1">
        {actionDefs.map((btn) => (
          <button
            key={btn.key}
            onClick={() => { if (requireVerified()) setActionType(btn.key); }}
            className="group flex flex-col items-center gap-2"
          >
            <div className="flex h-[52px] w-[52px] sm:h-[58px] sm:w-[58px] items-center justify-center rounded-full bg-card border border-[#0ABAB5]/15 shadow-[0_2px_12px_-4px_rgba(10,186,181,0.2)] transition-all duration-300 group-hover:shadow-[0_6px_18px_-6px_rgba(10,186,181,0.35)] group-hover:-translate-y-1 group-active:scale-95 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0ABAB5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[#0ABAB5] relative z-10">{btn.icon}</span>
            </div>
            <span className="text-[9.5px] sm:text-[10.5px] font-light text-foreground/60 group-hover:text-foreground leading-tight text-center tracking-wider transition-colors">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Exchange rates strip */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">{lang === 'lo' ? 'ອັດຕາແລກປ່ຽນ' : 'Exchange Rates'}</p>
          {ratesLoaded ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              USD {exchangeRates.usdBuy.toLocaleString()} · THB {exchangeRates.thbBuy.toLocaleString()} · CNY {exchangeRates.cnyBuy.toLocaleString()}
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
                <div key={tx.id} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg || 'bg-muted'}`}>
                    <TxIcon iconKey={cfg.iconKey || 'send'} className={cfg.color.replace('text-success', 'text-emerald-600 dark:text-emerald-400').replace('text-destructive', 'text-rose-500')} />
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