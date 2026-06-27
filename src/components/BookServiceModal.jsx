import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { X, Clock, Calendar, DollarSign, Wallet, MapPin } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATES, deductCrossCurrencyBalance, getTotalLakBalance } from '../utils/wallet';
import { formatServiceWhen } from '../utils/dateUtils';

export default function BookServiceModal({ post, profile, currentUser, lang, onClose, onBooked }) {
  const [loading, setLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(DEFAULT_EXCHANGE_RATES);
  const navigate = useNavigate();

  const price = post.service_price || 0;
  const currency = post.service_currency || profile?.wallet_currency || 'USD';

  useEffect(() => {
    firebaseClient.entities.ExchangeRateSettings.list('-updated_date', 1).then((items) => {
      const item = items[0];
      if (item) {
        setExchangeRates({
          usdBuy: item.usd_buy || 22072,
          usdSell: item.usd_sell || 22183,
          thbBuy: item.thb_buy || 640,
          thbSell: item.thb_sell || 645,
          cnyBuy: item.cny_buy || 3040,
          cnySell: item.cny_sell || 3060,
        });
      }
    });
  }, []);

  const totalLakBalance = getTotalLakBalance(profile, exchangeRates);
  const requiredLak = currency === 'LAK' ? price : price * (currency === 'THB' ? exchangeRates.thbBuy : currency === 'CNY' ? exchangeRates.cnyBuy : exchangeRates.usdBuy);
  const canAfford = totalLakBalance >= requiredLak;
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

  const handleMessage = async () => {
    if (post?.author_email) {
      setLoading(true);
      const convId = await startOrGetConversation(currentUser.email, post.author_email);
      setLoading(false);
      if (convId) {
        onClose();
        navigate(`/messages?conv=${convId}`);
      } else {
        toast.error('Unable to start conversation');
      }
    }
  };

  const handleBook = async () => {
    if (!profile?.is_verified && !profile?.is_pro) {
      toast.error(lang === 'lo' ? 'ຕ້ອງຢືນຢັນຕົວຕົນກ່ອນ' : 'You must verify your identity first');
      onClose();
      return;
    }
    if (!canAfford) {
      toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient wallet balance');
      return;
    }

    const balanceUpdate = deductCrossCurrencyBalance(profile, price, currency, exchangeRates);
    if (!balanceUpdate) {
      toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient wallet balance');
      return;
    }
    if (isHourlyService && slotOptions.length > 0 && !selectedSlot) {
      toast.error(lang === 'lo' ? 'ກະລຸນາເລືອກຊ່ວງເວລາ' : 'Please select a time slot');
      return;
    }

    setLoading(true);

    // Optimistic: close modal and show success immediately
    toast.success(lang === 'lo' ? 'ກຳລັງຈອງ... ✅' : 'Booking in progress... ✅');
    onClose();

    // Run all API calls in background
    try {
      const booking = await firebaseClient.entities.ServiceBooking.create({
        post_id: post.id,
        poster_email: post.author_email,
        booker_email: currentUser.email,
        booker_name: currentUser.full_name || currentUser.email,
        service_type: post.service_type || '',
        service_when: selectedSlot || post.service_when || '',
        service_duration: post.service_duration || 0,
        service_location: post.service_location || '',
        service_location_map_url: post.service_location_map_url || '',
        poster_name: post.author_name || '',
        price,
        currency,
        status: 'pending',
      });

      await firebaseClient.entities.UserProfile.update(profile.id, {
        wallet_balance_lak: balanceUpdate.wallet_balance_lak,
        wallet_balance_usd: balanceUpdate.wallet_balance_usd,
        wallet_balance_usdt: balanceUpdate.wallet_balance_usdt,
        wallet_currency: currency,
      });
      const walletTx = await firebaseClient.entities.WalletTransaction.create({
        user_email: currentUser.email,
        description: `Booked: ${post.service_type || 'Service'} from ${post.author_name}`,
        amount: -price,
        currency,
        type: 'payment',
      });

      await firebaseClient.entities.ServiceBooking.update(booking.id, {
        wallet_transaction_id: walletTx.id,
      });

      await firebaseClient.entities.Notification.create({
        user_email: post.author_email,
        type: '📅',
        text: `${currentUser.full_name || currentUser.email} booked your service "${post.service_type}" for ${price} ${currency}`,
      });

      const convs = await firebaseClient.entities.Conversation.list('-updated_date', 50);
      const existing = convs.find(c =>
        c.participants?.includes(currentUser.email) && c.participants?.includes(post.author_email)
      );
      let convId;
      const bookingContext = JSON.stringify({
        booking_id: booking.id,
        service_type: post.service_type || 'Service',
        service_emoji: post.service_type_emoji || '🛎️',
        price,
        currency,
        service_when: selectedSlot || post.service_when || '',
        service_location: post.service_location || '',
        service_location_map_url: post.service_location_map_url || '',
        booker_name: currentUser.full_name || currentUser.email,
        booker_email: currentUser.email,
        poster_name: post.author_name || '',
      });
      if (existing) {
        convId = existing.id;
        await firebaseClient.entities.Conversation.update(convId, {
          booking_context: bookingContext,
          booking_id: booking.id,
          last_message: `📋 ${lang === 'lo' ? 'ຈອງ' : 'Booked'}: ${post.service_type || 'Service'}`,
          last_message_time: new Date().toISOString(),
        });
      } else {
        const conv = await firebaseClient.entities.Conversation.create({
          participants: [currentUser.email, post.author_email],
          booking_context: bookingContext,
          booking_id: booking.id,
          last_message: `📋 ${lang === 'lo' ? 'ຈອງ' : 'Booked'}: ${post.service_type || 'Service'}`,
          last_message_time: new Date().toISOString(),
        });
        convId = conv.id;
      }
      // Send initial booking confirmation message
      const whenText = selectedSlot || post.service_when
        ? `\n⏰ ${selectedSlot || post.service_when}` : '';
      const locationText = post.service_location ? `\n📍 ${post.service_location}` : '';
      await firebaseClient.entities.Message.create({
        conversation_id: convId,
        sender_email: currentUser.email,
        text: `📋 ${lang === 'lo' ? 'ຂ້ອຍຈອງ' : 'I booked'}: "${post.service_type || 'Service'}"
💰 ${price} ${currency}${whenText}${locationText}

${lang === 'lo' ? 'ລໍຖ້າ ✅' : 'Looking forward to it! ✅'}`,
        msg_type: 'booking_card',
      });

      toast.success(lang === 'lo' ? 'ຈອງສຳເລັດ! ✅' : 'Booking confirmed! ✅');
      onBooked?.();
      navigate(`/messages?conv=${convId}`);
    } catch (err) {
      toast.error(lang === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Booking failed, please try again');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="bg-card rounded-[24px] w-full sm:max-w-sm p-5 sm:p-7 shadow-2xl border border-border max-h-[85vh] overflow-y-auto overscroll-contain"
        onMouseDown={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-card z-10 pb-2 border-b border-border">
          <h2 className="font-bold text-base">{lang === 'lo' ? 'ຈອງບໍລິການ' : 'Book Service'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
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
              {formatServiceWhen(post.service_when)}
            </div>
          )}
          {post.service_location && (
            post.service_location_map_url ? (
              <a
                href={post.service_location_map_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary underline underline-offset-2"
              >
                <MapPin size={14} />
                {post.service_location}
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                {post.service_location}
              </div>
            )
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
            {price} {currency}
          </div>
        </div>

        {/* Wallet balance */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-5 border ${canAfford ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex items-center gap-2 text-sm">
            <Wallet size={16} className={canAfford ? 'text-success' : 'text-destructive'} />
            <span className="font-medium">{lang === 'lo' ? 'ຍອດເງິນ' : 'Wallet Balance'}</span>
          </div>
          <span className={`font-bold text-sm ${canAfford ? 'text-success' : 'text-destructive'}`}>
            {Math.round(totalLakBalance).toLocaleString()} LAK
          </span>
        </div>

        {!canAfford && (
          <button
            onClick={() => {
              onClose();
              navigate('/wallet');
            }}
            className="w-full text-xs text-destructive text-center mb-3 underline underline-offset-2"
          >
            {lang === 'lo' ? 'ຍອດເງິນໃນກະເປົາບໍ່ພໍ — ກົດເພື່ອໄປໜ້າເຕີມເງິນ' : 'Not enough balance — tap to go to the top up page.'}
          </button>
        )}

        <button
          onClick={canAfford ? handleBook : () => {
            onClose();
            navigate('/wallet');
          }}
          disabled={loading}
          className="w-full bg-gradient-to-r from-tiffany to-deep-green text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? '...' : canAfford ? `${lang === 'lo' ? 'ຈ່າຍ & ຈອງ' : 'Pay & Book'} — ${price} ${currency}` : `${lang === 'lo' ? 'ໄປໜ້າເຕີມເງິນ' : 'Go to Top Up'}`}
        </button>
        <button onClick={handleMessage} disabled={loading} className="w-full border border-primary text-primary py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors mt-3">
          {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມຫາຜູ້ໃຫ້ບໍລິການ' : 'Message Provider'}
        </button>
        <button onClick={onClose} disabled={loading} className="w-full border border-border py-2.5 rounded-xl text-sm font-semibold mt-2 hover:bg-muted transition-colors">
          {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}