import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  post_count: number;
}

interface TopSpot {
  id: string;
  name: string;
  avg_rating: number | null;
  review_count: number | null;
}

const SidebarWidgets = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<TopUser[]>([]);
  const [spots, setSpots] = useState<TopSpot[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .limit(20);
      if (profiles) {
        const withCounts: TopUser[] = [];
        for (const p of profiles) {
          if (user && p.user_id === user.id) continue;
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', p.user_id);
          withCounts.push({ ...p, post_count: count || 0 });
        }
        withCounts.sort((a, b) => b.post_count - a.post_count);
        setUsers(withCounts.slice(0, 3));
      }

      const { data: topSpots } = await supabase
        .from('spots')
        .select('id, name, avg_rating, review_count')
        .order('review_count', { ascending: false })
        .limit(3);
      if (topSpots) setSpots(topSpots as TopSpot[]);

      if (user) {
        const { data: f } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (f) setFollowing(new Set(f.map((x) => x.following_id)));
      }
    })();
  }, [user]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (following.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowing((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowing((prev) => new Set(prev).add(targetId));
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {users.length > 0 && (
        <div className="border-t border-black/[0.08] pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">
            Pescatori da seguire
          </p>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-2 px-2">
                <Link to={`/profile/${u.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || ''} alt={u.username || ''} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(u.display_name || u.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate text-foreground">
                    @{u.username || u.display_name}
                  </span>
                </Link>
                <button
                  onClick={() => toggleFollow(u.user_id)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                    following.has(u.user_id)
                      ? 'bg-muted text-foreground'
                      : 'bg-[#242242] text-[#f5f0e8]'
                  }`}
                >
                  {following.has(u.user_id) ? 'Seguito' : 'Segui'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {spots.length > 0 && (
        <div className="border-t border-black/[0.08] pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">
            Spot più attivi
          </p>
          <div className="space-y-2">
            {spots.map((s) => (
              <Link
                key={s.id}
                to={`/spot/${s.id}`}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
              >
                <span className="text-xs font-medium truncate text-foreground flex-1">{s.name}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {(s.avg_rating || 0).toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarWidgets;
