import { useState, useEffect } from 'react';
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
      <div className="relative mb-6 overflow-hidden rounded-[30px] p-6 text-white shadow-[0_30px_80px_-24px_rgba(10,186,181,0.65)] bg-gradient-to-br from-[#12E2DC] via-[#0ABAB5] to-[#088F8A]">
        {/* Subtle inner hairline + glows */}
        <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/20" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-white/10 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_42%)]" />

        <div className="relative">
          {/* Brand row */}
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[14px] font-light tracking-[0.2em] uppercase text-white drop-shadow-sm opacity-90">
              iTimeYou
            </span>
          </div>

          {/* Chip + balance label */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-6 items-center justify-center rounded bg-gradient-to-br from-white/90 to-white/70 px-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
              <span className="text-[9px] font-medium tracking-widest text-[#088F8A] uppercase">
                iTimeYou
              </span>
            </div>
            <p className="text-[10px] font-normal uppercase tracking-[0.25em] text-white/60">{t.balance}</p>
          </div>

          {/* Big balance number — premium tabular font */}
          <div className="flex items-end gap-1.5 mb-1">
            <span className="wallet-num bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-[34px] sm:text-[42px] font-light leading-none text-transparent break-all drop-shadow-sm tracking-tight">
              {totalLak.toLocaleString()}
            </span>
            <span className="pb-1.5 text-[10px] sm:text-xs font-medium text-white/80 tracking-widest">LAK</span>
          </div>


          {/* Owner + masked number */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[11px] font-normal uppercase tracking-[0.15em] text-white/80">
              {profile?.first_name} {profile?.last_name}
            </p>
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
        {actions.map((btn) => (
          <button
            key={btn.key}
            onClick={() => { if (requireVerified()) setActionType(btn.key); }}
            className="group flex flex-col items-center gap-2"
          >
            <div className="flex h-[52px] w-[52px] sm:h-[60px] sm:w-[60px] items-center justify-center rounded-full bg-gradient-to-b from-card to-muted/30 border border-[#0ABAB5]/20 shadow-[0_4px_12px_-4px_rgba(10,186,181,0.15)] transition-all duration-300 group-hover:shadow-[0_8px_16px_-6px_rgba(10,186,181,0.3)] group-hover:-translate-y-1 group-active:scale-95 group-active:translate-y-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0ABAB5]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <btn.icon size={22} strokeWidth={1.5} className="text-[#0ABAB5] relative z-10 drop-shadow-sm" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-foreground/70 group-hover:text-foreground leading-tight text-center tracking-wide transition-colors">{btn.label}</span>
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