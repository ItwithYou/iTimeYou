import { useState, useEffect } from 'react';
import { useOutletContext, useParams, Link, useNavigate } from 'react-router-dom';
import { coverImage, onImgError } from '../utils/img';
import MobileDatePicker from '../components/MobileDatePicker';
import { base44 } from '@/api/base44Client';
import { Star, MapPin, Users, Bed, Bath, Check, MessageCircle, User } from 'lucide-react';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_ICONS } from '../hooks/useLang';
import { toast } from 'sonner';
import { DEFAULT_EXCHANGE_RATES, deductCrossCurrencyBalance } from '../utils/wallet';
import moment from 'moment';
import { getTodayISO } from '../utils/dateUtils';

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
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    base44.entities.Listing.filter({ id }).then(data => {
      if (data[0]) {
        setListing(data[0]);
        base44.entities.UserProfile.filter({ user_email: data[0].host_email }).then(h => {
          if (h[0]) setHost(h[0]);
        });
      }
    });
    // Load reviews for this listing
    base44.entities.Review.filter({ listing_id: id }).then(data => {
      setReviews(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10));
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
  const bookingCurrency = 'USD';

  const handleBooking = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (!checkIn || !checkOut) { toast.error(t.selectDates); return; }
    if (nights <= 0) { toast.error(t.selectDates); return; }
    if (checkIn < getTodayISO()) {
      toast.error(lang === 'lo' ? 'ບໍ່ສາມາດເລືອກວັນເຊັກອິນທີ່ຜ່ານມາແລ້ວ' : 'Check-in date cannot be in the past');
      return;
    }
    if (checkOut <= checkIn) {
      toast.error(lang === 'lo' ? 'ວັນເຊັກເອົ້າຕ້ອງຫຼັງວັນເຊັກອິນ' : 'Check-out must be after check-in');
      return;
    }
    if (!profile?.is_verified) {
      toast.error(t.needsVerify);
      navigate(`/profile/${profile?.id}`);
      return;
    }
    const balanceUpdate = deductCrossCurrencyBalance(profile, total, bookingCurrency, DEFAULT_EXCHANGE_RATES);
    if (!balanceUpdate) {
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
      currency: bookingCurrency,
      guest_confirmed_completed: false,
      admin_payout_approved: false,
      status: 'confirmed',
    });
    await base44.entities.UserProfile.update(profile.id, {
      wallet_balance_lak: balanceUpdate.wallet_balance_lak,
      wallet_balance_usd: balanceUpdate.wallet_balance_usd,
      wallet_balance_usdt: balanceUpdate.wallet_balance_usdt,
    });
    await base44.entities.WalletTransaction.create({
      user_email: currentUser.email,
      description: listing.title,
      description_lao: listing.title_lao || listing.title,
      amount: -total,
      currency: bookingCurrency,
      type: 'payment',
      status: 'completed',
      request_kind: 'booking_release',
      counterparty_email: listing.host_email,
    });
    setBooked(true);
    toast.success(t.bookingRequested);
  };

  const isLao = lang === 'lo';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="rounded-2xl overflow-hidden h-64 md:h-96 mb-6">
        <img src={coverImage(listing)} alt={listing.title} onError={(e) => onImgError(e, listing)} className="w-full h-full object-cover" />
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

          {/* Reviews section */}
          {reviews.length > 0 && (
            <div className="pt-6 border-t border-border">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Star size={20} className="fill-amber-400 text-amber-400" />
                {t.reviews} ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User size={20} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{review.reviewer_name || 'Guest'}</p>
                          <p className="text-xs text-muted-foreground">{moment(review.created_date).fromNow()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={14} className="fill-amber-400" />
                        <span className="text-sm font-bold">{review.stars}</span>
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    <MobileDatePicker
                      value={checkIn}
                      onChange={(d) => {
                        setCheckIn(d);
                        if (checkOut && d >= checkOut) setCheckOut('');
                      }}
                      placeholder="Select check-in"
                      label="Check-in Date"
                      min={getTodayISO()}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Check-out</label>
                    <MobileDatePicker
                      value={checkOut}
                      onChange={setCheckOut}
                      placeholder="Select check-out"
                      label="Check-out Date"
                      min={checkIn || getTodayISO()}
                    />
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