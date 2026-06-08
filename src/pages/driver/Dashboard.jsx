import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, Star, User, Package, MapPin } from 'lucide-react';
import useCurrentLocation from '@/hooks/useCurrentLocation';

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState([]);
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();
  const { address: currentAddress, loading: locationLoading } = useCurrentLocation();

  const REQUEST_TTL_MS = 2 * 60 * 1000;
  const loadRequests = () => base44.entities.RideRequest.filter({ status: 'open' }, '-created_date', 5)
    .then(all => setRequests(all.filter(r => (Date.now() - new Date(r.created_date).getTime()) < REQUEST_TTL_MS)));

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsOnline(u?.is_online || false);
      base44.entities.Trip.filter({ driver_id: u.email, status: 'completed' }, '-created_date', 100).then(setTrips);
    }).catch(() => navigate('/login'));
    loadRequests();
    const unsub = base44.entities.RideRequest.subscribe(() => loadRequests());
    const poll = setInterval(loadRequests, 8000);
    return () => { unsub(); clearInterval(poll); };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => {
        base44.auth.updateMe({
          current_lat: coords.latitude,
          current_lng: coords.longitude,
          last_seen: new Date().toISOString(),
        });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation?.clearWatch(watchId);
  }, [isOnline]);

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (!next) {
      await base44.auth.updateMe({ is_online: false });
    } else {
      await base44.auth.updateMe({ is_online: true, last_seen: new Date().toISOString() });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white px-5 pt-8 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-forge-navy rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold flex-shrink-0">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                : (user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'DR')
              }
            </div>
            <div>
              <p className="text-xs text-gray-400">Welcome back,</p>
              <h1 className="text-xl font-extrabold text-gray-900">{user?.display_name || user?.full_name || 'Driver'} 🔥</h1>
            </div>
          </div>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 mb-2">
          <MapPin className="w-4 h-4 text-forge-orange flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            {locationLoading ? 'Getting location…' : (currentAddress || 'Location unavailable')}
          </span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <button onClick={toggleOnline}
            className={`w-14 h-7 rounded-full transition-all relative ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isOnline ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Today's Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between mb-4">
            <p className="font-bold text-gray-900">Today's Summary</p>
            <Link to="/driver/history" className="text-forge-orange text-sm font-semibold">View All</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-extrabold text-forge-orange">₦{trips.reduce((s,t) => s + (t.agreed_price||0), 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-0.5">Earnings</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{trips.length}</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-0.5">Trips Done</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <p className="text-xl font-extrabold text-gray-900">—</p>
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase mt-0.5">Rating</p>
            </div>
          </div>
        </div>

        {/* Nearby Requests */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nearby Requests</p>
            <span className="text-forge-orange text-sm font-bold">{requests.length} available</span>
          </div>
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm shadow-sm">
              No nearby requests right now.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 3).map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {req.request_type === 'person' ? <User className="w-4 h-4 text-forge-orange" /> : <Package className="w-4 h-4 text-forge-orange" />}
                      <span className="text-xs font-bold text-forge-orange">
                        {req.request_type === 'person' ? 'Person Transport' : 'Goods Delivery'}
                      </span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">NEW</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                    <div className="w-2 h-2 rounded-full bg-forge-orange flex-shrink-0" />
                    <span className="truncate">{req.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="truncate">{req.dropoff_address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>~{req.estimated_distance_km} km</span>
                      <span>~{req.estimated_duration_min} min</span>
                    </div>
                    <Link to={`/driver/bid/${req.id}`}>
                      <button className="bg-forge-orange text-white text-xs font-bold px-4 py-2 rounded-xl">Place Bid</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/driver/requests" className="block text-center text-forge-orange font-bold text-sm mt-4">
            See All Requests →
          </Link>
        </div>
      </div>
    </div>
  );
}