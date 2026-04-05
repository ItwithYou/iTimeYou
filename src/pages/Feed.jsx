import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PostCard from '../components/PostCard';
import StarRating from '../components/StarRating';
import TrustBadge from '../components/TrustBadge';
import { CAT_KEYS, CAT_ICONS } from '../hooks/useLang';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function Feed() {
  const { profile, currentUser, t, lang } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState('');
  const [selectedCat, setSelectedCat] = useState('culture');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posting, setPosting] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="bg-card rounded-xl p-5 shadow-sm text-center">
            <img
              src={profile?.photo_url || profile?.avatar_url || ''}
              alt=""
              className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary object-cover"
            />
            <h3 className="font-semibold text-sm">{profile?.first_name} {profile?.last_name}</h3>
            {profile?.is_verified && (
              <span className="inline-block text-xs text-emerald-600 mt-1">✅ {t.verStatus}</span>
            )}
            <div className="mt-2">
              <StarRating rating={profile?.trust_stars || 0} size={14} />
            </div>
            <TrustBadge stars={profile?.trust_stars || 0} lang={lang} />
            <p className="text-xs text-muted-foreground mt-2">{lang === 'lo' ? profile?.bio_lao : profile?.bio}</p>
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-border text-xs">
              <div className="text-center">
                <strong>{(profile?.friends || []).length}</strong>
                <div className="text-muted-foreground">{t.friends}</div>
              </div>
              <div className="text-center">
                <strong>${profile?.wallet_balance || 0}</strong>
                <div className="text-muted-foreground">{t.wallet}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl mt-3 p-2 shadow-sm">
            <Link to="/explore" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">🏛️ {t.explore}</Link>
            <Link to="/wallet" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">💰 {t.wallet}</Link>
            <Link to="/messages" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">💬 {t.messages}</Link>
            <Link to="/bookings" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">📅 {t.trips}</Link>
          </div>
        </div>

        {/* Main feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Create post */}
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder={t.postPlaceholder}
              rows={3}
              className="w-full bg-transparent border border-border rounded-lg p-3 text-sm outline-none focus:border-primary resize-none"
            />
            {photoPreview && (
              <div className="relative inline-block mt-2">
                <img src={photoPreview} alt="" className="max-h-36 rounded-lg" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >✕</button>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                  <Camera size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {CAT_KEYS.map((cat, i) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`px-2.5 py-0.5 rounded-full text-xs border transition-all ${
                        selectedCat === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary'
                      }`}
                    >
                      {CAT_ICONS[cat]} {t.categories[i]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createPost}
                disabled={posting}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                📤 {t.post}
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={currentUser?.email}
                t={t}
                lang={lang}
                onRefresh={loadPosts}
              />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">📝</p>
                <p>{t.noPosts}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}