import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BookingCompletionCard({ booking, currentUser, lang, onUpdated }) {
  const isGuest = booking.guest_email === currentUser?.email;
  if (!isGuest || booking.guest_confirmed_completed) return null;

  const handleConfirm = async () => {
    await base44.entities.Booking.update(booking.id, { guest_confirmed_completed: true });
    const admins = await base44.entities.User.list('-created_date', 200).then((users) => users.filter((user) => user.role === 'admin'));
    await Promise.all(admins.map((admin) => base44.entities.Notification.create({
      user_email: admin.email,
      type: '📦',
      text: `Booking ${booking.id} is ready for payout approval`,
      text_lao: `ການຈອງ ${booking.id} ພ້ອມໃຫ້ອະນຸມັດຈ່າຍເງິນ`,
    })));
    toast.success(lang === 'lo' ? 'ຢືນຢັນສຳເລັດ ລໍຖ້າ admin ອະນຸມັດ' : 'Confirmed. Waiting for admin approval.');
    onUpdated?.();
  };

  return (
    <button onClick={handleConfirm} className="mt-3 w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">
      {lang === 'lo' ? 'ຢືນຢັນບໍລິການສຳເລັດ' : 'Confirm service completed'}
    </button>
  );
}