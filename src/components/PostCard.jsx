import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Pencil, Trash2, X, Check, MapPin, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import ImageLightbox from './ImageLightbox';
import BookServiceModal from './BookServiceModal';

import { base44 } from '@/api/base44Client';
import { CAT_ICONS } from '../hooks/useLang';
import moment from 'moment';

export default function PostCard({ post, currentUserEmail, t, lang, onRefresh, authorProfile: initialAuthorProfile }) {
  const { profile, currentUser, refreshProfile } = useAppContext();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';
  const [authorProfile, setAuthorProfile] = useState(initialAuthorProfile || null);
  const [followLoading, setFollowLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editPhotoUrl, setEditPhotoUrl] = useState(post.photo_url || '');
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(post.likes?.includes(currentUserEmail));
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const editPhotoInputRef = useRef(null);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const isOwn = currentUserEmail === post.author_email;
  const canEdit = isOwn || isAdmin;
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(post.category);

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: post.id });
    setComments(data);

    const emails = [...new Set(data.map(c => c.author_email).filter(Boolean))];
    if (emails.length === 0) {
      setCommentProfiles({});
      return;
    }

    const profiles = await base44.entities.UserProfile.list('-created_date', 100);
    const map = {};
    profiles.forEach(p => {
      if (emails.includes(p.user_email)) {
        map[p.user_email] = `${p.first_name} ${p.last_name}`.trim();
      }
    });
    setCommentProfiles(map);
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [post.id, showComments]);

  useEffect(() => {
    setAuthorProfile(initialAuthorProfile || null);
  }, [initialAuthorProfile]);

  const toggleLike = async () => {
    const currentLikes = post.likes || [];
    const alreadyLiked = currentLikes.includes(currentUserEmail);
    const newLikes = alreadyLiked
      ? currentLikes.filter(e => e !== currentUserEmail)
      : [...currentLikes, currentUserEmail];

    setLiked(!alreadyLiked);
    setLikeCount(newLikes.length);
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    await base44.entities.Post.delete(post.id);
    onRefresh?.();
  };

  const handleEdit = async () => {
    let nextPhotoUrl = editPhotoUrl;
    if (editPhotoFile) {
      const upload = await base44.integrations.Core.UploadFile({ file: editPhotoFile });
      nextPhotoUrl = upload.file_url;
    }
    await base44.entities.Post.update(post.id, { text: editText, photo_url: nextPhotoUrl });
    setEditPhotoUrl(nextPhotoUrl);
    setEditPhotoFile(null);
    setEditing(false);
    onRefresh?.();
  };

  const handleBookOrChat = async () => {
    if (!currentUser) return;
    setShowBookModal(true);
  };

  const isFollowing = !!profile?.friends?.includes(post.author_email);

  const handleFollowToggle = async () => {
    if (!profile || !authorProfile || followLoading || currentUserEmail === post.author_email) return;
    setFollowLoading(true);

    const myFriends = profile.friends || [];
    const theirFriends = authorProfile.friends || [];
    const nextMyFriends = isFollowing ? myFriends.filter((email) => email !== post.author_email) : [...myFriends, post.author_email];
    const nextTheirFriends = isFollowing ? theirFriends.filter((email) => email !== currentUserEmail) : [...theirFriends, currentUserEmail];

    await Promise.all([
      base44.entities.UserProfile.update(profile.id, { friends: nextMyFriends }),
      base44.entities.UserProfile.update(authorProfile.id, { friends: nextTheirFriends }),
    ]);

    setAuthorProfile({ ...authorProfile, friends: nextTheirFriends });
    await refreshProfile?.();
    setFollowLoading(false);
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    await base44.entities.Comment.create({
      post_id: post.id,
      author_email: currentUserEmail,
      author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : currentUserEmail,
      text: commentText,
    });
    setCommentText('');
    await loadComments();
  };

  const displayPhotoUrl = editPhotoFile ? URL.createObjectURL(editPhotoFile) : (editPhotoUrl || post.photo_url || '');
  const safeDisplayPhotoUrl = displayPhotoUrl?.trim();
  const shareText = `${post.service_type ? `${post.service_type} · ` : ''}${post.text || ''}`.trim();
  const shareUrl = post.service_location_map_url || window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.service_type || 'Post',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
      }
    }

    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => {
            if (authorProfile?.id) navigate(`/profile/${authorProfile.id}`);
          }}
          className="flex-shrink-0"
        >
          <img
            src={post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_email}`}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 hover:opacity-80 transition-opacity"
          />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => {
              if (authorProfile?.id) navigate(`/profile/${authorProfile.id}`);
            }}
            className="text-sm font-bold truncate hover:text-primary transition-colors block"
          >
            {post.author_name || 'User'}
          </button>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{moment(post.created_date).fromNow()}</span>
            {authorProfile && <span>• {(authorProfile.friends || []).length} {lang === 'lo' ? 'ຜູ້ຕິດຕາມ' : 'followers'}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-primary/10 to-deep-green/10 text-primary font-semibold border border-primary/15 flex-shrink-0">
              {CAT_ICONS[post.category]} {t.categories[catIndex] || ''}
            </span>
          )}
          {!isOwn && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${isFollowing ? 'border-border text-muted-foreground hover:bg-muted' : 'border-primary bg-primary text-primary-foreground hover:opacity-90'} disabled:opacity-50`}
            >
              {isFollowing ? (lang === 'lo' ? 'ກຳລັງຕິດຕາມ' : 'Following') : (lang === 'lo' ? 'ຕິດຕາມ' : 'Follow')}
            </button>
          )}
        </div>
        {canEdit && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
                <button onClick={() => { setEditing(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <Pencil size={13} /> {lang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}
                </button>
                <button onClick={() => { setShowMenu(false); handleDelete(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 size={13} /> {lang === 'lo' ? 'ລຶບ' : 'Delete'}
                </button>
                {isAdmin && !isOwn && (
                  <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground italic">{lang === 'lo' ? '(Admin)' : '(Admin)'}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text / Edit */}
      {editing ? (
        <div className="px-4 pb-3">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
          <input
            value={editPhotoUrl}
            onChange={e => setEditPhotoUrl(e.target.value)}
            placeholder={lang === 'lo' ? 'ລິ້ງຮູບພາບ' : 'Photo URL'}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary mt-2"
          />
          <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="mt-2 flex items-center gap-2 w-fit text-xs font-semibold text-primary min-h-[44px] px-2">
            <ImageIcon size={14} />
            {lang === 'lo' ? 'ເລືອກຮູບຈາກຄອມ' : 'Choose photo from desktop'}
          </button>
          <input ref={editPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => setEditPhotoFile(e.target.files?.[0] || null)} />
          {safeDisplayPhotoUrl && (
            <img src={safeDisplayPhotoUrl} alt="" className="mt-2 w-full max-h-52 object-cover rounded-xl border border-border" />
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={handleEdit} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setEditing(false); setEditText(post.text); setEditPhotoUrl(post.photo_url || ''); setEditPhotoFile(null); }} className="flex items-center gap-1 border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 text-sm leading-relaxed text-foreground">{post.text}</div>
      )}

      {/* Photo */}
      {safeDisplayPhotoUrl && (
        <div className="max-h-80 overflow-hidden cursor-zoom-in" onClick={() => setLightboxSrc(safeDisplayPhotoUrl)}>
          <img src={safeDisplayPhotoUrl} alt="" className="w-full object-cover" />
        </div>
      )}

      {post.service_location && (
        <div className="px-4 pb-3">
          {post.service_location_map_url ? (
            <a
              href={post.service_location_map_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2"
            >
              <MapPin size={14} />
              {post.service_location}
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} />
              {post.service_location}
            </div>
          )}
        </div>
      )}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      {showBookModal && (
        <BookServiceModal
          post={post}
          profile={profile}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setShowBookModal(false)}
          onBooked={onRefresh}
        />
      )}

      {/* Stats */}
      <div className="flex gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border/60 bg-muted/20">
        <span>{likeCount} {t.likes}</span>
        <span>{comments.length || post.comment_count || 0} {t.comments}</span>
      </div>

      {/* Chat / Book button for service posts */}
      {post.service_price > 0 && currentUserEmail !== post.author_email && (
        <div className="px-4 pb-3">
          <button
            onClick={handleBookOrChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-tiffany to-deep-green text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <MessageCircle size={16} />
            {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມ / ຈອງ' : 'Message & Book'} — {post.service_price} {post.service_currency || 'USD'}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-border">
        <button
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors hover:bg-muted ${liked ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}
        >
          <Heart size={17} className={liked ? 'fill-red-500' : ''} />
          {t.like}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle size={17} />
          {t.comment}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Share2 size={17} />
          {t.share}
        </button>
      </div>



      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border bg-muted/30">
          {comments.length > 0 && (
            <div className="px-4 py-3 space-y-2.5">
              {comments.slice(0, 5).map(c => (
                <div key={c.id} className="flex gap-2">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_email}`}
                    alt=""
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <div className="bg-card rounded-xl px-3 py-1.5 text-xs">
                    <span className="font-bold">{commentProfiles[c.author_email] || c.author_name || 'User'}</span>{' '}
                    <span className="text-muted-foreground">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 px-4 py-3 border-t border-border/50">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder={t.writeComment}
              className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={addComment} className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 flex-shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}