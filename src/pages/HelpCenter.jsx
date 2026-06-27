import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { firebaseClient } from '@/api/firebaseClient';
import { MessageCircle, Shield, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function HelpCenter() {
  const { currentUser, lang } = useAppContext();
  const navigate = useNavigate();
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const allProfiles = await firebaseClient.entities.UserProfile.list('-created_date', 100);
      const adminEmails = await firebaseClient.entities.User.list();
      const admins = adminEmails.filter(u => u.role === 'admin').map(u => u.email);
      const adminProfiles = allProfiles.filter(p => admins.includes(p.user_email));
      setAdminProfiles(adminProfiles);
    } catch (error) {
      console.error('Failed to load admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChatWithAdmin = async (adminEmail) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const existing = await firebaseClient.entities.Conversation.list('-updated_date', 50);
      const found = existing.find(
        (c) =>
          c.participants?.includes(currentUser.email) &&
          c.participants?.includes(adminEmail)
      );

      let convId;
      if (found) {
        convId = found.id;
      } else {
        const conv = await firebaseClient.entities.Conversation.create({
          participants: [currentUser.email, adminEmail],
          last_message: '',
        });
        convId = conv.id;

        // Send initial message
        await firebaseClient.entities.Message.create({
          conversation_id: conv.id,
          sender_email: currentUser.email,
          text: lang === 'lo' ? 'ສະບາຍດີ, ຂ້ອຍຕ້ອງການຄວາມຊ່ວຍເຫຼືອ' : 'Hello, I need some help',
        });

        await firebaseClient.entities.Conversation.update(conv.id, {
          last_message: lang === 'lo' ? 'ສະບາຍດີ, ຂ້ອຍຕ້ອງການຄວາມຊ່ວຍເຫຼືອ' : 'Hello, I need some help',
          last_message_time: new Date().toISOString(),
        });

        // Notify admin
        await firebaseClient.entities.Notification.create({
          user_email: adminEmail,
          type: '💬',
          text: `New help request from ${currentUser.email}`,
          text_lao: `ຄຳຖາມຊ່ວຍເຫຼືອໃໝ່ຈາກ ${currentUser.email}`,
        });
      }

      toast.success(lang === 'lo' ? 'ເປີດການສົນທະນາກັບແອັດມິນ' : 'Chat started with admin');
      navigate(`/messages?conv=${convId}`);
    } catch (error) {
      toast.error(lang === 'lo' ? 'ບໍ່ສາມາດເປີດການສົນທະນາໄດ້' : 'Failed to start chat');
      console.error('Error starting chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{lang === 'lo' ? 'ສູນຊ່ວຍເຫຼືອ' : 'Help Center'}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'lo' ? 'ຕິດຕໍ່ແອັດມິນເພື່ອຂໍຄວາມຊ່ວຍເຫຼືອ' : 'Contact admin for support'}
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມຫາແອັດມິນ' : 'Chat with Admin'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'lo'
              ? 'ແອັດມິນຈະຕອບກັບມາໃນໄວໆນີ້'
              : 'Our admin team will respond as soon as possible'}
          </p>
        </div>

        {adminProfiles.length > 0 ? (
          <div className="space-y-3">
            {adminProfiles.map((admin) => (
              <button
                key={admin.id}
                onClick={() => startChatWithAdmin(admin.user_email)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted hover:border-primary/50 transition-all text-left"
              >
                <img
                  src={admin.photo_url || admin.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.user_email}`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'lo' ? 'ແອັດມິນ' : 'Administrator'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    <MessageCircle size={12} />
                    {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມ' : 'Message'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {lang === 'lo' ? 'ບໍ່ມີແອັດມິນໃນລະບົບ' : 'No admins available'}
            </p>
          </div>
        )}
      </div>

      {/* FAQ section */}
      <div className="mt-6 bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Clock size={18} />
          {lang === 'lo' ? 'ຄຳຖາມທີ່ພົບເລື້ອຍ' : 'FAQ'}
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'ຈະຕິດຕໍ່ແອັດມິນໄດ້ແນວໃດ?' : 'How do I contact admin?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'ກົດປຸ່ມ "ສົ່ງຂໍ້ຄວາມ" ຂ້າງເທິງ ແລ້ວລໍຖ້າແອັດມິນຕອບ'
                : 'Click the "Message" button above and wait for admin to respond'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'ເວລາຕອບສະໜອງແມ່ນເທົ່າໃດ?' : 'Response time?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'ສ່ວນຫຼາຍຈະຕອບພາຍໃນ 24 ຊົ່ວໂມງ'
                : 'Usually within 24 hours'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'ຈະກວດສອບການຈອງໄດ້ແນວໃດ?' : 'How to check bookings?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'ໄປທີ່ໜ້າ "ການຈອງ" ໃນເມນູ'
                : 'Go to "Bookings" page from the menu'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}