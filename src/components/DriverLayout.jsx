import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useTabNavigation } from '@/components/TabNavigationProvider';
import { Home, Briefcase, Clock, User, Wallet } from 'lucide-react';

const tabs = [
  { path: '/driver', icon: Home, label: 'Home' },
  { path: '/driver/requests', icon: Briefcase, label: 'Jobs' },
  { path: '/driver/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/driver/history', icon: Clock, label: 'History' },
  { path: '/driver/profile', icon: User, label: 'Profile' },
];

const tabPaths = tabs.map(t => t.path);
const rootTab = tabs[0].path;

export default function DriverLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleTabPress } = useTabNavigation();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u?.app_role) navigate('/', { replace: true });
      else if (u?.app_role === 'passenger') navigate('/passenger', { replace: true });
    }).catch(() => navigate('/login', { replace: true }));
  }, []);

  const isActive = (path) => {
    if (path === rootTab) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <div className="flex-1 overflow-auto pb-20">
        <Outlet />
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 max-w-md mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Driver navigation"
      >
        <div className="flex justify-around py-2" role="tablist">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                onClick={() => handleTabPress(path, tabPaths)}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active ? 'text-forge-orange' : 'text-gray-400'}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}