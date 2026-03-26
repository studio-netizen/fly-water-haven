import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share2, MapPin, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PostComments from '@/components/PostComments';
import PostActionsMenu from '@/components/PostActionsMenu';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import { toast } from 'sonner';

interface PostData {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_tag: string | null;
  fish_species: string[] | null;
  fishing_technique: string[] | null;
  gear_used: string[] | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  useEffect(() => {
    if (user && post) {
      checkLiked();
      checkFollowing();
    }
  }, [user, post]);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(username, display_name, avatar_url)')
      .eq('id', postId!)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setPost(data as unknown as PostData);
    }
    setLoading(false);
  };

  const checkLiked = async () => {
    if (!user || !post) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const checkFollowing = async () => {
    if (!user || !post || user.id === post.user_id) return;
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', post.user_id)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleLike = async () => {
    if (!user || !post) return;
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
      setLiked(false);
      setPost(p => p ? { ...p, like_count: p.like_count - 1 } : p);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
      setLiked(true);
      setPost(p => p ? { ...p, like_count: p.like_count + 1 } : p);
    }
  };

  const toggleFollow = async () => {
    if (!user || !post) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', post.user_id);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: post.user_id });
      setIsFollowing(true);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: 'Flywaters', text: post.caption || 'Guarda questo post!', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiato!');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !post) {
    return (
      <AppLayout>
        <SEOHead title="Post non trovato | Flywaters" description="Il post che stai cercando non esiste." />
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <p className="text-6xl mb-4">🎣</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Post non trovato</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Questo post potrebbe essere stato rimosso o il link non è valido.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Torna al feed
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead
        title={`${post.profiles?.username || 'Pescatore'} su Flywaters`}
        description={post.caption || 'Scopri questa cattura su Flywaters.'}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-foreground p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Post</h1>
          <div className="w-7" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <article className="bg-card">
          {/* Post header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => navigate(`/profile/${post.user_id}`)}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url || ''} />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {(post.profiles?.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/profile/${post.user_id}`)}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {post.profiles?.username || 'pescatore'}
                </button>
                {user && user.id !== post.user_id && !isFollowing && (
                  <>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button
                      onClick={toggleFollow}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Segui
                    </button>
                  </>
                )}
              </div>
              {post.location_tag && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {post.location_tag}
                </p>
              )}
            </div>
            {user && post.user_id === user.id && (
              <PostActionsMenu post={post} onUpdated={fetchPost} />
            )}
          </div>

          {/* Image */}
          <div className="aspect-[4/5] bg-muted">
            <img
              src={post.image_url}
              alt={post.caption || 'Post di pesca'}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Actions */}
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={toggleLike} className="transition-transform active:scale-125">
                <Heart
                  className={`w-6 h-6 ${
                    liked
                      ? 'fill-destructive text-destructive'
                      : 'text-foreground hover:text-muted-foreground'
                  }`}
                />
              </button>
              <button className="text-foreground hover:text-muted-foreground">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button onClick={handleShare} className="text-foreground hover:text-muted-foreground">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm font-semibold text-foreground mb-1">
              {post.like_count} {post.like_count === 1 ? 'Mi piace' : 'Mi piace'}
            </p>

            {post.caption && (
              <p className="text-sm text-foreground">
                <span className="font-semibold mr-1">{post.profiles?.username || 'pescatore'}</span>
                {post.caption}
              </p>
            )}

            <div className="mt-1.5">
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                🐟 No-Kill
              </Badge>
            </div>

            {((post.fish_species?.length) || (post.fishing_technique?.length) || (post.gear_used?.length)) && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {post.fish_species?.map(s => (
                  <Badge key={s} variant="secondary" className="text-[11px] py-0 px-1.5">🐟 {s}</Badge>
                ))}
                {post.fishing_technique?.map(t => (
                  <Badge key={t} variant="secondary" className="text-[11px] py-0 px-1.5">🎯 {t}</Badge>
                ))}
                {post.gear_used?.map(g => (
                  <Badge key={g} variant="outline" className="text-[11px] py-0 px-1.5">🎣 {g}</Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 mb-1">{formatDate(post.created_at)}</p>
          </div>

          <PostComments
            postId={post.id}
            commentCount={post.comment_count}
            onCommentAdded={fetchPost}
          />
        </article>
      </div>
    </AppLayout>
  );
};

export default PostDetail;
