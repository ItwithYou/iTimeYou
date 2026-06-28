import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import PostCard from '../components/PostCard';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import CategoryTabs from '../components/CategoryTabs';
import LocationPickerModal from '../components/LocationPickerModal';
import { getDistanceFromLatLonInKm, extractLatLng } from '../utils/locationUtils';
import { MapPin } from 'lucide-react';

export default function Feed() {
  const { profile, currentUser, t, lang } = useAppContext();
  const [posts, setPosts] = useState([]);
  const [authorProfiles, setAuthorProfiles] = useState({});
  const [filterCat, setFilterCat] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState(null);

  const loadPosts = async () => {
    const data = await firebaseClient.entities.Post.list('-created_date', 30);
    const emails = [...new Set(data.map(p => p.author_email).filter(Boolean))];
    
    if (emails.length > 0) {
      const profiles = await firebaseClient.entities.UserProfile.list('-created_date', 100);
      const map = {};
      profiles.forEach(p => {
        if (emails.includes(p.user_email)) map[p.user_email] = p;
      });
      setAuthorProfiles(map);
    } else {
      setAuthorProfiles({});
    }
    
    setPosts(data);
  };

  const { refreshing, pullDistance, threshold } = usePullToRefresh(loadPosts, '/feed');

  useEffect(() => { loadPosts(); }, []);

  // Temporary fix for the wrong screenshot image
  useEffect(() => {
    const fixImage = async () => {
      if (localStorage.getItem('fixed_yakuci_image_v4')) return;
      localStorage.setItem('fixed_yakuci_image_v4', 'true');
      
      const posts = await firebaseClient.entities.Post.list('-created_date', 100);
      const targetPost = posts.find(p => p.text?.includes('ຮັບພາທ່ຽວຫຼວງພະບາງ!'));
      if (targetPost) {
        const newUrls = [...(targetPost.photo_urls || [])];
        newUrls[0] = '/green_hills.png';
        await firebaseClient.entities.Post.update(targetPost.id, {
          photo_urls: newUrls,
          photo_url: '/green_hills.png'
        });
      }
    };
    fixImage();
  }, []);

  // Automated one-time seeder for premium demo data — Yakuci admin posts
  useEffect(() => {
    const seedData = async () => {
      if (localStorage.getItem('seeded_yakuci_v12')) return;
      localStorage.setItem('seeded_yakuci_v12', 'true');

      // Clean up old demo posts
      try {
        const oldPosts = await firebaseClient.entities.Post.list('-created_date', 200);
        const toDelete = oldPosts.filter(p =>
          p.author_name === 'Premium User' ||
          p.author_name === 'iTimeYou Admin' ||
          p.author_name === 'Yakuci' ||
          (p.author_name && p.author_name.includes('Latdaphone'))
        );
        for (const p of toDelete) {
          try { await firebaseClient.entities.Post.delete(p.id); } catch {}
        }
      } catch {}

      const ADMIN_EMAIL = 'norecord88@gmail.com';
      const ADMIN_NAME = 'Yakuci';

      const DEMO_POSTS = [
        {
          category: 'talking',
          text: 'ສະບາຍດີ! ພວກເຮົານັກສຶກສາສາວມະຫາວິທະຍາໄລ ຕ້ອງການໝູ່ລົມ ຫຼື ປຶກສາຫາລືແລກປ່ຽນບົດຮຽນ ທີ່ຮ້ານນັ່ງຊິວໆ, ບັນຍາກາດດີໆ ພ້ອມກັບດື່ມເບຍລາວເຢັນໆ. ໃຜສົນໃຈຢາກລົມນຳກັນ ທັກມາໄດ້ເລີຍ! 🍻✨',
          text_en: 'Hello! We are a group of university girls looking for friends or professionals to talk and discuss various topics. We know a very nice place with a great atmosphere to chill and drink cold Beerlao together. Let\'s hang out! 🍻✨',
          text_lo: 'ສະບາຍດີ! ພວກເຮົານັກສຶກສາສາວມະຫາວິທະຍາໄລ ຕ້ອງການໝູ່ລົມ ຫຼື ປຶກສາຫາລືແລກປ່ຽນບົດຮຽນ ທີ່ຮ້ານນັ່ງຊິວໆ, ບັນຍາກາດດີໆ ພ້ອມກັບດື່ມເບຍລາວເຢັນໆ. ໃຜສົນໃຈຢາກລົມນຳກັນ ທັກມາໄດ້ເລີຍ! 🍻✨',
          photo_urls: [
            'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
          service_price: 15, service_type: 'Casual Talk & Drinks', service_location: 'Vientiane Capital', service_currency: 'USD/hour',
        },
        {
          category: 'talking',
          text: 'ສະບາຍດີ! ມີໃຜຢາກຝຶກພາສາອັງກິດບໍ່? ຂ້ອຍເປັນຄູສອນພາສາອັງກິດ ຮັບລົມກັນເປັນພາສາອັງກິດເພື່ອຝຶກການເວົ້າ. ມາລົມກັນ! 💬✨',
          text_en: 'Hello! Anyone wants to practice English? I am an English teacher offering conversation practice. Let us talk! 💬✨',
          text_lo: 'ສະບາຍດີ! ມີໃຜຢາກຝຶກພາສາອັງກິດບໍ່? ຂ້ອຍເປັນຄູສອນພາສາອັງກິດ ຮັບລົມກັນເປັນພາສາອັງກິດເພື່ອຝຶກການເວົ້າ. ມາລົມກັນ! 💬✨',
          photo_urls: [
            'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
          service_price: 10, service_type: 'Language Practice', service_location: 'Online', service_currency: 'USD/hour',
        },
        {
          category: 'home',
          text: 'ບ້ານພັກຕາກອາກາດກາງປ່າທຳມະຊາດໃນລາວ! ງຽບສະຫງົບ, ອາກາດສົດຊື່ນ, ແລະ ໄດ້ສຳຜັດກັບວິຖີຊີວິດຊົນນະບົດແບບແທ້ໆ 🌳🏡',
          text_en: 'Rural forest homestay in Laos! Peaceful, fresh air, and a true taste of authentic countryside living. Your perfect Airbnb-style getaway 🌳🏡',
          text_lo: 'ບ້ານພັກຕາກອາກາດກາງປ່າທຳມະຊາດໃນລາວ! ງຽບສະຫງົບ, ອາກາດສົດຊື່ນ, ແລະ ໄດ້ສຳຜັດກັບວິຖີຊີວິດຊົນນະບົດແບບແທ້ໆ 🌳🏡',
          photo_urls: [
            'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
          service_price: 35, service_type: 'Forest Homestay', service_location: 'Vang Vieng Rural', service_currency: 'USD/night',
        },
        {
          category: 'food',
          text: 'ເຊີນມາກິນເຂົ້ານຳຄອບຄົວລາວແທ້ໆ! ລາບ, ຕຳໝາກຫຸ່ງ, ປີ້ງໄກ່, ເຂົ້າໜຽວ — ອາຫານເຮັດສົດໆຈາກສວນຫຼັງບ້ານ. ປະສົບການທີ່ອົບອຸ່ນ ແລະ ເປັນກັນເອງ 🏡🍚',
          text_en: 'Join a real Lao family dinner at home! Laab, papaya salad, grilled chicken, sticky rice — all freshly made from the backyard garden. A warm and authentic home-hosted experience 🏡🍚',
          text_lo: 'ເຊີນມາກິນເຂົ້ານຳຄອບຄົວລາວແທ້ໆ! ລາບ, ຕຳໝາກຫຸ່ງ, ປີ້ງໄກ່, ເຂົ້າໜຽວ — ອາຫານເຮັດສົດໆຈາກສວນຫຼັງບ້ານ. ປະສົບການທີ່ອົບອຸ່ນ ແລະ ເປັນກັນເອງ 🏡🍚',
          photo_urls: [
            'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?auto=format&fit=crop&w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
          service_price: 15, service_type: 'Family Dinner', service_location: 'Vientiane Home', service_currency: 'USD/person',
        },
        {
          category: 'guide',
          text: 'ຮັບພາທ່ຽວຫຼວງພະບາງ! ຮູ້ຈັກທຸກມຸມເມືອງເກົ່າ, ວັດວາອາຮາມ, ແລະ ຮ້ານອາຫານລັບໆ ທີ່ນັກທ່ອງທ່ຽວບໍ່ຄ່ອຍຮູ້. ຈອງມື້ນີ້! 🗺️🛵',
          text_en: 'Local Luang Prabang guide! I know every corner of the old town, hidden temples, and secret local eateries that tourists usually miss. Book today! 🗺️🛵',
          text_lo: 'ຮັບພາທ່ຽວຫຼວງພະບາງ! ຮູ້ຈັກທຸກມຸມເມືອງເກົ່າ, ວັດວາອາຮາມ, ແລະ ຮ້ານອາຫານລັບໆ ທີ່ນັກທ່ອງທ່ຽວບໍ່ຄ່ອຍຮູ້. ຈອງມື້ນີ້! 🗺️🛵',
          photo_urls: [
            '/mountain.jpg',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&w=800&q=80'
          ],
          photo_url: '/mountain.jpg',
          service_price: 25, service_type: 'Local Guide', service_location: 'Luang Prabang', service_currency: 'USD/day',
        },
      ];

      // Create demo posts in parallel batches of 5 (faster, non-blocking)
      const chunkSize = 5;
      for (let i = 0; i < DEMO_POSTS.length; i += chunkSize) {
        const chunk = DEMO_POSTS.slice(i, i + chunkSize);
        await Promise.all(chunk.map(p => firebaseClient.entities.Post.create({
          ...p,
          author_email: ADMIN_EMAIL,
          author_name: ADMIN_NAME,
          likes: [],
          like_count: Math.floor(Math.random() * 40),
          comment_count: 0,
        })));
      }
      loadPosts();
    };
    seedData();
  }, []);

  // Real-time post subscription for instant updates
  useEffect(() => {
    const unsub = firebaseClient.entities.Post.subscribe((event) => {
      if (event.type === 'create') {
        setPosts(prev => [event.data, ...prev]);
        // Fetch author profile if missing
        if (event.data.author_email && !authorProfiles[event.data.author_email]) {
          firebaseClient.entities.UserProfile.filter({ user_email: event.data.author_email }).then(profiles => {
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
    
    if (filterPosition) {
      const pPos = extractLatLng(p.service_location || p.text);
      if (pPos) {
        const dist = getDistanceFromLatLonInKm(filterPosition.lat, filterPosition.lng, pPos.lat, pPos.lng);
        if (dist <= 10) return true;
      }
      // fallback text search if location didn't have coordinates but was within radius conceptually
      if (filterLocation) {
        const q = filterLocation.toLowerCase();
        const authorProfile = authorProfiles[p.author_email];
        const matchesAuthorLocation = authorProfile?.location?.toLowerCase().includes(q);
        const matchesService = p.service_type?.toLowerCase().includes(q) ||
                              p.text?.toLowerCase().includes(q) ||
                              p.service_location?.toLowerCase().includes(q);
        return matchesAuthorLocation || matchesService;
      }
      return false;
    } else if (filterLocation) {
      const q = filterLocation.toLowerCase();
      const authorProfile = authorProfiles[p.author_email];
      const matchesAuthorLocation = authorProfile?.location?.toLowerCase().includes(q);
      const matchesService = p.service_type?.toLowerCase().includes(q) ||
                            p.text?.toLowerCase().includes(q) ||
                            p.service_location?.toLowerCase().includes(q);
      if (!matchesAuthorLocation && !matchesService) return false;
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
          <CategoryTabs activeType="personal" activeCat={filterCat} onSelectCat={setFilterCat} lang={lang} />
          
          {/* CreateServicePost moved to dedicated /create page */}
            
          {/* Filter tabs */}
          <div className="space-y-3 mb-4">


            {/* Location filters */}
            <div className="flex gap-2 flex-wrap items-center bg-card border border-border rounded-full px-3 focus-within:border-primary transition-colors">
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => { setFilterLocation(e.target.value); setFilterPosition(null); }}
                placeholder={lang === 'lo' ? 'ຊອກຫາບໍລິການ...' : 'Search services...'}
                className="flex-1 min-w-[120px] bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button 
                onClick={() => setIsLocationPickerOpen(true)}
                className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                title={lang === 'lo' ? 'ເລືອກສະຖານທີ່' : 'Select Location on Map'}
              >
                <MapPin size={16} />
              </button>
              {filterLocation && (
                <button
                  onClick={() => { setFilterLocation(''); setFilterPosition(null); }}
                  className="px-2 py-1 rounded-full text-xs font-semibold bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            
            <LocationPickerModal 
              isOpen={isLocationPickerOpen} 
              onClose={() => setIsLocationPickerOpen(false)} 
              lang={lang}
              onSelectLocation={(loc, pos) => {
                setFilterLocation(loc);
                setFilterPosition(pos);
              }}
            />
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