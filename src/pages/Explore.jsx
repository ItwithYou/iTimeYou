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

  // Automated one-time seeder for premium listings
  useEffect(() => {
    const seedData = async () => {
      if (localStorage.getItem('seeded_explore_data_v7') || !currentUser) return;
      localStorage.setItem('seeded_explore_data_v7', 'true');
      
      try {
        const existing = await firebaseClient.entities.Listing.list();
        await Promise.all(existing.map(e => firebaseClient.entities.Listing.delete(e.id)));
      } catch (e) {}
      
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
        return Array.from({ length: 5 }).map((_, i) => 
          `https://picsum.photos/seed/${cat}-${idx}-${i}/500/375`
        );
      };

      const LISTINGS = [
        // TOURS
        { category: 'tours', title: 'Golden Stupa Temple Tour', title_lao: 'ທົວພະທາດຫຼວງສີທອງ', description: 'Experience the stunning morning views at the golden stupa in Vientiane. Guided tours available daily.', description_lao: 'ສຳຜັດກັບບັນຍາກາດຍາມເຊົ້າທີ່ງົດງາມຂອງພະທາດຫຼວງວຽງຈັນ. ມີທົວນຳທ່ຽວທຸກມື້.', price: 25, currency: 'USD', location: 'Vientiane', image_urls: getImages('tours', 0) },
        { category: 'tours', title: 'Traditional Baci Ceremony', title_lao: 'ພິທີບາສີສູ່ຂວັນ', description: 'A beautiful way to welcome guests and wish them good fortune. Authentic setup included.', description_lao: 'ວິທີທີ່ສວຍງາມໃນການຕ້ອນຮັບແຂກ ແລະ ອວຍພອນໃຫ້ໂຊກດີ.', price: 150, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('tours', 1) },
        { category: 'tours', title: 'Ancient Temples Photography Tour', title_lao: 'ທົວຖ່າຍຮູບວັດບູຮານ', description: 'Explore the ancient temples of Luang Prabang with a professional photographer.', description_lao: 'ສຳຫຼວດວັດບູຮານຂອງຫຼວງພະບາງກັບຊ່າງພາບມືອາຊີບ.', price: 45, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('tours', 2) },
        { category: 'tours', title: 'Mekong Golden Sunset Tour', title_lao: 'ທົວເບິ່ງຕາເວັນຕົກດິນ', description: 'A peaceful boat tour to watch the sunset over the calm waters of the Mekong.', description_lao: 'ທົວເຮືອເພື່ອຊົມຕາເວັນຕົກ.', price: 20, currency: 'USD', location: 'Vientiane', image_urls: getImages('tours', 3) },
        { category: 'tours', title: 'Sunrise Hot Air Balloon', title_lao: 'ບອນລູນຍາມເຊົ້າ', description: 'Ride at sunrise over the karst mountains. A breathtaking, once-in-a-lifetime view!', description_lao: 'ຂີ່ບອນລູນເບິ່ງວິວພູເຂົາ.', price: 120, currency: 'USD', location: 'Vang Vieng', image_urls: getImages('tours', 4) },

        // HOTELS
        { category: 'hotels', title: 'Luxury Riverside Villa', title_lao: 'ເຮືອນວິນລາແຄມນ້ຳ', description: 'Features a private infinity pool overlooking the Mekong. Perfect for weekends.', description_lao: 'ມີສະລອຍນ້ຳສ່ວນຕົວເບິ່ງເຫັນແມ່ນ້ຳຂອງ. ເໝາະສຳລັບທ້າຍອາທິດ.', price: 250, currency: 'USD/night', location: 'Luang Prabang', image_urls: getImages('hotels', 0) },
        { category: 'hotels', title: 'Vientiane Boutique Hotel', title_lao: 'ໂຮງແຮມບູຕິກວຽງຈັນ', description: 'Cozy boutique hotel in the heart of Vientiane. Walking distance to all major cafes.', description_lao: 'ໂຮງແຮມທີ່ອົບອຸ່ນໃນໃຈກາງເມືອງວຽງຈັນ.', price: 85, currency: 'USD/night', location: 'Vientiane', image_urls: getImages('hotels', 1) },
        { category: 'hotels', title: 'Eco-Lodge Retreat', title_lao: 'ທີ່ພັກແບບອະນຸລັກທຳມະຊາດ', description: 'Surrounded by lush jungle and rice paddies. Perfect for a digital detox retreat.', description_lao: 'ອ້ອມຮອບໄປດ້ວຍປ່າໄມ້ ແລະ ທົ່ງນາ. ເໝາະສຳລັບການພັກຜ່ອນ.', price: 120, currency: 'USD/night', location: 'Vang Vieng', image_urls: getImages('hotels', 2) },
        { category: 'hotels', title: 'Panoramic Penthouse', title_lao: 'ຫ້ອງແຖວຫຼັງຄາກວ້າງ', description: 'Modern apartment with panoramic city views, full kitchen and high-speed internet.', description_lao: 'ອາພາດເມັນທັນສະໄໝພ້ອມວິວເມືອງ.', price: 150, currency: 'USD/night', location: 'Vientiane', image_urls: getImages('hotels', 3) },
        { category: 'hotels', title: 'Traditional Wooden Guesthouse', title_lao: 'ເຮືອນພັກໄມ້ແບບດັ້ງເດີມ', description: 'Experience authentic local living with premium modern comforts.', description_lao: 'ສຳຜັດກັບການດຳລົງຊີວິດແບບທ້ອງຖິ່ນ.', price: 65, currency: 'USD/night', location: 'Luang Prabang', image_urls: getImages('hotels', 4) },

        // RESTAURANTS
        { category: 'restaurants', title: 'The Best Khao Soi', title_lao: 'ເຂົ້າຊອຍທີ່ແຊບທີ່ສຸດ', description: 'Rich, spicy, and absolutely packed with flavor. You have to try this local favorite.', description_lao: 'ເຂັ້ມຂຸ້ນ, ເຜັດ ແລະ ແຊບຫຼາຍ.', price: 5, currency: 'USD', location: 'Night Market', image_urls: getImages('restaurants', 0) },
        { category: 'restaurants', title: 'Authentic Papaya Salad (Tum Mak Hoong)', title_lao: 'ຕຳໝາກຫຸ່ງ', description: 'Freshly made with sticky rice. The ultimate comfort food!', description_lao: 'ເຮັດສົດໆໃໝ່ໆກັບເຂົ້າໜຽວ. ອາຫານແຊບໆ!', price: 4, currency: 'USD', location: 'Vientiane', image_urls: getImages('restaurants', 1) },
        { category: 'restaurants', title: 'Riverside High-Tea Experience', title_lao: 'ດື່ມຊາຍາມບ່າຍແຄມນ້ຳ', description: 'A perfect blend of French pastries and local flavors overlooking the river.', description_lao: 'ລົດຊາດທ້ອງຖິ່ນແຄມແມ່ນ້ຳ.', price: 35, currency: 'USD', location: 'Riverside Lounge', image_urls: getImages('restaurants', 2) },
        { category: 'restaurants', title: 'Lao BBQ (Muu Kra Tha) Feast', title_lao: 'ຊຸດປີ້ງຊິ້ນ (ໝູກະທະ)', description: 'Nothing beats grilling under the stars. Premium meat sets available.', description_lao: 'ບໍ່ມີຫຍັງດີກວ່າການປີ້ງພາຍໃຕ້ດວງດາວ.', price: 20, currency: 'USD', location: 'Vientiane', image_urls: getImages('restaurants', 3) },
        { category: 'restaurants', title: 'Tropical Fruit & Coconut Bar', title_lao: 'ບາໝາກໄມ້ ແລະ ນ້ຳໝາກພ້າວ', description: 'Fresh tropical fruit platter and coconut water to beat the afternoon heat.', description_lao: 'ໝາກໄມ້ສົດ ແລະ ນ້ຳໝາກພ້າວ.', price: 8, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('restaurants', 4) },

        // FLIGHTS
        { category: 'flights', title: 'Vientiane to Luang Prabang', title_lao: 'ວຽງຈັນ ຫາ ຫຼວງພະບາງ', description: 'Direct flight, includes 20kg baggage.', description_lao: 'ບິນກົງ, ລວມນ້ຳໜັກກະເປົາ 20kg.', price: 45, currency: 'USD', location: 'Vientiane', image_urls: getImages('flights', 0) },
        { category: 'flights', title: 'Vientiane to Pakse', title_lao: 'ວຽງຈັນ ຫາ ປາກເຊ', description: 'Round trip ticket for business class.', description_lao: 'ປີ້ໄປກັບຊັ້ນທຸລະກິດ.', price: 120, currency: 'USD', location: 'Vientiane', image_urls: getImages('flights', 1) },
        { category: 'flights', title: 'Luang Prabang to Hanoi', title_lao: 'ຫຼວງພະບາງ ຫາ ຮ່າໂນ້ຍ', description: 'International flight connection.', description_lao: 'ຖ້ຽວບິນສາກົນ.', price: 90, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('flights', 2) },
        { category: 'flights', title: 'Vientiane to Bangkok', title_lao: 'ວຽງຈັນ ຫາ ບາງກອກ', description: 'Daily flights with budget airlines.', description_lao: 'ຖ້ຽວບິນທຸກມື້.', price: 55, currency: 'USD', location: 'Vientiane', image_urls: getImages('flights', 3) },
        { category: 'flights', title: 'Pakse to Siem Reap', title_lao: 'ປາກເຊ ຫາ ຊຽມຣຽບ', description: 'Explore the Angkor Wat with direct connections.', description_lao: 'ສຳຫຼວດນະຄອນວັດດ້ວຍຖ້ຽວບິນກົງ.', price: 150, currency: 'USD', location: 'Pakse', image_urls: getImages('flights', 4) },

        // SEMINARS
        { category: 'seminars', title: 'Lao Business Networking 2026', title_lao: 'ງານເຄືອຂ່າຍທຸລະກິດລາວ 2026', description: 'Connect with top entrepreneurs in Vientiane. Dinner included.', description_lao: 'ເຊື່ອມຕໍ່ກັບຜູ້ປະກອບການຊັ້ນນຳໃນວຽງຈັນ.', price: 50, currency: 'USD', location: 'Vientiane', image_urls: getImages('seminars', 0) },
        { category: 'seminars', title: 'Digital Marketing Masterclass', title_lao: 'ຮຽນການຕະຫຼາດດິຈິຕອນ', description: 'Learn how to grow your brand online with experts.', description_lao: 'ຮຽນຮູ້ວິທີການສ້າງແບຣນອອນລາຍ.', price: 200, currency: 'USD', location: 'Online', image_urls: getImages('seminars', 1) },
        { category: 'seminars', title: 'Real Estate Investment Summit', title_lao: 'ງານສຳມະນາອະສັງຫາລິມະຊັບ', description: 'Top strategies for investing in Lao property.', description_lao: 'ຍຸດທະສາດການລົງທຶນອະສັງຫາລິມະຊັບ.', price: 120, currency: 'USD', location: 'Vientiane', image_urls: getImages('seminars', 2) },
        { category: 'seminars', title: 'Tourism & Hospitality Workshop', title_lao: 'ງານອົບຮົມການທ່ອງທ່ຽວ', description: 'Improve your service quality for international guests.', description_lao: 'ປັບປຸງຄຸນນະພາບການບໍລິການ.', price: 30, currency: 'USD', location: 'Luang Prabang', image_urls: getImages('seminars', 3) },
        { category: 'seminars', title: 'Tech Startup Pitch Night', title_lao: 'ງານນຳສະເໜີທຸລະກິດເຕັກໂນໂລຊີ', description: 'Watch local startups pitch their ideas to investors.', description_lao: 'ເບິ່ງການນຳສະເໜີໄອເດຍທຸລະກິດ.', price: 15, currency: 'USD', location: 'Vientiane', image_urls: getImages('seminars', 4) },
      ];

      for (const p of LISTINGS) {
        await firebaseClient.entities.Listing.create({
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