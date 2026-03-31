import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Star, UserPlus, CheckCheck } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useTranslation } from 'react-i18next';

const ICONS: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  review: Star,
  follow: UserPlus,
  message: MessageCircle,
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(user_id, username, display_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}g`;
  };

  const getMessage = (type: string) => {
    switch (type) {
      case 'like': return t('notifications.likedYourPost');
      case 'comment': return t('notifications.commentedYourPost');
      case 'follow': return t('notifications.startedFollowing');
      case 'review': return t('notifications.reviewedSpot');
      case 'message': return t('notifications.sentMessage');
      default: return t('notifications.interacted');
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('auth.loginToSee')} {t('nav.notifications').toLowerCase()}</p>
        </div>
      </AppLayout>
    );
  }

  const hasUnread = notifications.some(n => !n.read);

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">{t('notifications.title')}</h1>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1">
              <CheckCheck className="w-4 h-4" /> {t('notifications.markRead')}
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {hasUnread && (
          <div className="hidden lg:flex justify-end px-4 py-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1">
              <CheckCheck className="w-4 h-4" /> {t('notifications.markAllRead')}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div className="h-11 w-11 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-2.5 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">{t('notifications.noNotifications')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('notifications.willAppearHere')}</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = ICONS[n.type] || Heart;
            const profile = n.profiles;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (n.type === 'follow' && profile?.user_id) navigate(`/profile/${profile.user_id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition-colors hover:bg-muted/30 ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    {(profile?.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{profile?.display_name || profile?.username || t('notifications.someone')}</span>{' '}
                    {getMessage(n.type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                </div>
                <Icon className={`w-5 h-5 flex-shrink-0 ${n.type === 'like' ? 'text-destructive' : 'text-muted-foreground'}`} />
              </button>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
