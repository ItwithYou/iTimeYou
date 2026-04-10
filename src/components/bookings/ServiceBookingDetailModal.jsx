import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import moment from 'moment';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200',      icon: AlertCircle },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200',          icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200',             icon: XCircle },
};

export default function ServiceBookingDetailModal({ booking, currentUser, lang, onClose, onRequestCancel, onApproveCancel, onDeclineCancel, onMarkCompleted }) {
  if (!booking) return null;

  const st = statusConfig[booking.status] || statusConfig.pending;

  const isBooker = booking.booker_email === currentUser?.email;
  const isPoster = booking.poster_email === currentUser?.email;
  const serviceStart = booking.service_when ? moment(booking.service_when.split('·')[0].trim()) : null;
  const canRequestCancel = isBooker && booking.status !== 'cancelled' && booking.cancel_request_status !== 'requested' && serviceStart && serviceStart.diff(moment(), 'hours', true) <= 3 && serviceStart.diff(moment(), 'minutes') > 0;
  const canResolve = (isBooker || isPoster || currentUser?.role === 'admin') && booking.cancel_request_status === 'requested' && booking.cancel_requested_by !== currentUser?.email;
  const canMarkCompleted = currentUser?.role === 'admin' && booking.status !== 'completed' && booking.status !== 'cancelled';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{lang === 'lo' ? 'ລາຍລະອຽດການຈອງ' : 'Booking Details'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Service Info */}
          <div className="bg-gradient-to-r from-tiffany/10 to-deep-green/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                🛎️
              </div>
              <div>
                <p className="font-bold text-base">{booking.service_type || 'Service'}</p>
                <p className="text-xs text-muted-foreground">{booking.service_duration} {booking.service_duration_unit || 'hours'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ' : 'Service Provider'}
              </span>
              <span className="text-sm font-bold text-foreground">
                {booking.poster_name || booking.poster_email}
              </span>
            </div>
          </div>

          {/* Booker Info */}
          {booking.booker_name && (
            <div className="bg-muted/50 rounded-xl p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {lang === 'lo' ? 'ຈອງໂດຍ' : 'Booked by'}
              </p>
              <p className="text-sm font-medium">{booking.booker_name}</p>
              <p className="text-xs text-muted-foreground">{booking.booker_email}</p>
            </div>
          )}

          {/* Date & Time */}
          {booking.service_when && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Calendar size={18} className="text-primary" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {lang === 'lo' ? 'ວັນ ແລະ ເວລາ' : 'Date & Time'}
                </p>
                <p className="text-sm font-medium">{booking.service_when}</p>
              </div>
            </div>
          )}

          {/* Duration */}
          {booking.service_duration > 0 && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Clock size={18} className="text-primary" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {lang === 'lo' ? 'ໄລຍະເວລາ' : 'Duration'}
                </p>
                <p className="text-sm font-medium">{booking.service_duration} {booking.service_duration_unit || 'hours'}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {booking.service_location && (
            booking.service_location_map_url ? (
              <a
                href={booking.service_location_map_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors group"
              >
                <MapPin size={18} className="text-primary group-hover:text-primary/80" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}
                  </p>
                  <p className="text-sm font-medium text-primary underline underline-offset-2">{booking.service_location}</p>
                </div>
                <span className="text-xs text-muted-foreground">↗</span>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <MapPin size={18} className="text-primary" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {lang === 'lo' ? 'ສະຖານທີ່' : 'Location'}
                  </p>
                  <p className="text-sm font-medium">{booking.service_location}</p>
                </div>
              </div>
            )
          )}

          {/* Price */}
          <div className="bg-gradient-to-r from-success/10 to-emerald-100/50 rounded-xl p-4 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === 'lo' ? 'ລາຄາ' : 'Total Price'}
              </span>
              <span className="text-xl font-bold text-success">
                {booking.price} {booking.currency || 'USD'}
              </span>
            </div>
          </div>

          {/* Booking Metadata */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {lang === 'lo' ? 'ສ້າງເມື່ອ' : 'Created'}: {new Date(booking.created_date).toLocaleString()}
            </p>
            {booking.wallet_transaction_id && (
              <p className="text-xs text-muted-foreground">
                {lang === 'lo' ? 'ການຈ່າຍເງິນ' : 'Payment'}: ✅ {lang === 'lo' ? 'ສຳເລັດ' : 'Completed'}
              </p>
            )}
          </div>

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
                  <p><span className="font-semibold">{lang === 'lo' ? 'ເວລາ:' : 'Time:'}</span> {new Date(booking.cancel_requested_at).toLocaleString()}</p>
                )}
                {booking.cancel_note && (
                  <div className="mt-2 p-2 bg-amber-100/50 rounded-lg">
                    <p className="font-semibold mb-1">{lang === 'lo' ? 'ເຫດຜົນ:' : 'Reason:'}</p>
                    <p>{booking.cancel_note}</p>
                  </div>
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
              {booking.cancel_resolved_by && (
                <p className="text-xs text-emerald-700 mt-1">
                  {lang === 'lo' ? 'ອະນຸມັດໂດຍ' : 'Approved by'}: {booking.cancel_resolved_by}
                </p>
              )}
            </div>
          )}

          {booking.cancel_request_status === 'declined' && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="flex items-center gap-2 font-semibold text-destructive">
                <XCircle size={14} />
                {lang === 'lo' ? 'ການຍົກເລີກຖືກປະຕິເສດ' : 'Cancellation Declined'}
              </p>
              <p className="text-xs text-destructive mt-1">
                {lang === 'lo' ? 'ອີກຝ່າຍບໍ່ອະນຸມັດ. ກະລຸນາສົນທະນາກັນ ຫຼື ຕິດຕໍ່ admin.' : 'The other side did not approve. Please discuss together or contact admin.'}
              </p>
            </div>
          )}

          {/* Status Badge */}
          {(() => {
            const StatusIcon = st.icon;
            return (
              <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                <StatusIcon size={18} className={st.cls.split(' ')[1]} />
                <span className={`text-sm font-bold ${st.cls.split(' ')[1]}`}>{st.label}</span>
              </div>
            );
          })()}
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