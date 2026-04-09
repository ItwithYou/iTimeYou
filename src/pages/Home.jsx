import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ListingCard from '../components/ListingCard';
import { CAT_ICONS, CAT_KEYS } from '../hooks/useLang';

export default function Home() {
  const { t, lang } = useAppContext();
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Listing.list('-created_date', 6).then(setListings);
  }, []);

  const handleSearch = () => {
    navigate(`/explore${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const categories = [
  { key: 'culture', emoji: '🏛️' },
  { key: 'stay', emoji: '🏠' },
  { key: 'food', emoji: '🍜' },
  { key: 'experience', emoji: '🎭' },
  { key: 'home', emoji: '🏡' },
  { key: 'nature', emoji: '🌿' }];


  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[480px] sm:min-h-[560px] flex items-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a6b62] via-[#155e52] to-[#0d3d2e]" />
        <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff33 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ffffff22 0%, transparent 40%)' }} />

        <div className="relative w-full max-w-5xl mx-auto text-white px-5 py-14">
          <div className="absolute top-4 left-4">
            <img src="https://media.base44.com/images/public/69d24b2d55b4f5275f81d6df/5910b1767_image.png" alt="iTimeYou" className="opacity-90 h-10 w-auto" />
          </div>
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={() => base44.auth.redirectToLogin('/')}
              className="border border-white/40 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Log in
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center pt-10">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                <span>Trusted local connections</span>
              </div>
              <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-sm">
                Discover stays, services, and real local experiences in one place.
              </h1>
              <p className="text-base sm:text-lg opacity-90 mb-6 max-w-2xl leading-relaxed">
                iTimeYou helps people connect with trusted hosts, book unique experiences, chat directly, and pay simply inside the app. It’s a faster, more personal way to explore and do business locally.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => base44.auth.redirectToLogin('/')}
                  className="bg-white text-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-95 transition-opacity shadow-lg"
                >
                  Sign up free
                </button>
                <button
                  onClick={handleSearch}
                  className="border border-white/40 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  Explore now
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {[
                  'Chat directly with hosts and users',
                  'Book trusted local services faster',
                  'Pay securely in one simple flow',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 bg-white/10 border border-white/10 rounded-2xl p-3">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl">
              <p className="text-sm font-semibold opacity-90 mb-3">Why people choose iTimeYou</p>
              <div className="space-y-3">
                {[
                  {
                    title: 'Everything in one app',
                    text: 'From finding a place to stay to booking food, culture, and local experiences, everything is easy to discover in one trusted platform.',
                  },
                  {
                    title: 'More trust, less friction',
                    text: 'Profiles, messaging, reviews, and identity verification help people feel confident before they book or connect.',
                  },
                  {
                    title: 'Built for local business growth',
                    text: 'Hosts and service providers can showcase what makes them special, attract customers, and build repeat relationships.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white/10 p-4 border border-white/10">
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm opacity-85 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="py-6 bg-card border-b border-border sticky top-14 z-10">
        <div className="flex gap-3 overflow-x-auto px-4 max-w-6xl mx-auto scrollbar-hide pb-1">
          {categories.map((cat, i) =>
          <Link
            key={cat.key}
            to={`/explore?cat=${cat.key}`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-2xl group-hover:from-primary/20 group-hover:to-secondary/20 transition-all border border-border group-hover:border-primary/30 group-hover:shadow-md">
                {cat.emoji}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center leading-tight max-w-[56px]">
                {t.categories[i]}
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-5 bg-gradient-to-r from-secondary/5 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-6 sm:gap-12">
          {[
          { icon: '🔐', en: 'Verified Hosts', lo: 'ເຈົ້າພາບຢືນຢັນ' },
          { icon: '⭐', en: 'Trust Ratings', lo: 'ຄະແນນຄວາມໜ້າເຊື່ອຖື' },
          { icon: '💰', en: 'Secure eWallet', lo: 'ກະເປົາເງິນປອດໄພ' },
          { icon: '🌏', en: 'EN & Lao', lo: 'ອັງກິດ & ລາວ' }].
          map((f) =>
          <div key={f.en} className="flex items-center gap-2 text-sm">
              <span className="text-xl">{f.icon}</span>
              <span className="font-medium text-muted-foreground">{lang === 'lo' ? f.lo : f.en}</span>
            </div>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-10 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{t.featListTitle}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{listings.length} {t.resultsFound}</p>
          </div>
          <Link to="/explore" className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
            {t.seeAll} <ArrowRight size={14} />
          </Link>
        </div>
        {listings.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => <ListingCard key={l.id} listing={l} t={t} lang={lang} />)}
          </div> :

        <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🏠</p>
            <p>No listings yet. Be the first to create one!</p>
          </div>
        }
      </section>

      {/* Features grid */}
      <section className="py-12 bg-gradient-to-b from-muted/40 to-background">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-1">{t.featTitle}</h2>
          <p className="text-center text-muted-foreground mb-8 font-lao text-sm">{t.featSub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.features.map((f, i) =>
            <div key={i} className="text-center p-5 rounded-2xl bg-card hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 group cursor-default">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold mb-1 text-sm text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-r from-[#1a6b62] to-[#0d3d2e] text-white text-center">
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">{t.ctaTitle}</h2>
          <p className="opacity-85 mb-8 text-sm sm:text-base">{t.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto sm:max-w-none">
            <Link to="/feed" className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-sm hover:opacity-95 transition-opacity shadow-lg">
              {t.getStarted}
            </Link>
            <Link to="/explore" className="border-2 border-white/60 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
              {t.explore}
            </Link>
          </div>
        </div>
      </section>
    </div>);

}