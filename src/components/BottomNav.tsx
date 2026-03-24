import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, User, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/map', icon: Map, label: 'Mappa' },
    { to: '/messages', icon: MessageCircle, label: 'Messaggi' },
    { to: '/notifications', icon: Bell, label: 'Notifiche' },
    { to: user ? `/profile/${user.id}` : '/auth', icon: User, label: 'Profilo' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
          return (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
