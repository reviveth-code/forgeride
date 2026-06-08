import { useState, useEffect } from 'react';

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'ForgeRide/1.0' } }
  );
  const data = await res.json();
  const a = data.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway,
    a.suburb || a.neighbourhood || a.quarter || a.district,
    a.city || a.town || a.village || a.county,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : data.display_name?.split(',').slice(0, 2).join(', ') || 'Location found';
}

export default function useCurrentLocation() {
  const [address, setAddress] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setAddress('Location unavailable');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const addr = await reverseGeocode(lat, lng);
        if (!cancelled) { setAddress(addr); setLoading(false); }
      },
      () => {
        if (!cancelled) { setAddress('Location unavailable'); setLoading(false); }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    return () => { cancelled = true; };
  }, []);

  return { address, coords, loading };
}