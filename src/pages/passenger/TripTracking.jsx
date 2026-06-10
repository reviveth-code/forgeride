import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Star, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
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

export default function TripTracking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverOffline, setDriverOffline] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const lastDriverUpdateRef = useRef(null);
  const smoothDistRef = useRef(null);

  useEffect(() => {
    const loadTrip = async () => {
      const t = await base44.entities.Trip.get(tripId);
      setTrip(t);
      if (t?.status === 'completed') navigate(`/passenger/trip-complete/${tripId}`);
      if (t?.driver_id && !driverProfile) {
        const users = await base44.entities.User.list();
        const dp = users.find(u => u.email === t.driver_id);
        if (dp) setDriverProfile(dp);
      }
    };

    loadTrip();

    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === tripId) {
        setTrip(event.data);
        if (event.data?.status === 'completed') navigate(`/passenger/trip-complete/${tripId}`);
      }
    });

    const poll = setInterval(loadTrip, 3000);
    return () => { unsub(); clearInterval(poll); };
  }, [tripId]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  const driverPos = trip?.driver_lat ? [trip.driver_lat, trip.driver_lng] : null;
  const pickupPos = trip?.pickup_lat ? [trip.pickup_lat, trip.pickup_lng] : null;
  const dropoffPos = trip?.dropoff_lat ? [trip.dropoff_lat, trip.dropoff_lng] : null;

  // Track when driver location last changed — detect offline
  useEffect(() => {
    if (trip?.driver_lat && trip?.driver_lng) {
      const key = `${trip.driver_lat},${trip.driver_lng}`;
      if (lastDriverUpdateRef.current !== key) {
        lastDriverUpdateRef.current = key;
        setDriverOffline(false);
      }
    }
  }, [trip?.driver_lat, trip?.driver_lng]);

  // Mark driver offline if no location update for 60s
  useEffect(() => {
    const t = setTimeout(() => {
      if (trip?.status === 'in_progress' || trip?.status === 'driver_arriving') {
        setDriverOffline(true);
      }
    }, 60000);
    return () => clearTimeout(t);
  }, [trip?.driver_lat, trip?.driver_lng, trip?.status]);

  // Smooth distance with exponential moving average (alpha=0.2 → slow smooth)
  const [smoothDistKm, setSmoothDistKm] = useState(null);
  useEffect(() => {
    const raw = (() => {
      if (!driverPos) return null;
      if (trip?.status === 'in_progress') return haversine(trip.driver_lat, trip.driver_lng, trip.dropoff_lat, trip.dropoff_lng);
      return haversine(trip.driver_lat, trip.driver_lng, trip.pickup_lat, trip.pickup_lng);
    })();
    if (raw == null) return;
    setSmoothDistKm(prev => {
      if (prev == null) return raw;
      return +((0.2 * raw + 0.8 * prev).toFixed(2));
    });
  }, [trip?.driver_lat, trip?.driver_lng, trip?.status]);

  const liveDistKm = smoothDistKm;
  const liveEtaMin = liveDistKm != null ? Math.max(1, Math.round(liveDistKm * 3)) : null;

  // Trip progress % (only when in_progress) — use smoothed distance
  const progressPct = useMemo(() => {
    if (!driverPos || !pickupPos || !dropoffPos || trip?.status !== 'in_progress') return 0;
    const total = haversine(trip.pickup_lat, trip.pickup_lng, trip.dropoff_lat, trip.dropoff_lng);
    const remaining = smoothDistKm ?? haversine(trip.driver_lat, trip.driver_lng, trip.dropoff_lat, trip.dropoff_lng);
    if (!total || total === 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }, [smoothDistKm, trip?.status, trip?.pickup_lat, trip?.dropoff_lat]);

  const fitPositions = [driverPos, pickupPos, dropoffPos].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-card border-b border-border z-10 relative" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <button onClick={() => navigate('/passenger')}><ArrowLeft className="w-6 h-6 text-foreground" /></button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold text-foreground">
            {trip?.status === 'in_progress' ? 'Trip In Progress' : trip?.status === 'awaiting_passenger_confirm' ? 'Confirm Pickup' : 'Driver Arriving'}
          </h1>
          {liveEtaMin != null && trip?.status !== 'in_progress' && (
            <p className="text-xs text-forge-orange font-semibold">~{liveEtaMin} min away</p>
          )}
        </div>
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
      <div className="relative" style={{ height: '45vh', minHeight: '280px', display: (trip?.status === 'in_progress' && !showMap) ? 'none' : 'block' }}>
        <MapContainer
          center={driverPos || pickupPos || [6.5244, 3.3792]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverPos && <SmoothDriverMarker position={driverPos} />}
          {pickupPos && <PinMarker position={pickupPos} color="#E85A0F" emoji="📍" label="Pickup" />}
          {dropoffPos && <PinMarker position={dropoffPos} color="#0D1B3E" emoji="🏁" label="Dropoff" />}
          {fitPositions.length >= 2 ? <FitBounds positions={fitPositions} /> : null}
        </MapContainer>
        {driverPos && !driverOffline && (
          <div className="absolute top-3 left-3 z-[1000] bg-card rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-foreground">Live Tracking</span>
          </div>
        )}
        {driverOffline && (
          <div className="absolute top-3 left-3 z-[1000] bg-orange-100 border border-orange-300 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-bold text-orange-700">Driver signal lost</span>
          </div>
        )}
        {trip?.status === 'in_progress' && (
          <button onClick={() => setShowMap(false)}
            className="absolute top-3 right-3 z-[1000] bg-card rounded-full px-3 py-1.5 shadow-lg text-xs font-bold text-foreground">
            Hide Map ✕
          </button>
        )}
      </div>

      {/* In-progress compact banner (replaces map when hidden) */}
      {trip?.status === 'in_progress' && !showMap && (
        <div className="bg-forge-navy px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-white font-extrabold text-sm">Trip In Progress</p>
              <p className="text-white/60 text-xs">{liveDistKm != null ? `${liveDistKm} km to dropoff` : 'Calculating...'}</p>
            </div>
          </div>
          <button onClick={() => setShowMap(true)}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Show Map
          </button>
        </div>
      )}

      {/* Progress bar (in_progress only) */}
      {trip?.status === 'in_progress' && (
        <div className="bg-card border-b border-border px-5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-forge-orange truncate max-w-[45%]">{trip?.pickup_address?.split(',')[0]}</span>
            <span className="text-xs font-bold text-forge-navy truncate max-w-[45%] text-right">{trip?.dropoff_address?.split(',')[0]}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
            <div className="h-full bg-forge-orange rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-forge-orange border-2 border-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center"
              style={{ left: `calc(${progressPct}% - 10px)` }}>
              <span style={{ fontSize: '9px' }}>🚗</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1.5">{progressPct}% of trip complete · {liveDistKm} km to dropoff</p>
        </div>
      )}

      {/* Driver info bottom card */}
      <div className="bg-card flex-1 p-5 shadow-lg overflow-auto">
        {trip ? (
          <>
            {/* Driver info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {initials(trip.driver_name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">{trip.driver_name}</p>
                {(() => {
                  const parts = [driverProfile?.vehicle_type, driverProfile?.vehicle_color, driverProfile?.vehicle_model].filter(Boolean);
                  return parts.length > 0 ? <p className="text-xs text-gray-500">{parts.join(' · ')}</p> : null;
                })()}
                {driverProfile?.vehicle_plate && (
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mt-0.5 inline-block">{driverProfile.vehicle_plate}</span>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500">{driverProfile?.rating ?? trip.driver_rating ?? '—'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Agreed price</p>
              </div>
            </div>

            {/* Route summary */}
            <div className="bg-background rounded-xl px-3 py-3 mb-4 space-y-2">
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

            {/* Stats */}
            {trip.status !== 'in_progress' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background rounded-xl py-3 text-center">
                  <p className="text-base font-extrabold text-foreground">{liveEtaMin != null ? `~${liveEtaMin} min` : '—'}</p>
                  <p className="text-xs text-gray-400 uppercase font-medium">ETA</p>
                </div>
                <div className="bg-background rounded-xl py-3 text-center">
                  <p className="text-base font-extrabold text-foreground">{liveDistKm != null ? `${liveDistKm} km` : '—'}</p>
                  <p className="text-xs text-gray-400 uppercase font-medium">To Pickup</p>
                </div>
              </div>
            )}

            {trip.status === 'awaiting_passenger_confirm' && (
              <div className="mb-3">
                <p className="text-sm font-bold text-center text-gray-700 mb-2">Driver says they've arrived — are you in the vehicle?</p>
                <button
                  onClick={async () => {
                    await base44.entities.Trip.update(tripId, { status: 'in_progress' });
                    setTrip(prev => ({ ...prev, status: 'in_progress' }));
                  }}
                  className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl text-sm"
                >
                  ✅ Yes, I'm in the vehicle — Start Trip
                </button>
              </div>
            )}

            <div className={`text-white text-center py-3 rounded-2xl font-bold text-sm ${
              trip.status === 'in_progress' ? 'bg-forge-navy' :
              trip.status === 'awaiting_passenger_confirm' ? 'bg-yellow-500' :
              'bg-forge-orange'
            }`}>
              ● {trip.status === 'in_progress' ? 'Trip In Progress' : trip.status === 'awaiting_passenger_confirm' ? 'Waiting for Your Confirmation' : 'Driver On The Way'}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading trip details...
          </div>
        )}
      </div>
    </div>
  );
}