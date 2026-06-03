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

async function getIPLocation() {
  const res = await fetch('https://ipapi.co/json/');
  const data = await res.json();
  if (data.latitude && data.longitude) {
    return { lat: data.latitude, lng: data.longitude };
  }
  throw new Error('IP location unavailable');
}

export default function useCurrentLocation() {
  const [address, setAddress] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // 1. Try GPS first (with 8s timeout)
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 60000,
            });
          });
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          const addr = await reverseGeocode(lat, lng);
          if (!cancelled) { setAddress(addr); setLoading(false); }
          return;
        } catch {
          // GPS failed — fall through to IP-based
        }
      }

      // 2. Fallback: IP-based geolocation
      try {
        const { lat, lng } = await getIPLocation();
        if (cancelled) return;
        setCoords({ lat, lng });
        const addr = await reverseGeocode(lat, lng);
        if (!cancelled) { setAddress(addr); setLoading(false); }
      } catch {
        if (!cancelled) { setAddress('Location unavailable'); setLoading(false); }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, []);

  return { address, coords, loading };
}