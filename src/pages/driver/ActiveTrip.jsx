import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Phone, AlertTriangle, Flag, Loader2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MapViewUpdater from '@/components/MapViewUpdater';
import SmoothDriverMarker from '@/components/SmoothDriverMarker';
import L from 'leaflet';
import '@/utils/leaflet';

function haversine(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

function PinMarker({ position, color, emoji, label }) {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:16px;">${emoji}</div>
        ${label ? `<div style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${label}</div>` : ''}
      </div>`,
      iconSize: [36, 50], iconAnchor: [18, 50],
    });
    const m = L.marker(position, { icon }).addTo(map);
    return () => m.remove();
  }, [position?.[0], position?.[1]]);
  return null;
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    const valid = positions.filter(p => p && p[0] != null && p[1] != null);
    if (valid.length >= 2) {
      map.fitBounds(valid, { padding: [60, 60] });
    } else if (valid.length === 1) {
      map.setView(valid[0], 15);
    }
  }, [positions.map(p => p ? `${p[0]},${p[1]}` : 'null').join('|')]);
  return null;
}

export default function ActiveTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [showEndWarning, setShowEndWarning] = useState(false);
  const wakeLockRef = useRef(null);
  const tripRef = useRef(null);

  // Keep screen on
  useEffect(() => {
    const acquireWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request('screen');
      } catch {}
    };
    acquireWakeLock();
    // Re-acquire if page becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Auto-end trip when screen goes off (page hidden) while in_progress
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === 'hidden' && tripRef.current?.status === 'in_progress') {
        await base44.entities.Trip.update(tripId, { status: 'completed' });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [tripId]);

  // Live distance from driver to target
  const liveDistKm = useMemo(() => {
    if (!driverPos) return null;
    if (trip?.status === 'in_progress' && trip?.dropoff_lat) {
      return haversine(driverPos[0], driverPos[1], trip.dropoff_lat, trip.dropoff_lng);
    }
    if (trip?.pickup_lat) {
      return haversine(driverPos[0], driverPos[1], trip.pickup_lat, trip.pickup_lng);
    }
    return null;
  }, [driverPos, trip?.status, trip?.pickup_lat, trip?.dropoff_lat]);

  const liveEtaMin = liveDistKm != null ? Math.max(1, Math.round(liveDistKm * 3)) : null;

  // Progress % for the route bar: 0% = at pickup, 100% = at dropoff
  const progressPct = useMemo(() => {
    if (!driverPos || !trip?.pickup_lat || !trip?.dropoff_lat) return 0;
    if (trip.status !== 'in_progress') return 0;
    const total = haversine(trip.pickup_lat, trip.pickup_lng, trip.dropoff_lat, trip.dropoff_lng);
    const remaining = haversine(driverPos[0], driverPos[1], trip.dropoff_lat, trip.dropoff_lng);
    if (!total || total === 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }, [driverPos, trip?.status, trip?.pickup_lat, trip?.dropoff_lat]);

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(t => { setTrip(t); tripRef.current = t; });
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setDriverPos(pos);
        base44.entities.Trip.update(tripId, { driver_lat: coords.latitude, driver_lng: coords.longitude });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation?.clearWatch(watchId);
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === tripId) { setTrip(event.data); tripRef.current = event.data; }
    });
    const poll = setInterval(() => base44.entities.Trip.get(tripId).then(t => { setTrip(t); tripRef.current = t; }), 4000);
    return () => { unsub(); clearInterval(poll); };
  }, [tripId]);

  const confirmPickup = async () => {
    setLoading(true);
    await base44.entities.Trip.update(tripId, { status: 'awaiting_passenger_confirm' });
    setTrip(prev => ({ ...prev, status: 'awaiting_passenger_confirm' }));
    setLoading(false);
  };

  const doEndTrip = async () => {
    setLoading(true);
    await base44.entities.Trip.update(tripId, { status: 'completed' });
    navigate(`/driver/trip-complete/${tripId}`);
  };

  const endTrip = async () => {
    if (trip?.status !== 'in_progress') return;
    if (liveDistKm != null && liveDistKm > 0.2) { setShowEndWarning(true); return; }
    doEndTrip();
  };

  const passengerLabel = trip?.is_for_someone_else ? trip?.recipient_name : (trip?.passenger_name || 'Passenger');

  // Map positions
  const pickupPos = trip?.pickup_lat ? [trip.pickup_lat, trip.pickup_lng] : null;
  const dropoffPos = trip?.dropoff_lat ? [trip.dropoff_lat, trip.dropoff_lng] : null;
  const fitPositions = [driverPos, pickupPos, dropoffPos].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-background">
      {/* Overlay top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <div className={`rounded-full px-4 py-2 shadow-lg flex items-center gap-2 ${trip?.status === 'in_progress' ? 'bg-forge-navy' : trip?.status === 'awaiting_passenger_confirm' ? 'bg-yellow-500' : 'bg-forge-orange'}`}>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white">
            {trip?.status === 'in_progress' ? 'Trip In Progress' : trip?.status === 'awaiting_passenger_confirm' ? 'Awaiting Confirm' : 'Arriving at Pickup'}
          </span>
        </div>
        <button className="w-11 h-11 bg-forge-orange rounded-full shadow-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Navigation banner */}
      <div className="absolute top-16 left-4 right-4 z-10">
        <div className="bg-forge-navy/95 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-forge-orange flex-shrink-0" />
            <span className="text-white text-xs font-medium truncate">
              {trip?.status === 'in_progress'
                ? `To Dropoff: ${trip?.dropoff_address?.split(',')[0] || '...'}`
                : `To Pickup: ${trip?.pickup_address?.split(',')[0] || '...'}`}
            </span>
          </div>
          <span className="text-forge-orange font-extrabold text-xs ml-2 flex-shrink-0">{liveDistKm != null ? `${liveDistKm} km` : '—'}</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: '58vh' }}>
        <MapContainer
          center={driverPos || pickupPos || [6.5244, 3.3792]}
          zoom={14}
          style={{ height: '100%', width: '100%', minHeight: '58vh' }}
          zoomControl={false} attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverPos && <SmoothDriverMarker position={driverPos} />}
          {pickupPos && <PinMarker position={pickupPos} color="#E85A0F" emoji="📍" label="Pickup" />}
          {dropoffPos && <PinMarker position={dropoffPos} color="#0D1B3E" emoji="🏁" label="Dropoff" />}
          {fitPositions.length >= 2
            ? <FitBounds positions={fitPositions} />
            : driverPos ? <MapViewUpdater center={driverPos} zoom={15} /> : null
          }
        </MapContainer>
        {/* Live badge */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-card rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground">Live GPS</span>
        </div>
      </div>

      {/* Progress bar (only when in_progress) */}
      {trip?.status === 'in_progress' && (
        <div className="bg-card border-t border-border px-5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-forge-orange truncate max-w-[40%]">{trip?.pickup_address?.split(',')[0]}</span>
            <span className="text-xs font-bold text-forge-navy truncate max-w-[40%] text-right">{trip?.dropoff_address?.split(',')[0]}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
            <div className="h-full bg-forge-orange rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            {/* Driver dot on progress bar */}
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-forge-orange border-2 border-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center"
              style={{ left: `calc(${progressPct}% - 10px)` }}>
              <span style={{ fontSize: '9px' }}>🚗</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1.5 font-medium">{progressPct}% of trip complete</p>
        </div>
      )}

      {/* Bottom card */}
      <div className="bg-card p-4 border-t border-border shadow-2xl">
        {trip ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white font-extrabold flex-shrink-0 text-sm">
                {passengerLabel?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PA'}
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-foreground text-sm">{passengerLabel}</p>
                {trip?.is_for_someone_else && (
                  <p className="text-xs text-forge-orange font-semibold">Booked by {trip?.passenger_name}</p>
                )}
                <p className="text-xs text-gray-400">{trip?.request_type === 'goods' ? 'Goods Delivery' : 'Person Transport'}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{liveEtaMin != null ? `~${liveEtaMin} min away` : '—'}</p>
              </div>
            </div>

            {/* Route summary */}
            <div className="bg-background rounded-xl px-3 py-2.5 mb-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-forge-orange flex-shrink-0" />
                <span className="text-xs text-foreground font-medium truncate">{trip.pickup_address}</span>
              </div>
              <div className="ml-[4px] w-0 border-l-2 border-dashed border-gray-300 h-3" />
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-forge-navy flex-shrink-0" />
                <span className="text-xs text-foreground font-medium truncate">{trip.dropoff_address}</span>
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
                <AlertTriangle className="w-4 h-4" /> SOS
              </button>
              <button onClick={endTrip} disabled={loading || trip?.status !== 'in_progress'}
                className={`flex-1 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm ${trip?.status === 'in_progress' ? 'bg-forge-navy text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4" /> End Trip</>}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading trip...
          </div>
        )}
      </div>

      {/* End Trip Warning Dialog */}
      {showEndWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-card w-full rounded-t-3xl p-6 max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2 text-foreground">Not at Dropoff Yet</h3>
            <p className="text-sm text-gray-400 text-center mb-4">You're <span className="font-bold text-forge-orange">{liveDistKm} km</span> away from the dropoff. End the trip anyway?</p>
            <button onClick={() => { setShowEndWarning(false); doEndTrip(); }} className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base mb-3">
              Yes, End Trip Anyway
            </button>
            <button onClick={() => setShowEndWarning(false)} className="w-full border-2 border-border text-foreground font-bold py-4 rounded-2xl text-base">
              Cancel — I'm Not There Yet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}