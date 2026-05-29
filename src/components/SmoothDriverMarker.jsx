import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom orange driver icon
const driverIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 44px; height: 44px;
    background: #E85A0F;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 12px rgba(232,90,15,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  ">🚗</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export default function SmoothDriverMarker({ position }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!position || position[0] == null) return;

    if (!markerRef.current) {
      markerRef.current = L.marker(position, { icon: driverIcon }).addTo(map);
    } else {
      // Smoothly animate to new position
      const current = markerRef.current.getLatLng();
      const target = L.latLng(position[0], position[1]);
      const steps = 20;
      let step = 0;

      const animate = () => {
        step++;
        const t = step / steps;
        const lat = current.lat + (target.lat - current.lat) * t;
        const lng = current.lng + (target.lng - current.lng) * t;
        markerRef.current?.setLatLng([lat, lng]);
        if (step < steps) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  }, [position?.[0], position?.[1]]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return null;
}