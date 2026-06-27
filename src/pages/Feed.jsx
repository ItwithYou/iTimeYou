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

  // Automated one-time seeder for premium demo data — Yakuci admin posts
  useEffect(() => {
    const seedData = async () => {
      if (localStorage.getItem('seeded_yakuci_v3')) return;
      localStorage.setItem('seeded_yakuci_v3', 'true');

      // Clean up old demo posts
      try {
        const oldPosts = await base44.entities.Post.list('-created_date', 200);
        const toDelete = oldPosts.filter(p =>
          p.author_name === 'Premium User' ||
          p.author_name === 'iTimeYou Admin' ||
          p.author_name === 'Yakuci' ||
          (p.author_name && p.author_name.includes('Latdaphone'))
        );
        for (const p of toDelete) {
          try { await base44.entities.Post.delete(p.id); } catch {}
        }
      } catch {}

      const ADMIN_EMAIL = 'norecord88@gmail.com';
      const ADMIN_NAME = 'Yakuci';

      const DEMO_POSTS = [
        {
          category: 'culture',
          text: 'ປີໃໝ່ມົ້ງ 2026! ເທດສະການທີ່ສວຍງາມທີ່ສຸດ — ເຕັ້ນລຳ, ເກມໂຍນລູກບານ, ແລະ ຊຸດມົ້ງດັ້ງເດີມ. ມາສະເຫຼີມສະຫຼອງນຳກັນ! 🎊🌸',
          text_en: 'Hmong New Year 2026! The most beautiful festival — traditional dances, ball-tossing games, and stunning Hmong costumes. Come celebrate with us! 🎊🌸',
          text_lo: 'ປີໃໝ່ມົ້ງ 2026! ເທດສະການທີ່ສວຍງາມທີ່ສຸດ — ເຕັ້ນລຳ, ເກມໂຍນລູກບານ, ແລະ ຊຸດມົ້ງດັ້ງເດີມ. ມາສະເຫຼີມສະຫຼອງນຳກັນ! 🎊🌸',
          photo_urls: [
            'https://images.unsplash.com/photo-1596489481283-36cb9eb070d6?w=800&q=80',
            'https://images.unsplash.com/photo-1628174542289-4b68ce46b1eb?w=800&q=80',
            'https://images.unsplash.com/photo-1582236371720-3351ec8f26db?w=800&q=80',
            'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1596489481283-36cb9eb070d6?w=800&q=80',
          service_price: 0,
        },
        {
          category: 'food',
          text: 'ເຊີນມາກິນເຂົ້ານຳຄອບຄົວລາວແທ້ໆ! ລາບ, ຕຳໝາກຫຸ່ງ, ປີ້ງໄກ່, ເຂົ້າໜຽວ — ອາຫານເຮັດສົດໆຈາກສວນຫຼັງບ້ານ. ປະສົບການທີ່ອົບອຸ່ນ ແລະ ເປັນກັນເອງ 🏡🍚',
          text_en: 'Join a real Lao family dinner at home! Laab, papaya salad, grilled chicken, sticky rice — all freshly made from the backyard garden. A warm and authentic home-hosted experience 🏡🍚',
          text_lo: 'ເຊີນມາກິນເຂົ້ານຳຄອບຄົວລາວແທ້ໆ! ລາບ, ຕຳໝາກຫຸ່ງ, ປີ້ງໄກ່, ເຂົ້າໜຽວ — ອາຫານເຮັດສົດໆຈາກສວນຫຼັງບ້ານ. ປະສົບການທີ່ອົບອຸ່ນ ແລະ ເປັນກັນເອງ 🏡🍚',
          photo_urls: [
            'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
            'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=800&q=80',
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
          service_price: 15, service_type: 'Family Dinner', service_location: 'Vientiane Home', service_currency: 'USD',
        },
        {
          category: 'experience',
          text: 'ນັດລົມກັບຜູ້ຊ່ຽວຊານດ້ານວັດທະນະທຳລາວ! ຮຽນຮູ້ກ່ຽວກັບປະເພນີບາສີ, ການຖັກແສ່ວ, ແລະ ປະຫວັດສາດຊົນເຜົ່າ. ຈອງເວລາ 1 ຊົ່ວໂມງ ເພື່ອສົນທະນາສ່ວນຕົວ 🎓🇱🇦',
          text_en: 'Book a 1-on-1 session with a Lao cultural expert! Learn about Baci traditions, silk weaving heritage, and ethnic group history. 1-hour private consultation available 🎓🇱🇦',
          text_lo: 'ນັດລົມກັບຜູ້ຊ່ຽວຊານດ້ານວັດທະນະທຳລາວ! ຮຽນຮູ້ກ່ຽວກັບປະເພນີບາສີ, ການຖັກແສ່ວ, ແລະ ປະຫວັດສາດຊົນເຜົ່າ. ຈອງເວລາ 1 ຊົ່ວໂມງ ເພື່ອສົນທະນາສ່ວນຕົວ 🎓🇱🇦',
          photo_urls: [
            'https://images.unsplash.com/photo-1615568153396-1c0b115682b7?w=800&q=80',
            'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
            'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1615568153396-1c0b115682b7?w=800&q=80',
          service_price: 25, service_type: 'Expert Session', service_location: 'Online / Vientiane', service_currency: 'USD',
        },
        {
          category: 'nature',
          text: 'ທຳມະຊາດຂອງລາວງາມຫຼາຍ! ນ້ຳຕົກຕາດກວາງຊີ ນ້ຳໃສສີຟ້າທີ່ບໍ່ເຄີຍເຫັນມາກ່ອນ. ການເດີນປ່າຍາກແຕ່ຄຸ້ມຄ່າ — ທຳມະຊາດລາວບໍ່ມີບ່ອນໃດທຽບໄດ້ ⛰️💚',
          text_en: 'Lao nature is unmatched! Kuang Si Falls with crystal-clear turquoise water like nowhere else. The trek is challenging but so worth it — nothing compares to Lao wilderness ⛰️💚',
          text_lo: 'ທຳມະຊາດຂອງລາວງາມຫຼາຍ! ນ້ຳຕົກຕາດກວາງຊີ ນ້ຳໃສສີຟ້າທີ່ບໍ່ເຄີຍເຫັນມາກ່ອນ. ການເດີນປ່າຍາກແຕ່ຄຸ້ມຄ່າ — ທຳມະຊາດລາວບໍ່ມີບ່ອນໃດທຽບໄດ້ ⛰️💚',
          photo_urls: [
            'https://images.unsplash.com/photo-1596489370076-2f7881c12cc8?w=800&q=80',
            'https://images.unsplash.com/photo-1561081734-7db3e1345d3f?w=800&q=80',
            'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1596489370076-2f7881c12cc8?w=800&q=80',
          service_price: 0,
        },
        {
          category: 'stay',
          text: 'ເຮືອນພັກແບບລາວດັ້ງເດີມຕິດແມ່ນ້ຳຂອງ ຢູ່ຫຼວງພະບາງ. ຕື່ນມາຕອນເຊົ້າຟັງສຽງນ້ຳ, ເບິ່ງຂະບວນຕັກບາດ, ແລະ ກິນເຂົ້າເຊົ້າແບບລາວ ☀️🏘️',
          text_en: 'Traditional Lao riverside guesthouse in Luang Prabang. Wake up to the sound of the Mekong, watch the morning alms giving, and enjoy an authentic Lao breakfast ☀️🏘️',
          text_lo: 'ເຮືອນພັກແບບລາວດັ້ງເດີມຕິດແມ່ນ້ຳຂອງ ຢູ່ຫຼວງພະບາງ. ຕື່ນມາຕອນເຊົ້າຟັງສຽງນ້ຳ, ເບິ່ງຂະບວນຕັກບາດ, ແລະ ກິນເຂົ້າເຊົ້າແບບລາວ ☀️🏘️',
          photo_urls: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'
          ],
          photo_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
          service_price: 45, service_type: 'Lao Guesthouse', service_location: 'Luang Prabang', service_currency: 'USD/night',
        },
      ];

      for (const p of DEMO_POSTS) {
        await base44.entities.Post.create({
          ...p,
          author_email: ADMIN_EMAIL,
          author_name: ADMIN_NAME,
          likes: [],
          like_count: Math.floor(Math.random() * 50) + 10,
          comment_count: 0,
        });
      }
      loadPosts();
    };
    seedData();
  }, []);

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

            {/* Location filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                value={filterLocation}
                onChange={(e) => { setFilterLocation(e.target.value); }}
                placeholder={lang === 'lo' ? 'ຊອກຫາບໍລິການ...' : 'Search services...'}
                className="flex-1 min-w-[120px] bg-card border border-border rounded-full px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              {filterLocation && (
                <button
                  onClick={() => { setFilterLocation(''); }}
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