import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ListingCard from '../components/ListingCard';
import CreateListing from '../components/CreateListing';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import { Search } from 'lucide-react';

export default function Explore() {
  const { t, lang, profile, currentUser } = useAppContext();

  const loadData = () => base44.entities.Listing.list('-created_date', 100).then(data => {
    setListings(data);
    filterData(data, searchQuery, activeCat, sortBy);
  });
  const { refreshing, pullDistance, threshold } = usePullToRefresh(loadData, '/explore');
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [activeCat, setActiveCat] = useState('');

  // Automated one-time seeder for premium listings
  useEffect(() => {
    const seedData = async () => {
      if (localStorage.getItem('seeded_explore_data_v2') || !currentUser) return;
      localStorage.setItem('seeded_explore_data_v2', 'true');
      
      const CAT_IMAGES = {
        culture: [
          'https://images.unsplash.com/photo-1590396472288-51829e2f9d6c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1605648814781-a9f826372d82?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1549491873-1082c9769352?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1528169941961-80f4f9fde2c9?auto=format&fit=crop&w=800&q=80'
        ],
        stay: [
          'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c15a8223d61?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
        ],
        food: [
          'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1544025162-8111149f4851?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'
        ],
        experience: [
          'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1610756055562-b94f6e1f0e42?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&w=800&q=80'
        ],
        home: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
        ],
        nature: [
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        ]
      };

      const getImages = (cat, idx) => {
        const arr = [...CAT_IMAGES[cat]];
        for(let i=0; i<idx; i++) arr.push(arr.shift());
        return arr;
      };

      const LISTINGS = [
        // CULTURE
        { category: 'culture', title: 'Golden Stupa Temple Tour', description: 'Experience the stunning morning views at the golden stupa in Vientiane. Guided tours available daily.', price: 25, currency: 'USD', location: 'Vientiane', image_urls: getImages('culture', 0) },
        { category: 'culture', title: 'Traditional Baci Ceremony', description: 'A beautiful way to welcome guests and wish them good fortune. Authentic setup included.', price: 150, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('culture', 1) },
        { category: 'culture', title: 'Ancient Temples Photography Tour', description: 'Explore the ancient temples of Luang Prabang with a professional photographer.', price: 45, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('culture', 2) },
        { category: 'culture', title: 'Alms Giving Morning Experience', description: 'A deeply spiritual and peaceful experience in the old town at dawn.', price: 15, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('culture', 3) },
        { category: 'culture', title: 'Silk Weaving Masterclass', description: 'Learn beautiful traditional Lao silk weaving. The patterns tell stories passed down for generations!', price: 35, currency: 'USD', location: 'Vientiane', image_urls: getImages('culture', 4) },

        // STAY
        { category: 'stay', title: 'Luxury Riverside Villa', description: 'Features a private infinity pool overlooking the Mekong. Perfect for weekends.', price: 250, currency: 'USD/night', location: 'Luang Prabang', image_urls: getImages('stay', 0) },
        { category: 'stay', title: 'Vientiane Boutique Hotel', description: 'Cozy boutique hotel in the heart of Vientiane. Walking distance to all major cafes.', price: 85, currency: 'USD/night', location: 'Vientiane', image_urls: getImages('stay', 1) },
        { category: 'stay', title: 'Eco-Lodge Retreat', description: 'Surrounded by lush jungle and rice paddies. Perfect for a digital detox retreat.', price: 120, currency: 'USD/night', location: 'Vang Vieng', image_urls: getImages('stay', 2) },
        { category: 'stay', title: 'Panoramic Penthouse', description: 'Modern apartment with panoramic city views, full kitchen and high-speed internet.', price: 150, currency: 'USD/night', location: 'Vientiane', image_urls: getImages('stay', 3) },
        { category: 'stay', title: 'Traditional Wooden Guesthouse', description: 'Experience authentic local living with premium modern comforts.', price: 65, currency: 'USD/night', location: 'Luang Prabang', image_urls: getImages('stay', 4) },

        // FOOD
        { category: 'food', title: 'The Best Khao Soi', description: 'Rich, spicy, and absolutely packed with flavor. You have to try this local favorite.', price: 5, currency: 'USD', location: 'Night Market', image_urls: getImages('food', 0) },
        { category: 'food', title: 'Authentic Papaya Salad (Tum Mak Hoong)', description: 'Freshly made with sticky rice. The ultimate comfort food!', price: 4, currency: 'USD', location: 'Vientiane', image_urls: getImages('food', 1) },
        { category: 'food', title: 'Riverside High-Tea Experience', description: 'A perfect blend of French pastries and local flavors overlooking the river.', price: 35, currency: 'USD', location: 'Riverside Lounge', image_urls: getImages('food', 2) },
        { category: 'food', title: 'Lao BBQ (Muu Kra Tha) Feast', description: 'Nothing beats grilling under the stars. Premium meat sets available.', price: 20, currency: 'USD', location: 'Vientiane', image_urls: getImages('food', 3) },
        { category: 'food', title: 'Tropical Fruit & Coconut Bar', description: 'Fresh tropical fruit platter and coconut water to beat the afternoon heat.', price: 8, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('food', 4) },

        // EXPERIENCE
        { category: 'experience', title: 'Sunrise Hot Air Balloon', description: 'Ride at sunrise over the karst mountains. A breathtaking, once-in-a-lifetime view!', price: 120, currency: 'USD', location: 'Vang Vieng', image_urls: getImages('experience', 0) },
        { category: 'experience', title: 'Guided Jungle Trekking', description: 'Trek through pristine jungle. Spot rare birds and discover hidden waterfalls!', price: 45, currency: 'USD', location: 'Nam Ha NPA', image_urls: getImages('experience', 1) },
        { category: 'experience', title: 'Mekong Sunset Cruise', description: 'Includes a traditional dinner and drinks on board down the Mekong river.', price: 60, currency: 'USD', location: 'Mekong River', image_urls: getImages('experience', 2) },
        { category: 'experience', title: 'Traditional Pottery Masterclass', description: 'Learn how to craft and fire your own clay bowls hands-on!', price: 30, currency: 'USD', location: 'Artisan Village', image_urls: getImages('experience', 3) },
        { category: 'experience', title: 'Kuang Si Falls Swimming Tour', description: 'Swim in the turquoise tiers of Kuang Si. Transport and lunch included.', price: 25, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('experience', 4) },

        // HOME
        { category: 'home', title: 'Fully Furnished 3-BR Villa', description: 'Beautiful villa with a private garden. Ready to move in!', price: 1200, currency: 'USD/mo', location: 'Sisattanak District', image_urls: getImages('home', 0) },
        { category: 'home', title: 'Minimalist Interior Design', description: 'We transform empty spaces into luxurious, cozy homes.', price: 500, currency: 'USD', location: 'Vientiane', image_urls: getImages('home', 1) },
        { category: 'home', title: 'Custom Teak Furniture', description: 'Premium local woodwork. Solid teak dining tables made to order.', price: 800, currency: 'USD', location: 'Vientiane', image_urls: getImages('home', 2) },
        { category: 'home', title: 'Downtown Loft Apartment', description: 'Spacious loft with floor-to-ceiling windows and incredible natural light.', price: 900, currency: 'USD/mo', location: 'Chanthabouly', image_urls: getImages('home', 3) },
        { category: 'home', title: 'Deep-Sanitization Cleaning', description: 'Professional home cleaning service. Book us for a sparkling clean home!', price: 40, currency: 'USD', location: 'Vientiane', image_urls: getImages('home', 4) },

        // NATURE
        { category: 'nature', title: 'Karst Mountains Photography', description: 'The misty morning views over the limestone karst mountains are surreal.', price: 50, currency: 'USD', location: 'Vang Vieng', image_urls: getImages('nature', 0) },
        { category: 'nature', title: 'Hidden Waterfall Hike', description: 'Discover hidden jungle waterfalls that take your breath away.', price: 30, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('nature', 1) },
        { category: 'nature', title: 'Mekong Golden Sunset Tour', description: 'A peaceful boat tour to watch the sunset over the calm waters of the Mekong.', price: 20, currency: 'USD', location: 'Vientiane', image_urls: getImages('nature', 2) },
        { category: 'nature', title: 'Wild Orchid Spotting', description: 'Incredible bio-diversity in the national protected areas.', price: 45, currency: 'USD', location: 'Nam Et-Phou Louey', image_urls: getImages('nature', 3) },
        { category: 'nature', title: 'Cave River Paddling', description: 'Paddle through quiet cave rivers with huge glowing stalactites!', price: 35, currency: 'USD', location: 'Kong Lor', image_urls: getImages('nature', 4) },
      ];

      for (const p of LISTINGS) {
        await base44.entities.Listing.create({
          ...p,
          host_email: currentUser.email,
          host_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Premium Host',
          rating: parseFloat((Math.random() * 1 + 4).toFixed(1)),
          review_count: Math.floor(Math.random() * 150) + 10,
        });
      }
      loadData();
    };
    seedData();
  }, [currentUser, profile]);

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
    <div className="max-w-7xl mx-auto px-4 py-6">
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
      <div className="mb-5">
        {profile?.is_pro ? (
          <CreateListing
            profile={{ ...profile, first_name: profile.business_name || profile.first_name, last_name: '' }}
            currentUser={currentUser}
            lang={lang}
            t={t}
            onPosted={loadData}
          />
        ) : (
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex gap-3 items-center">
              <img
                src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
                alt=""
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 bg-muted/50 border border-border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
                {lang === 'lo' ? 'ຕ້ອງຜ່ານ Pro ກ່ອນຈຶ່ງຈະລົງໂພສໃນ Business ໄດ້' : 'You need Pro approval before posting on Business'}
              </div>
              <Link to={`/profile/${profile?.id || ''}`} className="flex-shrink-0 bg-gradient-to-r from-tiffany to-deep-green text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                {profile?.is_verified ? (lang === 'lo' ? 'ສະໝັກ Pro' : 'Apply Pro') : (lang === 'lo' ? 'ຢືນຢັນ' : 'Verify')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 border border-border focus-within:border-primary transition-colors">
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); filterData(listings, e.target.value, activeCat, sortBy); }}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleFilter}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t.search}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {[{ v: '', label: '🕐 Recent' }, { v: 'price_low', label: '💲 Low Price' }, { v: 'price_high', label: '💲 High Price' }, { v: 'rating', label: '⭐ Top Rated' }].map(opt => (
            <button
              key={opt.v}
              onClick={() => { setSortBy(opt.v); filterData(listings, searchQuery, activeCat, opt.v); }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all select-none ${
                sortBy === opt.v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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