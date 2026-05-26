import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import '@/utils/leaflet';

export default function TripTracking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(setTrip);
    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === tripId) {
        setTrip(event.data);
        if (event.data?.status === 'completed') navigate(`/passenger/trip-complete/${tripId}`);
      }
    });
    return unsub;
  }, [tripId]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 z-10 relative">
        <button onClick={() => navigate('/passenger')}><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-900">Pick up in Progress</h1>
        <button className="w-10 h-10 bg-forge-orange rounded-full flex items-center justify-center shadow">
          <Phone className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: '320px' }}>
        <MapContainer center={[6.5244, 3.3792]} zoom={13} style={{ height: '100%', width: '100%', minHeight: '320px' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[6.5244, 3.3792]} />
          <Marker position={[6.5344, 3.3892]} />
        </MapContainer>
      </div>

      {/* Driver info bottom card */}
      <div className="bg-white border-t border-gray-100 p-5 shadow-lg">
        {trip ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {initials(trip.driver_name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-base">{trip.driver_name}</p>
                <p className="text-sm text-gray-400">Keke Napep • KJA-291</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-gray-500">4.8</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-lg font-extrabold text-gray-900">~6 min</p>
                <p className="text-xs text-gray-400 font-medium uppercase">Arriving In</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900">{trip.distance_km} km</p>
                <p className="text-xs text-gray-400 font-medium uppercase">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium uppercase">Agreed Price</p>
              </div>
            </div>
            <div className="bg-forge-orange text-white text-center py-3 rounded-2xl font-bold text-sm">
              ● Driver Arriving
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4">Loading trip details...</div>
        )}
      </div>
    </div>
  );
}