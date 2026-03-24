import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, PlusSquare, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Feed' },
    { to: '/map', icon: Map, label: 'Mappa' },
    { to: '/publish', icon: PlusSquare, label: 'Pubblica', isCenter: true },
    { to: '/notifications', icon: Bell, label: 'Notifiche' },
    { to: user ? `/profile/${user.id}` : '/auth', icon: User, label: 'Profilo' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {links.map(({ to, icon: Icon, label, isCenter }) => {
          const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isCenter
                    ? 'text-foreground'
                    : isActive
                    ? 'text-[#242242]'
                    : 'text-muted-foreground'
                }`}
                strokeWidth={isActive || isCenter ? 2.2 : 1.5}
              />
              <span
                className={`text-[10px] ${
                  isActive ? 'text-[#242242] font-semibold' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
