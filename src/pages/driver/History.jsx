import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock } from 'lucide-react';

export default function DriverHistory() {
  const [trips, setTrips] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.Trip.filter({ driver_id: u.email }, '-created_date', 30).then(setTrips);
    });
  }, []);

  const totalEarnings = trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.agreed_price || 0), 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-5 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">Trip History</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-forge-orange/10 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Total Earned</p>
            <p className="text-xl font-extrabold text-forge-orange">₦{totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-background rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium mb-1">Trips Completed</p>
            <p className="text-xl font-extrabold text-foreground">{completedTrips}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {trips.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No trips yet. Start accepting jobs!</p>
          </div>
        ) : (
          trips.map(trip => (
            <div key={trip.id} className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-forge-orange" />
                    <span className="text-sm font-semibold text-foreground truncate">{trip.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-gray-500 truncate">{trip.dropoff_address}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                  {trip.status === 'completed' && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" /> Done
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 capitalize">{trip.request_type === 'person' ? '👤 Person' : '📦 Goods'} • {trip.distance_km} km • {trip.duration_min} min</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}