import { Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { Home, Clock, MapPin, User } from 'lucide-react';

const tabs = [
  { path: '/passenger', icon: Home, label: 'Home' },
  { path: '/passenger/requests', icon: Clock, label: 'Requests' },
  { path: '/passenger/track', icon: MapPin, label: 'Track' },
  { path: '/passenger/profile', icon: User, label: 'Profile' },
];

export default function PassengerLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto relative">
      <div className="flex-1 overflow-auto pb-20">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 max-w-md mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active ? 'text-forge-orange' : 'text-gray-400'}`}>
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