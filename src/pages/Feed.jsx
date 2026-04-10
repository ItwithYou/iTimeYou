import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PostCard from '../components/PostCard';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import CreateServicePost from '../components/CreateServicePost';
import { toast } from 'sonner';

export default function Feed() {
  const { profile, currentUser, t, lang } = useAppContext();
  const [posts, setPosts] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [activeTab, setActiveTab] = useState('feed');
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [scheduleProfiles, setScheduleProfiles] = useState({});

  const loadPosts = async () => {
    const data = await base44.entities.Post.list('-created_date', 30);
    setPosts(data);
  };

  const { refreshing, pullDistance, threshold } = usePullToRefresh(loadPosts, '/feed');

  useEffect(() => {loadPosts();}, []);

  const loadSchedule = async () => {
    if (!currentUser) return;
    const [asBooker, asPoster] = await Promise.all([
    base44.entities.ServiceBooking.filter({ booker_email: currentUser.email }, '-created_date', 30),
    base44.entities.ServiceBooking.filter({ poster_email: currentUser.email }, '-created_date', 30)]
    );
    const all = [...asBooker, ...asPoster].filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
    all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setScheduleBookings(all);
    const emails = [...new Set(all.flatMap((b) => [b.booker_email, b.poster_email]).filter(Boolean))];
    if (emails.length) {
      const profiles = await base44.entities.UserProfile.list('-created_date', 100);
      const map = {};
      profiles.forEach((p) => {map[p.user_email] = `${p.first_name} ${p.last_name}`.trim();});
      setScheduleProfiles(map);
    }
  };

  useEffect(() => {if (activeTab === 'schedule') loadSchedule();}, [activeTab, currentUser]);

  const filteredPosts = filterCat === 'all' ? posts : posts.filter((p) => p.category === filterCat);

  const statusConfig = {
    pending: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: lang === 'lo' ? 'ລໍຖ້າ' : 'Pending' },
    confirmed: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: lang === 'lo' ? 'ຢືນຢັນ' : 'Confirmed' },
    cancelled: { cls: 'bg-red-100 text-red-700 border-red-200', label: lang === 'lo' ? 'ຍົກເລີກ' : 'Cancelled' }
  };

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
                <div className="text-muted-foreground">{t.friends}</div>
              </div>
              <div className="text-center">
                
                
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-2 shadow-sm">
            {[
            { to: '/explore', icon: '🏛️', label: t.explore },
            { to: '/wallet', icon: '💰', label: t.wallet },
            { to: '/messages', icon: '💬', label: t.messages },
            { to: '/bookings', icon: '📅', label: t.trips }].
            map((item) =>
            <Link key={item.to} to={item.to} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors font-medium">
                <span>{item.icon}</span> {item.label}
              </Link>
            )}
          </div>
        </div>

        {/* Main feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'feed' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              
              📝 {lang === 'lo' ? 'ຟີດ' : 'Feed'}
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'schedule' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              
              📅 {lang === 'lo' ? 'ຕາຕະລາງ' : 'Schedule'}
            </button>
          </div>

          {activeTab === 'schedule' &&
          <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{lang === 'lo' ? 'ການຈອງບໍລິການທັງໝົດຂອງທ່ານ' : 'All your service bookings'}</p>
              {scheduleBookings.length === 0 ?
            <div className="text-center py-14 text-muted-foreground">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="font-semibold">{lang === 'lo' ? 'ຍັງບໍ່ມີການຈອງ' : 'No bookings yet'}</p>
                </div> :

            scheduleBookings.map((b) => {
              const isBooker = b.booker_email === currentUser?.email;
              const st = statusConfig[b.status] || statusConfig.pending;
              return (
                <div key={b.id} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🛎️</div>
                          <div>
                            <p className="font-bold text-sm">{b.service_type || 'Service'}</p>
                            <p className="text-xs text-muted-foreground">
                              {isBooker ?
                          `${lang === 'lo' ? 'ຜູ້ໃຫ້ບໍລິການ' : 'Provider'}: ${scheduleProfiles[b.poster_email] || 'User'}` :
                          `${lang === 'lo' ? 'ຜູ້ຈອງ' : 'Booked by'}: ${scheduleProfiles[b.booker_email] || b.booker_name || 'User'}`
                          }
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">👤 {isBooker ? `${lang === 'lo' ? 'ທ່ານ' : 'You'} → ${scheduleProfiles[b.poster_email] || 'Provider'}` : `${scheduleProfiles[b.booker_email] || b.booker_name || 'User'} → ${lang === 'lo' ? 'ທ່ານ' : 'You'}`}</span>
                        {b.service_when && <span>📆 {b.service_when}</span>}
                        {b.service_duration > 0 && <span>⏱ {b.service_duration}h</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">${b.price}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBooker ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isBooker ? lang === 'lo' ? 'ທ່ານຈອງ' : 'You booked' : lang === 'lo' ? 'ທ່ານໃຫ້ບໍລິການ' : 'You provide'}
                        </span>
                      </div>
                    </div>);

            })
            }
            </div>
          }

          {activeTab === 'feed' && <>
          <CreateServicePost
              profile={profile}
              currentUser={currentUser}
              lang={lang}
              t={t}
              onPosted={loadPosts} />
            

          {/* Filter tabs */}
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

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post) =>
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={currentUser?.email}
                t={t}
                lang={lang}
                onRefresh={loadPosts} />

              )}
            {filteredPosts.length === 0 &&
              <div className="text-center py-14 text-muted-foreground">
                <p className="text-5xl mb-3">📝</p>
                <p className="font-semibold">{t.noPosts}</p>
              </div>
              }
          </div>
          </>}
        </div>
      </div>
    </div>);

}