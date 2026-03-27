import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, PlusSquare, Bell, User, Send, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoImg from '@/assets/flywaters-logo-dark.png';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const DesktopSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const unreadMessages = useUnreadMessages();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false)
      .then(({ count }) => setUnreadNotifs(count || 0));
  }, [user]);

  const links = [
    { to: '/', icon: Home, label: t('nav.feed') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/publish', icon: PlusSquare, label: t('nav.publish') },
    { to: '/messages', icon: Send, label: t('nav.messages'), badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: t('nav.notifications'), badge: unreadNotifs },
    { to: user ? `/profile/${user.id}` : '/auth', icon: User, label: t('nav.profile') },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 border-r border-black/[0.08] bg-background px-4 py-6">
      <div className="mb-8 px-2 flex items-center justify-between">
        <img src={logoImg} alt="Flywaters" className="h-8" />
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all ${
                isActive
                  ? 'bg-[#242242] text-white font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
                {badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {user && profile && (
        <div className="border-t border-black/[0.08] pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(profile.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile.display_name || profile.username}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-full text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </aside>
  );
};

export default DesktopSidebar;
