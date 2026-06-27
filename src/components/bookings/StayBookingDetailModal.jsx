import { X, Calendar, Users, Home, AlertCircle, CheckCircle2, DollarSign, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseClient } from '@/api/firebaseClient';
import moment from 'moment';
import { formatTimestampDMY, formatDateDMY } from '../../utils/dateUtils';

const statusConfig = {
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200',             icon: AlertCircle },
};

export default function StayBookingDetailModal({ booking, currentUser, lang, onClose, onRequestCancel, onRequestComplete, onApproveCancel, onDeclineCancel, onMarkCompleted }) {
  const navigate = useNavigate();
  const [hostProfile, setHostProfile] = useState(null);
  const [guestProfile, setGuestProfile] = useState(null);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    if (!booking) return;
    firebaseClient.entities.UserProfile.filter({ user_email: booking.host_email }).then(p => { if (p[0]) setHostProfile(p[0]); });
    firebaseClient.entities.UserProfile.filter({ user_email: booking.guest_email }).then(p => { if (p[0]) setGuestProfile(p[0]); });
    firebaseClient.entities.Listing.get(booking.listing_id).then(setListing);
  }, [booking?.id]);

  if (!booking) return null;

  const status = booking.status || 'confirmed';
  const st = statusConfig[status] || statusConfig.confirmed;

  const isGuest = booking.guest_email === currentUser?.email;
  const isHost = booking.host_email === currentUser?.email;
  const serviceStart = booking.check_in ? moment(booking.check_in) : null;
  const canRequestCancel = isGuest && booking.status !== 'cancelled' && booking.status !== 'completed' && booking.cancel_request_status !== 'requested' && (!serviceStart || serviceStart.isAfter(moment()));
  const canRequestComplete = isGuest && booking.status !== 'cancelled' && booking.status !== 'completed' && booking.complete_request_status !== 'requested';
  const canResolve = (isGuest || isHost || currentUser?.role === 'admin') && booking.cancel_request_status === 'requested' && booking.cancel_requested_by !== currentUser?.email;
  const canMarkCompleted = currentUser?.role === 'admin' && booking.status !== 'completed' && booking.status !== 'cancelled';

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onTouchEnd={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card w-full sm:max-w-lg rounded-2xl p-5 border border-border shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain hide-scrollbar relative" onMouseDown={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <div className="sticky top-[-20px] pt-4 pb-3 mb-4 bg-card z-10 flex items-center justify-between border-b border-border">
          <h3 className="font-bold text-base">{lang === 'lo' ? 'ລາຍລະອຽດການຈອງທີ່ພັກ' : 'Stay Booking Details'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted bg-muted/50"><X size={18} /></button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Listing Info */}
          <div className="bg-gradient-to-r from-tiffany/10 to-deep-green/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              {listing?.images?.[0] ? (
                <img src={listing.images[0]} alt="Stay" className="w-14 h-14 rounded-xl object-cover shadow-sm border border-white/20" />
              ) : (
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                  🏠
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base truncate">{listing ? (lang === 'lo' && listing.title_lao ? listing.title_lao : listing.title) : 'Stay Accommodation'}</p>
                <p className="text-xs text-muted-foreground">{listing ? `${listing.city}, ${listing.country}` : 'Laos'}</p>
              </div>
            </div>
            {hostProfile && (
              <button
                onClick={() => { onClose(); navigate(`/profile/${hostProfile.id}`); }}
                className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  {lang === 'lo' ? 'ເຈົ້າພາບ' : 'Host'}
                </span>
                <div className="flex items-center gap-2">
                  {hostProfile.photo_url && <img src={hostProfile.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />}
                  <span className="text-sm font-bold text-primary underline underline-offset-2">
                    {hostProfile.first_name} {hostProfile.last_name}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Guest Info */}
          {guestProfile && (
            <button
              onClick={() => { onClose(); navigate(`/profile/${guestProfile.id}`); }}
              className="w-full text-left bg-muted/50 rounded-xl p-3 border border-border hover:border-primary/50 transition-colors"
            >
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {lang === 'lo' ? 'ຈອງໂດຍ' : 'Booked by'}
              </p>
              <div className="flex items-center gap-2">
                {guestProfile.photo_url && <img src={guestProfile.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />}
                <div>
                  <p className="text-sm font-medium text-primary">{guestProfile.first_name} {guestProfile.last_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.guest_email}</p>
                </div>
              </div>
            </button>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Calendar size={18} className="text-primary" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Check-in</p>
                <p className="text-sm font-medium">{formatDateDMY(booking.check_in)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Calendar size={18} className="text-primary" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Check-out</p>
                <p className="text-sm font-medium">{formatDateDMY(booking.check_out)}</p>
              </div>
            </div>
          </div>

          {/* Booking Details Summary */}
          <div className="flex gap-6 text-xs text-muted-foreground py-2 px-1 border-b border-border">
            <span className="flex items-center gap-1"><Users size={14} /> {booking.guests} Guests</span>
            <span className="flex items-center gap-1"><Home size={14} /> {booking.nights} Nights</span>
          </div>

          {/* Total Price */}
          <div className="bg-gradient-to-r from-success/10 to-emerald-100/50 rounded-xl p-4 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === 'lo' ? 'ລາຄາທັງໝົດ' : 'Total Paid'}
              </span>
              <span className="text-xl font-bold text-success flex items-center">
                <DollarSign size={16} /> {booking.total} {booking.currency || 'USD'}
              </span>
            </div>
          </div>

          {/* Completion Status */}
          {booking.complete_request_status === 'requested' && booking.status !== 'completed' && (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 space-y-2">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <CheckCircle2 size={16} />
                {lang === 'lo' ? 'ລູກຄ້າໄດ້ຮັບການບໍລິການແລ້ວ (ລໍຖ້າ Admin ໂອນເງິນ)' : 'Customer received service (Waiting for Admin to release payment)'}
              </p>
            </div>
          )}

          {/* Cancellation Status */}
          {booking.cancel_request_status === 'requested' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertCircle size={16} />
                {lang === 'lo' ? 'ມີຄຳຂໍຍົກເລີກ' : 'Cancellation Requested'}
              </p>
              <div className="text-xs text-amber-700 space-y-1">
                <p><span className="font-semibold">{lang === 'lo' ? 'ຂໍໂດຍ:' : 'Requested by:'}</span> {booking.cancel_requested_by}</p>
                {booking.cancel_requested_at && (
                  <p><span className="font-semibold">{lang === 'lo' ? 'ເວລາ:' : 'Time:'}</span> {formatTimestampDMY(booking.cancel_requested_at)}</p>
                )}
              </div>
            </div>
          )}

          {booking.cancel_request_status === 'approved' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 size={14} />
                {lang === 'lo' ? 'ການຍົກເລີກໄດ້ຮັບການອະນຸມັດ' : 'Cancellation Approved'}
              </p>
            </div>
          )}

          {booking.cancel_request_status === 'declined' && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="flex items-center gap-2 font-semibold text-destructive">
                <XCircle size={14} />
                {lang === 'lo' ? 'ການຍົກເລີກຖືກປະຕິເສດ' : 'Cancellation Declined'}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
            <p>{lang === 'lo' ? 'ສ້າງເມື່ອ' : 'Created'}: {formatTimestampDMY(booking.created_date)}</p>
            <p>Booking ID: {booking.id}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {canRequestComplete && (
            <button onClick={() => onRequestComplete(booking)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity">
              {lang === 'lo' ? 'ໄດ້ຮັບການບໍລິການແລ້ວ (Got Service)' : 'Got Service'}
            </button>
          )}
          {canRequestCancel && (
            <button onClick={() => onRequestCancel(booking)} className="w-full bg-destructive text-destructive-foreground py-3 rounded-xl font-semibold text-sm">
              {lang === 'lo' ? 'ສົ່ງຄຳຂໍຍົກເລີກ' : 'Send Cancel Request'}
            </button>
          )}
          {canResolve && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onApproveCancel(booking)} className="bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">
                {lang === 'lo' ? 'ອະນຸມັດ' : 'Approve'}
              </button>
              <button onClick={() => onDeclineCancel(booking)} className="border border-border py-3 rounded-xl font-semibold text-sm">
                {lang === 'lo' ? 'ບໍ່ອະນຸມັດ' : 'Decline'}
              </button>
            </div>
          )}
          {canMarkCompleted && (
            <button onClick={() => onMarkCompleted(booking)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm">
              {lang === 'lo' ? 'ໝາຍເປັນສຳເລັດ ແລະ ໂອນເງິນ' : 'Mark completed and release payment'}
            </button>
          )}
          <button onClick={onClose} className="w-full border border-border py-3 rounded-xl font-semibold text-sm">
            {lang === 'lo' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
