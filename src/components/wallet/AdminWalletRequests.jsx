import { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const adminTabs = [
  { key: 'topup', label: 'Popup' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'send', label: 'Send' },
  { key: 'receive', label: 'Recieve' },
  { key: 'transactions', label: 'Transaction' },
];

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {status === 'approved' || status === 'completed' ? 'Success' : status === 'rejected' ? 'Reject' : 'Pending'}
    </span>
  );
}

function RequestCard({ tx, lang, onApprove, onReject }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm">ID: {tx.id}</p>
          <p className="text-sm font-semibold break-all">{tx.user_email}</p>
          <p className="text-xs text-muted-foreground">{tx.request_kind} · {Math.abs(tx.amount)} {tx.currency || 'USD'}</p>
          {tx.bank_name && <p className="text-xs text-muted-foreground">{tx.bank_name} · {tx.account_number}</p>}
          {tx.counterparty_email && <p className="text-xs text-muted-foreground break-all">{lang === 'lo' ? 'ຜູ້ກ່ຽວຂ້ອງ' : 'Counterparty'}: {tx.counterparty_email}</p>}
        </div>
        <StatusBadge status={tx.status} />
      </div>

      {tx.payment_screenshot_url ? (
        <a href={tx.payment_screenshot_url} target="_blank" rel="noreferrer" className="block">
          <img src={tx.payment_screenshot_url} alt="proof" className="w-full h-44 rounded-xl object-cover border border-border" />
        </a>
      ) : (
        <div className="h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
          No proof attached
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onApprove(tx)} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold">Approve</button>
        <button onClick={() => onReject(tx)} className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-semibold">Reject</button>
      </div>
    </div>
  );
}

function TransactionRow({ tx, lang }) {
  return (
    <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <p className="font-bold text-sm">ID: {tx.id}</p>
        <p className="text-sm font-semibold break-all">{lang === 'lo' && tx.description_lao ? tx.description_lao : tx.description}</p>
        <p className="text-xs text-muted-foreground break-all">{tx.user_email}</p>
        <p className="text-xs text-muted-foreground">{tx.request_kind || tx.type} · {Math.abs(tx.amount)} {tx.currency || 'USD'}</p>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <StatusBadge status={tx.status} />
      </div>
    </div>
  );
}

export default function AdminWalletRequests({ currentUser, transactions, onUpdated, lang }) {
  const [activeTab, setActiveTab] = useState('topup');
  const [transactionFilter, setTransactionFilter] = useState('all');

  const pendingTopups = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'topup');
  const pendingWithdraws = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'withdraw');
  const pendingSends = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'send');
  const pendingReceives = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'receive');

  const filteredTransactions = useMemo(() => {
    const base = transactions.filter((tx) => tx.status === 'approved' || tx.status === 'completed' || tx.status === 'rejected');
    if (transactionFilter === 'all') return base;
    return base.filter((tx) => (tx.request_kind || tx.type) === transactionFilter);
  }, [transactions, transactionFilter]);

  if (currentUser?.role !== 'admin') return null;

  const approveTransaction = async (tx) => {
    const targetProfiles = await base44.entities.UserProfile.filter({ user_email: tx.user_email });
    const targetProfile = targetProfiles[0];
    if (!targetProfile) return;

    if (tx.request_kind === 'topup' || tx.request_kind === 'receive') {
      await base44.entities.UserProfile.update(targetProfile.id, {
        wallet_balance: (targetProfile.wallet_balance || 0) + Math.abs(tx.amount),
        wallet_currency: tx.currency || targetProfile.wallet_currency || 'USD',
      });
    }

    if (tx.request_kind === 'withdraw') {
      if ((targetProfile.wallet_balance || 0) < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, {
        wallet_balance: (targetProfile.wallet_balance || 0) - Math.abs(tx.amount),
      });
    }

    if (tx.request_kind === 'send') {
      if ((targetProfile.wallet_balance || 0) < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, {
        wallet_balance: (targetProfile.wallet_balance || 0) - Math.abs(tx.amount),
      });
      if (tx.counterparty_email) {
        const receiverProfiles = await base44.entities.UserProfile.filter({ user_email: tx.counterparty_email });
        const receiver = receiverProfiles[0];
        if (receiver) {
          await base44.entities.UserProfile.update(receiver.id, {
            wallet_balance: (receiver.wallet_balance || 0) + Math.abs(tx.amount),
            wallet_currency: tx.currency || receiver.wallet_currency || 'USD',
          });
          await base44.entities.WalletTransaction.create({
            user_email: receiver.user_email,
            description: `Received from ${tx.user_email}`,
            description_lao: `ຮັບຈາກ ${tx.user_email}`,
            amount: Math.abs(tx.amount),
            currency: tx.currency || 'USD',
            type: 'received',
            status: 'completed',
            request_kind: 'receive',
            counterparty_email: tx.user_email,
          });
        }
      }
    }

    await base44.entities.WalletTransaction.update(tx.id, { status: 'approved' });
    await base44.entities.Notification.create({
      user_email: tx.user_email,
      type: '✅',
      text: `Your ${tx.request_kind} request was approved`,
      text_lao: `ຄຳຂໍ ${tx.request_kind} ຂອງທ່ານໄດ້ຖືກອະນຸມັດ`,
    });
    onUpdated?.();
  };

  const rejectTransaction = async (tx) => {
    await base44.entities.WalletTransaction.update(tx.id, { status: 'rejected' });
    await base44.entities.Notification.create({
      user_email: tx.user_email,
      type: '❌',
      text: `Your ${tx.request_kind} request was rejected`,
      text_lao: `ຄຳຂໍ ${tx.request_kind} ຂອງທ່ານຖືກປະຕິເສດ`,
    });
    onUpdated?.();
  };

  const currentList = activeTab === 'topup'
    ? pendingTopups
    : activeTab === 'withdraw'
    ? pendingWithdraws
    : activeTab === 'send'
    ? pendingSends
    : pendingReceives;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {adminTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeTab === tab.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'transactions' ? (
        currentList.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">No requests</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentList.map((tx) => (
              <RequestCard key={tx.id} tx={tx} lang={lang} onApprove={approveTransaction} onReject={rejectTransaction} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="font-bold text-sm">All Transactions</h3>
            <select value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} className="border border-border rounded-xl px-3 py-2 text-sm bg-card">
              <option value="all">All types</option>
              <option value="topup">Popup</option>
              <option value="withdraw">Withdraw</option>
              <option value="send">Send</option>
              <option value="receive">Recieve</option>
              <option value="booking_release">Booking</option>
            </select>
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No transactions found</div>
          ) : (
            filteredTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} lang={lang} />)
          )}
        </div>
      )}
    </div>
  );
}