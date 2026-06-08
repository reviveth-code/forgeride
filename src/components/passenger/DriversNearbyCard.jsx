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

function makeDriverIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Snaps map bounds to fit all markers
function MapBoundsFitter({ drivers, userLat, userLng }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...drivers.map(d => [d.current_lat, d.current_lng]),
      ...(userLat && userLng ? [[userLat, userLng]] : []),
    ];

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15, animate: true });
    }
  }, [drivers, userLat, userLng]);

  return null;
}

export default function DriversNearbyCard({ userLat, userLng }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const load = async () => {
      // Only show loading spinner on very first fetch
      if (!initialLoadDone.current) setLoading(true);
      const res = await base44.functions.invoke('getOnlineDrivers', {});
      setDrivers(res.data?.drivers || []);
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    };
    load();
    const poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, []);

  const defaultCenter = userLat && userLng
    ? [userLat, userLng]
    : drivers.length > 0
      ? [drivers[0].current_lat, drivers[0].current_lng]
      : [6.5244, 3.3792]; // Lagos fallback

  const counts = drivers.reduce((acc, d) => {
    const vt = (d.vehicle_type || 'car').toLowerCase();
    acc[vt] = (acc[vt] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drivers Near You</p>
          {loading ? (
            <p className="text-sm text-gray-400 mt-1">Checking availability…</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm font-semibold text-gray-500 mt-1">No drivers online right now</p>
          ) : (
            <p className="text-sm font-bold text-green-700 mt-1">
              {drivers.length} driver{drivers.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
        {!loading && drivers.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-end">
            {Object.entries(counts).map(([vt, count]) => (
              <span key={vt} className="text-xs bg-gray-100 rounded-full px-2 py-1 font-semibold text-gray-600">
                {VEHICLE_EMOJI[vt] || '🚗'} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 180 }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
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
          {drivers.map(d => (
            <Marker
              key={d.id}
              position={[d.current_lat, d.current_lng]}
              icon={makeDriverIcon(VEHICLE_EMOJI[(d.vehicle_type || 'car').toLowerCase()] || '🚗')}
            >
              <Tooltip permanent={false} direction="top">
                {d.full_name || 'Driver'} · {d.vehicle_type || 'vehicle'}
              </Tooltip>
            </Marker>
          ))}
          {userLat && userLng && (
            <Marker
              position={[userLat, userLng]}
              icon={L.divIcon({
                html: '<div style="width:12px;height:12px;background:#E85A0F;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3)"></div>',
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            />
          )}
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