import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PostCard from '../components/PostCard';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import { Camera, Image, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Feed() {
  const { profile, currentUser, t, lang } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState('');
  const [selectedCat, setSelectedCat] = useState('culture');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const loadPosts = async () => {
    const data = await base44.entities.Post.list('-created_date', 30);
    setPosts(data);
  };

  useEffect(() => { loadPosts(); }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const createPost = async () => {
    if (!newText.trim() && !photoFile) return;
    setPosting(true);
    let photo_url = '';
    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = file_url;
    }
    await base44.entities.Post.create({
      author_email: currentUser.email,
      author_name: `${profile.first_name} ${profile.last_name}`,
      author_avatar: profile.photo_url || profile.avatar_url,
      text: newText,
      category: selectedCat,
      photo_url,
      likes: [],
      like_count: 0,
    });
    setNewText('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setPosting(false);
    loadPosts();
    toast.success(lang === 'lo' ? 'ໂພສສຳເລັດ ✅' : 'Posted! ✅');
  };

  const filteredPosts = filterCat === 'all' ? posts : posts.filter(p => p.category === filterCat);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block space-y-3">
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border text-center">
            <div className="relative inline-block mb-3">
              <img
                src={profile?.photo_url || profile?.avatar_url || ''}
                alt=""
                className="w-16 h-16 rounded-full border-3 border-primary object-cover"
              />
              {profile?.is_verified && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
              )}
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
                <strong className="text-base font-bold text-primary">${profile?.wallet_balance || 0}</strong>
                <div className="text-muted-foreground">{t.wallet}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-2 shadow-sm">
            {[
              { to: '/explore', icon: '🏛️', label: t.explore },
              { to: '/wallet', icon: '💰', label: t.wallet },
              { to: '/messages', icon: '💬', label: t.messages },
              { to: '/bookings', icon: '📅', label: t.trips },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors font-medium">
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Main feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Create post card */}
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex gap-3 mb-3">
              <img
                src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
                alt=""
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder={t.postPlaceholder}
                rows={2}
                className="flex-1 bg-muted/50 border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
              />
            </div>

            {photoPreview && (
              <div className="relative inline-block mb-3 ml-12">
                <img src={photoPreview} alt="" className="max-h-40 rounded-xl border border-border" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Category select + actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1">
                  <Image size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
                <div className="flex gap-1 flex-shrink-0">
                  {CAT_KEYS.map((cat, i) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      title={t.categories[i]}
                      className={`w-8 h-8 rounded-full text-base flex items-center justify-center transition-all border ${
                        selectedCat === cat
                          ? 'bg-primary/15 border-primary shadow-sm scale-110'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {CAT_ICONS[cat]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createPost}
                disabled={posting || (!newText.trim() && !photoFile)}
                className="bg-gradient-to-r from-tiffany to-deep-green text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
              >
                {posting ? '...' : t.post}
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilterCat('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterCat === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
            >
              🌐 {lang === 'lo' ? 'ທັງໝົດ' : 'All'}
            </button>
            {CAT_KEYS.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterCat === cat ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {CAT_ICONS[cat]} {t.categories[i]}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={currentUser?.email}
                t={t}
                lang={lang}
                onRefresh={loadPosts}
              />
            ))}
            {filteredPosts.length === 0 && (
              <div className="text-center py-14 text-muted-foreground">
                <p className="text-5xl mb-3">📝</p>
                <p className="font-semibold">{t.noPosts}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}