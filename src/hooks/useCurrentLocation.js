import { useState, useEffect } from 'react';

export default function useCurrentLocation() {
  const [address, setAddress] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setCoords({ lat: coords.latitude, lng: coords.longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const parts = [
            data.address?.road,
            data.address?.suburb || data.address?.neighbourhood || data.address?.quarter,
            data.address?.city || data.address?.town || data.address?.village,
          ].filter(Boolean);
          setAddress(parts.join(', ') || data.display_name?.split(',').slice(0,2).join(',') || 'Location found');
        } catch {
          setAddress('Location found');
        }
        setLoading(false);
      },
      () => { setAddress(null); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { address, coords, loading };
}