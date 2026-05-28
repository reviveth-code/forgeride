import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin, Clock, User, Package } from 'lucide-react';

export default function NearbyRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = () => base44.entities.RideRequest.filter({ status: 'open' }, '-created_date', 30).then(setRequests);

  useEffect(() => {
    load();
    const unsub = base44.entities.RideRequest.subscribe(() => load());
    const poll = setInterval(load, 8000);
    return () => { unsub(); clearInterval(poll); };
  }, []);

  const filtered = requests.filter(r => filter === 'all' || r.request_type === filter);

  const timeSince = (date) => {
    const m = Math.floor((Date.now() - new Date(date)) / 60000);
    return m < 1 ? 'just now' : `${m} min ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Nearby Requests</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 text-forge-orange" />
          <span>Showing requests within 5km of your location</span>
          <button className="text-forge-orange font-bold ml-auto">Adjust</button>
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
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm mt-2">
            No requests found. Check back soon!
          </div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white ${req.request_type === 'person' ? 'bg-forge-orange' : 'bg-blue-500'}`}>
                  {req.request_type === 'person' ? <User className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                  {req.request_type === 'person' ? 'Person Transport' : 'Goods Delivery'}
                </div>
                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">0.8 km away</span>
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
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeSince(req.created_date)}</span>
                </div>
                <Link to={`/driver/bid/${req.id}`}>
                  <button className="bg-forge-orange text-white text-sm font-bold px-5 py-2.5 rounded-2xl">Place Bid</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}