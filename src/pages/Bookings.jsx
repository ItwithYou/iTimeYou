import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200',      icon: AlertCircle },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200',             icon: XCircle },
};

export default function Bookings() {
  const { currentUser, t, lang } = useAppContext();
  const [tab, setTab] = useState('stays');
  const [bookings, setBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [listings, setListings] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Booking.filter({ guest_email: currentUser.email }, '-created_date', 30).then(async data => {
      setBookings(data);
      const allListings = await base44.entities.Listing.list('-created_date', 100);
      const map = {};
      allListings.forEach(l => { map[l.id] = l; });
      setListings(map);
    });
    base44.entities.ServiceBooking.filter({ booker_email: currentUser.email }, '-created_date', 30).then(setServiceBookings);
  }, [currentUser]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">{t.bookingsTitle}</h1>
      <p className="text-muted-foreground text-sm mb-5">{lang === 'lo' ? 'ລາຍການຈອງທັງໝົດຂອງທ່ານ' : 'All your reservations in one place'}</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('stays')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'stays' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🏠 {lang === 'lo' ? 'ທີ່ພັກ' : 'Stays'}
          {bookings.length > 0 && <span className="ml-1 text-xs bg-primary text-white rounded-full px-1.5">{bookings.length}</span>}
        </button>
        <button
          onClick={() => setTab('services')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'services' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🛎️ {lang === 'lo' ? 'ບໍລິການ' : 'Services'}
          {serviceBookings.length > 0 && <span className="ml-1 text-xs bg-primary text-white rounded-full px-1.5">{serviceBookings.length}</span>}
        </button>
      </div>

      {tab === 'stays' && (
        bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map(b => {
              const listing = listings[b.listing_id];
              const st = statusConfig[b.status] || statusConfig.pending;
              const Icon = st.icon;
              return (
                <div key={b.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    {listing && (
                      <Link to={`/listing/${listing.id}`} className="w-28 sm:w-36 flex-shrink-0">
                        <img src={listing.image_url} alt="" className="w-full h-full object-cover" />
                      </Link>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link to={`/listing/${b.listing_id}`} className="font-bold text-sm hover:text-primary leading-tight">
                          {listing ? (lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title) : 'Loading...'}
                        </Link>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${st.cls}`}>
                          <Icon size={11} /> {st.label}
                        </span>
                      </div>
                      {listing && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                          <MapPin size={11} /> {lang === 'lo' && listing.city_lao ? listing.city_lao : listing.city}, {listing.country}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Calendar size={11} /> {moment(b.check_in).format('MMM D')} → {moment(b.check_out).format('MMM D, YYYY')} · {b.nights} {t.nights}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">${b.total}</span>
                        <span className="text-xs text-muted-foreground">{moment(b.created_date).fromNow()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-5xl mb-3">🏠</p>
            <h3 className="font-semibold mb-1">{t.noBookings}</h3>
            <p className="text-sm mb-5">{lang === 'lo' ? 'ຄົ້ນຫາທີ່ພັກໃກ້ທ່ານ' : 'Find a place to stay'}</p>
            <Link to="/explore" className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">{t.explore}</Link>
          </div>
        )
      )}

      {tab === 'services' && (
        serviceBookings.length > 0 ? (
          <div className="space-y-4">
            {serviceBookings.map(b => {
              const st = statusConfig[b.status] || statusConfig.pending;
              const Icon = st.icon;
              return (
                <div key={b.id} className="bg-card rounded-2xl border border-border shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🛎️</div>
                      <div>
                        <p className="font-bold text-sm">{b.service_type || 'Service'}</p>
                        <p className="text-xs text-muted-foreground">{lang === 'lo' ? 'ຈາກ' : 'From'} {b.booker_name || lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ' : 'Service Provider'}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${st.cls}`}>
                      <Icon size={11} /> {st.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {b.service_when && <span className="flex items-center gap-1"><Calendar size={11} /> {b.service_when}</span>}
                    {b.service_duration > 0 && <span className="flex items-center gap-1"><Clock size={11} /> {b.service_duration}h</span>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="font-bold text-primary">${b.price}</span>
                    <span className="text-xs text-muted-foreground">{moment(b.created_date).fromNow()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-5xl mb-3">🛎️</p>
            <h3 className="font-semibold mb-1">{lang === 'lo' ? 'ຍັງບໍ່ມີການຈອງບໍລິການ' : 'No service bookings yet'}</h3>
            <p className="text-sm mb-5">{lang === 'lo' ? 'ຊອກຫາບໍລິການໃນ Feed' : 'Browse services in the Feed'}</p>
            <Link to="/feed" className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">{t.feed}</Link>
          </div>
        )
      )}
    </div>
  );
}