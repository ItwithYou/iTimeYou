import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X, Clock, Calendar, DollarSign, Wallet } from 'lucide-react';

export default function BookServiceModal({ post, profile, currentUser, lang, onClose, onBooked }) {
  const [loading, setLoading] = useState(false);

  const price = post.service_price || 0;
  const balance = profile?.wallet_balance || 0;
  const canAfford = balance >= price;

  const handleBook = async () => {
    if (!profile?.is_verified) {
      toast.error(lang === 'lo' ? 'ຕ້ອງຢືນຢັນຕົວຕົນກ່ອນ' : 'You must verify your identity first');
      onClose();
      return;
    }
    if (!canAfford) {
      toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient wallet balance');
      return;
    }

    setLoading(true);

    // Create booking
    await base44.entities.ServiceBooking.create({
      post_id: post.id,
      poster_email: post.author_email,
      booker_email: currentUser.email,
      booker_name: currentUser.full_name || currentUser.email,
      service_type: post.service_type || '',
      service_when: post.service_when || '',
      service_duration: post.service_duration || 0,
      price,
      status: 'pending',
    });

    // Deduct from booker wallet
    await base44.entities.UserProfile.update(profile.id, {
      wallet_balance: balance - price,
    });
    await base44.entities.WalletTransaction.create({
      user_email: currentUser.email,
      description: `Booked: ${post.service_type || 'Service'} from ${post.author_name}`,
      amount: -price,
      type: 'payment',
    });

    // Notify poster
    await base44.entities.Notification.create({
      user_email: post.author_email,
      type: '📅',
      text: `${currentUser.full_name || currentUser.email} booked your service "${post.service_type}" for $${price}`,
    });

    setLoading(false);
    toast.success(lang === 'lo' ? 'ຈອງສຳເລັດ! ✅' : 'Booking confirmed! ✅');
    onBooked?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{lang === 'lo' ? 'ຈອງບໍລິການ' : 'Book Service'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={18} /></button>
        </div>

        {/* Service summary */}
        <div className="bg-muted/50 rounded-2xl p-4 space-y-2.5 mb-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">{post.service_type_emoji || '🛎️'}</span>
            {post.service_type || 'Service'}
          </div>
          {post.service_duration > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              {post.service_duration} {post.service_duration_unit || 'hours'}
            </div>
          )}
          {post.service_when && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} />
              {post.service_when}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-bold text-primary pt-1 border-t border-border">
            <DollarSign size={14} />
            ${price}
          </div>
        </div>

        {/* Wallet balance */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-5 border ${canAfford ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex items-center gap-2 text-sm">
            <Wallet size={16} className={canAfford ? 'text-success' : 'text-destructive'} />
            <span className="font-medium">{lang === 'lo' ? 'ຍອດເງິນ' : 'Wallet Balance'}</span>
          </div>
          <span className={`font-bold text-sm ${canAfford ? 'text-success' : 'text-destructive'}`}>
            ${balance}
          </span>
        </div>

        {!canAfford && (
          <p className="text-xs text-destructive text-center mb-3">
            {lang === 'lo' ? 'ຍອດເງິນໃນກະເປົາບໍ່ພໍ' : 'Not enough balance — top up your wallet first.'}
          </p>
        )}

        <button
          onClick={handleBook}
          disabled={loading || !canAfford}
          className="w-full bg-gradient-to-r from-tiffany to-deep-green text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? '...' : `${lang === 'lo' ? 'ຈ່າຍ & ຈອງ' : 'Pay & Book'} — $${price}`}
        </button>
        <button onClick={onClose} className="w-full border border-border py-2.5 rounded-xl text-sm font-semibold mt-2 hover:bg-muted transition-colors">
          {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}