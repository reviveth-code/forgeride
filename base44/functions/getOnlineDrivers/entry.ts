import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userLat, userLng, radiusKm = 5 } = body;

    const allUsers = await base44.asServiceRole.entities.User.list('-last_seen', 200);
    const now = Date.now();

    let onlineDrivers = allUsers
      .filter(u =>
        u.is_online &&
        (u.app_role === 'driver' || u.role === 'driver') &&
        u.current_lat &&
        u.current_lng &&
        (!u.last_seen || now - new Date(u.last_seen).getTime() < STALE_THRESHOLD_MS)
      )
      .map(u => ({
        id: u.id,
        full_name: u.display_name || u.full_name,
        vehicle_type: u.vehicle_type,
        current_lat: u.current_lat,
        current_lng: u.current_lng,
        last_seen: u.last_seen,
        distance_km: (userLat && userLng)
          ? +haversineKm(userLat, userLng, u.current_lat, u.current_lng).toFixed(2)
          : null,
      }));

    // If passenger location provided, filter by radius and sort by proximity
    if (userLat && userLng) {
      onlineDrivers = onlineDrivers
        .filter(d => d.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    return Response.json({ drivers: onlineDrivers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});