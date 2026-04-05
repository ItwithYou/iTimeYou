import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar } from 'lucide-react';

export default function Bookings() {
  const { currentUser, t, lang } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Booking.filter({ guest_email: currentUser.email }, '-created_date', 30).then(async data => {
      setBookings(data);
      // Load listings for bookings
      const listingIds = [...new Set(data.map(b => b.listing_id))];
      const allListings = await base44.entities.Listing.list('-created_date', 100);
      const map = {};
      allListings.forEach(l => { map[l.id] = l; });
      setListings(map);
    });
  }, [currentUser]);

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t.bookingsTitle}</h1>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(b => {
            const listing = listings[b.listing_id];
            return (
              <div key={b.id} className="flex flex-col sm:flex-row gap-4 bg-card rounded-xl p-4 shadow-sm">
                {listing && (
                  <Link to={`/listing/${listing.id}`} className="w-full sm:w-32 h-32 sm:h-24 flex-shrink-0">
                    <img src={listing.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  </Link>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <Link to={`/listing/${b.listing_id}`} className="font-semibold text-sm hover:text-primary">
                      {listing ? (lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title) : 'Loading...'}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[b.status] || 'bg-muted text-muted-foreground'}`}>
                      {b.status}
                    </span>
                  </div>
                  {listing && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin size={12} />
                      {lang === 'lo' && listing.city_lao ? listing.city_lao : listing.city}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} />
                    {b.check_in} → {b.check_out} · {b.nights} {t.nights}
                  </p>
                  <p className="font-semibold text-sm mt-1">${b.total} {t.total}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📅</p>
          <h3 className="font-semibold">{t.noBookings}</h3>
          <Link to="/explore" className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
            {t.explore}
          </Link>
        </div>
      )}
    </div>
  );
}