import { Link, useNavigate } from 'react-router-dom';
import { BrandLockup } from './BrandLogo';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';

export default function Footer({ t, lang }) {
  const navigate = useNavigate();

  const startChatWithAdmin = async () => {
    if (!await firebaseClient.auth.isAuthenticated()) {
      firebaseClient.auth.redirectToLogin('/messages');
      return;
    }
    const currentUser = await firebaseClient.auth.me();
    const users = await firebaseClient.entities.User.list('-created_date', 100);
    const admin = users.find(u => u.role === 'admin');
    if (!admin) {
      toast.error(lang === 'lo' ? 'ບໍ່ມີ admin ຢູ່' : 'No admin available');
      return;
    }
    const existing = await firebaseClient.entities.Conversation.list('-updated_date', 50);
    const found = existing.find(c => 
      c.participants?.includes(currentUser.email) && c.participants?.includes(admin.email)
    );
    let convId;
    if (found) {
      convId = found.id;
    } else {
      const conv = await firebaseClient.entities.Conversation.create({
        participants: [currentUser.email, admin.email],
        last_message: ''
      });
      convId = conv.id;
    }
    navigate(`/messages?conv=${convId}`);
  };
  return (
    <footer className="bg-zinc-100 text-zinc-900 mt-16 dark:bg-zinc-950 dark:text-zinc-100 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-3"><BrandLockup markSize={34} textSize={26} tagline /></div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{t.heroDesc}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-zinc-800 dark:text-zinc-200">{t.explore}</h4>
            <div className="space-y-2">
              <Link to="/explore" className="block text-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">Find Stays</Link>
              <Link to="/feed" className="block text-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">Social Feed</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-zinc-800 dark:text-zinc-200">Support</h4>
            <div className="space-y-2">
              <button onClick={startChatWithAdmin} className="block text-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors text-left">Help Center</button>
              <span className="block text-sm text-zinc-600 dark:text-zinc-400">Safety</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-zinc-800 dark:text-zinc-200">Community</h4>
            <div className="space-y-2">
              <span className="block text-sm text-zinc-600 dark:text-zinc-400">Blog</span>
              <span className="block text-sm text-zinc-600 dark:text-zinc-400">Guidelines</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
          © 2024 iTimeYou. All rights reserved. | ສະຫງວນລິຂະສິດ
        </div>
      </div>
    </footer>
  );
}