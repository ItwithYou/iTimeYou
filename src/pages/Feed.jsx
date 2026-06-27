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
import ErrorBoundary from '../components/ErrorBoundary';

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
      if (!authorProfile?.location || !authorProfile.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    }
    if (filterGender) {
      const authorProfile = authorProfiles[p.author_email];
      if (!authorProfile?.gender || authorProfile.gender !== filterGender) return false;
    }
    // Search across service type, description, and location
    if (filterLocation) {
      const matchesService = p.service_type?.toLowerCase().includes(filterLocation.toLowerCase()) ||
                            p.text?.toLowerCase().includes(filterLocation.toLowerCase()) ||
                            p.service_location?.toLowerCase().includes(filterLocation.toLowerCase());
      if (!matchesService) return false;
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
              <ErrorBoundary key={post.id}>
                <PostCard
                  post={post}
                  currentUserEmail={currentUser?.email}
                  t={t}
                  lang={lang}
                  authorProfile={authorProfiles[post.author_email] || null}
                  onRefresh={loadPosts} />
              </ErrorBoundary>
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