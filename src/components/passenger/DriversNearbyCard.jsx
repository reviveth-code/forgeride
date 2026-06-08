import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import '@/utils/leaflet';
import L from 'leaflet';

const VEHICLE_EMOJI = {
  keke: '🛺',
  okada: '🏍️',
  car: '🚗',
  bus: '🚌',
  truck: '🚚',
  van: '🚐',
};

const RADIUS_KM = 3;
const POLL_INTERVAL_MS = 5000; // 5 seconds

function makeDriverIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const USER_ICON = L.divIcon({
  html: `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
      <div style="
        position:absolute;
        width:28px;height:28px;
        background:rgba(232,90,15,0.25);
        border-radius:50%;
        animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
      <div style="
        width:14px;height:14px;
        background:#E85A0F;
        border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 0 8px rgba(232,90,15,0.6);
        position:relative;z-index:1;
      "></div>
    </div>
    <style>
      @keyframes ping {
        75%,100%{ transform:scale(2); opacity:0; }
      }
    </style>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapBoundsFitter({ drivers, userLat, userLng }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...drivers.map(d => [d.current_lat, d.current_lng]),
      ...(userLat && userLng ? [[userLat, userLng]] : []),
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15, animate: true });
    }
  }, [JSON.stringify(drivers.map(d => [d.current_lat, d.current_lng])), userLat, userLng]);

  return null;
}

export default function DriversNearbyCard({ userLat, userLng }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchDrivers = async () => {
    if (!initialLoadDone.current) setLoading(true);
    const res = await base44.functions.invoke('getOnlineDrivers', {
      userLat: userLat || null,
      userLng: userLng || null,
      radiusKm: RADIUS_KM,
    });
    setDrivers(res.data?.drivers || []);
    if (!initialLoadDone.current) {
      setLoading(false);
      initialLoadDone.current = true;
    }
  };

  useEffect(() => {
    fetchDrivers();
    // Poll every 5s so driver positions update in near real-time
    const poll = setInterval(fetchDrivers, POLL_INTERVAL_MS);
    // Also subscribe to User entity changes so any position update triggers a refresh
    const unsub = base44.entities.User.subscribe(() => fetchDrivers());
    return () => { clearInterval(poll); unsub(); };
  }, [userLat, userLng]);

  const defaultCenter = userLat && userLng
    ? [userLat, userLng]
    : drivers.length > 0
      ? [drivers[0].current_lat, drivers[0].current_lng]
      : [6.5244, 3.3792];

  const counts = drivers.reduce((acc, d) => {
    const vt = (d.vehicle_type || 'car').toLowerCase();
    acc[vt] = (acc[vt] || 0) + 1;
    return acc;
  }, {});

  const closestDriver = drivers[0];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Drivers Near You · {RADIUS_KM}km
          </p>
          {loading ? (
            <p className="text-sm text-gray-400 mt-1">Checking availability…</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm font-semibold text-gray-500 mt-1">No drivers online nearby</p>
          ) : (
            <p className="text-sm font-bold text-green-700 mt-1">
              {drivers.length} driver{drivers.length !== 1 ? 's' : ''} available
              {closestDriver?.distance_km != null && (
                <span className="text-gray-400 font-normal">
                  {' '}· closest {closestDriver.distance_km} km
                </span>
              )}
            </p>
          )}
        </div>
        {!loading && drivers.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {Object.entries(counts).map(([vt, count]) => (
              <span key={vt} className="text-xs bg-gray-100 rounded-full px-2 py-1 font-semibold text-gray-600">
                {VEHICLE_EMOJI[vt] || '🚗'} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 200 }}>
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBoundsFitter drivers={drivers} userLat={userLat} userLng={userLng} />

          {/* Passenger position — pulsing orange dot */}
          {userLat && userLng && (
            <Marker position={[userLat, userLng]} icon={USER_ICON}>
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>You</span>
              </Tooltip>
            </Marker>
          )}

          {/* Driver markers — positions update every poll */}
          {drivers.map(d => (
            <Marker
              key={d.id}
              position={[d.current_lat, d.current_lng]}
              icon={makeDriverIcon(VEHICLE_EMOJI[(d.vehicle_type || 'car').toLowerCase()] || '🚗')}
            >
              <Tooltip permanent={false} direction="top">
                {d.full_name || 'Driver'} · {d.vehicle_type || 'vehicle'}
                {d.distance_km != null ? ` · ${d.distance_km} km` : ''}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="px-4 py-2.5 border-t border-gray-50">
        <p className="text-xs text-gray-400 text-center">
          {drivers.length > 0
            ? 'Tap "Post a New Request" to get offers from these drivers'
            : 'Check back soon — drivers come online throughout the day'}
        </p>
      </div>
    </div>
  );
}