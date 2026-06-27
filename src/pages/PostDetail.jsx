import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { ArrowLeft } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use useOutletContext since it's rendered in Layout
  const { profile, currentUser, t, lang } = useOutletContext();
  
  const [post, setPost] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const posts = await base44.entities.Post.filter({ id });
        if (posts.length > 0) {
          setPost(posts[0]);
          if (posts[0].author_email) {
            const profiles = await base44.entities.UserProfile.filter({ user_email: posts[0].author_email });
            if (profiles.length > 0) {
              setAuthorProfile(profiles[0]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id]);

  return (
    <div className="pb-32 bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">{lang === 'lo' ? 'ໂພສ' : 'Post'}</h1>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto pt-6 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : post ? (
          <PostCard
            post={post}
            currentUserEmail={currentUser?.email}
            t={t}
            lang={lang}
            authorProfile={authorProfile}
          />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            {lang === 'lo' ? 'ບໍ່ພົບໂພສນີ້' : 'Post not found'}
          </div>
        )}
      </div>
    </div>
  );
}
