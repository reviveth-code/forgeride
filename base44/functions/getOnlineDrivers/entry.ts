import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to list users (bypasses admin-only restriction)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const now = Date.now();

    const onlineDrivers = allUsers
      .filter(u =>
        u.is_online &&
        u.app_role === 'driver' &&
        u.current_lat &&
        u.current_lng &&
        (!u.last_seen || now - new Date(u.last_seen).getTime() < STALE_THRESHOLD_MS)
      )
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        vehicle_type: u.vehicle_type,
        current_lat: u.current_lat,
        current_lng: u.current_lng,
        last_seen: u.last_seen,
      }));

    return Response.json({ drivers: onlineDrivers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});