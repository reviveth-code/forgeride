import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';

export default function PassengerTrack() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Trip.filter({ status: 'driver_arriving' }, '-created_date', 5).then(setTrips);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-900">Track</h1>
        <p className="text-sm text-gray-400 mt-1">Your active trips</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No active trips to track.</p>
          </div>
        ) : (
          trips.map(trip => (
            <button key={trip.id} onClick={() => navigate(`/passenger/tracking/${trip.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left">
              <p className="font-bold text-gray-900 mb-1">{trip.pickup_address} → {trip.dropoff_address}</p>
              <p className="text-sm text-forge-orange font-semibold capitalize">{trip.status?.replace('_', ' ')}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}