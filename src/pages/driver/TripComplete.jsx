import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function DriverTripComplete() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(setTrip);
  }, [tripId]);

  const goOffline = async () => {
    await base44.auth.updateMe({ is_online: false });
    navigate('/driver');
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Celebration header */}
      <div className="bg-forge-navy pt-14 pb-12 px-5 text-center relative overflow-hidden">
        <div className="absolute top-6 left-8 text-2xl opacity-40">🎊</div>
        <div className="absolute top-8 right-10 text-xl opacity-40">⭐</div>
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Trip Completed!</h1>
        <p className="text-white/50 text-sm mb-4">Great work, {trip?.driver_name?.split(' ')[0] || 'Driver'}!</p>
        <p className="text-forge-orange text-4xl font-extrabold">₦{trip?.agreed_price?.toLocaleString() || '1,500'}</p>
        <p className="text-white/40 text-sm mt-1">Earned this trip</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trip Summary</p>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-xs text-gray-400">Distance Covered</p>
              <p className="font-extrabold text-gray-900 text-xl mt-0.5">{trip?.distance_km || 14.3} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Duration</p>
              <p className="font-extrabold text-gray-900 text-xl mt-0.5">{trip?.duration_min || 26} min</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Request Type</p>
              <p className="font-extrabold text-gray-900 text-xl mt-0.5 capitalize">{trip?.request_type || 'Person'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trip Status</p>
              <p className="font-extrabold text-green-600 text-lg mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-5 h-5" /> Completed
              </p>
            </div>
          </div>
          {trip?.pickup_address && (
            <div className="mt-4 border-t border-gray-100 pt-4 flex items-center gap-2 flex-wrap text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-forge-orange flex-shrink-0" />
              <span>{trip.pickup_address}</span>
              <span className="text-gray-300">→</span>
              <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0" />
              <span>{trip.dropoff_address}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-extrabold text-sm">
              {(trip?.is_for_someone_else ? trip?.recipient_name : trip?.passenger_name)?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'PA'}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {trip?.is_for_someone_else ? trip?.recipient_name : trip?.passenger_name}
              </p>
              {trip?.is_for_someone_else && (
                <p className="text-xs text-forge-orange font-medium">Booked by {trip?.passenger_name}</p>
              )}
              <span className="text-xs text-green-600 font-semibold">Verified ✓</span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/driver/requests')}
          className="w-full bg-forge-orange text-white font-extrabold py-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-sm">
          🔍 Find Next Job
        </button>
        <button onClick={goOffline}
          className="w-full border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-base">
          Go Offline
        </button>
        <Link to="/driver/history" className="block text-center text-forge-orange text-sm font-semibold">
          View Trip History
        </Link>
      </div>
    </div>
  );
}