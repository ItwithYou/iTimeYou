import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ListingCard from '../components/ListingCard';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import { Search } from 'lucide-react';

export default function Explore() {
  const { t, lang } = useOutletContext();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [activeCat, setActiveCat] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    base44.entities.Listing.list('-created_date', 50).then(data => {
      setListings(data);
      if (q) {
        filterData(data, q, '', '');
      } else {
        setFiltered(data);
      }
    });
  }, []);

  const filterData = (data, query, cat, sort) => {
    let result = [...data];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.title_lao?.includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.city_lao?.includes(q) ||
        l.country?.toLowerCase().includes(q)
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="bg-card rounded-xl p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center border border-border rounded-lg px-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); filterData(listings, searchQuery, activeCat, e.target.value); }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-transparent outline-none"
        >
          <option value="">Recent</option>
          <option value="price_low">Price ↑</option>
          <option value="price_high">Price ↓</option>
          <option value="rating">Rating</option>
        </select>
        <button
          onClick={handleFilter}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t.search}
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CAT_KEYS.map((cat, i) => (
          <button
            key={cat}
            onClick={() => handleCatFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCat === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary'
            }`}
          >
            {CAT_ICONS[cat]} {t.categories[i]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length} {t.resultsFound}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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