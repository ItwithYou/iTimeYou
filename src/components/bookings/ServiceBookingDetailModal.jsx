import { X, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import moment from 'moment';

export default function ServiceBookingDetailModal({ booking, currentUser, lang, onClose, onRequestCancel, onApproveCancel, onDeclineCancel }) {
  if (!booking) return null;

  const isBooker = booking.booker_email === currentUser?.email;
  const isPoster = booking.poster_email === currentUser?.email;
  const serviceStart = booking.service_when ? moment(booking.service_when.split('·')[0].trim()) : null;
  const canRequestCancel = isBooker && booking.status !== 'cancelled' && booking.cancel_request_status !== 'requested' && serviceStart && serviceStart.diff(moment(), 'hours', true) <= 3 && serviceStart.diff(moment(), 'minutes') > 0;
  const canResolve = (isBooker || isPoster) && booking.cancel_request_status === 'requested' && booking.cancel_requested_by !== currentUser?.email;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{lang === 'lo' ? 'ລາຍລະອຽດການຈອງ' : 'Booking Details'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">{booking.service_type}</p>
            <p className="text-muted-foreground">{lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ' : 'Provider'}: {booking.poster_name || booking.poster_email}</p>
          </div>
          {booking.service_when && <p className="flex items-center gap-2 text-muted-foreground"><Calendar size={14} /> {booking.service_when}</p>}
          {booking.service_duration > 0 && <p className="flex items-center gap-2 text-muted-foreground"><Clock size={14} /> {booking.service_duration}</p>}
          {booking.service_location && <p className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /> {booking.service_location}</p>}
          <p className="font-bold text-primary">{booking.price} {booking.currency || 'USD'}</p>

          {booking.cancel_request_status === 'requested' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-2 font-semibold text-amber-800"><AlertCircle size={14} /> {lang === 'lo' ? 'ມີຄຳຂໍຍົກເລີກ' : 'Cancellation requested'}</p>
              <p className="text-xs text-amber-700 mt-1">{booking.cancel_requested_by}</p>
              {booking.cancel_note && <p className="text-xs text-amber-700 mt-1">{booking.cancel_note}</p>}
            </div>
          )}

          {booking.cancel_request_status === 'declined' && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              {lang === 'lo' ? 'ອີກຝ່າຍບໍ່ອະນຸມັດ. ກະລຸນາສົນທະນາກັນ ຫຼື ຕິດຕໍ່ admin.' : 'The other side did not approve. Please discuss together or contact admin.'}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-2">
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
          <button onClick={onClose} className="w-full border border-border py-3 rounded-xl font-semibold text-sm">
            {lang === 'lo' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}