import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import moment from 'moment';
import AdminExchangeRates from './AdminExchangeRates';
import MobileSelect from '../MobileSelect';

const getCurrencyBalanceField = (currency) => {
  if (currency === 'LAK') return 'wallet_balance_lak';
  if (currency === 'USDT') return 'wallet_balance_usdt';
  return 'wallet_balance_usd';
};

const adminTabs = [
  { key: 'topup', label: 'Popup' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'send', label: 'Send' },
  { key: 'receive', label: 'Recieve' },
  { key: 'transactions', label: 'Transaction' },
  { key: 'appeals', label: 'Appeals' },
  { key: 'rates', label: 'Rates' },
  { key: 'account', label: 'Account' },
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
          <p className="text-lg font-black tracking-tight text-primary">{Math.abs(tx.amount)} {tx.currency || 'USD'}</p>
          <p className="text-xs text-muted-foreground">{tx.request_kind}</p>
          {tx.bank_name && <p className="text-xs text-muted-foreground">{tx.bank_name} · {tx.account_number}</p>}
          {tx.account_name && <p className="text-xs text-muted-foreground">{tx.account_name}</p>}
          {tx.counterparty_email && <p className="text-xs text-muted-foreground break-all">{lang === 'lo' ? 'ຜູ້ກ່ຽວຂ້ອງ' : 'Counterparty'}: {tx.counterparty_email}</p>}
        </div>
        <StatusBadge status={tx.status} />
      </div>

      {tx.request_kind === 'withdraw' && tx.account_qr_url ? (
        <a href={tx.account_qr_url} target="_blank" rel="noreferrer" className="block">
          <img src={tx.account_qr_url} alt="account qr" className="w-full h-44 rounded-xl object-cover border border-border" />
        </a>
      ) : tx.payment_screenshot_url ? (
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
        {tx.approved_by_name && <p className="text-xs text-muted-foreground">Approved by: {tx.approved_by_name}</p>}
        {tx.approved_by_email && !tx.approved_by_name && <p className="text-xs text-muted-foreground">Approved by: {tx.approved_by_email}</p>}
        {tx.approved_at && <p className="text-xs text-muted-foreground">Approved time: {new Date(tx.approved_at).toLocaleString()}</p>}
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <StatusBadge status={tx.status} />
      </div>
    </div>
  );
}

export default function AdminWalletRequests({ currentUser, transactions, bookings, onUpdated, lang }) {
  const [activeTab, setActiveTab] = useState('topup');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [appealFilter, setAppealFilter] = useState('all');
  const [accountSettings, setAccountSettings] = useState(null);
  const [accountForm, setAccountForm] = useState({ bank_name: 'BCEL', account_name: '', account_number: '', qr_code_url: '', notes: '' });
  const [qrFile, setQrFile] = useState(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [rejectingTx, setRejectingTx] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const pendingTopups = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'topup');
  const pendingWithdraws = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'withdraw');
  const pendingSends = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'send');
  const pendingReceives = transactions.filter((tx) => tx.status === 'pending' && tx.request_kind === 'receive');

  const serviceAppeals = useMemo(() => {
    const completedBookings = bookings?.filter((b) => b.status === 'completed' && b.appeal_status !== 'none') || [];
    if (appealFilter === 'all') return completedBookings;
    return completedBookings.filter((b) => b.appeal_status === appealFilter);
  }, [bookings, appealFilter]);

  const filteredTransactions = useMemo(() => {
    const base = transactions.filter((tx) => tx.status === 'approved' || tx.status === 'completed' || tx.status === 'rejected');
    if (transactionFilter === 'all') return base;
    return base.filter((tx) => (tx.request_kind || tx.type) === transactionFilter);
  }, [transactions, transactionFilter]);

  useEffect(() => {
    const loadAccountSettings = async () => {
      const settings = await base44.entities.WalletAccountSettings.list('-updated_date', 1);
      const item = settings[0] || null;
      setAccountSettings(item);
      if (item) {
        setAccountForm({
          bank_name: item.bank_name || 'BCEL',
          account_name: item.account_name || '',
          account_number: item.account_number || '',
          qr_code_url: item.qr_code_url || '',
          notes: item.notes || '',
        });
      }
    };

    loadAccountSettings();
  }, []);

  if (currentUser?.role !== 'admin') return null;

  const approveTransaction = async (tx) => {
    const targetProfiles = await base44.entities.UserProfile.filter({ user_email: tx.user_email });
    const targetProfile = targetProfiles[0];
    if (!targetProfile) return;

    const currency = tx.currency || 'USD';
    const balanceField = getCurrencyBalanceField(currency);
    const targetBalance = targetProfile[balanceField] || 0;

    if (tx.request_kind === 'topup' || tx.request_kind === 'receive') {
      await base44.entities.UserProfile.update(targetProfile.id, {
        [balanceField]: targetBalance + Math.abs(tx.amount),
        wallet_currency: currency,
      });
    }

    if (tx.request_kind === 'withdraw') {
      if (targetBalance < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, {
        [balanceField]: targetBalance - Math.abs(tx.amount),
      });
    }

    if (tx.request_kind === 'send') {
      if (targetBalance < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, {
        [balanceField]: targetBalance - Math.abs(tx.amount),
      });
      if (tx.counterparty_email) {
        const receiverProfiles = await base44.entities.UserProfile.filter({ user_email: tx.counterparty_email });
        const receiver = receiverProfiles[0];
        if (receiver) {
          const receiverBalanceField = getCurrencyBalanceField(currency);
          await base44.entities.UserProfile.update(receiver.id, {
            [receiverBalanceField]: (receiver[receiverBalanceField] || 0) + Math.abs(tx.amount),
            wallet_currency: currency,
          });
          await base44.entities.WalletTransaction.create({
            user_email: receiver.user_email,
            description: `Received from ${tx.user_email}`,
            description_lao: `ຮັບຈາກ ${tx.user_email}`,
            amount: Math.abs(tx.amount),
            currency,
            type: 'received',
            status: 'completed',
            request_kind: 'receive',
            counterparty_email: tx.user_email,
          });
        }
      }
    }

    await base44.entities.WalletTransaction.update(tx.id, {
      status: 'approved',
      approved_by_name: currentUser.full_name || currentUser.email,
      approved_by_email: currentUser.email,
      approved_at: new Date().toISOString(),
    });
    await base44.entities.Notification.create({
      user_email: tx.user_email,
      type: '✅',
      text: `Your ${tx.request_kind} request was approved`,
      text_lao: `ຄຳຂໍ ${tx.request_kind} ຂອງທ່ານໄດ້ຖືກອະນຸມັດ`,
    });
    onUpdated?.();
  };

  const rejectTransaction = async (tx, reason) => {
    await base44.entities.WalletTransaction.update(tx.id, {
      status: 'rejected',
      reject_reason: reason || '',
      approved_by_name: currentUser.full_name || currentUser.email,
      approved_by_email: currentUser.email,
      approved_at: new Date().toISOString(),
    });
    await base44.entities.Notification.create({
      user_email: tx.user_email,
      type: '❌',
      text: `Your ${tx.request_kind} request was rejected${reason ? `: ${reason}` : ''}`,
      text_lao: `ຄຳຂໍ ${tx.request_kind} ຂອງທ່ານຖືກປະຕິເສດ${reason ? `: ${reason}` : ''}`,
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

  const resolveAppeal = async (booking, resolution) => {
    await base44.entities.ServiceBooking.update(booking.id, {
      appeal_status: 'resolved',
      appeal_resolved_by: currentUser.email,
      appeal_resolved_at: new Date().toISOString(),
      appeal_resolution_notes: resolution,
    });

    const notifications = [
      base44.entities.Notification.create({
        user_email: booking.booker_email,
        type: '✅',
        text: `Your appeal for ${booking.service_type} has been resolved`,
        text_lao: `ຄຳອຸທອນຂອງທ່ານສຳລັບ ${booking.service_type} ໄດ້ຖືກແກ້ໄຂແລ້ວ`,
      }),
      base44.entities.Notification.create({
        user_email: booking.poster_email,
        type: 'ℹ️',
        text: `An appeal for ${booking.service_type} has been resolved by admin`,
        text_lao: `ຄຳອຸທອນສຳລັບ ${booking.service_type} ໄດ້ຖືກແກ້ໄຂໂດຍ admin`,
      }),
    ];

    await Promise.all(notifications);
    onUpdated?.();
    setSelectedAppeal(null);
    setResolutionNotes('');
    toast.success(lang === 'lo' ? 'ແກ້ໄຂຄຳອຸທອນແລ້ວ' : 'Appeal resolved');
  };

  const saveAccountSettings = async () => {
    if (!accountForm.account_number) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ເລກບັນຊີ' : 'Please enter account number');
      return;
    }

    setSavingAccount(true);
    let nextQrUrl = accountForm.qr_code_url;
    if (qrFile) {
      const upload = await base44.integrations.Core.UploadFile({ file: qrFile });
      nextQrUrl = upload.file_url;
    }

    const payload = { ...accountForm, qr_code_url: nextQrUrl };
    if (accountSettings?.id) {
      await base44.entities.WalletAccountSettings.update(accountSettings.id, payload);
    } else {
      const created = await base44.entities.WalletAccountSettings.create(payload);
      setAccountSettings(created);
    }
    const latest = await base44.entities.WalletAccountSettings.list('-updated_date', 1);
    setAccountSettings(latest[0] || null);
    setAccountForm({
      bank_name: latest[0]?.bank_name || 'BCEL',
      account_name: latest[0]?.account_name || '',
      account_number: latest[0]?.account_number || '',
      qr_code_url: latest[0]?.qr_code_url || '',
      notes: latest[0]?.notes || '',
    });
    setQrFile(null);
    setSavingAccount(false);
    toast.success(lang === 'lo' ? 'ບັນທຶກຂໍ້ມູນບັນຊີແລ້ວ' : 'Account details saved');
  };

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

      {activeTab === 'rates' ? (
        <AdminExchangeRates currentUser={currentUser} lang={lang} />
      ) : activeTab === 'appeals' ? (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <MobileSelect
              value={appealFilter}
              onChange={setAppealFilter}
              options={[
                { value: 'all', label: 'All appeals' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'resolved', label: 'Resolved' },
              ]}
              placeholder="Filter"
              label="Filter Appeals"
              className="!w-auto !min-w-[120px]"
            />
          </div>

          {serviceAppeals.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">No service appeals</div>
          ) : (
            <div className="space-y-4">
              {serviceAppeals.map((booking) => {
                const completedAt = booking.completed_at ? new Date(booking.completed_at) : null;
                const daysSince = completedAt ? (new Date() - completedAt) / (1000 * 60 * 60 * 24) : null;
                return (
                  <div key={booking.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{booking.service_type || 'Service'}</p>
                        <p className="text-sm font-semibold break-all">{booking.booker_email}</p>
                        <p className="text-xs text-muted-foreground">{booking.poster_email}</p>
                        <p className="text-sm font-bold text-primary">{booking.price} {booking.currency || 'USD'}</p>
                        {completedAt && (
                          <p className="text-xs text-muted-foreground">Completed: {moment(completedAt).format('MMM D, YYYY')}</p>
                        )}
                        {daysSince !== null && (
                          <p className={`text-xs ${daysSince <= 3 ? 'text-emerald-600 font-semibold' : 'text-destructive font-semibold'}`}>
                            {daysSince <= 3 ? `${(3 - daysSince).toFixed(1)} days in appeal window` : 'Appeal window expired'}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${
                        booking.appeal_status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        booking.appeal_status === 'under_review' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {booking.appeal_status}
                      </span>
                    </div>

                    {booking.appeal_reason && (
                      <div className="p-3 bg-muted rounded-xl">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Appeal reason:</p>
                        <p className="text-sm">{booking.appeal_reason}</p>
                        {booking.appeal_submitted_at && (
                          <p className="text-xs text-muted-foreground mt-2">{moment(booking.appeal_submitted_at).fromNow()}</p>
                        )}
                      </div>
                    )}

                    {booking.appeal_resolution_notes && (
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Admin response:</p>
                        <p className="text-sm">{booking.appeal_resolution_notes}</p>
                        {booking.appeal_resolved_by && (
                          <p className="text-xs text-muted-foreground mt-1">By: {booking.appeal_resolved_by}</p>
                        )}
                      </div>
                    )}

                    {booking.appeal_status !== 'resolved' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedAppeal(booking); setResolutionNotes(''); }}
                          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'account' ? (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base">Transfer Account</h3>
            <p className="text-sm text-muted-foreground">Users will see this account number and QR code for top up and withdraw.</p>
          </div>

          <MobileSelect
            value={accountForm.bank_name}
            onChange={(v) => setAccountForm({ ...accountForm, bank_name: v })}
            options={['BCEL', 'LDB']}
            placeholder="Bank"
            label="Select Bank"
          />
          <input value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} placeholder="Account Name" className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          <input value={accountForm.account_number} onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} placeholder="Account Number" className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          <label className="block border-2 border-dashed border-border rounded-xl px-3 py-3 text-sm text-muted-foreground cursor-pointer hover:border-primary">
            {qrFile ? `✅ ${qrFile.name}` : (lang === 'lo' ? 'ອັບໂຫລດຮູບ QR' : 'Upload QR Photo')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setQrFile(e.target.files[0])} />
          </label>
          <textarea value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} placeholder="Notes" rows={3} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />

          {(qrFile || accountForm.qr_code_url) && (
            <img src={qrFile ? URL.createObjectURL(qrFile) : accountForm.qr_code_url} alt="QR code" className="w-48 h-48 object-cover rounded-2xl border border-border" />
          )}

          <button onClick={saveAccountSettings} disabled={savingAccount} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
            {savingAccount ? '...' : 'Save Account'}
          </button>
        </div>
      ) : activeTab !== 'transactions' ? (
        currentList.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">No requests</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentList.map((tx) => (
              <RequestCard key={tx.id} tx={tx} lang={lang} onApprove={approveTransaction} onReject={(item) => { setRejectingTx(item); setRejectReason(item.reject_reason || ''); }} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="font-bold text-sm">All Transactions</h3>
            <MobileSelect
              value={transactionFilter}
              onChange={setTransactionFilter}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'topup', label: 'Popup' },
                { value: 'withdraw', label: 'Withdraw' },
                { value: 'send', label: 'Send' },
                { value: 'receive', label: 'Recieve' },
                { value: 'booking_release', label: 'Booking' },
              ]}
              placeholder="Filter"
              label="Filter Transactions"
              className="!w-auto !min-w-[120px]"
            />
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No transactions found</div>
          ) : (
            filteredTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} lang={lang} />)
          )}
        </div>
      )}

      {rejectingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setRejectingTx(null)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-3">Reject Reason</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Write reason here"
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectingTx(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={async () => { await rejectTransaction(rejectingTx, rejectReason); setRejectingTx(null); setRejectReason(''); }} className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl text-sm font-semibold">Send Reject</button>
            </div>
          </div>
        </div>
      )}

      {selectedAppeal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setSelectedAppeal(null)}>
          <div className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-3">Resolve Appeal</h3>
            <div className="mb-4 p-3 bg-muted rounded-xl">
              <p className="text-sm font-semibold">{selectedAppeal.service_type}</p>
              <p className="text-xs text-muted-foreground">{selectedAppeal.booker_email}</p>
              {selectedAppeal.appeal_reason && (
                <p className="text-sm mt-2">{selectedAppeal.appeal_reason}</p>
              )}
            </div>
            <label className="block text-sm font-semibold mb-2">Resolution notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Write your resolution decision and notes..."
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelectedAppeal(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button 
                onClick={async () => { 
                  if (!resolutionNotes.trim()) {
                    toast.error('Please provide resolution notes');
                    return;
                  }
                  await resolveAppeal(selectedAppeal, resolutionNotes); 
                }} 
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                Resolve Appeal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}