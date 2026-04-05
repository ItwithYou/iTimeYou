import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { CAT_ICONS } from '../hooks/useLang';
import moment from 'moment';

export default function PostCard({ post, currentUserEmail, t, lang, onRefresh }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const liked = post.likes?.includes(currentUserEmail);
  const catIndex = ['culture', 'stay', 'food', 'experience', 'home', 'nature'].indexOf(post.category);

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: post.id }).then(setComments);
  }, [post.id]);

  const toggleLike = async () => {
    const newLikes = liked
      ? (post.likes || []).filter(e => e !== currentUserEmail)
      : [...(post.likes || []), currentUserEmail];
    await base44.entities.Post.update(post.id, { likes: newLikes, like_count: newLikes.length });
    onRefresh?.();
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    await base44.entities.Comment.create({
      post_id: post.id,
      author_email: currentUserEmail,
      author_name: '',
      text: commentText,
    });
    setCommentText('');
    const updated = await base44.entities.Comment.filter({ post_id: post.id });
    setComments(updated);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <img 
          src={post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_email}`} 
          alt="" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{post.author_name || post.author_email}</h4>
          <span className="text-xs text-muted-foreground">{moment(post.created_date).fromNow()}</span>
        </div>
        {post.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {CAT_ICONS[post.category]} {t.categories[catIndex] || ''}
          </span>
        )}
      </div>

      <div className="px-4 pb-3 text-sm leading-relaxed">{post.text}</div>

      {post.photo_url && (
        <div className="max-h-80 overflow-hidden">
          <img src={post.photo_url} alt="" className="w-full object-cover" />
        </div>
      )}

      <div className="flex gap-4 px-4 py-2 text-xs text-muted-foreground">
        <span>{post.like_count || 0} {t.likes}</span>
        <span>{comments.length} {t.comments}</span>
      </div>

      <div className="flex border-t border-border">
        <button 
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-muted ${liked ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
        >
          <Heart size={16} className={liked ? 'fill-primary' : ''} />
          {t.like}
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
          <MessageCircle size={16} />
          {t.comment}
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Share2 size={16} />
          {t.share}
        </button>
      </div>

      {comments.length > 0 && (
        <div className="px-4 py-2 border-t border-border space-y-2">
          {comments.slice(0, 3).map(c => (
            <div key={c.id} className="text-xs">
              <span className="font-semibold">{c.author_name || c.author_email}</span>{' '}
              <span className="text-muted-foreground">{c.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 px-4 py-2 border-t border-border">
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addComment()}
          placeholder={t.writeComment}
          className="flex-1 bg-transparent border border-border rounded-full px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button onClick={addComment} className="text-primary font-semibold text-sm">➤</button>
      </div>
    </div>
  );
}