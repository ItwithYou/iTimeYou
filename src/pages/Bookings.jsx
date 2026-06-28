import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import ServiceBookingDetailModal from '../components/bookings/ServiceBookingDetailModal';
import StayBookingDetailModal from '../components/bookings/StayBookingDetailModal';
import MapHistoryView from '../components/bookings/MapHistoryView';
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
      const allListings = await firebaseClient.entities.Listing.list('-created_date', 200);
      const listingMap = {};
      allListings.forEach(l => { listingMap[l.id] = l; });

      const allPosts = await firebaseClient.entities.ServicePost.list('-created_date', 200);
      const postMap = {};
      allPosts.forEach(p => { postMap[p.id] = p; });

      if (currentUser.role === 'admin') {
        const [allServices, allStays] = await Promise.all([
          firebaseClient.entities.ServiceBooking.list('-created_date', 100),
          firebaseClient.entities.Booking.list('-created_date', 100)
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
        firebaseClient.entities.ServiceBooking.filter({ booker_email: currentUser.email }, '-created_date', 30),
        firebaseClient.entities.ServiceBooking.filter({ poster_email: currentUser.email }, '-created_date', 30),
        firebaseClient.entities.Booking.filter({ guest_email: currentUser.email }, '-created_date', 30),
        firebaseClient.entities.Booking.filter({ host_email: currentUser.email }, '-created_date', 30)
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

      const allBookings = [...services, ...stays].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setServiceBookings(allBookings);

      // Default to map view if there is a travel track
      const coordsCount = allBookings.filter(b => b.city || b.service_location).length;
      if (coordsCount > 1) {
        setTab('map');
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (currentUser) loadServiceBookings();
  }, [currentUser]);

  // Real-time subscription for fast updates
  useEffect(() => {
    const unsubServices = firebaseClient.entities.ServiceBooking.subscribe(() => {
      loadServiceBookings();
    });
    const unsubStays = firebaseClient.entities.Booking.subscribe(() => {
      loadServiceBookings();
    });
    return () => {
      unsubServices();
      unsubStays();
    };
  }, []);

  const getEntity = (b) => b.booking_kind === 'stay' ? firebaseClient.entities.Booking : firebaseClient.entities.ServiceBooking;

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

    const profiles = await firebaseClient.entities.UserProfile.filter({ user_email: bookerEmail });
    const bookerProfile = profiles[0];
    if (bookerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'THB' ? 'wallet_balance_thb' : booking.currency === 'CNY' ? 'wallet_balance_cny' : 'wallet_balance_usd';
      await firebaseClient.entities.UserProfile.update(bookerProfile.id, {
        [balanceField]: (bookerProfile[balanceField] || 0) + Math.abs(price || 0)
      });
    }

    await firebaseClient.entities.WalletTransaction.create({
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

    const providerProfiles = await firebaseClient.entities.UserProfile.filter({ user_email: posterEmail });
    const providerProfile = providerProfiles[0];
    if (providerProfile) {
      const balanceField = booking.currency === 'LAK' ? 'wallet_balance_lak' : booking.currency === 'THB' ? 'wallet_balance_thb' : booking.currency === 'CNY' ? 'wallet_balance_cny' : 'wallet_balance_usd';
      await firebaseClient.entities.UserProfile.update(providerProfile.id, {
        [balanceField]: (providerProfile[balanceField] || 0) + Math.abs(price || 0),
        wallet_currency: booking.currency || 'USD'
      });

      await firebaseClient.entities.WalletTransaction.create({
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

    await firebaseClient.entities.Notification.create({
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
  const completedBookings = currentServiceBookings.filter((b) => b.status === 'completed');
  const cancelledBookings = currentServiceBookings.filter((b) => b.status === 'cancelled');
  
  let visibleBookings = [];
  if (tab === 'pending') visibleBookings = pendingBookings;
  else if (tab === 'completed') visibleBookings = completedBookings;
  else if (tab === 'cancelled') visibleBookings = cancelledBookings;
  else visibleBookings = currentServiceBookings; // For map view, use all current

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

      {/* Status Sub-tabs */}
      <div className="flex gap-4 sm:gap-6 border-b border-border/50 mb-6 px-1 sm:px-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setTab('pending')}
          className={`pb-3 text-xs sm:text-sm font-bold relative transition-colors whitespace-nowrap ${tab === 'pending' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ⏳ {lang === 'lo' ? 'ລໍຖ້າດຳເນີນການ' : 'Pending'}
          {pendingBookings.length > 0 && <span className="ml-1.5 text-[9px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">{pendingBookings.length}</span>}
          {tab === 'pending' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`pb-3 text-xs sm:text-sm font-bold relative transition-colors whitespace-nowrap ${tab === 'completed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ✅ {lang === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed'}
          {completedBookings.length > 0 && <span className="ml-1.5 text-[9px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5">{completedBookings.length}</span>}
          {tab === 'completed' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`pb-3 text-xs sm:text-sm font-bold relative transition-colors whitespace-nowrap ${tab === 'cancelled' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ❌ {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancelled'}
          {cancelledBookings.length > 0 && <span className="ml-1.5 text-[9px] bg-destructive text-white rounded-full px-1.5 py-0.5">{cancelledBookings.length}</span>}
          {tab === 'cancelled' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab('map')}
          className={`pb-3 text-xs sm:text-sm font-bold relative transition-colors whitespace-nowrap ml-auto ${tab === 'map' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🗺️ {lang === 'lo' ? 'ແຜນທີ່' : 'Map View'}
          {tab === 'map' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* View Content */}
      {tab === 'map' ? (
        <MapHistoryView bookings={visibleBookings} lang={lang} currentUser={currentUser} />
      ) : visibleBookings.length > 0 ? (
        <div className="space-y-3">
          {visibleBookings.map((b) => {
            const st = statusConfig[b.status] || statusConfig.pending;
            const isIncoming = serviceTab === 'incoming_requests';
            const statusColor = b.status === 'completed' ? 'bg-emerald-500' : b.status === 'confirmed' ? 'bg-blue-500' : b.status === 'cancelled' ? 'bg-destructive' : 'bg-amber-500';

            return (
              <button
                key={b.id}
                onClick={() => setSelectedServiceBooking(b)}
                className="w-full text-left bg-card rounded-[20px] p-4 flex gap-4 items-center group transition-colors hover:bg-muted/30 border border-border/50"
              >
                {b.image ? (
                  <img src={b.image} alt={b.service_type} className="w-16 h-16 rounded-[14px] object-cover shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-[14px] flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                    {b.booking_kind === 'stay' ? '🏠' : '🛎️'}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-[15px] truncate text-foreground">{b.service_type || 'Service Transaction'}</p>
                    <div className={`w-2 h-2 rounded-full ${statusColor} shadow-sm shrink-0`} title={st.label} />
                  </div>
                  
                  <div className="text-[12px] text-muted-foreground flex flex-col gap-0.5">
                    <span className="truncate">
                      {isIncoming ? (lang === 'lo' ? 'ລູກຄ້າ: ' : 'Client: ') : (lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ: ' : 'Provider: ')}
                      <span className="font-medium text-foreground/80">{isIncoming ? (b.booker_name || b.booker_email) : (b.poster_name || b.poster_email)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Calendar size={12} /> {formatTimestampDMY(b.created_date)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    {b.price?.toLocaleString()}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{b.currency || 'LAK'}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-[24px] border border-border/50">
          <p className="text-4xl mb-4">{tab === 'pending' ? '⏳' : tab === 'completed' ? '✅' : '❌'}</p>
          <h3 className="text-[15px] font-bold mb-2">
            {tab === 'pending'
              ? lang === 'lo' ? 'ຍັງບໍ່ມີທຸລະກຳທີ່ລໍຖ້າ' : 'No pending transactions'
              : tab === 'completed'
              ? lang === 'lo' ? 'ຍັງບໍ່ມີທຸລະກຳທີ່ສຳເລັດ' : 'No completed transactions'
              : lang === 'lo' ? 'ບໍ່ມີທຸລະກຳທີ່ຍົກເລີກ' : 'No cancelled transactions'}
          </h3>
          <p className="text-xs mb-6 max-w-[250px] mx-auto opacity-70">
            {lang === 'lo' ? 'ຊອກຫາການບໍລິການໃນ Feed ເພື່ອເລີ່ມຕົ້ນທຸລະກຳໃໝ່' : 'Browse services in the Feed to start a new transaction'}
          </p>
          <Link to="/feed" className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all">{t.feed}</Link>
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