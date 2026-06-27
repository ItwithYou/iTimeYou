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
          text: lang === 'lo' ? 'àºªàº°àºšàº²àºàº”àºµ, àº‚à»‰àº­àºàº•à»‰àº­àº‡àºàº²àº™àº„àº§àº²àº¡àºŠà»ˆàº§àºà»€àº«àº¼àº·àº­' : 'Hello, I need some help',
        });

        await firebaseClient.entities.Conversation.update(conv.id, {
          last_message: lang === 'lo' ? 'àºªàº°àºšàº²àºàº”àºµ, àº‚à»‰àº­àºàº•à»‰àº­àº‡àºàº²àº™àº„àº§àº²àº¡àºŠà»ˆàº§àºà»€àº«àº¼àº·àº­' : 'Hello, I need some help',
          last_message_time: new Date().toISOString(),
        });

        // Notify admin
        await firebaseClient.entities.Notification.create({
          user_email: adminEmail,
          type: 'ðŸ’¬',
          text: `New help request from ${currentUser.email}`,
          text_lao: `àº„àº³àº–àº²àº¡àºŠà»ˆàº§àºà»€àº«àº¼àº·àº­à»ƒà»à»ˆàºˆàº²àº ${currentUser.email}`,
        });
      }

      toast.success(lang === 'lo' ? 'à»€àº›àºµàº”àºàº²àº™àºªàº»àº™àº—àº°àº™àº²àºàº±àºšà»àº­àº±àº”àº¡àº´àº™' : 'Chat started with admin');
      navigate(`/messages?conv=${convId}`);
    } catch (error) {
      toast.error(lang === 'lo' ? 'àºšà»à»ˆàºªàº²àº¡àº²àº”à»€àº›àºµàº”àºàº²àº™àºªàº»àº™àº—àº°àº™àº²à»„àº”à»‰' : 'Failed to start chat');
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
          <h1 className="text-2xl font-bold">{lang === 'lo' ? 'àºªàº¹àº™àºŠà»ˆàº§àºà»€àº«àº¼àº·àº­' : 'Help Center'}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'lo' ? 'àº•àº´àº”àº•à»à»ˆà»àº­àº±àº”àº¡àº´àº™à»€àºžàº·à»ˆàº­àº‚à»àº„àº§àº²àº¡àºŠà»ˆàº§àºà»€àº«àº¼àº·àº­' : 'Contact admin for support'}
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
            {lang === 'lo' ? 'àºªàº»à»ˆàº‡àº‚à»à»‰àº„àº§àº²àº¡àº«àº²à»àº­àº±àº”àº¡àº´àº™' : 'Chat with Admin'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'lo'
              ? 'à»àº­àº±àº”àº¡àº´àº™àºˆàº°àº•àº­àºšàºàº±àºšàº¡àº²à»ƒàº™à»„àº§à»†àº™àºµà»‰'
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
                    {lang === 'lo' ? 'à»àº­àº±àº”àº¡àº´àº™' : 'Administrator'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    <MessageCircle size={12} />
                    {lang === 'lo' ? 'àºªàº»à»ˆàº‡àº‚à»à»‰àº„àº§àº²àº¡' : 'Message'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {lang === 'lo' ? 'àºšà»à»ˆàº¡àºµà»àº­àº±àº”àº¡àº´àº™à»ƒàº™àº¥àº°àºšàº»àºš' : 'No admins available'}
            </p>
          </div>
        )}
      </div>

      {/* FAQ section */}
      <div className="mt-6 bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Clock size={18} />
          {lang === 'lo' ? 'àº„àº³àº–àº²àº¡àº—àºµà»ˆàºžàº»àºšà»€àº¥àº·à»‰àº­àº' : 'FAQ'}
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'àºˆàº°àº•àº´àº”àº•à»à»ˆà»àº­àº±àº”àº¡àº´àº™à»„àº”à»‰à»àº™àº§à»ƒàº”?' : 'How do I contact admin?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'àºàº»àº”àº›àº¸à»ˆàº¡ "àºªàº»à»ˆàº‡àº‚à»à»‰àº„àº§àº²àº¡" àº‚à»‰àº²àº‡à»€àº—àº´àº‡ à»àº¥à»‰àº§àº¥à»àº–à»‰àº²à»àº­àº±àº”àº¡àº´àº™àº•àº­àºš'
                : 'Click the "Message" button above and wait for admin to respond'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'à»€àº§àº¥àº²àº•àº­àºšàºªàº°à»œàº­àº‡à»àº¡à»ˆàº™à»€àº—àº»à»ˆàº²à»ƒàº”?' : 'Response time?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'àºªà»ˆàº§àº™àº«àº¼àº²àºàºˆàº°àº•àº­àºšàºžàº²àºà»ƒàº™ 24 àºŠàº»à»ˆàº§à»‚àº¡àº‡'
                : 'Usually within 24 hours'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">
              {lang === 'lo' ? 'àºˆàº°àºàº§àº”àºªàº­àºšàºàº²àº™àºˆàº­àº‡à»„àº”à»‰à»àº™àº§à»ƒàº”?' : 'How to check bookings?'}
            </p>
            <p className="text-muted-foreground">
              {lang === 'lo'
                ? 'à»„àº›àº—àºµà»ˆà»œà»‰àº² "àºàº²àº™àºˆàº­àº‡" à»ƒàº™à»€àº¡àº™àº¹'
                : 'Go to "Bookings" page from the menu'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}