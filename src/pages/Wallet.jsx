import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
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
      const items = await base44.entities.ExchangeRateSettings.list('-updated_date', 1);
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
      <div className="relative mb-4 overflow-hidden rounded-[26px] p-6 text-white shadow-[0_24px_60px_-12px_rgba(4,51,44,0.45)] bg-gradient-to-br from-[#0e8273] via-[#0a5f54] to-[#06352f]">
        {/* decorative glows */}
        <div className="pointer-events-none absolute -top-16 -right-12 h-52 w-52 rounded-full bg-[#23e8cc]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)]" />

        <div className="relative">
          {/* Top row: brand + chip */}
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* EMV-style chip */}
              <div className="grid h-8 w-10 place-items-center rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner">
                <div className="h-3.5 w-5 rounded-[3px] border border-amber-700/30" />
              </div>
              <span className="text-[15px] font-extrabold tracking-tight">iTimeYou</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Wallet</span>
          </div>

          {/* Balance */}
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/55">{t.balance}</p>
          <div className="mt-1.5 flex items-end gap-2">
            <p className="text-[36px] font-bold leading-none tracking-tight break-all">{totalLak.toLocaleString()}</p>
            <span className="pb-1.5 text-sm font-semibold text-white/65">LAK</span>
          </div>

          {/* Owner */}
          <p className="mt-5 mb-6 text-[15px] font-semibold tracking-wide text-white/90">
            {profile?.first_name} {profile?.last_name}
          </p>

          {/* Currency pills */}
          <div className="mb-2 grid grid-cols-3 gap-2.5">
            {[
              { code: 'LAK', val: lakBalance },
              { code: 'USD', val: usdBalance },
              { code: 'USDT', val: usdtBalance },
            ].map((c) => (
              <div key={c.code} className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">{c.code}</p>
                <p className="mt-1 break-all text-[13px] font-semibold leading-tight text-white/95">{(c.val || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 grid grid-cols-5 gap-2">
        {actions.map((btn) => (
          <button
            key={btn.key}
            onClick={() => { if (requireVerified()) setActionType(btn.key); }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <btn.icon size={18} />
            </div>
            <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{btn.label}</span>
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
                    <p className="text-xs text-muted-foreground">{formatTimestampDMY(tx.created_date)}</p>
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