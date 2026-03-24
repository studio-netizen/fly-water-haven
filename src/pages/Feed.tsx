import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Landing from './Landing';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, MapPin, Fish } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import CreatePostDialog from '@/components/CreatePostDialog';

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  location_tag: string | null;
  fish_species: string[] | null;
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

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchPosts();
    fetchLikedPosts();
  }, [user]);

  if (!authLoading && !user) return <Landing />;

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setPosts(data as unknown as Post[]);
    setLoading(false);
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count - 1 } : p));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p));
    }
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-serif text-foreground">Flywaters</h1>
          </div>
          <CreatePostDialog onPostCreated={fetchPosts} />
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Fish className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No catches yet</h3>
            <p className="text-muted-foreground">Be the first to share your fishing adventure!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="border-b border-border animate-fade-in">
              {/* Post header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(post.profiles?.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {post.profiles?.display_name || post.profiles?.username || 'Angler'}
                  </p>
                  {post.location_tag && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.location_tag}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
              </div>

              {/* Post image */}
              <div className="aspect-square bg-muted">
                <img src={post.image_url} alt={post.caption || 'Fishing post'} className="w-full h-full object-cover" />
              </div>

              {/* Actions */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 transition-colors">
                    <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-destructive text-destructive' : 'text-foreground hover:text-destructive'}`} />
                    <span className="text-sm font-medium text-foreground">{post.like_count}</span>
                  </button>
                  <div className="flex items-center gap-1 text-foreground">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm font-medium">{post.comment_count}</span>
                  </div>
                </div>

                {post.caption && (
                  <p className="text-sm text-foreground">
                    <span className="font-semibold mr-1">{post.profiles?.username || 'angler'}</span>
                    {post.caption}
                  </p>
                )}

                {post.fish_species && post.fish_species.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {post.fish_species.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
