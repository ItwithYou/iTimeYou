import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X, Clock, Calendar, DollarSign, Wallet } from 'lucide-react';

export default function BookServiceModal({ post, profile, currentUser, lang, onClose, onBooked }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const price = post.service_price || 0;
  const balance = profile?.wallet_balance || 0;
  const canAfford = balance >= price;
  const isHourlyService = post.service_duration_unit === 'hours';
  const slotOptions = useMemo(() => {
    if (!isHourlyService) return [];
    const baseDatePart = post.service_when?.split('·')[0]?.trim() || '';
    const timeMatch = post.service_when?.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (!timeMatch) return [];
    const [, start, end] = timeMatch;
    const options = [];
    const startHour = Number(start.split(':')[0]);
    const endHour = Number(end.split(':')[0]);
    for (let hour = startHour; hour < endHour; hour += 1) {
      const from = `${String(hour).padStart(2, '0')}:00`;
      const to = `${String(hour + 1).padStart(2, '0')}:00`;
      options.push(baseDatePart ? `${baseDatePart} · ${from} - ${to}` : `${from} - ${to}`);
    }
    return options;
  }, [isHourlyService, post.service_when]);
  const [selectedSlot, setSelectedSlot] = useState('');

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
    if (isHourlyService && !selectedSlot) {
      toast.error(lang === 'lo' ? 'ກະລຸນາເລືອກຊ່ວງເວລາ' : 'Please select a time slot');
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
      service_when: selectedSlot || post.service_when || '',
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

    // Open or create conversation with the poster
    const convs = await base44.entities.Conversation.list('-updated_date', 50);
    const existing = convs.find(c =>
      c.participants?.includes(currentUser.email) && c.participants?.includes(post.author_email)
    );
    let convId;
    if (existing) {
      convId = existing.id;
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [currentUser.email, post.author_email],
        last_message: '',
      });
      convId = conv.id;
    }
    // Send an auto message
    await base44.entities.Message.create({
      conversation_id: convId,
      sender_email: currentUser.email,
      text: `Hi! I just booked your service "${post.service_type || 'Service'}" for $${price}. Looking forward to it! 🎉`,
    });
    await base44.entities.Conversation.update(convId, {
      last_message: `Booking confirmed for "${post.service_type || 'Service'}"`,
      last_message_time: new Date().toISOString(),
    });

    setLoading(false);
    toast.success(lang === 'lo' ? 'ຈອງສຳເລັດ! ✅' : 'Booking confirmed! ✅');
    onBooked?.();
    onClose();
    navigate(`/messages?conv=${convId}`);
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
          {isHourlyService && slotOptions.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {lang === 'lo' ? 'ເລືອກຊ່ວງເວລາ' : 'Select Time Slot'}
              </p>
              <div className="grid gap-2">
                {slotOptions.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${selectedSlot === slot ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
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