import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Clock, User } from 'lucide-react';

const tabs = [
  { path: '/driver', icon: Home, label: 'Home' },
  { path: '/driver/requests', icon: Briefcase, label: 'Jobs' },
  { path: '/driver/history', icon: Clock, label: 'History' },
  { path: '/driver/profile', icon: User, label: 'Profile' },
];

export default function DriverLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <div className="flex-1 overflow-auto pb-20">
        <Outlet />
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 max-w-md mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path || (path !== '/driver' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active ? 'text-forge-orange' : 'text-gray-400'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}