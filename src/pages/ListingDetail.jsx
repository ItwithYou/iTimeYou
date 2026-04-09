import { useState, useEffect } from 'react';
import { useOutletContext, useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, MapPin, Users, Bed, Bath, Check, MessageCircle } from 'lucide-react';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_ICONS } from '../hooks/useLang';
import { toast } from 'sonner';

export default function ListingDetail() {
  const { id } = useParams();
  const { profile, currentUser, t, lang } = useOutletContext();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [host, setHost] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    base44.entities.Listing.filter({ id }).then(data => {
      if (data[0]) {
        setListing(data[0]);
        base44.entities.UserProfile.filter({ user_email: data[0].host_email }).then(h => {
          if (h[0]) setHost(h[0]);
        });
      }
    });
  }, [id]);

  if (!listing) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;
  const subtotal = listing.price * nights;
  const total = subtotal + (listing.cleaning_fee || 0) + (listing.service_fee || 0);

  const handleBooking = async () => {
    if (!checkIn || !checkOut) { toast.error(t.selectDates); return; }
    if (nights <= 0) { toast.error(t.selectDates); return; }
    if (!profile?.is_verified) {
      toast.error(t.needsVerify);
      navigate(`/profile/${profile?.id}`);
      return;
    }
    if (profile.wallet_balance < total) {
      toast.error(t.insufficientBalance);
      return;
    }
    await base44.entities.Booking.create({
      listing_id: listing.id,
      guest_email: currentUser.email,
      host_email: listing.host_email,
      check_in: checkIn,
      check_out: checkOut,
      guests: guestCount,
      nights,
      total,
      status: 'pending',
    });
    await base44.entities.UserProfile.update(profile.id, {
      wallet_balance: profile.wallet_balance - total,
    });
    await base44.entities.WalletTransaction.create({
      user_email: currentUser.email,
      description: listing.title,
      description_lao: listing.title_lao || listing.title,
      amount: -total,
      type: 'payment',
    });
    setBooked(true);
    toast.success(t.bookingRequested);
  };

  const isLao = lang === 'lo';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="rounded-2xl overflow-hidden h-64 md:h-96 mb-6">
        <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {isLao && listing.title_lao ? listing.title_lao : listing.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-gold font-semibold">
                <Star size={14} className="fill-gold" />
                {(listing.rating || 0).toFixed(1)} · {listing.review_count || 0} {t.reviews}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {isLao && listing.city_lao ? listing.city_lao : listing.city}, {listing.country}
              </span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                {CAT_ICONS[listing.category]} {listing.category}
              </span>
            </div>
          </div>

          {/* Host card */}
          {host && (
            <div className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm">
              <Link to={`/profile/${host.id}`} className="flex items-center gap-3">
                <img
                  src={host.photo_url || host.avatar_url || ''}
                  alt="" className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-sm">{t.hostedBy} {host.first_name}</h3>
                  <div className="flex items-center gap-2">
                    <StarRating rating={host.trust_stars || 0} size={12} />
                    <TrustBadge stars={host.trust_stars || 0} lang={lang} />
                    {host.is_verified && <span className="text-xs text-emerald-600">✅</span>}
                  </div>
                </div>
              </Link>
              <Link to="/messages" className="flex items-center gap-1 border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors">
                <MessageCircle size={14} />
                {t.message}
              </Link>
            </div>
          )}

          {/* Details */}
          <div className="flex gap-6 text-sm text-muted-foreground py-4 border-b border-border">
            <span className="flex items-center gap-1"><Users size={16} /> {listing.guests} {t.guests}</span>
            <span className="flex items-center gap-1"><Bed size={16} /> {listing.beds} {t.beds}</span>
            <span className="flex items-center gap-1"><Bath size={16} /> {listing.baths} {t.bath}</span>
          </div>

          <div className="py-4 border-b border-border">
            <h2 className="font-semibold text-lg mb-2">{t.about}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isLao && listing.description_lao ? listing.description_lao : listing.description}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-3">{t.amenities}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(listing.amenities || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} className="text-secondary" />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking panel */}
        <div className="lg:sticky lg:top-20 self-start">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            {!booked ? (
              <>
                <div className="text-2xl font-bold text-primary mb-1">
                  ${listing.price} <span className="text-base font-normal text-muted-foreground">{t.perNight}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Check-in</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Check-out</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-muted-foreground">{t.guests}</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button onClick={() => setGuestCount(g => Math.max(1, g - 1))} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors select-none">−</button>
                    <span className="flex-1 text-center font-bold text-sm border border-border rounded-xl py-2 bg-muted/40">{guestCount} {t.guests}</span>
                    <button onClick={() => setGuestCount(g => Math.min(listing.guests || 1, g + 1))} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors select-none">+</button>
                  </div>
                </div>
                {nights > 0 && (
                  <div className="border-t border-border pt-3 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>${listing.price} × {nights} {t.nights}</span>
                      <span>${subtotal}</span>
                    </div>
                    {listing.cleaning_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>{t.cleaning}</span>
                        <span>${listing.cleaning_fee}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>{t.service}</span>
                      <span>${listing.service_fee || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border pt-2">
                      <span>{t.total}</span>
                      <span>${total}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleBooking}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t.requestBook}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-2">💰 {t.payViaWallet}</p>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-bold text-success mb-1">{t.bookingRequested}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.paidVia}: ${total}</p>
                <Link to="/bookings" className="block w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold text-center hover:opacity-90">
                  {t.viewBookings}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}