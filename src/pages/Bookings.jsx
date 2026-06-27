import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import ServiceBookingDetailModal from '../components/bookings/ServiceBookingDetailModal';
import StayBookingDetailModal from '../components/bookings/StayBookingDetailModal';
import { toast } from 'sonner';
import { formatServiceWhen, formatTimestampDMY } from '../utils/dateUtils';

const statusConfig = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
};

export default function Bookings() {
  const { currentUser, t, lang } = useAppContext();
  const [tab, setTab] = useState('pending');
  const [serviceTab, setServiceTab] = useState('my_bookings');
  const [serviceBookings, setServiceBookings] = useState([]);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState(null);

  const loadServiceBookings = async () => {
    if (!currentUser) return;
    try {
      const allListings = await base44.entities.Listing.list('-created_date', 200);
      const listingMap = {};
      allListings.forEach(l => { listingMap[l.id] = l; });

      const allPosts = await base44.entities.ServicePost.list('-created_date', 200);
      const postMap = {};
      allPosts.forEach(p => { postMap[p.id] = p; });

      if (currentUser.role === 'admin') {
        const [allServices, allStays] = await Promise.all([
          base44.entities.ServiceBooking.list('-created_date', 100),
          base44.entities.Booking.list('-created_date', 100)
        ]);
        const services = allServices.map(b => ({ ...b, booking_kind: 'service', image: postMap[b.post_id]?.images?.[0] }));
        const stays = allStays.map(b => {
          const lst = listingMap[b.listing_id];
          return {
            ...b,
            booking_kind: 'stay',
            image: lst?.images?.[0],
            service_type: lst ? (lang === 'lo' && lst.title_lao ? lst.title_lao : lst.title) : 'Stay Accommodation',
            booker_email: b.guest_email,
            booker_name: b.guest_name || b.guest_email,
            poster_email: b.host_email,
            poster_name: b.host_name || b.host_email,
            price: b.total,
            service_duration: b.nights,
            service_duration_unit: 'nights',
            service_location: b.city || (lst ? `${lst.city}, ${lst.country}` : 'Stay'),
            service_when: `${b.check_in} - ${b.check_out}`,
          };
        });
        setServiceBookings([...services, ...stays].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        return;
      }

      const [asBooker, asPoster, stayAsBooker, stayAsPoster] = await Promise.all([
        base44.entities.ServiceBooking.filter({ booker_email: currentUser.email }, '-created_date', 30),
        base44.entities.ServiceBooking.filter({ poster_email: currentUser.email }, '-created_date', 30),
        base44.entities.Booking.filter({ guest_email: currentUser.email }, '-created_date', 30),
        base44.entities.Booking.filter({ host_email: currentUser.email }, '-created_date', 30)
      ]);

      const services = [...asBooker, ...asPoster]
        .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
        .map(b => ({ ...b, booking_kind: 'service', image: postMap[b.post_id]?.images?.[0] }));

      const stays = [...stayAsBooker, ...stayAsPoster]
        .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
        .map(b => {
          const lst = listingMap[b.listing_id];
          return {
            ...b,
            booking_kind: 'stay',
            image: lst?.images?.[0],
            service_type: lst ? (lang === 'lo' && lst.title_lao ? lst.title_lao : lst.title) : 'Stay Accommodation',
            booker_email: b.guest_email,
            booker_name: b.guest_name || b.guest_email,
            poster_email: b.host_email,
            poster_name: b.host_name || b.host_email,
            price: b.total,
            service_duration: b.nights,
            service_duration_unit: 'nights',
            service_location: b.city || (lst ? `${lst.city}, ${lst.country}` : 'Stay'),
            service_when: `${b.check_in} - ${b.check_out}`,
          };
        });

      setServiceBookings([...services, ...stays].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (currentUser) loadServiceBookings();
  }, [currentUser]);

  // Real-time subscription for fast updates
  useEffect(() => {
    const unsubServices = base44.entities.ServiceBooking.subscribe(() => {
      loadServiceBookings();
    });
    const unsubStays = base44.entities.Booking.subscribe(() => {
      loadServiceBookings();
    });
    return () => {
      unsubServices();
      unsubStays();
    };
  }, []);

  const getEntity = (b) => b.booking_kind === 'stay' ? base44.entities.Booking : base44.entities.ServiceBooking;

  const requestCancel = async (booking) => {
    await getEntity(booking).update(booking.id, {
      cancel_request_status: 'requested',
      cancel_requested_by: currentUser.email,
      cancel_requested_at: new Date().toISOString()
    });
    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ສົ່ງຄຳຂໍຍົກເລີກແລ້ວ' : 'Cancel request sent');
  };

  const requestComplete = async (booking) => {
    await getEntity(booking).update(booking.id, {
      complete_request_status: 'requested',
      complete_requested_by: currentUser.email,
      complete_requested_at: new Date().toISOString()
    });
    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ສົ່ງຄຳຂໍສຳເລັດແລ້ວ (ລໍຖ້າ Admin ອະນຸມັດ)' : 'Completion request sent (waiting for admin approval)');
  };

  const approveCancel = async (booking) => {
    await getEntity(booking).update(booking.id, {
      status: 'cancelled',
      cancel_request_status: 'approved',
      cancel_resolved_by: currentUser.email,
      cancel_resolved_at: new Date().toISOString(),
      refund_done: true
    });

    const bookerEmail = booking.booking_kind === 'stay' ? booking.guest_email : booking.booker_email;
    const posterEmail = booking.booking_kind === 'stay' ? booking.host_email : booking.poster_email;
    const price = booking.booking_kind === 'stay' ? booking.total : booking.price;
    const serviceType = booking.service_type || 'Stay';

    const profiles = await base44.entities.UserProfile.filter({ user_email: bookerEmail });
    const bookerProfile = profiles[0];
    if (bookerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
      await base44.entities.UserProfile.update(bookerProfile.id, {
        [balanceField]: (bookerProfile[balanceField] || 0) + Math.abs(price || 0)
      });
    }

    await base44.entities.WalletTransaction.create({
      user_email: bookerEmail,
      description: `Refund for cancelled ${serviceType}`,
      description_lao: `ຄືນເງິນສຳລັບ ${serviceType}`,
      amount: Math.abs(price || 0),
      currency: booking.currency || 'USD',
      type: 'received',
      status: 'completed',
      request_kind: 'receive',
      counterparty_email: posterEmail
    });

    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ຍົກເລີກ ແລະ ຄືນເງິນສຳເລັດ' : 'Cancelled and refunded');
  };

  const declineCancel = async (booking) => {
    await getEntity(booking).update(booking.id, {
      cancel_request_status: 'declined',
      cancel_resolved_by: currentUser.email,
      cancel_resolved_at: new Date().toISOString()
    });
    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ບໍ່ອະນຸມັດຄຳຂໍຍົກເລີກ' : 'Cancel request declined');
  };

  const markServiceCompleted = async (booking) => {
    if (booking.status === 'completed') return;

    await getEntity(booking).update(booking.id, {
      status: 'completed',
      complete_request_status: 'approved',
      complete_resolved_by: currentUser.email,
      complete_resolved_at: new Date().toISOString(),
      guest_confirmed_completed: booking.booking_kind === 'stay' ? true : undefined,
      admin_payout_approved: booking.booking_kind === 'stay' ? true : undefined
    });

    const bookerEmail = booking.booking_kind === 'stay' ? booking.guest_email : booking.booker_email;
    const posterEmail = booking.booking_kind === 'stay' ? booking.host_email : booking.poster_email;
    const price = booking.booking_kind === 'stay' ? booking.total : booking.price;
    const serviceType = booking.service_type || 'Stay';

    const providerProfiles = await base44.entities.UserProfile.filter({ user_email: posterEmail });
    const providerProfile = providerProfiles[0];
    if (providerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
      await base44.entities.UserProfile.update(providerProfile.id, {
        [balanceField]: (providerProfile[balanceField] || 0) + Math.abs(price || 0),
        wallet_currency: booking.currency || 'USD'
      });

      await base44.entities.WalletTransaction.create({
        user_email: posterEmail,
        description: `Payout for ${serviceType}`,
        description_lao: `ຮັບເງິນຄ່າ ${serviceType}`,
        amount: Math.abs(price || 0),
        currency: booking.currency || 'USD',
        type: 'received',
        status: 'completed',
        request_kind: 'booking_release',
        counterparty_email: bookerEmail
      });
    }

    await base44.entities.Notification.create({
      user_email: posterEmail,
      type: '💸',
      text: `Payment for ${serviceType} has been released to your wallet`,
      text_lao: `ເງິນຄ່າ ${serviceType} ໄດ້ເຂົ້າກະເປົາແລ້ວ`
    });

    await loadServiceBookings();
    setSelectedServiceBooking(null);
    toast.success(lang === 'lo' ? 'ສຳເລັດ ແລະ ໂອນເງິນໃຫ້ຜູ້ໃຫ້ບໍລິການແລ້ວ' : 'Completed and paid to provider');
  };

  const myServiceBookings = serviceBookings.filter((b) => currentUser?.role === 'admin' || b.booker_email === currentUser?.email);
  const incomingServiceBookings = serviceBookings.filter((b) => currentUser?.role === 'admin' || b.poster_email === currentUser?.email);
  const currentServiceBookings = serviceTab === 'my_bookings' ? myServiceBookings : incomingServiceBookings;

  const pendingBookings = currentServiceBookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const completedBookings = currentServiceBookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const visibleBookings = tab === 'pending' ? pendingBookings : completedBookings;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">{t.bookingsTitle}</h1>
      <p className="text-muted-foreground text-sm mb-5">
        {currentUser?.role === 'admin' ?
        lang === 'lo' ? 'ລາຍການຈອງຂອງຜູ້ໃຊ້ທັງໝົດ' : 'All user bookings in one place' :
        lang === 'lo' ? 'ລາຍການຈອງທັງໝົດຂອງທ່ານ' : 'All your reservations in one place'}
      </p>

      {/* Giving / Asking Service Main Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 bg-muted/30 rounded-2xl border border-border/50">
        <button
          onClick={() => setServiceTab('incoming_requests')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${serviceTab === 'incoming_requests' ? 'bg-card text-primary shadow-sm border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🤝 {lang === 'lo' ? 'ໃຫ້ບໍລິການ' : 'Giving Service'}
        </button>
        <button
          onClick={() => setServiceTab('my_bookings')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${serviceTab === 'my_bookings' ? 'bg-card text-primary shadow-sm border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🙋 {lang === 'lo' ? 'ໃຊ້ບໍລິການ' : 'Using Service'}
        </button>
      </div>

      {/* Pending / Completed Sub-tabs */}
      <div className="flex gap-6 border-b border-border mb-6 px-2">
        <button
          onClick={() => setTab('pending')}
          className={`pb-3 text-sm font-bold relative transition-colors ${tab === 'pending' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ⏳ {lang === 'lo' ? 'ລໍຖ້າດຳເນີນການ' : 'Pending'}
          {pendingBookings.length > 0 && <span className="ml-1.5 text-[10px] bg-amber-500 text-white rounded-full px-2 py-0.5">{pendingBookings.length}</span>}
          {tab === 'pending' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`pb-3 text-sm font-bold relative transition-colors ${tab === 'completed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ✅ {lang === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed'}
          {completedBookings.length > 0 && <span className="ml-1.5 text-[10px] bg-primary text-white rounded-full px-2 py-0.5">{completedBookings.length}</span>}
          {tab === 'completed' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
        </button>
      </div>

      {/* Transaction list */}
      {visibleBookings.length > 0 ? (
        <div className="space-y-4">
          {visibleBookings.map((b) => {
            const st = statusConfig[b.status] || statusConfig.pending;
            const Icon = st.icon;
            const isIncoming = serviceTab === 'incoming_requests';
            const statusColor = b.status === 'completed' ? 'border-l-blue-500' : b.status === 'confirmed' ? 'border-l-emerald-500' : b.status === 'cancelled' ? 'border-l-red-500' : 'border-l-amber-500';

            return (
              <button
                key={b.id}
                onClick={() => setSelectedServiceBooking(b)}
                className={`w-full text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-[6px] ${statusColor}`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      {b.image ? (
                        <img src={b.image} alt={b.service_type} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-border flex-shrink-0">
                          {b.booking_kind === 'stay' ? '🏠' : '🛎️'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-base line-clamp-1">{b.service_type || 'Service Transaction'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isIncoming
                            ? `${lang === 'lo' ? 'ລູກຄ້າ:' : 'Client:'} ${b.booker_name || b.booker_email}`
                            : `${lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ:' : 'Provider:'} ${b.poster_name || b.poster_email}`}
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border flex-shrink-0 ${st.cls}`}>
                      <Icon size={12} /> {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground mb-4">
                    {b.service_when && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="text-primary/70" /> {formatServiceWhen(b.service_when)}
                      </span>
                    )}
                    {b.service_duration > 0 && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-primary/70" /> {b.service_duration}{b.booking_kind === 'stay' ? ' nights' : 'h'}
                      </span>
                    )}
                    {b.service_location && (
                      <span className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
                        <MapPin size={14} className="text-primary/70" /> {b.service_location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 px-4 sm:px-5 py-3 border-t border-dashed border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{formatTimestampDMY(b.created_date)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{lang === 'lo' ? 'ລາຄາລວມ' : 'TOTAL'}</span>
                    <span className="text-lg font-black text-foreground">{b.price} {b.currency || 'USD'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border border-border border-dashed">
          <p className="text-5xl mb-4">{tab === 'pending' ? '⏳' : '✅'}</p>
          <h3 className="text-lg font-bold mb-2">
            {tab === 'pending'
              ? lang === 'lo' ? 'ຍັງບໍ່ມີທຸລະກຳທີ່ລໍຖ້າ' : 'No pending transactions'
              : lang === 'lo' ? 'ຍັງບໍ່ມີທຸລະກຳທີ່ສຳເລັດ' : 'No completed transactions'}
          </h3>
          <p className="text-sm mb-6 max-w-sm mx-auto">{lang === 'lo' ? 'ຊອກຫາການບໍລິການໃນ Feed ເພື່ອເລີ່ມຕົ້ນທຸລະກຳໃໝ່' : 'Browse services in the Feed to start a new transaction'}</p>
          <Link to="/feed" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-105 transition-all">{t.feed}</Link>
        </div>
      )}

      {selectedServiceBooking && selectedServiceBooking.booking_kind === 'stay' ? (
        <StayBookingDetailModal
          booking={selectedServiceBooking}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setSelectedServiceBooking(null)}
          onRequestCancel={requestCancel}
          onRequestComplete={requestComplete}
          onApproveCancel={approveCancel}
          onDeclineCancel={declineCancel}
          onMarkCompleted={markServiceCompleted}
        />
      ) : selectedServiceBooking && (
        <ServiceBookingDetailModal
          booking={selectedServiceBooking}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setSelectedServiceBooking(null)}
          onRequestCancel={requestCancel}
          onRequestComplete={requestComplete}
          onApproveCancel={approveCancel}
          onDeclineCancel={declineCancel}
          onMarkCompleted={markServiceCompleted}
        />
      )}
    </div>);
}