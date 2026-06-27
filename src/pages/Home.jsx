import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import { Search, Globe, Bus, Hotel, Plane, ChefHat, Presentation } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import ListingCard from '../components/ListingCard';
import { BUSINESS_CATS } from '../hooks/useLang';

const iconMap = {
  'all': Globe,
  'tours': Bus,
  'hotels': Hotel,
  'flights': Plane,
  'restaurants': ChefHat,
  'seminars': Presentation,
};

export default function Home() {
  const { t, lang } = useAppContext();
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    firebaseClient.entities.Listing.list('-created_date', 6).then(setListings);
  }, []);

  const handleSearch = () => {
    navigate(`/explore${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };




  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0d3d2e] via-[#1a6b62] to-[#134f44] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=80" alt="" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1 text-[10px] font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            {lang === 'lo' ? 'ເວທີໄວ້ວາງໃຈ' : 'Trusted Community Platform'}
          </div>
          <h1 className="text-xl sm:text-3xl font-bold leading-snug mb-2">
            {lang === 'lo' ? 'ຄົ້ນພົບ ແລະ ແລກປ່ຽນ' : 'Discover, Share &'}{' '}
            <span className="text-emerald-300">{lang === 'lo' ? 'ບໍລິການທີ່ໜ້າເຊື່ອຖື' : 'Book Trusted Services'}</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            {lang === 'lo' ? 'ຊຸມຊົນທີ່ຢືນຢັນຕົວຕົນ · ກະເປົາເງິນດິຈິທັລ · ທົ່ວໂລກ' : 'Verified identities · Digital wallet · Bilingual EN & Lao'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto sm:max-w-none">
            <div
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 flex-1 max-w-sm mx-auto sm:mx-0 shadow-md cursor-pointer"
              onClick={handleSearch}
            >
              <Search size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={lang === 'lo' ? 'ຄົ້ນຫາລາຍຊື່...' : 'Search listings, services...'}
                className="flex-1 bg-transparent text-foreground text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={handleSearch} className="bg-emerald-400 hover:bg-emerald-300 text-[#0d3d2e] px-6 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-md">
              {lang === 'lo' ? 'ຄົ້ນຫາ' : 'Search'}
            </button>
          </div>
        </div>
      </section>

      {/* Category Navigation (Premium Minimalist Design) */}
      <section className="py-6 sm:py-8 bg-card/40 backdrop-blur-xl relative z-10 -mt-10 mx-4 sm:mx-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 max-w-4xl xl:mx-auto overflow-hidden">
        {/* Subtle glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
        
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 px-6 relative z-10">
          {BUSINESS_CATS.filter(c => c.key !== 'all').map((cat) => {
            const Icon = iconMap[cat.key] || Globe;
            return (
              <Link
                key={cat.key}
                to={`/explore?cat=${cat.key}`}
                className="flex flex-col items-center gap-2.5 group cursor-pointer flex-shrink-0 relative pb-2"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#faf8f5] to-[#f0e8df] border border-[#e2d5c5] shadow-sm group-hover:shadow-md text-[#8B7355] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1">
                  <Icon
                    size={22}
                    className="transition-colors duration-300"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-[#8B7355] transition-colors duration-300 text-center whitespace-nowrap tracking-wide">
                  {lang === 'lo' ? cat.lo : cat.en}
                </span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#8B7355] group-hover:w-full transition-all duration-300 rounded-t-full opacity-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </section>



      {/* Featured Listings */}
      <section className="py-7 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">{t.featListTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{listings.length} {t.resultsFound}</p>
          </div>
          <Link to="/explore" className="flex items-center gap-1 text-primary font-medium text-xs hover:underline">
            {t.seeAll} <ArrowRight size={12} />
          </Link>
        </div>
        {listings.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} t={t} lang={lang} />)}
          </div> :
        <div className="text-center py-10 text-muted-foreground">
            <p className="text-3xl mb-2">🏠</p>
            <p className="text-xs">No listings yet. Be the first to create one!</p>
          </div>
        }
      </section>

      {/* Features grid */}
      <section className="py-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-sm sm:text-base font-semibold text-center mb-0.5">{t.featTitle}</h2>
          <p className="text-center text-muted-foreground mb-5 font-lao text-xs">{t.featSub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {t.features.map((f, i) =>
            <div key={i} className="text-center p-4 rounded-xl bg-card hover:shadow-md transition-all duration-200 border border-border hover:border-primary/20 group cursor-default">
                <div className="text-2xl mb-2 group-hover:scale-105 transition-transform">{f.icon}</div>
                <h3 className="font-medium mb-0.5 text-xs text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-[10px] leading-relaxed">{f.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 bg-gradient-to-r from-[#1a6b62] to-[#0d3d2e] text-white text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="text-lg sm:text-xl font-bold mb-2">{t.ctaTitle}</h2>
          <p className="opacity-70 mb-6 text-xs sm:text-sm">{t.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto sm:max-w-none">
            <Link to="/feed" className="bg-white text-primary px-6 py-2.5 rounded-lg font-semibold text-xs hover:opacity-95 transition-opacity shadow-md">
              {t.getStarted}
            </Link>
            <Link to="/explore" className="border border-white/50 text-white px-6 py-2.5 rounded-lg font-semibold text-xs hover:bg-white/10 transition-colors">
              {t.explore}
            </Link>
          </div>
        </div>
      </section>
    </div>);

}