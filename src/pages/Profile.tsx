import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Grid3X3, MapPin } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const FISHING_TYPES: Record<string, string> = {
  'fly-fishing': '🎣 Fly Fishing',
  'spinning': '🔄 Spinning',
  'baitcasting': '🎯 Baitcasting',
  'surfcasting': '🌊 Surfcasting',
  'ice-fishing': '🧊 Ice Fishing',
};

const Profile = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const userId = paramUserId || user?.id;
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchStats();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">@{profile.username || 'angler'}</h1>
          {isOwnProfile && (
            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Profile header */}
        <div className="flex items-center gap-6 py-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {(profile.display_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <StatItem value={stats.posts} label="Posts" />
              <StatItem value={stats.followers} label="Followers" />
              <StatItem value={stats.following} label="Following" />
            </div>
          </div>
        </div>

        <div className="pb-4">
          <h2 className="font-semibold text-foreground">{profile.display_name}</h2>
          {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
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

        {!isOwnProfile && user && (
          <Button onClick={toggleFollow} variant={isFollowing ? 'outline' : 'default'} className="w-full mb-4">
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}

        {/* Posts grid */}
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-center gap-1 py-2 text-sm font-medium text-foreground">
            <Grid3X3 className="w-4 h-4" /> Posts
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map(post => (
              <div key={post.id} className="aspect-square bg-muted">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {posts.length === 0 && (
            <p className="text-center py-10 text-muted-foreground text-sm">No posts yet</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

const StatItem = ({ value, label }: { value: number; label: string }) => (
  <div className="text-center">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
