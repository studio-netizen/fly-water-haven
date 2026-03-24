import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Star, UserPlus } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const ICONS: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  review: Star,
  follow: UserPlus,
  message: MessageCircle,
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(username, display_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
    setLoading(false);

    // Mark all as read
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const getMessage = (type: string) => {
    switch (type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'review': return 'reviewed a spot you follow';
      case 'message': return 'sent you a message';
      default: return 'interacted with you';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Sign in to view notifications</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">No notifications</p>
        ) : (
          notifications.map(n => {
            const Icon = ICONS[n.type] || Heart;
            const profile = n.profiles;
            return (
              <div key={n.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border ${!n.read ? 'bg-primary/5' : ''}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(profile?.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{profile?.display_name || profile?.username || 'Someone'}</span>{' '}
                    {getMessage(n.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTime(n.created_at)}</p>
                </div>
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
