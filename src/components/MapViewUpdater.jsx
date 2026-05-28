import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function MapViewUpdater({ center, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, zoom);
    }
  }, [center?.[0], center?.[1], zoom]);
  return null;
}