import { useState } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import moment from 'moment';

export default function ServiceAppealsModal({ booking, currentUser, lang, onClose, onUpdated }) {
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const completedAt = booking.completed_at ? new Date(booking.completed_at) : null;
  const now = new Date();
  const daysSinceCompletion = completedAt ? (now - completedAt) / (1000 * 60 * 60 * 24) : null;
  const canAppeal = completedAt && daysSinceCompletion <= 3 && booking.appeal_status === 'none';

  const submitAppeal = async () => {
    if (!appealReason.trim()) {
      toast.error(lang === 'lo' ? 'ກະລຸນາລະບຸເຫດຜົນ' : 'Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      await firebaseClient.entities.ServiceBooking.update(booking.id, {
        appeal_status: 'submitted',
        appeal_submitted_by: currentUser.email,
        appeal_submitted_at: new Date().toISOString(),
        appeal_reason: appealReason,
      });

      await firebaseClient.entities.Notification.create({
        user_email: booking.poster_email,
        type: '⚠️',
        text: `An appeal has been submitted for ${booking.service_type}`,
        text_lao: `ມີການອຸທອນສຳລັບ ${booking.service_type}`,
      });

      toast.success(lang === 'lo' ? 'ສົ່ງຄຳອຸທອນແລ້ວ' : 'Appeal submitted');
      onUpdated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-base mb-2">{lang === 'lo' ? 'ອຸທອນການບໍລິການ' : 'Service Appeal'}</h3>
        
        {completedAt ? (
          <div className="mb-4 p-3 bg-muted rounded-xl">
            <p className="text-sm">
              {lang === 'lo' ? 'ສຳເລັດເມື່ອ:' : 'Completed:'} {moment(completedAt).format('MMM D, YYYY h:mm A')}
            </p>
            <p className={`text-xs mt-1 ${daysSinceCompletion <= 3 ? 'text-emerald-600 font-semibold' : 'text-destructive font-semibold'}`}>
              {daysSinceCompletion <= 3 
                ? (lang === 'lo' ? `${(3 - daysSinceCompletion).toFixed(1)} ມື້ທີ່ຈະອຸທອນ` : `${(3 - daysSinceCompletion).toFixed(1)} days left to appeal`)
                : (lang === 'lo' ? 'ໝົດເຂດອຸທອນແລ້ວ' : 'Appeal window expired')}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-800">{lang === 'lo' ? 'ຍັງບໍ່ທັນສຳເລັດການບໍລິການ' : 'Service not yet completed'}</p>
          </div>
        )}

        {booking.appeal_status !== 'none' ? (
          <div className="mb-4 p-3 bg-muted rounded-xl">
            <p className="text-sm font-semibold">
              {lang === 'lo' ? 'ສະຖານະຄຳອຸທອນ:' : 'Appeal status:'}{' '}
              <span className={booking.appeal_status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'}>
                {booking.appeal_status}
              </span>
            </p>
            {booking.appeal_reason && (
              <p className="text-xs text-muted-foreground mt-2">{booking.appeal_reason}</p>
            )}
            {booking.appeal_resolution_notes && (
              <div className="mt-2 p-2 bg-card rounded-lg border border-border">
                <p className="text-xs font-semibold">{lang === 'lo' ? 'ຄຳຕອບຈາກ admin:' : 'Admin response:'}</p>
                <p className="text-xs text-muted-foreground">{booking.appeal_resolution_notes}</p>
                {booking.appeal_resolved_at && (
                  <p className="text-xs text-muted-foreground mt-1">{moment(booking.appeal_resolved_at).fromNow()}</p>
                )}
              </div>
            )}
          </div>
        ) : canAppeal ? (
          <>
            <label className="block text-sm font-semibold mb-2">{lang === 'lo' ? 'ເຫດຜົນການອຸທອນ' : 'Appeal reason'}</label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder={lang === 'lo' ? 'ອະທິບາຍບັນຫາຂອງທ່ານ...' : 'Describe your issue...'}
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={onClose} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold">
                {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button 
                onClick={submitAppeal} 
                disabled={submitting || !appealReason.trim()}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? '...' : (lang === 'lo' ? 'ສົ່ງຄຳອຸທອນ' : 'Submit Appeal')}
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {lang === 'lo' ? 'ບໍ່ສາມາດອຸທອນໄດ້' : 'Cannot submit appeal'}
          </div>
        )}
      </div>
    </div>
  );
}