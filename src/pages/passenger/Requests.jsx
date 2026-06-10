import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Plus } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  matched: 'bg-blue-100 text-blue-700',
  active: 'bg-orange-100 text-forge-orange',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
};

export default function PassengerRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const u = await base44.auth.me();
    const data = await base44.entities.RideRequest.filter({ created_by: u.email }, '-created_date', 30);
    setRequests(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <PullToRefresh onRefresh={load}>
      <div className="bg-card px-5 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">My Requests</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'open', 'matched', 'active', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-colors ${filter === f ? 'bg-forge-orange text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">No requests found.</p>
            <Link to="/passenger/new-request">
              <button className="bg-forge-orange text-white font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Post New Request
              </button>
            </Link>
          </div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-forge-orange" />
                    <p className="text-sm font-semibold text-foreground">{req.pickup_address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="text-sm text-gray-500">{req.dropoff_address}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-500'}`}>
                  {req.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400 capitalize">{req.request_type === 'person' ? '👤 Person Transport' : '📦 Goods Delivery'}</span>
                {req.status === 'open' && (
                  <Link to={`/passenger/offers/${req.id}`} className="text-forge-orange text-xs font-bold flex items-center gap-1">
                    View Offers <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PullToRefresh>
  );
}