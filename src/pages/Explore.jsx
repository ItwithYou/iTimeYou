import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import ListingCard from '../components/ListingCard';
import CreateListing from '../components/CreateListing';
import { BUSINESS_CATS } from '../hooks/useLang';
import { Search } from 'lucide-react';

export default function Explore() {
  const { t, lang, profile, currentUser } = useAppContext();

  const loadData = () => firebaseClient.entities.Listing.list('-created_date', 100).then(data => {
    setListings(data);
    filterData(data, searchQuery, activeCat, sortBy);
  });
  const { refreshing, pullDistance, threshold } = usePullToRefresh(loadData, '/explore');
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [activeCat, setActiveCat] = useState('');



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const initialCat = params.get('cat') || '';
    setSearchQuery(q);
    setActiveCat(initialCat);
    
    firebaseClient.entities.Listing.list('-created_date', 100).then(data => {
      setListings(data);
      filterData(data, q, initialCat, '');
    });
  }, []);

  const filterData = (data, query, cat, sort) => {
    let result = [...data];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.title_lao?.includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.description_lao?.includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.city_lao?.includes(q) ||
        l.country?.toLowerCase().includes(q) ||
        l.amenities?.some(a => a.toLowerCase().includes(q))
      );
    }
    if (cat) {
      result = result.filter(l => l.category === cat);
    }
    if (sort === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    setFiltered(result);
  };

  const handleFilter = () => {
    filterData(listings, searchQuery, activeCat, sortBy);
  };

  const handleCatFilter = (cat) => {
    const newCat = activeCat === cat ? '' : cat;
    setActiveCat(newCat);
    filterData(listings, searchQuery, newCat, sortBy);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 8 || refreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 bg-card shadow-lg rounded-full p-2.5 border border-border pointer-events-none"
          style={{ top: `calc(4rem + ${Math.min(pullDistance * 0.6, 48)}px)` }}
        >
          {refreshing
            ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            : <RefreshCw size={18} className="text-primary" style={{ transform: `rotate(${pullDistance * 4}deg)`, opacity: Math.min(pullDistance / threshold, 1) }} />
          }
        </div>
      )}
      <div className="mb-4">
        {profile?.is_pro || profile?.is_verified ? (
          <CreateListing
            profile={{ ...profile, first_name: profile.business_name || profile.first_name, last_name: '' }}
            currentUser={currentUser}
            lang={lang}
            t={t}
            onPosted={loadData}
          />
        ) : (
          <div className="bg-gradient-to-r from-muted to-muted/30 rounded-xl p-2.5 px-4 flex items-center justify-between border border-border/50">
            <span className="text-xs text-muted-foreground font-medium">
              {lang === 'lo' ? 'àº•à»‰àº­àº‡àº¢àº·àº™àº¢àº±àº™àºšàº±àº™àºŠàºµàºà»ˆàº­àº™àºˆàº¶à»ˆàº‡àºªàº²àº¡àº²àº”àº¥àº»àº‡à»‚àºžàºªà»„àº”à»‰' : 'Account verification required to post'}
            </span>
            <Link to={`/profile/${profile?.id || ''}`} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-90">
              {lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™' : 'Verify'}
            </Link>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl p-3 shadow-sm border border-border mb-4">
        {/* Premium Segmented Control - Sort Options */}
        <div className="flex items-center justify-between bg-muted/40 p-0.5 rounded-lg border border-border/50 mb-3 w-full">
          {[{ v: '', label: lang === 'lo' ? 'àº«àº¼à»‰àº²àºªàº¸àº”' : 'Recent' }, { v: 'price_low', label: lang === 'lo' ? 'àº¥àº²àº„àº²àº•à»à»ˆàº²' : 'Low Price' }, { v: 'price_high', label: lang === 'lo' ? 'àº¥àº²àº„àº²àºªàº¹àº‡' : 'High Price' }, { v: 'rating', label: lang === 'lo' ? 'àº„àº°à»àº™àº™àºªàº¹àº‡àºªàº¸àº”' : 'Top Rated' }].map(opt => (
            <button
              key={opt.v}
              onClick={() => { setSortBy(opt.v); filterData(listings, searchQuery, activeCat, opt.v); }}
              className={`flex-1 text-center truncate px-1 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all select-none ${
                sortBy === opt.v ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border focus-within:border-primary transition-colors">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); filterData(listings, e.target.value, activeCat, sortBy); }}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {BUSINESS_CATS.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCatFilter(cat.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl border transition-all flex flex-col items-center min-w-[80px] ${
              activeCat === cat.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border text-muted-foreground bg-card hover:border-primary/50'
            }`}
          >
            <div className="text-base mb-0.5">{cat.icon}</div>
            <div className="text-[11px] font-bold leading-tight">{lang === 'lo' ? cat.lo : cat.en}</div>
            <div className="text-[9px] opacity-75 mt-0.5 whitespace-nowrap">{lang === 'lo' ? cat.descLo : cat.descEn}</div>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length} {t.resultsFound}
      </p>

      {filtered.length > 0 ? (
        <div className="space-y-6">
          {filtered.map(l => (
            <ListingCard key={l.id} listing={l} t={t} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">ðŸ”</p>
          <h3 className="font-semibold">{t.noResults}</h3>
        </div>
      )}
    </div>
  );
}