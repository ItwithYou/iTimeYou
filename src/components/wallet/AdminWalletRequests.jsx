import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminWalletRequests({ currentUser, transactions, onUpdated, bookings, profilesByEmail, lang }) {
  if (currentUser?.role !== 'admin') return null;

  const pendingRequests = transactions.filter((tx) => tx.status === 'pending');
  const payoutBookings = bookings.filter((booking) => booking.guest_confirmed_completed && !booking.admin_payout_approved);

  const approveTransaction = async (tx) => {
    const targetProfiles = await base44.entities.UserProfile.filter({ user_email: tx.user_email });
    const targetProfile = targetProfiles[0];
    if (!targetProfile) return;

    if (tx.request_kind === 'topup' || tx.request_kind === 'receive') {
      await base44.entities.UserProfile.update(targetProfile.id, { wallet_balance: (targetProfile.wallet_balance || 0) + Math.abs(tx.amount), wallet_currency: tx.currency || targetProfile.wallet_currency || 'USD' });
    }
    if (tx.request_kind === 'withdraw') {
      if ((targetProfile.wallet_balance || 0) < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, { wallet_balance: (targetProfile.wallet_balance || 0) - Math.abs(tx.amount) });
    }
    if (tx.request_kind === 'send') {
      if ((targetProfile.wallet_balance || 0) < Math.abs(tx.amount)) {
        toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
        return;
      }
      await base44.entities.UserProfile.update(targetProfile.id, { wallet_balance: (targetProfile.wallet_balance || 0) - Math.abs(tx.amount) });
      if (tx.counterparty_email) {
        const receiverProfiles = await base44.entities.UserProfile.filter({ user_email: tx.counterparty_email });
        const receiver = receiverProfiles[0];
        if (receiver) {
          await base44.entities.UserProfile.update(receiver.id, { wallet_balance: (receiver.wallet_balance || 0) + Math.abs(tx.amount), wallet_currency: tx.currency || receiver.wallet_currency || 'USD' });
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

  const approveBookingPayout = async (booking) => {
    const hostProfiles = await base44.entities.UserProfile.filter({ user_email: booking.host_email });
    const hostProfile = hostProfiles[0];
    if (!hostProfile) return;

    await base44.entities.UserProfile.update(hostProfile.id, {
      wallet_balance: (hostProfile.wallet_balance || 0) + booking.total,
      wallet_currency: booking.currency || hostProfile.wallet_currency || 'USD',
    });
    await base44.entities.Booking.update(booking.id, { admin_payout_approved: true, status: 'completed' });
    await base44.entities.WalletTransaction.create({
      user_email: booking.host_email,
      description: `Booking payout`,
      description_lao: `ຈ່າຍເງິນການຈອງ`,
      amount: booking.total,
      currency: booking.currency || 'USD',
      type: 'received',
      status: 'completed',
      related_booking_id: booking.id,
      request_kind: 'booking_release',
      counterparty_email: booking.guest_email,
    });
    await base44.entities.Notification.create({
      user_email: booking.host_email,
      type: '💸',
      text: `Booking payout approved`,
      text_lao: `ການຈ່າຍເງິນການຈອງຖືກອະນຸມັດ`,
    });
    onUpdated?.();
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-bold text-sm">{lang === 'lo' ? 'ຄຳຂໍ Wallet ລໍຖ້າ' : 'Pending Wallet Requests'}</div>
        {pendingRequests.length === 0 ? <div className="p-4 text-sm text-muted-foreground">{lang === 'lo' ? 'ບໍ່ມີຄຳຂໍ' : 'No pending requests'}</div> : pendingRequests.map((tx) => (
          <div key={tx.id} className="p-4 border-t border-border space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{tx.user_email}</p>
                <p className="text-xs text-muted-foreground">{tx.request_kind} · {Math.abs(tx.amount)} {tx.currency}</p>
                {tx.bank_name && <p className="text-xs text-muted-foreground">{tx.bank_name} · {tx.account_number}</p>}
                {tx.counterparty_email && <p className="text-xs text-muted-foreground">{lang === 'lo' ? 'ຜູ້ຮັບ/ຜູ້ສົ່ງ' : 'Counterparty'}: {tx.counterparty_email}</p>}
              </div>
              {tx.payment_screenshot_url && <img src={tx.payment_screenshot_url} alt="screenshot" className="w-16 h-16 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-2">
              <button onClick={() => approveTransaction(tx)} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-semibold">Approve</button>
              <button onClick={() => rejectTransaction(tx)} className="flex-1 bg-destructive text-destructive-foreground py-2 rounded-xl text-sm font-semibold">Reject</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-bold text-sm">{lang === 'lo' ? 'ການປ່ອຍເງິນການຈອງ' : 'Booking Release Approval'}</div>
        {payoutBookings.length === 0 ? <div className="p-4 text-sm text-muted-foreground">{lang === 'lo' ? 'ບໍ່ມີລາຍການ' : 'No payout requests'}</div> : payoutBookings.map((booking) => (
          <div key={booking.id} className="p-4 border-t border-border space-y-2">
            <div>
              <p className="font-semibold text-sm">{profilesByEmail[booking.guest_email] || booking.guest_email} → {profilesByEmail[booking.host_email] || booking.host_email}</p>
              <p className="text-xs text-muted-foreground">{booking.total} {booking.currency || 'USD'}</p>
            </div>
            <button onClick={() => approveBookingPayout(booking)} className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold">{lang === 'lo' ? 'ອະນຸມັດການຈ່າຍ' : 'Approve payout'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}