import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Home, Briefcase, Clock, User, Wallet } from 'lucide-react';

const tabs = [
  { path: '/driver', icon: Home, label: 'Home' },
  { path: '/driver/requests', icon: Briefcase, label: 'Jobs' },
  { path: '/driver/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/driver/history', icon: Clock, label: 'History' },
  { path: '/driver/profile', icon: User, label: 'Profile' },
];

export default function DriverLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u?.app_role) navigate('/', { replace: true });
      else if (u?.app_role === 'passenger') navigate('/passenger', { replace: true });
    }).catch(() => navigate('/login', { replace: true }));
  }, []);

  const handleTabPress = (path) => {
    if (location.pathname === path) {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  };

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
              <button
                key={path}
                onClick={() => handleTabPress(path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active ? 'text-forge-orange' : 'text-gray-400'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}