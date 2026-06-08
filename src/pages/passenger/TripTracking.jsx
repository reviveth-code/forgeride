import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Star } from 'lucide-react';

function haversine(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
}
import { MapContainer, TileLayer } from 'react-leaflet';
import SmoothDriverMarker from '@/components/SmoothDriverMarker';
import MapViewUpdater from '@/components/MapViewUpdater';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@/utils/leaflet';

function PickupMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#E85A0F;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">📍</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
    const m = L.marker(position, { icon }).addTo(map).bindPopup('Pickup');
    return () => m.remove();
  }, [position?.[0], position?.[1]]);
  return null;
}

function DropoffMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#0D1B3E;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">🏁</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
    const m = L.marker(position, { icon }).addTo(map).bindPopup('Dropoff');
    return () => m.remove();
  }, [position?.[0], position?.[1]]);
  return null;
}

export default function TripTracking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);

  useEffect(() => {
    const loadTrip = () => base44.entities.Trip.get(tripId).then(async t => {
      setTrip(t);
      if (t?.status === 'completed') navigate(`/passenger/trip-complete/${tripId}`);
      // Fetch driver profile once we have the driver_id
      if (t?.driver_id && !driverProfile) {
        const users = await base44.entities.User.list();
        const dp = users.find(u => u.email === t.driver_id);
        if (dp) setDriverProfile(dp);
      }
    });

    loadTrip();

    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === tripId) {
        setTrip(event.data);
        if (event.data?.status === 'completed') navigate(`/passenger/trip-complete/${tripId}`);
      }
    });

    // Poll every 3s for cross-user real-time driver location
    const poll = setInterval(loadTrip, 3000);

    return () => { unsub(); clearInterval(poll); };
  }, [tripId]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  // Real-time distance: driver → passenger pickup (arriving) or driver → dropoff (in progress)
  const liveDistKm = useMemo(() => {
    if (!trip?.driver_lat || !trip?.driver_lng) return null;
    if (trip.status === 'in_progress') {
      return haversine(trip.driver_lat, trip.driver_lng, trip.dropoff_lat, trip.dropoff_lng);
    }
    return haversine(trip.driver_lat, trip.driver_lng, trip.pickup_lat, trip.pickup_lng);
  }, [trip?.driver_lat, trip?.driver_lng, trip?.status]);

  const liveEtaMin = liveDistKm != null ? Math.max(1, Math.round(liveDistKm * 3)) : null;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <div className="flex items-center justify-between px-5 py-4 bg-card border-b border-border z-10 relative">
        <button onClick={() => navigate('/passenger')}><ArrowLeft className="w-6 h-6 text-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Pick up in Progress</h1>
        {driverProfile?.phone ? (
          <a href={`tel:${driverProfile.phone}`} className="w-10 h-10 bg-forge-orange rounded-full flex items-center justify-center shadow">
            <Phone className="w-5 h-5 text-white" />
          </a>
        ) : (
          <div className="w-10 h-10 bg-forge-orange/40 rounded-full flex items-center justify-center shadow">
            <Phone className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '380px' }}>
        <MapContainer
          center={trip?.driver_lat ? [trip.driver_lat, trip.driver_lng] : [6.5244, 3.3792]}
          zoom={15}
          style={{ height: '100%', width: '100%', minHeight: '380px' }}
          zoomControl={false} attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {trip?.driver_lat && (
            <>
              <SmoothDriverMarker position={[trip.driver_lat, trip.driver_lng]} />
              <MapViewUpdater center={[trip.driver_lat, trip.driver_lng]} zoom={15} />
            </>
          )}
          {trip?.pickup_lat && trip?.status !== 'in_progress' && (
            <PickupMarker position={[trip.pickup_lat, trip.pickup_lng]} />
          )}
          {trip?.dropoff_lat && trip?.status === 'in_progress' && (
            <DropoffMarker position={[trip.dropoff_lat, trip.dropoff_lng]} />
          )}
        </MapContainer>
        {/* Live pulse indicator */}
        {trip?.driver_lat && (
          <div className="absolute top-3 left-3 z-[1000] bg-card rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground">Live Tracking</span>
          </div>
        )}
      </div>

      {/* Driver info bottom card */}
      <div className="bg-card border-t border-border p-5 shadow-lg">
        {trip ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {initials(trip.driver_name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base">{trip.driver_name}</p>
                {(() => {
                  const parts = [
                    driverProfile?.vehicle_type,
                    driverProfile?.vehicle_color,
                    driverProfile?.vehicle_model,
                  ].filter(Boolean);
                  return parts.length > 0 ? (
                    <p className="text-sm text-gray-500">{parts.join(' · ')}</p>
                  ) : null;
                })()}
                {driverProfile?.vehicle_plate && (
                  <p className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mt-0.5 inline-block">{driverProfile.vehicle_plate}</p>
                )}
                {driverProfile?.phone && (
                  <p className="text-xs text-gray-400 mt-0.5">📞 {driverProfile.phone}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-gray-500">{driverProfile?.rating ?? trip.driver_rating ?? '—'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-lg font-extrabold text-foreground">{liveEtaMin != null ? `~${liveEtaMin} min` : '—'}</p>
                <p className="text-xs text-gray-400 font-medium uppercase">ETA</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground">{liveDistKm != null ? `${liveDistKm} km` : '—'}</p>
                <p className="text-xs text-gray-400 font-medium uppercase">{trip.status === 'in_progress' ? 'To Dropoff' : 'To Pickup'}</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium uppercase">Agreed Price</p>
              </div>
            </div>
            <div className={`text-white text-center py-3 rounded-2xl font-bold text-sm ${trip.status === 'in_progress' ? 'bg-forge-navy' : 'bg-forge-orange'}`}>
              ● {trip.status === 'in_progress' ? 'Trip In Progress' : 'Driver Arriving'}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4">Loading trip details...</div>
        )}
      </div>
    </div>
  );
}