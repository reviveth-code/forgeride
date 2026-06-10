import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin, Clock, User, Package } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

function haversine(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

const REQUEST_TTL_MS = 3 * 60 * 1000; // 3 minutes

function useCountdown(createdDate) {
  const [secsLeft, setSecsLeft] = useState(0);
  useEffect(() => {
    const tick = () => {
      const dateStr = typeof createdDate === 'string' && !createdDate.endsWith('Z') ? createdDate + 'Z' : createdDate;
      const elapsed = Date.now() - new Date(dateStr).getTime();
      setSecsLeft(Math.max(0, Math.floor((REQUEST_TTL_MS - elapsed) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [createdDate]);
  return secsLeft;
}

function RequestCard({ req, driverPos, alreadyBid }) {
  const secsLeft = useCountdown(req.created_date);
  const dist = haversine(driverPos?.lat, driverPos?.lng, req.pickup_lat, req.pickup_lng);
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const ss = String(secsLeft % 60).padStart(2, '0');
  const urgent = secsLeft < 30;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${alreadyBid ? 'border-forge-orange/40 bg-forge-orange/5' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white ${req.request_type === 'person' ? 'bg-forge-orange' : 'bg-blue-500'}`}>
          {req.request_type === 'person' ? <User className="w-3 h-3" /> : <Package className="w-3 h-3" />}
          {req.request_type === 'person' ? 'Person Transport' : 'Goods Delivery'}
        </div>
        {dist != null
          ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">{dist} km away</span>
          : <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">Locating…</span>
        }
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-800 mb-1 font-medium">
        <div className="w-2.5 h-2.5 rounded-full bg-forge-orange flex-shrink-0" />
        <span className="truncate">{req.pickup_address}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-900 flex-shrink-0" />
        <span className="truncate">{req.dropoff_address}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-400">
          <span>~{req.estimated_distance_km} km trip</span>
          <span className={`flex items-center gap-1 font-bold ${urgent ? 'text-red-500' : 'text-forge-orange'}`}>
            <Clock className="w-3 h-3" /> {mm}:{ss}
          </span>
        </div>
        {alreadyBid ? (
          <span className="text-forge-orange text-xs font-bold bg-forge-orange/10 px-4 py-2.5 rounded-2xl">Bid Placed ✓</span>
        ) : (
          <Link to={`/driver/bid/${req.id}`}>
            <button className="bg-forge-orange text-white text-sm font-bold px-5 py-2.5 rounded-2xl">Place Bid</button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function NearbyRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [driverPos, setDriverPos] = useState(null);
  const [myBidIds, setMyBidIds] = useState(new Set());

  const load = async () => base44.entities.RideRequest.filter({ status: 'open' }, '-created_date', 30).then(setRequests);

  useEffect(() => {
    load();
    const unsub = base44.entities.RideRequest.subscribe(() => load());
    const poll = setInterval(load, 8000);

    // Get real driver GPS
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => setDriverPos({ lat: coords.latitude, lng: coords.longitude }),
      null,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    // Load driver's existing bids to prevent duplicates
    base44.auth.me().then(user => {
      if (user?.email) {
        base44.entities.Bid.filter({ driver_id: user.email, status: 'pending' }).then(bids => {
          setMyBidIds(new Set(bids.map(b => b.request_id)));
        });
      }
    });

    return () => { unsub(); clearInterval(poll); navigator.geolocation?.clearWatch(watchId); };
  }, []);

  const RADIUS_KM = 25; // increased radius so drivers don't miss requests

  const filtered = requests
    .filter(r => filter === 'all' || r.request_type === filter)
    .filter(r => {
      const ds = typeof r.created_date === 'string' && !r.created_date.endsWith('Z') ? r.created_date + 'Z' : r.created_date;
      return (Date.now() - new Date(ds).getTime()) < REQUEST_TTL_MS;
    })
    .filter(r => {
      if (!driverPos) return true; // show all while location is loading
      if (!r.pickup_lat || !r.pickup_lng) return true; // no coords on request, show it
      const dist = haversine(driverPos.lat, driverPos.lng, r.pickup_lat, r.pickup_lng);
      return dist == null || dist <= RADIUS_KM;
    });



  return (
    <PullToRefresh onRefresh={load}>
      <div className="bg-card px-5 pt-8 pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground mb-3">Nearby Requests</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 text-forge-orange" />
          <span>Showing requests within 25km of your location</span>
        </div>
      </div>

      <div className="px-5 py-3 flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'person', label: 'Person' },
          { key: 'goods', label: 'Goods' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === key ? 'bg-forge-orange text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3 pb-6">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center mt-2 space-y-2">
            {!driverPos ? (
              <>
                <p className="text-sm font-semibold text-foreground">Getting your location…</p>
                <p className="text-xs text-muted-foreground">Please allow location access. Requests will appear once your location is detected.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">No open requests within 10km</p>
                <p className="text-xs text-muted-foreground">Pull down to refresh or check back shortly.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(req => (
            <RequestCard key={req.id} req={req} driverPos={driverPos} alreadyBid={myBidIds.has(req.id)} />
          ))
        )}
      </div>
    </PullToRefresh>
  );
}