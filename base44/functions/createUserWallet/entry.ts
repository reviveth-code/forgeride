import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const userId = payload?.event?.entity_id || payload?.user_id;
    if (!userId) return Response.json({ error: 'user_id required' }, { status: 400 });

    // Fetch the user
    const user = await base44.asServiceRole.entities.User.get(userId);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Only fund verified users (skip unverified or OTP-pending signups)
    if (!user.is_verified) {
      return Response.json({ skipped: true, reason: 'User not yet verified' });
    }

    // Check if wallet already exists
    const existing = await base44.asServiceRole.entities.Wallet.filter({ user_id: user.email });
    if (existing.length > 0) {
      return Response.json({ skipped: true, reason: 'Wallet already exists', wallet_id: existing[0].id });
    }

    // Create wallet with ₦50,000
    const wallet = await base44.asServiceRole.entities.Wallet.create({
      user_id: user.email,
      balance: 50000,
      currency: 'NGN',
    });

    // Record the funding as a transaction
    await base44.asServiceRole.entities.Transaction.create({
      wallet_id: wallet.id,
      user_id: user.email,
      type: 'funding',
      amount: 50000,
      status: 'success',
      reference: `SIGNUP-${userId}`,
      description: 'Welcome bonus — ₦50,000 signup credit',
      metadata: { source: 'signup_bonus' },
    });

    return Response.json({ success: true, wallet_id: wallet.id, balance: 50000 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});