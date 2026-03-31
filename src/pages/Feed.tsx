import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Landing from './Landing';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Share2, MapPin, Send } from 'lucide-react';
import PostActionsMenu from '@/components/PostActionsMenu';
import PostComments from '@/components/PostComments';
import logoImg from '@/assets/flywaters-logo-dark.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import { toast } from 'sonner';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTranslation } from 'react-i18next';

interface Post {
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

interface SuggestedUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  post_count: number;
}

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<'forYou' | 'following'>('forYou');
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const unreadMessages = useUnreadMessages();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    fetchFollowedUsers();
    fetchLikedPosts();
    fetchSuggestedUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchPosts();
  }, [user, feedMode, followedUsers]);

  if (!authLoading && !user) return <Landing />;

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (feedMode === 'following' && followedUsers.size > 0) {
      query = query.in('user_id', Array.from(followedUsers));
    } else if (feedMode === 'following') {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;
    if (!error && data) setPosts(data as unknown as Post[]);
    setLoading(false);
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const fetchFollowedUsers = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setFollowedUsers(new Set(data.map(f => f.following_id)));
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .neq('user_id', user.id)
      .limit(10);

    if (!profiles) return;

    const suggestions: SuggestedUser[] = [];
    for (const p of profiles) {
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', p.user_id);
      suggestions.push({ ...p, post_count: count || 0 });
    }
    suggestions.sort((a, b) => b.post_count - a.post_count);
    setSuggestedUsers(suggestions.slice(0, 5));
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

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (followedUsers.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowedUsers(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowedUsers(prev => new Set(prev).add(targetId));
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: 'Flywaters', text: post.caption || t('feed.checkThisPost'), url });
    } else {
      await navigator.clipboard.writeText(url);
      toast(t('feed.linkCopied'));
    }
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}g`;
  };

  return (
    <AppLayout>
      <SEOHead title={`Feed | Flywaters`} description={t('seo.defaultDescription')} />
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <img src={logoImg} alt="Flywaters — La community italiana per la pesca a mosca" className="h-7" />
          <button onClick={() => navigate('/messages')} className="relative p-1">
            <Send className="w-5 h-5 text-foreground" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Feed mode tabs */}
      <div className="sticky top-[53px] lg:top-0 z-30 bg-background border-b border-border">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setFeedMode('forYou')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              feedMode === 'forYou'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('feed.forYou')}
          </button>
          <button
            onClick={() => setFeedMode('following')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              feedMode === 'following'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('feed.following')}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-lg font-semibold text-foreground mb-1">
              {feedMode === 'following' ? t('feed.noFollowingPosts') : t('feed.noCatches')}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {feedMode === 'following'
                ? t('feed.followOthers')
                : t('feed.beFirst')}
            </p>

            {suggestedUsers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">{t('feed.suggestedAnglers')}</p>
                <div className="space-y-3">
                  {suggestedUsers.map(su => (
                    <SuggestedUserCard
                      key={su.user_id}
                      user={su}
                      isFollowing={followedUsers.has(su.user_id)}
                      onToggleFollow={() => toggleFollow(su.user_id)}
                      onNavigate={() => navigate(`/profile/${su.user_id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {posts.map((post, idx) => (
              <article key={post.id} className="rounded-card border border-black/[0.08] bg-card shadow-card overflow-hidden">
                {/* Post header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/profile/${post.user_id}`)}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={post.profiles?.avatar_url || ''} alt={`Profilo di ${post.profiles?.username || 'pescatore'} su Flywaters`} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {(post.profiles?.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                        className="text-sm font-semibold text-foreground truncate hover:underline"
                      >
                        {post.profiles?.username || 'pescatore'}
                      </button>
                      {post.user_id !== user?.id && !followedUsers.has(post.user_id) && (
                        <>
                          <span className="text-muted-foreground text-xs">•</span>
                          <button
                            onClick={() => toggleFollow(post.user_id)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            {t('feed.follow')}
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
                  <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                  {post.user_id === user?.id && (
                    <PostActionsMenu post={post} onUpdated={fetchPosts} />
                  )}
                </div>

                <button onClick={() => navigate(`/post/${post.id}`)} className="block w-full aspect-[4/5] bg-muted">
                  <img
                    src={post.image_url}
                    alt={`Foto di pesca a mosca condivisa da ${post.profiles?.username || 'pescatore'} su Flywaters`}
                    className="w-full h-full object-cover rounded-t-card"
                    loading="lazy"
                  />
                </button>

                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => toggleLike(post.id)} className="transition-transform active:scale-125">
                      <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-destructive text-destructive' : 'text-foreground hover:text-muted-foreground'}`} />
                    </button>
                    <button className="text-foreground hover:text-muted-foreground">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleShare(post)} className="text-foreground hover:text-muted-foreground">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-foreground mb-1">
                    {post.like_count} {t('feed.likes')}
                  </p>

                  {post.caption && (
                    <p className="text-sm text-foreground">
                      <span className="font-semibold mr-1">{post.profiles?.username || 'pescatore'}</span>
                      {post.caption}
                    </p>
                  )}

                  <div className="mt-1.5">
                    <Badge variant="secondary" className="text-[11px] py-0.5 px-2 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">🐟 No-Kill</Badge>
                  </div>

                  {((post.fish_species && post.fish_species.length > 0) || (post.fishing_technique && post.fishing_technique.length > 0) || (post.gear_used && post.gear_used.length > 0)) && (
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
                </div>

                <PostComments
                  postId={post.id}
                  commentCount={post.comment_count}
                  onCommentAdded={fetchPosts}
                />
              </article>
            ))}

            {suggestedUsers.length > 0 && posts.length >= 3 && (
              <div className="border-b border-border py-6 px-4">
                <p className="text-sm font-semibold text-foreground mb-4">{t('feed.suggestedForYou')}</p>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {suggestedUsers.map(su => (
                    <div
                      key={su.user_id}
                      className="flex flex-col items-center gap-2 min-w-[100px] py-3 px-2 border border-border rounded-xl"
                    >
                      <button onClick={() => navigate(`/profile/${su.user_id}`)}>
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={su.avatar_url || ''} alt={`Profilo di ${su.username || su.display_name || 'utente'} su Flywaters`} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {(su.display_name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <p className="text-xs font-semibold text-foreground text-center truncate w-full">
                        {su.username || su.display_name}
                      </p>
                      <button
                        onClick={() => toggleFollow(su.user_id)}
                        className={`text-xs font-semibold px-4 py-1 rounded-lg transition-colors ${
                          followedUsers.has(su.user_id)
                            ? 'bg-muted text-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {followedUsers.has(su.user_id) ? t('feed.followingBtn') : t('feed.follow')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const SuggestedUserCard = ({
  user: su,
  isFollowing,
  onToggleFollow,
  onNavigate,
}: {
  user: SuggestedUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onNavigate: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-left">
      <button onClick={onNavigate}>
        <Avatar className="h-11 w-11">
          <AvatarImage src={su.avatar_url || ''} alt={`Profilo di ${su.username || su.display_name || 'utente'} su Flywaters`} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {(su.display_name || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{su.display_name || su.username}</p>
        <p className="text-xs text-muted-foreground">{su.post_count} posts</p>
      </div>
      <button
        onClick={onToggleFollow}
        className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
          isFollowing
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {isFollowing ? t('feed.followingBtn') : t('feed.follow')}
      </button>
    </div>
  );
};

export default Feed;
