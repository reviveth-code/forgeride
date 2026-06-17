import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SIGNUP_BONUS = 50000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all verified users
    const users = await base44.asServiceRole.entities.User.list();
    const verifiedUsers = users.filter(u => u.is_verified);

    // Get all existing wallets
    const wallets = await base44.asServiceRole.entities.Wallet.list();
    const walletUserIds = new Set(wallets.map(w => w.user_id));

    // Find verified users without wallets
    const unfunded = verifiedUsers.filter(u => !walletUserIds.has(u.email));

    const results = [];
    for (const user of unfunded) {
      const wallet = await base44.asServiceRole.entities.Wallet.create({
        user_id: user.email,
        balance: SIGNUP_BONUS,
        currency: 'NGN',
      });

      await base44.asServiceRole.entities.Transaction.create({
        wallet_id: wallet.id,
        user_id: user.email,
        type: 'funding',
        amount: SIGNUP_BONUS,
        status: 'success',
        reference: `SIGNUP-${user.id}`,
        description: 'Welcome bonus — ₦50,000 signup credit',
        metadata: { source: 'signup_bonus' },
      });

      results.push({ email: user.email, wallet_id: wallet.id });
    }

    return Response.json({ funded: results.length, details: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});