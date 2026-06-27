import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';

export default function BookingCompletionCard({ booking, currentUser, lang, onUpdated }) {
  const isGuest = booking.guest_email === currentUser?.email;
  if (!isGuest || booking.guest_confirmed_completed) return null;

  const handleConfirm = async () => {
    await firebaseClient.entities.Booking.update(booking.id, { guest_confirmed_completed: true });
    const admins = await firebaseClient.entities.User.list('-created_date', 200).then((users) => users.filter((user) => user.role === 'admin'));
    await Promise.all(admins.map((admin) => firebaseClient.entities.Notification.create({
      user_email: admin.email,
      type: 'ðŸ“¦',
      text: `Booking ${booking.id} is ready for payout approval`,
      text_lao: `àºàº²àº™àºˆàº­àº‡ ${booking.id} àºžà»‰àº­àº¡à»ƒàº«à»‰àº­àº°àº™àº¸àº¡àº±àº”àºˆà»ˆàº²àºà»€àº‡àº´àº™`,
    })));
    toast.success(lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àºªàº³à»€àº¥àº±àº” àº¥à»àº–à»‰àº² admin àº­àº°àº™àº¸àº¡àº±àº”' : 'Confirmed. Waiting for admin approval.');
    onUpdated?.();
  };

  return (
    <button onClick={handleConfirm} className="mt-3 w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">
      {lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àºšà»àº¥àº´àºàº²àº™àºªàº³à»€àº¥àº±àº”' : 'Confirm service completed'}
    </button>
  );
}