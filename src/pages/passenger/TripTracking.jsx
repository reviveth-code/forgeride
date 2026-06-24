import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Star, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
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
    if (valid.length >= 2) map.fitBounds(valid, { padding: [80, 80] });
    else if (valid.length === 1) map.setView(valid[0], 15);
  }, [positions.map(p => p ? `${p[0]},${p[1]}` : 'null').join('|')]);
  return null;
}

export default function TripTracking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverOffline, setDriverOffline] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [smoothDistKm, setSmoothDistKm] = useState(null);
  const lastDriverUpdateRef = useRef(null);

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

  // Offline detection
  useEffect(() => {
    if (trip?.driver_lat && trip?.driver_lng) {
      const key = `${trip.driver_lat},${trip.driver_lng}`;
      if (lastDriverUpdateRef.current !== key) {
        lastDriverUpdateRef.current = key;
        setDriverOffline(false);
      }
    }
  }, [trip?.driver_lat, trip?.driver_lng]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (trip?.status === 'in_progress' || trip?.status === 'driver_arriving') setDriverOffline(true);
    }, 60000);
    return () => clearTimeout(t);
  }, [trip?.driver_lat, trip?.driver_lng, trip?.status]);

  // Smooth distance EMA
  useEffect(() => {
    const raw = (() => {
      if (!trip?.driver_lat) return null;
      if (trip?.status === 'in_progress') return haversine(trip.driver_lat, trip.driver_lng, trip.dropoff_lat, trip.dropoff_lng);
      return haversine(trip.driver_lat, trip.driver_lng, trip.pickup_lat, trip.pickup_lng);
    })();
    if (raw == null) return;
    setSmoothDistKm(prev => prev == null ? raw : +((0.2 * raw + 0.8 * prev).toFixed(2)));
  }, [trip?.driver_lat, trip?.driver_lng, trip?.status]);

  const driverPos = trip?.driver_lat ? [trip.driver_lat, trip.driver_lng] : null;
  const pickupPos = trip?.pickup_lat ? [trip.pickup_lat, trip.pickup_lng] : null;
  const dropoffPos = trip?.dropoff_lat ? [trip.dropoff_lat, trip.dropoff_lng] : null;
  const fitPositions = [driverPos, pickupPos, dropoffPos].filter(Boolean);

  const liveDistKm = smoothDistKm;
  const liveEtaMin = liveDistKm != null ? Math.max(1, Math.round(liveDistKm * 3)) : null;

  const progressPct = useMemo(() => {
    if (!driverPos || !pickupPos || !dropoffPos || trip?.status !== 'in_progress') return 0;
    const total = haversine(trip.pickup_lat, trip.pickup_lng, trip.dropoff_lat, trip.dropoff_lng);
    const remaining = smoothDistKm ?? haversine(trip.driver_lat, trip.driver_lng, trip.dropoff_lat, trip.dropoff_lng);
    if (!total) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }, [smoothDistKm, trip?.status, trip?.pickup_lat, trip?.dropoff_lat]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  const statusLabel = trip?.status === 'in_progress' ? 'On the way to dropoff'
    : trip?.status === 'awaiting_passenger_confirm' ? 'Driver arrived — confirm pickup'
    : 'Driver is on the way';

  // Bottom sheet height: collapsed = 220px, expanded = auto
  const sheetStyle = sheetExpanded
    ? { maxHeight: '70vh', overflowY: 'auto' }
    : { maxHeight: '220px', overflow: 'hidden' };

  return (
    <div className="fixed inset-0 max-w-md mx-auto bg-background flex flex-col">

      {/* Fullscreen Map */}
      <div className="absolute inset-0" style={{ bottom: sheetExpanded ? '70vh' : '220px', transition: 'bottom 0.3s ease' }}>
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

        {/* Floating back button */}
        <button
          onClick={() => navigate('/passenger')}
          aria-label="Go back"
          className="absolute z-[1000] bg-card shadow-lg rounded-full w-11 h-11 flex items-center justify-center"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)', left: '16px' }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
        </button>

        {/* Live / offline badge */}
        {driverPos && !driverOffline && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-card rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
            style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-foreground">Live</span>
          </div>
        )}
        {driverOffline && (
          <div className="absolute z-[1000] bg-orange-100 border border-orange-300 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
            style={{ top: 'calc(env(safe-area-inset-top) + 12px)', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-bold text-orange-700">Driver signal lost</span>
          </div>
        )}

        {/* Phone button floating */}
        {driverProfile?.phone && (
          <a href={`tel:${driverProfile.phone}`} aria-label={`Call ${trip?.driver_name || 'driver'}`}
            className="absolute z-[1000] bg-forge-orange shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
            style={{ top: 'calc(env(safe-area-inset-top) + 12px)', right: '16px' }}>
            <Phone className="w-5 h-5 text-white" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl z-10"
        style={sheetStyle}
      >
        {/* Drag handle + toggle */}
        <button
          className="w-full flex flex-col items-center pt-3 pb-2"
          onClick={() => setSheetExpanded(e => !e)}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 mb-2" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forge-orange">{statusLabel}</span>
            {sheetExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {trip ? (
          <div className="px-5 pb-6">

            {/* ETA / distance pill */}
            {liveEtaMin != null && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-foreground">{liveEtaMin} min</p>
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    {trip.status === 'in_progress' ? 'to dropoff' : 'away'}
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-foreground">{liveDistKm} km</p>
                  <p className="text-xs text-muted-foreground uppercase font-medium">distance</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-forge-orange">₦{trip.agreed_price?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground uppercase font-medium">fare</p>
                </div>
              </div>
            )}

            {/* Progress bar (in_progress) */}
            {trip.status === 'in_progress' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="truncate max-w-[45%] font-medium">{trip.pickup_address?.split(',')[0]}</span>
                  <span className="truncate max-w-[45%] font-medium text-right">{trip.dropoff_address?.split(',')[0]}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-visible">
                  <div className="h-full bg-forge-orange rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-forge-orange border-2 border-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center"
                    style={{ left: `calc(${progressPct}% - 10px)` }}>
                    <span style={{ fontSize: '8px' }}>🚗</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{progressPct}% complete</p>
              </div>
            )}

            {/* Confirm pickup CTA */}
            {trip.status === 'awaiting_passenger_confirm' && (
              <button
                onClick={async () => {
                  await base44.entities.Trip.update(tripId, { status: 'in_progress' });
                  setTrip(prev => ({ ...prev, status: 'in_progress' }));
                }}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-sm mb-4"
              >
                ✅ Yes, I'm in the vehicle — Start Trip
              </button>
            )}

            {/* Driver card */}
            <div className="flex items-center gap-3 py-3 border-t border-border">
              <div className="w-12 h-12 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {initials(trip.driver_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm">{trip.driver_name}</p>
                {(() => {
                  const parts = [driverProfile?.vehicle_type, driverProfile?.vehicle_color, driverProfile?.vehicle_model].filter(Boolean);
                  return parts.length > 0 ? <p className="text-xs text-muted-foreground truncate">{parts.join(' · ')}</p> : null;
                })()}
                {driverProfile?.vehicle_plate && (
                  <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded mt-0.5 inline-block">{driverProfile.vehicle_plate}</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-foreground">{driverProfile?.rating ?? trip.driver_rating ?? '—'}</span>
              </div>
            </div>

            {/* Route (only in expanded) */}
            {sheetExpanded && (
              <div className="bg-muted rounded-2xl px-4 py-3 mt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-forge-orange flex-shrink-0" />
                  <span className="text-xs text-foreground font-medium">{trip.pickup_address}</span>
                </div>
                <div className="ml-[4px] w-0 border-l-2 border-dashed border-border h-3" />
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-forge-navy flex-shrink-0" />
                  <span className="text-xs text-foreground font-medium">{trip.dropoff_address}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        )}
      </div>
    </div>
  );
}