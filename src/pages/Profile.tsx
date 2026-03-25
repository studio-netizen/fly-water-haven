import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grid3X3, MapPin, Pencil, Star } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const FISHING_TYPES: Record<string, string> = {
  'fly-fishing': '🎣 Pesca a mosca',
  'spinning': '🔄 Spinning',
  'baitcasting': '🎯 Baitcasting',
  'surfcasting': '🌊 Surfcasting',
  'ice-fishing': '🧊 Pesca sul ghiaccio',
};

const Profile = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = paramUserId || user?.id;
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'spots'>('posts');
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchStats();
      fetchReviews();
      if (user && !isOwnProfile) checkFollowing();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId!).single();
    if (data) setProfile(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').eq('user_id', userId!).order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, spots(name, spot_type)')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const fetchStats = async () => {
    const [postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId!),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId!),
    ]);
    setStats({
      posts: postsRes.count || 0,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  const checkFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId!).maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId!);
      setIsFollowing(false);
      setStats(s => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId! });
      setIsFollowing(true);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{profile.username || 'pescatore'}</h1>
          {isOwnProfile && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile/edit')}>
              <Pencil className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Profile header – Instagram style */}
        <div className="flex items-center gap-6 py-5">
          <Avatar className="h-20 w-20 lg:h-24 lg:w-24">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {(profile.display_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <StatItem value={stats.posts} label="Posts" />
              <StatItem value={stats.followers} label="Followers" />
              <StatItem value={stats.following} label="Following" />
            </div>
          </div>
        </div>

        {/* Name, bio, tags */}
        <div className="pb-3">
          <h2 className="font-semibold text-foreground text-sm">{profile.display_name}</h2>
          {profile.bio && <p className="text-sm text-foreground mt-0.5">{profile.bio}</p>}
          {profile.fishing_types && profile.fishing_types.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {profile.fishing_types.map((t: string) => (
                <Badge key={t} variant={t === 'fly-fishing' ? 'default' : 'secondary'} className="text-xs">
                  {FISHING_TYPES[t] || t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pb-4">
          {isOwnProfile ? (
            <Button variant="outline" className="flex-1 h-9 text-sm font-semibold" onClick={() => navigate('/profile/edit')}>
              Modifica profilo
            </Button>
          ) : user ? (
            <>
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                className="flex-1 h-9 text-sm font-semibold"
                onClick={toggleFollow}
              >
                {isFollowing ? 'Seguendo' : 'Segui'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm font-semibold"
                onClick={() => navigate('/messages')}
              >
                Messaggio
              </Button>
            </>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="border-t border-border flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" /> Post
          </button>
          <button
            onClick={() => setActiveTab('spots')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'spots'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <Star className="w-4 h-4" /> Spot recensiti
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'posts' ? (
          <div className="grid grid-cols-3 gap-0.5 pb-4">
            {posts.map(post => (
              <div key={post.id} className="aspect-square bg-muted">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
            {posts.length === 0 && (
              <p className="col-span-3 text-center py-14 text-muted-foreground text-sm">Nessun post ancora</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {reviews.map(r => (
              <div key={r.id} className="flex items-start gap-3 px-1">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.spots?.name || 'Spot'}</p>
                  <p className="text-xs text-muted-foreground">{r.spots?.spot_type}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  {r.content && <p className="text-sm text-foreground mt-1">{r.content}</p>}
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center py-14 text-muted-foreground text-sm">Nessuna recensione ancora</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const StatItem = ({ value, label }: { value: number; label: string }) => (
  <div className="text-center flex-1">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
