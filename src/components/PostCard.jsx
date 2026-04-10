import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, CalendarCheck, MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import ImageLightbox from './ImageLightbox';

import { base44 } from '@/api/base44Client';
import { CAT_ICONS } from '../hooks/useLang';
import moment from 'moment';

export default function PostCard({ post, currentUserEmail, t, lang, onRefresh }) {
  const { profile, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [showBookModal, setShowBookModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(post.likes?.includes(currentUserEmail));
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const isOwn = currentUserEmail === post.author_email;
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(post.category);

  const loadComments = async () => {
    const data = await base44.entities.Comment.filter({ post_id: post.id });
    setComments(data);
    // fetch profiles to resolve real names
    const emails = [...new Set(data.map(c => c.author_email).filter(Boolean))];
    if (emails.length > 0) {
      const profiles = await base44.entities.UserProfile.list('-created_date', 100);
      const map = {};
      profiles.forEach(p => { map[p.user_email] = `${p.first_name} ${p.last_name}`.trim(); });
      setCommentProfiles(map);
    }
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [post.id, showComments]);

  const toggleLike = async () => {
    const newLiked = !liked;
    const newLikes = newLiked
      ? [...(post.likes || []), currentUserEmail]
      : (post.likes || []).filter(e => e !== currentUserEmail);
    setLiked(newLiked);
    setLikeCount(newLikes.length);
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
    onRefresh?.();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    await base44.entities.Post.delete(post.id);
    onRefresh?.();
  };

  const handleEdit = async () => {
    await base44.entities.Post.update(post.id, { text: editText });
    setEditing(false);
    onRefresh?.();
  };

  const handleBookOrChat = async () => {
    if (!currentUser) return;
    const convs = await base44.entities.Conversation.list('-updated_date', 50);
    const existing = convs.find(c =>
      c.participants?.includes(currentUser.email) && c.participants?.includes(post.author_email)
    );
    let convId;
    if (existing) {
      convId = existing.id;
    } else {
      const conv = await base44.entities.Conversation.create({
        participants: [currentUser.email, post.author_email],
        last_message: '',
      });
      convId = conv.id;
    }
    navigate(`/messages?conv=${convId}`);
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

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={async () => {
            const profiles = await base44.entities.UserProfile.filter({ user_email: post.author_email });
            if (profiles[0]) navigate(`/profile/${profiles[0].id}`);
          }}
          className="flex-shrink-0"
        >
          <img
            src={post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_email}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 hover:opacity-80 transition-opacity"
          />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={async () => {
              const profiles = await base44.entities.UserProfile.filter({ user_email: post.author_email });
              if (profiles[0]) navigate(`/profile/${profiles[0].id}`);
            }}
            className="text-sm font-bold truncate hover:text-primary transition-colors block"
          >
            {post.author_name || 'User'}
          </button>
          <span className="text-xs text-muted-foreground">{moment(post.created_date).fromNow()}</span>
        </div>
        {post.category && (
          <span className="text-xs px-2.5 py-1 rounded-xl bg-gradient-to-r from-primary/10 to-deep-green/10 text-primary font-semibold border border-primary/15 flex-shrink-0">
            {CAT_ICONS[post.category]} {t.categories[catIndex] || ''}
          </span>
        )}
        {isOwn && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[120px]">
                <button onClick={() => { setEditing(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { setShowMenu(false); handleDelete(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
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
          <div className="flex gap-2 mt-2">
            <button onClick={handleEdit} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
              <Check size={12} /> Save
            </button>
            <button onClick={() => { setEditing(false); setEditText(post.text); }} className="flex items-center gap-1 border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 text-sm leading-relaxed text-foreground">{post.text}</div>
      )}

      {/* Photo */}
      {post.photo_url && (
        <div className="max-h-80 overflow-hidden cursor-zoom-in" onClick={() => setLightboxSrc(post.photo_url)}>
          <img src={post.photo_url} alt="" className="w-full object-cover" />
        </div>
      )}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

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
            {lang === 'lo' ? 'ສົ່ງຂໍ້ຄວາມ / ຈອງ' : 'Message & Book'} — ${post.service_price}
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
        <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
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