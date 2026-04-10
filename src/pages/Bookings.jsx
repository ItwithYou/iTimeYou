import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';
import ServiceBookingDetailModal from '../components/bookings/ServiceBookingDetailModal';
import { toast } from 'sonner';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200',      icon: AlertCircle },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200',             icon: XCircle },
};

export default function Bookings() {
  const { currentUser, t, lang } = useAppContext();
  const [tab, setTab] = useState('pending');
  const [serviceTab, setServiceTab] = useState('my_bookings');
  const [serviceBookings, setServiceBookings] = useState([]);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState(null);

  const loadServiceBookings = async () => {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      const all = await base44.entities.ServiceBooking.list('-created_date', 100);
      setServiceBookings(all);
      return;
    }
    const [asBooker, asPoster] = await Promise.all([
      base44.entities.ServiceBooking.filter({ booker_email: currentUser.email }, '-created_date', 30),
      base44.entities.ServiceBooking.filter({ poster_email: currentUser.email }, '-created_date', 30),
    ]);
    const all = [...asBooker, ...asPoster].filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
    setServiceBookings(all);
  };

  useEffect(() => {
    if (currentUser) loadServiceBookings();
  }, [currentUser]);

  const requestCancel = async (booking) => {
    await base44.entities.ServiceBooking.update(booking.id, {
      cancel_request_status: 'requested',
      cancel_requested_by: currentUser.email,
      cancel_requested_at: new Date().toISOString(),
    });
    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ສົ່ງຄຳຂໍຍົກເລີກແລ້ວ' : 'Cancel request sent');
  };

  const approveCancel = async (booking) => {
    await base44.entities.ServiceBooking.update(booking.id, {
      status: 'cancelled',
      cancel_request_status: 'approved',
      cancel_resolved_by: currentUser.email,
      cancel_resolved_at: new Date().toISOString(),
      refund_done: true,
    });

    const profiles = await base44.entities.UserProfile.filter({ user_email: booking.booker_email });
    const bookerProfile = profiles[0];
    if (bookerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
      await base44.entities.UserProfile.update(bookerProfile.id, {
        [balanceField]: (bookerProfile[balanceField] || 0) + Math.abs(booking.price || 0),
      });
    }

    await base44.entities.WalletTransaction.create({
      user_email: booking.booker_email,
      description: `Refund for cancelled ${booking.service_type}`,
      description_lao: `ຄືນເງິນສຳລັບ ${booking.service_type}`,
      amount: Math.abs(booking.price || 0),
      currency: booking.currency || 'USD',
      type: 'received',
      status: 'completed',
      request_kind: 'receive',
      counterparty_email: booking.poster_email,
    });

    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ຍົກເລີກ ແລະ ຄືນເງິນສຳເລັດ' : 'Cancelled and refunded');
  };

  const declineCancel = async (booking) => {
    await base44.entities.ServiceBooking.update(booking.id, {
      cancel_request_status: 'declined',
      cancel_resolved_by: currentUser.email,
      cancel_resolved_at: new Date().toISOString(),
    });
    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ບໍ່ອະນຸມັດຄຳຂໍຍົກເລີກ' : 'Cancel request declined');
  };

  const markServiceCompleted = async (booking) => {
    if (booking.status === 'completed') return;

    await base44.entities.ServiceBooking.update(booking.id, {
      status: 'completed',
    });

    const providerProfiles = await base44.entities.UserProfile.filter({ user_email: booking.poster_email });
    const providerProfile = providerProfiles[0];
    if (providerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
      await base44.entities.UserProfile.update(providerProfile.id, {
        [balanceField]: (providerProfile[balanceField] || 0) + Math.abs(booking.price || 0),
        wallet_currency: booking.currency || 'USD',
      });

      await base44.entities.WalletTransaction.create({
        user_email: booking.poster_email,
        description: `Service payout for ${booking.service_type}`,
        description_lao: `ຮັບເງິນຄ່າບໍລິການ ${booking.service_type}`,
        amount: Math.abs(booking.price || 0),
        currency: booking.currency || 'USD',
        type: 'received',
        status: 'completed',
        request_kind: 'booking_release',
        counterparty_email: booking.booker_email,
      });
    }

    await base44.entities.Notification.create({
      user_email: booking.poster_email,
      type: '💸',
      text: `Payment for ${booking.service_type} has been released to your wallet`,
      text_lao: `ເງິນຄ່າ ${booking.service_type} ໄດ້ເຂົ້າກະເປົາແລ້ວ`,
    });

    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ສຳເລັດ ແລະ ໂອນເງິນໃຫ້ຜູ້ໃຫ້ບໍລິການແລ້ວ' : 'Completed and paid to provider');
  };

  const myServiceBookings = serviceBookings.filter((b) => currentUser?.role === 'admin' || b.booker_email === currentUser?.email);
  const incomingServiceBookings = serviceBookings.filter((b) => currentUser?.role === 'admin' || b.poster_email === currentUser?.email);
  const currentServiceBookings = serviceTab === 'my_bookings' ? myServiceBookings : incomingServiceBookings;

  const pendingBookings = currentServiceBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const completedBookings = currentServiceBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const visibleBookings = tab === 'pending' ? pendingBookings : completedBookings;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">{t.bookingsTitle}</h1>
      <p className="text-muted-foreground text-sm mb-5">
        {currentUser?.role === 'admin'
          ? (lang === 'lo' ? 'ລາຍການຈອງຂອງຜູ້ໃຊ້ທັງໝົດ' : 'All user bookings in one place')
          : (lang === 'lo' ? 'ລາຍການຈອງທັງໝົດຂອງທ່ານ' : 'All your reservations in one place')}
      </p>

      {/* Pending / Completed tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'pending' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ⏳ {lang === 'lo' ? 'ກຳລັງດຳເນີນການ' : 'Pending'}
          {pendingBookings.length > 0 && <span className="ml-1 text-xs bg-amber-500 text-white rounded-full px-1.5">{pendingBookings.length}</span>}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'completed' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ✅ {lang === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed'}
          {completedBookings.length > 0 && <span className="ml-1 text-xs bg-primary text-white rounded-full px-1.5">{completedBookings.length}</span>}
        </button>
      </div>

      {/* My Bookings / Incoming sub-tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5">
        <button
          onClick={() => setServiceTab('my_bookings')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${serviceTab === 'my_bookings' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {lang === 'lo' ? 'ການຈອງຂອງຂ້ອຍ' : 'My Bookings'}
        </button>
        <button
          onClick={() => setServiceTab('incoming_requests')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${serviceTab === 'incoming_requests' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {lang === 'lo' ? 'ຄຳຂໍເຂົ້າມາ' : 'Incoming Requests'}
        </button>
      </div>

      {/* Booking list */}
      {visibleBookings.length > 0 ? (
        <div className="space-y-4">
          {visibleBookings.map(b => {
            const st = statusConfig[b.status] || statusConfig.pending;
            const Icon = st.icon;
            const isIncoming = serviceTab === 'incoming_requests';
            return (
              <button
                key={b.id}
                onClick={() => setSelectedServiceBooking(b)}
                className="w-full text-left bg-card rounded-2xl border border-border shadow-sm p-4 hover:shadow-md transition-all hover:border-primary/50 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🛎️</div>
                    <div>
                      <p className="font-bold text-sm">{b.service_type || 'Service'}</p>
                      <p className="text-xs text-muted-foreground">
                        {isIncoming
                          ? `${lang === 'lo' ? 'ຈາກລູກຄ້າ' : 'From customer'} ${b.booker_name || b.booker_email}`
                          : `${lang === 'lo' ? 'ຈາກຜູ້ໃຫ້ບໍລິການ' : 'From host'} ${b.poster_name || b.poster_email}`}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${st.cls}`}>
                    <Icon size={11} /> {st.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  {b.service_when && <span className="flex items-center gap-1"><Calendar size={11} /> {b.service_when}</span>}
                  {b.service_duration > 0 && <span className="flex items-center gap-1"><Clock size={11} /> {b.service_duration}h</span>}
                  {b.service_location && <span className="flex items-center gap-1"><MapPin size={11} /> {b.service_location}</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-bold text-primary">{b.price} {b.currency || 'USD'}</span>
                  <span className="text-xs text-muted-foreground">{moment(b.created_date).fromNow()}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-3">{tab === 'pending' ? '⏳' : '✅'}</p>
          <h3 className="font-semibold mb-1">
            {tab === 'pending'
              ? (lang === 'lo' ? 'ຍັງບໍ່ມີການຈອງທີ່ລໍຖ້າ' : 'No pending bookings')
              : (lang === 'lo' ? 'ຍັງບໍ່ມີການຈອງທີ່ສຳເລັດ' : 'No completed bookings')}
          </h3>
          <p className="text-sm mb-5">{lang === 'lo' ? 'ຊອກຫາການບໍລິການໃນ Feed' : 'Browse services in the Feed'}</p>
          <Link to="/feed" className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">{t.feed}</Link>
        </div>
      )}

      {selectedServiceBooking && (
        <ServiceBookingDetailModal
          booking={selectedServiceBooking}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setSelectedServiceBooking(null)}
          onRequestCancel={requestCancel}
          onApproveCancel={approveCancel}
          onDeclineCancel={declineCancel}
          onMarkCompleted={markServiceCompleted}
        />
      )}
    </div>
  );
}