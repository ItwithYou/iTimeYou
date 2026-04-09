import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { Search, Star, MapPin, Shield, Globe, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ListingCard from '../components/ListingCard';
import { CAT_ICONS, CAT_KEYS } from '../hooks/useLang';

export default function Home() {
  const { t, lang, profile } = useAppContext();
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

        <div className="relative w-full max-w-3xl mx-auto text-center text-white px-5 py-14">
          <div className="absolute top-4 left-4">
            <img src="https://media.base44.com/images/public/69d24b2d55b4f5275f81d6df/5910b1767_image.png" alt="iTimeYou" className="opacity-40 h-10 w-auto" />
          </div>
          

          
          <h1 className="mb-3 text-sm font-black tracking-tight leading-tight opacity-45 sm:text-5xl drop-shadow-sm">
            {t.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-2 font-lao">{t.heroLao}</p>
          <p className="text-sm sm:text-base opacity-80 mb-8 max-w-xl mx-auto leading-relaxed">{t.heroDesc}</p>

          {/* Search bar */}
          <div className="flex bg-white rounded-2xl p-1.5 shadow-2xl max-w-md mx-auto">
            <div className="flex items-center flex-1 px-3">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent px-3 py-1.5 text-foreground outline-none text-sm" />
              
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-tiffany to-deep-green text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              
              <Search size={15} />
              <span className="hidden sm:inline">{t.search}</span>
            </button>
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