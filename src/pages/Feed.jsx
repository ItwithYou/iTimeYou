import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import MobileSelect from '../components/MobileSelect';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PostCard from '../components/PostCard';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import CreateServicePost from '../components/CreateServicePost';

export default function Feed() {
  const { profile, currentUser, t, lang } = useAppContext();
  const [posts, setPosts] = useState([]);
  const [authorProfiles, setAuthorProfiles] = useState({});
  const [filterCat, setFilterCat] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const loadPosts = async () => {
    const data = await base44.entities.Post.list('-created_date', 30);
    setPosts(data);

    const emails = [...new Set(data.map(p => p.author_email).filter(Boolean))];
    if (emails.length === 0) {
      setAuthorProfiles({});
      return;
    }

    const profiles = await base44.entities.UserProfile.list('-created_date', 100);
    const map = {};
    profiles.forEach(p => {
      if (emails.includes(p.user_email)) map[p.user_email] = p;
    });
    setAuthorProfiles(map);
  };

  const { refreshing, pullDistance, threshold } = usePullToRefresh(loadPosts, '/feed');

  useEffect(() => { loadPosts(); }, []);

  // Automated one-time seeder for premium demo data
  useEffect(() => {
    const seedData = async () => {
      if (localStorage.getItem('seeded_demo_data_v3') || !currentUser) return;
      localStorage.setItem('seeded_demo_data_v3', 'true');
      
      const DEMO_POSTS = [
        // CULTURE
        { category: 'culture', text: 'Stunning morning views at the golden stupa in Vientiane. The heritage here is incredibly well-preserved! 🙏✨ #Laos #Culture', photo_url: 'https://images.unsplash.com/photo-1590396472288-51829e2f9d6c?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'culture', text: 'The traditional Baci ceremony setup. Such a beautiful way to welcome guests and wish them good fortune. 🌸', photo_url: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'culture', text: 'Exploring the ancient temples of Luang Prabang. The intricate wood carvings on the doors are a masterpiece of craftsmanship.', photo_url: 'https://images.unsplash.com/photo-1605648814781-a9f826372d82?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'culture', text: 'Alms giving ceremony at dawn. A deeply spiritual and peaceful experience in the old town. 🌅', photo_url: 'https://images.unsplash.com/photo-1549491873-1082c9769352?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'culture', text: 'Beautiful traditional Lao silk weaving. The patterns tell stories that have been passed down for generations! 🧵', photo_url: 'https://images.unsplash.com/photo-1528169941961-80f4f9fde2c9?auto=format&fit=crop&w=800&q=80', service_price: 0 },

        // STAY
        { category: 'stay', text: 'Luxury riverside villa available for this weekend. Features a private infinity pool overlooking the Mekong. Book now! 🌊🏨', photo_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80', service_price: 250, service_type: 'Luxury Villa', service_location: 'Luang Prabang', service_currency: 'USD' },
        { category: 'stay', text: 'Cozy boutique hotel in the heart of Vientiane. Walking distance to all major cafes and the night market. 🛏️☕', photo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', service_price: 85, service_type: 'Boutique Room', service_location: 'Vientiane', service_currency: 'USD' },
        { category: 'stay', text: 'Eco-lodge surrounded by lush jungle and rice paddies. Perfect for a digital detox retreat. 🌿🛖', photo_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80', service_price: 120, service_type: 'Eco Lodge', service_location: 'Vang Vieng', service_currency: 'USD' },
        { category: 'stay', text: 'Modern penthouse apartment with panoramic city views. Features a full kitchen and high-speed fiber internet. 🏙️💻', photo_url: 'https://images.unsplash.com/photo-1502672260266-1c15a8223d61?auto=format&fit=crop&w=800&q=80', service_price: 150, service_type: 'Penthouse', service_location: 'Vientiane', service_currency: 'USD' },
        { category: 'stay', text: 'Charming traditional wooden guesthouse. Experience authentic local living with premium modern comforts. 🪵✨', photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', service_price: 65, service_type: 'Guesthouse', service_location: 'Luang Prabang', service_currency: 'USD' },

        // FOOD
        { category: 'food', text: 'The best Khao Soi in town! Rich, spicy, and absolutely packed with flavor. You have to try this. 🍜🌶️', photo_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80', service_price: 5, service_type: 'Local Cuisine', service_location: 'Night Market', service_currency: 'USD' },
        { category: 'food', text: 'Freshly made Papaya Salad (Tum Mak Hoong) with sticky rice. The ultimate comfort food! 🔥🥗', photo_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'food', text: 'Premium high-tea experience overlooking the river. A perfect blend of French pastries and local flavors. 🫖🥐', photo_url: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80', service_price: 35, service_type: 'High Tea', service_location: 'Riverside Lounge', service_currency: 'USD' },
        { category: 'food', text: 'Authentic Lao BBQ (Muu Kra Tha) night with friends! Nothing beats grilling under the stars. 🥩✨', photo_url: 'https://images.unsplash.com/photo-1544025162-8111149f4851?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'food', text: 'Fresh tropical fruit platter and coconut water to beat the afternoon heat. 🥥🥭', photo_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80', service_price: 0 },

        // EXPERIENCE
        { category: 'experience', text: 'Hot air balloon ride at sunrise over the karst mountains. A breathtaking, once-in-a-lifetime view! 🎈🌄', photo_url: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80', service_price: 120, service_type: 'Balloon Tour', service_location: 'Vang Vieng', service_currency: 'USD' },
        { category: 'experience', text: 'Guided trekking through the pristine jungle. We spotted rare birds and discovered hidden waterfalls! 🥾🦜', photo_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80', service_price: 45, service_type: 'Jungle Trek', service_location: 'Nam Ha NPA', service_currency: 'USD' },
        { category: 'experience', text: 'Sunset cruise down the Mekong river. Includes a traditional dinner and drinks on board. 🛥️🍷', photo_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', service_price: 60, service_type: 'River Cruise', service_location: 'Mekong River', service_currency: 'USD' },
        { category: 'experience', text: 'Hands-on traditional pottery masterclass. Learn how to craft and fire your own clay bowls! 🏺🤲', photo_url: 'https://images.unsplash.com/photo-1610756055562-b94f6e1f0e42?auto=format&fit=crop&w=800&q=80', service_price: 30, service_type: 'Pottery Class', service_location: 'Artisan Village', service_currency: 'USD' },
        { category: 'experience', text: 'Swimming in the turquoise tiers of Kuang Si. The water is incredibly refreshing! 💦🦋', photo_url: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&w=800&q=80', service_price: 0 },

        // HOME
        { category: 'home', text: 'Just listed: Beautiful fully furnished 3-bedroom villa with a private garden. Ready to move in! 🏡🔑', photo_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', service_price: 1200, service_type: 'Villa Rental', service_location: 'Sisattanak District', service_currency: 'USD/mo' },
        { category: 'home', text: 'Modern minimalist interior design service. We transform empty spaces into luxurious, cozy homes. 🛋️📐', photo_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', service_price: 500, service_type: 'Interior Design', service_location: 'Vientiane', service_currency: 'USD' },
        { category: 'home', text: 'Premium local woodwork and custom furniture making. Solid teak dining tables made to order. 🪑🪚', photo_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80', service_price: 800, service_type: 'Custom Furniture', service_location: 'Vientiane', service_currency: 'USD' },
        { category: 'home', text: 'Spacious loft apartment available downtown. Floor-to-ceiling windows with incredible natural light. 🏙️✨', photo_url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80', service_price: 900, service_type: 'Apartment', service_location: 'Chanthabouly', service_currency: 'USD/mo' },
        { category: 'home', text: 'Professional home cleaning and deep-sanitization service. Book us for a sparkling clean home today! 🧹🧼', photo_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80', service_price: 40, service_type: 'Cleaning Service', service_location: 'Vientiane', service_currency: 'USD' },

        // NATURE
        { category: 'nature', text: 'The misty morning views over the limestone karst mountains are completely surreal. Nature at its finest. ⛰️🌫️', photo_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'nature', text: 'Hidden jungle waterfalls that take your breath away. The hike was tough but absolutely worth it! 🌿💦', photo_url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'nature', text: 'A golden sunset reflecting perfectly over the calm waters of the Mekong. Peaceful and quiet. 🌅🛶', photo_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'nature', text: 'Incredible bio-diversity in the national protected areas. Spotted so many beautiful wild orchids blooming! 🌸🍃', photo_url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80', service_price: 0 },
        { category: 'nature', text: 'Paddling through the quiet cave rivers. The stalactites are huge and glowing in the dark! 🚣‍♂️🦇', photo_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', service_price: 0 },
      ];

      for (const p of DEMO_POSTS) {
        await base44.entities.Post.create({
          ...p,
          author_email: currentUser.email,
          author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Premium User',
          likes: [],
          like_count: Math.floor(Math.random() * 50) + 1,
          comment_count: 0
        });
      }
      loadPosts();
    };
    seedData();
  }, [currentUser, profile]);

  // Real-time post subscription for instant updates
  useEffect(() => {
    const unsub = base44.entities.Post.subscribe((event) => {
      if (event.type === 'create') {
        setPosts(prev => [event.data, ...prev]);
        // Fetch author profile if missing
        if (event.data.author_email && !authorProfiles[event.data.author_email]) {
          base44.entities.UserProfile.filter({ user_email: event.data.author_email }).then(profiles => {
            if (profiles[0]) setAuthorProfiles(prev => ({ ...prev, [event.data.author_email]: profiles[0] }));
          });
        }
      } else if (event.type === 'update') {
        setPosts(prev => prev.map(p => p.id === event.id ? { ...p, ...event.data } : p));
      } else if (event.type === 'delete') {
        setPosts(prev => prev.filter(p => p.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    if (filterLocation) {
      const authorProfile = authorProfiles[p.author_email];
      const matchesAuthorLocation = authorProfile?.location?.toLowerCase().includes(filterLocation.toLowerCase());
      const matchesService = p.service_type?.toLowerCase().includes(filterLocation.toLowerCase()) ||
                            p.text?.toLowerCase().includes(filterLocation.toLowerCase()) ||
                            p.service_location?.toLowerCase().includes(filterLocation.toLowerCase());
      if (!matchesAuthorLocation && !matchesService) return false;
    }
    if (filterGender) {
      const authorProfile = authorProfiles[p.author_email];
      if (!authorProfile?.gender || authorProfile.gender !== filterGender) return false;
    }
    return true;
  });

  // Get unique locations from all posts
  const uniqueLocations = [...new Set(Object.values(authorProfiles).map(p => p.location).filter(Boolean))];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5">
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 8 || refreshing) &&
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 bg-card shadow-lg rounded-full p-2.5 border border-border pointer-events-none"
        style={{ top: `calc(4rem + ${Math.min(pullDistance * 0.6, 48)}px)` }}>
        
          {refreshing ?
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> :
        <RefreshCw size={18} className="text-primary" style={{ transform: `rotate(${pullDistance * 4}deg)`, opacity: Math.min(pullDistance / threshold, 1) }} />
        }
        </div>
      }
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block space-y-3">
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border text-center">
            <div className="relative inline-block mb-3">
              <img
                src={profile?.photo_url || profile?.avatar_url || ''}
                alt=""
                className="w-16 h-16 rounded-full border-3 border-primary object-cover" />
              
              {profile?.is_verified &&
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
              }
            </div>
            <h3 className="font-bold text-sm">{profile?.first_name} {profile?.last_name}</h3>
            <div className="mt-1.5 flex justify-center">
              <StarRating rating={profile?.trust_stars || 0} size={13} />
            </div>
            <div className="mt-1.5">
              <TrustBadge stars={profile?.trust_stars || 0} lang={lang} />
            </div>
            {profile?.bio && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{lang === 'lo' ? profile?.bio_lao : profile?.bio}</p>}
            <div className="flex justify-around mt-3 pt-3 border-t border-border text-xs">
              <div className="text-center">
                <strong className="text-base font-bold">{(profile?.friends || []).length}</strong>
                <div className="text-muted-foreground">{lang === 'lo' ? 'ຜູ້ຕິດຕາມ' : 'Followers'}</div>
              </div>
              <div className="text-center">
                <strong className="text-base font-bold">{posts.filter((post) => post.author_email === currentUser?.email && post.service_price > 0).length}</strong>
                <div className="text-muted-foreground">{lang === 'lo' ? 'ບໍລິການ' : 'Services'}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-2 shadow-sm">
            {[
            { to: '/explore', icon: '🏛️', label: t.explore },
            { to: '/wallet', icon: '💰', label: t.wallet },
            { to: '/messages', icon: '💬', label: t.messages },
            { to: '/bookings', icon: '📅', label: t.trips },
            { to: '/help', icon: '❓', label: lang === 'lo' ? 'ສູນຊ່ວຍເຫຼືອ' : 'Help Center' }].
            map((item) =>
            <Link key={item.to} to={item.to} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors font-medium">
                <span>{item.icon}</span> {item.label}
              </Link>
            )}
          </div>
        </div>

        {/* Main feed */}
        <div className="lg:col-span-3 space-y-4">
          <CreateServicePost
              profile={profile}
              currentUser={currentUser}
              lang={lang}
              t={t}
              onPosted={loadPosts} />
            
          {/* Filter tabs */}
          <div className="space-y-3 mb-4">
            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                  onClick={() => setFilterCat('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterCat === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  
                🌐 {lang === 'lo' ? 'ທັງໝົດ' : 'All'}
              </button>
              {CAT_KEYS.map((cat, i) =>
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterCat === cat ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  
                  {CAT_ICONS[cat]} {t.categories[i]}
                </button>
                )}
            </div>

            {/* Location and Gender filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => { setFilterLocation(e.target.value); }}
                placeholder={lang === 'lo' ? 'ຊອກຫາບໍລິການ...' : 'Search services...'}
                className="flex-1 min-w-[120px] bg-card border border-border rounded-full px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              <MobileSelect
                value={filterGender}
                onChange={setFilterGender}
                options={[
                  { value: '', label: lang === 'lo' ? 'ເພດ...' : 'Gender...' },
                  { value: 'male', label: lang === 'lo' ? 'ຊາຍ' : 'Male' },
                  { value: 'female', label: lang === 'lo' ? 'ຍິງ' : 'Female' },
                  { value: 'other', label: lang === 'lo' ? 'ອື່ນໆ' : 'Other' },
                ]}
                placeholder={lang === 'lo' ? 'ເພດ...' : 'Gender...'}
                label={lang === 'lo' ? 'ເລືອກເພດ' : 'Filter by Gender'}
                className="!w-auto !min-w-[100px] !rounded-full !py-1.5 !text-xs"
              />
              {(filterLocation || filterGender) && (
                <button
                  onClick={() => { setFilterLocation(''); setFilterGender(''); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post) =>
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={currentUser?.email}
                t={t}
                lang={lang}
                authorProfile={authorProfiles[post.author_email] || null}
                onRefresh={loadPosts} />

              )}
            {filteredPosts.length === 0 &&
              <div className="text-center py-14 text-muted-foreground">
                <p className="text-5xl mb-3">📝</p>
                <p className="font-semibold">{t.noPosts}</p>
              </div>
              }
          </div>
        </div>
      </div>
    </div>);

}