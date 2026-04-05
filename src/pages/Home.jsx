import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ListingCard from '../components/ListingCard';

export default function Home() {
  const { t, lang } = useOutletContext();
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Listing.list('-created_date', 6).then(setListings);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-secondary to-accent min-h-[520px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-3xl mx-auto text-center text-primary-foreground px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-2">
            {t.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-2 font-lao">{t.heroLao}</p>
          <p className="text-base md:text-lg opacity-85 mb-8 max-w-xl mx-auto">{t.heroDesc}</p>
          <div className="flex bg-card rounded-full p-1.5 shadow-xl max-w-lg mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent px-4 py-2 text-foreground outline-none rounded-full text-sm"
            />
            <button
              onClick={handleSearch}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Search size={16} />
              {t.search}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-1">{t.featTitle}</h2>
          <p className="text-center text-muted-foreground mb-10 font-lao">{t.featSub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {t.features.map((f, i) => (
              <div key={i} className="text-center p-6 rounded-2xl hover:shadow-lg transition-shadow group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold mb-1 text-sm">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t.featListTitle}</h2>
          <Link to="/explore" className="text-primary font-semibold text-sm hover:underline">{t.seeAll}</Link>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} t={t} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🏠</p>
            <p>No listings yet. Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.ctaTitle}</h2>
          <p className="opacity-90 mb-8">{t.ctaDesc}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/feed" className="bg-card text-primary px-8 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              {t.getStarted}
            </Link>
            <Link to="/explore" className="border-2 border-primary-foreground text-primary-foreground px-8 py-3 rounded-lg font-semibold text-sm hover:bg-primary-foreground/10 transition-colors">
              {t.explore}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}