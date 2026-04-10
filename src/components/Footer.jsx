import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Footer({ t, lang }) {
  const navigate = useNavigate();

  const startChatWithAdmin = async () => {
    if (!await base44.auth.isAuthenticated()) {
      base44.auth.redirectToLogin('/messages');
      return;
    }
    const currentUser = await base44.auth.me();
    const users = await base44.entities.User.list('-created_date', 100);
    const admin = users.find(u => u.role === 'admin');
    if (!admin) {
      toast.error(lang === 'lo' ? 'ບໍ່ມີ admin ຢູ່' : 'No admin available');
      return;
    }
    const existing = await base44.entities.Conversation.list('-updated_date', 50);
    const found = existing.find(c => 
      c.participants?.includes(currentUser.email) && c.participants?.includes(admin.email)
    );
    let convId;
    if (found) {
      convId = found.id;
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [currentUser.email, admin.email],
        last_message: ''
      });
      convId = conv.id;
    }
    navigate(`/messages?conv=${convId}`);
  };
  return (
    <footer className="bg-foreground text-card mt-16">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src="https://media.base44.com/images/public/69d24b2d55b4f5275f81d6df/5910b1767_image.png" alt="iTimeYou" className="h-8 w-auto mb-3" />
            <p className="text-card/60 text-sm leading-relaxed">{t.heroDesc}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t.explore}</h4>
            <div className="space-y-2">
              <Link to="/explore" className="block text-sm text-card/60 hover:text-card transition-colors">Find Stays</Link>
              <Link to="/feed" className="block text-sm text-card/60 hover:text-card transition-colors">Social Feed</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <div className="space-y-2">
              <button onClick={startChatWithAdmin} className="block text-sm text-card/60 hover:text-card transition-colors text-left">Help Center</button>
              <span className="block text-sm text-card/60">Safety</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Community</h4>
            <div className="space-y-2">
              <span className="block text-sm text-card/60">Blog</span>
              <span className="block text-sm text-card/60">Guidelines</span>
            </div>
          </div>
        </div>
        <div className="border-t border-card/10 pt-4 text-center text-xs text-card/40">
          © 2024 iTimeYou. All rights reserved. | ສະຫງວນລິຂະສິດ
        </div>
      </div>
    </footer>
  );
}