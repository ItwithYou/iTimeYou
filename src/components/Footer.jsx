import { Link } from 'react-router-dom';

export default function Footer({ t }) {
  return (
    <footer className="bg-foreground text-card mt-16">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-bold mb-3">⏰ iTimeYou</h4>
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
              <span className="block text-sm text-card/60">Help Center</span>
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