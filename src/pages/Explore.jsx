import { useState, useEffect } from 'react';
import { useAppContext } from '../lib/AppContext';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import ListingCard from '../components/ListingCard';
import { Search, MapPin } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import LocationPickerModal from '../components/LocationPickerModal';
import { getDistanceFromLatLonInKm, extractLatLng } from '../utils/locationUtils';

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
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [searchPosition, setSearchPosition] = useState(null);


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

  const filterData = (data, query, cat, sort, pos) => {
    let result = [...data];
    if (pos) {
      result = result.filter(l => {
        const lPos = extractLatLng(l.location || l.city);
        if (lPos) {
          const dist = getDistanceFromLatLonInKm(pos.lat, pos.lng, lPos.lat, lPos.lng);
          return dist <= 10;
        }
        if (query) {
           const q = query.toLowerCase();
           return l.location?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q);
        }
        return false;
      });
    } else if (query) {
      const q = query.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.title_lao?.includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.description_lao?.includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.city_lao?.includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.country?.toLowerCase().includes(q) ||
        l.amenities?.some(a => a.toLowerCase().includes(q))
      );
    }
    if (cat && cat !== 'all') {
      result = result.filter(l => l.category === cat);
    }
    if (sort === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    setFiltered(result);
  };

  const handleFilter = () => {
    filterData(listings, searchQuery, activeCat, sortBy, searchPosition);
  };

  const handleCatFilter = (cat) => {
    const newCat = activeCat === cat ? '' : cat;
    setActiveCat(newCat);
    filterData(listings, searchQuery, newCat, sortBy, searchPosition);
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
        {/* CreateListing moved to dedicated /create page */}
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl p-3 shadow-sm border border-border mb-4">
        {/* Premium Segmented Control - Sort Options */}
        <div className="flex items-center justify-between bg-muted/40 p-0.5 rounded-lg border border-border/50 mb-3 w-full">
          {[{ v: '', label: lang === 'lo' ? 'ຫຼ້າສຸດ' : 'Recent' }, { v: 'price_low', label: lang === 'lo' ? 'ລາຄາຕໍ່າ' : 'Low Price' }, { v: 'price_high', label: lang === 'lo' ? 'ລາຄາສູງ' : 'High Price' }, { v: 'rating', label: lang === 'lo' ? 'ຄະແນນສູງສຸດ' : 'Top Rated' }].map(opt => (
            <button
              key={opt.v}
              onClick={() => { setSortBy(opt.v); filterData(listings, searchQuery, activeCat, opt.v, searchPosition); }}
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
            onChange={e => { setSearchQuery(e.target.value); setSearchPosition(null); filterData(listings, e.target.value, activeCat, sortBy, null); }}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
          <button 
            onClick={() => setIsLocationPickerOpen(true)}
            className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
            title={lang === 'lo' ? 'ເລືອກສະຖານທີ່' : 'Select Location on Map'}
          >
            <MapPin size={16} />
          </button>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchPosition(null); filterData(listings, '', activeCat, sortBy, null); }}
              className="px-2 py-1 flex-shrink-0 rounded-full text-xs font-semibold bg-muted-foreground/10 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title={lang === 'lo' ? 'ລຶບ' : 'Clear'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <LocationPickerModal 
        isOpen={isLocationPickerOpen} 
        onClose={() => setIsLocationPickerOpen(false)} 
        lang={lang}
        onSelectLocation={(loc, pos) => {
          setSearchQuery(loc);
          setSearchPosition(pos);
          filterData(listings, loc, activeCat, sortBy, pos);
        }}
      />

      {/* Category filters */}
      <CategoryTabs activeType="business" activeCat={activeCat} onSelectCat={handleCatFilter} lang={lang} />

      <p className="text-sm text-muted-foreground mb-4 mt-2">
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
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="font-semibold">{t.noResults}</h3>
        </div>
      )}
    </div>
  );
}