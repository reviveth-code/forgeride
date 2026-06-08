import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';

export default function PassengerTrack() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      base44.entities.Trip.filter({ passenger_id: u.email }, '-created_date', 10).then(trips => {
        setTrips(trips.filter(t => t.status === 'driver_arriving' || t.status === 'in_progress'));
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-5 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground">Track</h1>
        <p className="text-sm text-gray-400 mt-1">Your active trips</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {trips.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No active trips to track.</p>
          </div>
        ) : (
          trips.map(trip => (
            <button key={trip.id} onClick={() => navigate(`/passenger/tracking/${trip.id}`)}
              className="w-full bg-card rounded-2xl p-4 shadow-sm text-left">
              <p className="font-bold text-foreground mb-1">{trip.pickup_address} → {trip.dropoff_address}</p>
              <p className="text-sm text-forge-orange font-semibold capitalize">{trip.status?.replace('_', ' ')}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}