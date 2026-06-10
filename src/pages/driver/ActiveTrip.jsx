import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Menu, Phone, Star, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MapViewUpdater from '@/components/MapViewUpdater';
import '@/utils/leaflet';

export default function ActiveTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState(null);

  // Live distance from driver to target (pickup while arriving, dropoff during trip)
  const liveDistKm = useMemo(() => {
    if (!driverPos) return null;
    if (trip?.status === 'in_progress' && trip?.dropoff_lat) {
      const R = 6371, dLat = (trip.dropoff_lat-driverPos[0])*Math.PI/180, dLng = (trip.dropoff_lng-driverPos[1])*Math.PI/180;
      const a = Math.sin(dLat/2)**2+Math.cos(driverPos[0]*Math.PI/180)*Math.cos(trip.dropoff_lat*Math.PI/180)*Math.sin(dLng/2)**2;
      return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
    }
    if (trip?.pickup_lat) {
      const R = 6371, dLat = (trip.pickup_lat-driverPos[0])*Math.PI/180, dLng = (trip.pickup_lng-driverPos[1])*Math.PI/180;
      const a = Math.sin(dLat/2)**2+Math.cos(driverPos[0]*Math.PI/180)*Math.cos(trip.pickup_lat*Math.PI/180)*Math.sin(dLng/2)**2;
      return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
    }
    return null;
  }, [driverPos, trip?.status, trip?.pickup_lat, trip?.dropoff_lat]);

  const liveEtaMin = liveDistKm != null ? Math.max(1, Math.round(liveDistKm * 3)) : null;

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(setTrip);

    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setDriverPos(pos);
        base44.entities.Trip.update(tripId, { driver_lat: coords.latitude, driver_lng: coords.longitude });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation?.clearWatch(watchId);
  }, [tripId]);

  const confirmPickup = async () => {
    setLoading(true);
    await base44.entities.Trip.update(tripId, { status: 'awaiting_passenger_confirm' });
    setTrip(prev => ({ ...prev, status: 'awaiting_passenger_confirm' }));
    setLoading(false);
  };

  // Auto-sync trip status changes from passenger confirmation
  useEffect(() => {
    if (!tripId) return;
    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === tripId) setTrip(event.data);
    });
    const poll = setInterval(() => base44.entities.Trip.get(tripId).then(setTrip), 4000);
    return () => { unsub(); clearInterval(poll); };
  }, [tripId]);

  const endTrip = async () => {
    if (trip?.status !== 'in_progress') return;
    setLoading(true);
    await base44.entities.Trip.update(tripId, { status: 'completed', duration_min: 26 });
    navigate(`/driver/trip-complete/${tripId}`);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
      {/* Overlay top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-4 flex items-center justify-between">
        <button className="w-11 h-11 bg-card rounded-full shadow-lg flex items-center justify-center">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="bg-card rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-foreground">Trip Active</span>
        </div>
        <button className="w-11 h-11 bg-forge-orange rounded-full shadow-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Navigation banner */}
      <div className="absolute top-20 left-4 right-4 z-10">
        <div className="bg-forge-navy rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-white text-xl font-bold">→</span>
            <span className="text-white text-sm font-medium truncate">To: {trip?.dropoff_address?.split(',')[0] || '...'}</span>
          </div>
          <span className="text-forge-orange font-extrabold text-sm">{trip?.distance_km ? `${trip.distance_km} km` : '—'}</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: '65vh' }}>
        <MapContainer center={[6.5244, 3.3792]} zoom={13}
          style={{ height: '100%', width: '100%', minHeight: '65vh' }}
          zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverPos && <Marker position={driverPos} />}
          {driverPos && <MapViewUpdater center={driverPos} zoom={15} />}
        </MapContainer>
      </div>

      {/* Bottom card */}
      <div className="bg-card p-5 border-t border-border shadow-2xl">
        {trip ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-extrabold flex-shrink-0">
                {(trip?.is_for_someone_else ? trip?.recipient_name : trip?.passenger_name)?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'PA'}
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-foreground">
                  {trip?.is_for_someone_else ? trip?.recipient_name : (trip?.passenger_name || 'Passenger')}
                </p>
                {trip?.is_for_someone_else && (
                  <p className="text-xs text-forge-orange font-semibold">Booked by {trip?.passenger_name}</p>
                )}
                <p className="text-xs text-gray-400">{trip?.request_type === 'goods' ? 'Goods Delivery' : 'Person Transport'}</p>
              </div>
              <button className="w-10 h-10 bg-forge-orange rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-background rounded-2xl py-3 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase">ETA</p>
                <p className="text-sm font-bold text-foreground">{liveEtaMin != null ? `~${liveEtaMin} min` : '—'}</p>
              </div>
              <div className="bg-background rounded-2xl py-3 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase">{trip?.status === 'in_progress' ? 'To Dropoff' : 'To Pickup'}</p>
                <p className="text-sm font-bold text-foreground">{liveDistKm != null ? `${liveDistKm} km` : '—'}</p>
              </div>
              <div className="col-span-2 bg-forge-orange/10 rounded-2xl py-3 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase">Earnings</p>
                <p className="text-base font-bold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
              </div>
            </div>
            {trip?.status === 'driver_arriving' && (
              <button onClick={confirmPickup} disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm mb-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ Confirm Passenger Picked Up'}
              </button>
            )}
            {trip?.status === 'awaiting_passenger_confirm' && (
              <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm mb-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for passenger to confirm...
              </div>
            )}
            <div className="flex gap-3">
              <button className="flex-1 border-2 border-red-400 text-red-400 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" /> SOS Emergency
              </button>
              <button onClick={endTrip} disabled={loading || trip?.status !== 'in_progress'}
                className={`flex-1 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm ${trip?.status === 'in_progress' ? 'bg-forge-navy text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4" /> End Trip</>}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4">Loading trip...</div>
        )}
      </div>
    </div>
  );
}