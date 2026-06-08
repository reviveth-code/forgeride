import { useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Clock, MapPin, User } from 'lucide-react';

const tabs = [
  { path: '/passenger', icon: Home, label: 'Home' },
  { path: '/passenger/requests', icon: Clock, label: 'Requests' },
  { path: '/passenger/track', icon: MapPin, label: 'Track' },
  { path: '/passenger/profile', icon: User, label: 'Profile' },
];

// Preserves scroll position per tab by keeping rendered tabs in the DOM (display:none when inactive)
function ScrollPreservingOutlet({ activePath }) {
  const scrollRefs = useRef({});

  useEffect(() => {
    // Save scroll when leaving, restore when arriving
    const container = scrollRefs.current[activePath];
    if (container) container.scrollTop = container._savedScroll || 0;
    return () => {
      const c = scrollRefs.current[activePath];
      if (c) c._savedScroll = c.scrollTop;
    };
  }, [activePath]);

  return (
    <div className="flex-1 relative">
      {tabs.map(({ path }) => (
        <div
          key={path}
          ref={el => { scrollRefs.current[path] = el; }}
          className="absolute inset-0 overflow-auto pb-20"
          style={{ display: activePath === path ? 'block' : 'none' }}
        >
          {activePath === path && <Outlet />}
        </div>
      ))}
    </div>
  );
}

export default function PassengerLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 max-w-md mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
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