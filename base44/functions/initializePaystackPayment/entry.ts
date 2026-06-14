import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || amount < 500) {
      return Response.json({ error: 'Minimum funding amount is ₦500' }, { status: 400 });
    }

    const ref = `FR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const amountKobo = Math.round(amount * 100);

    // Find or create wallet
    let wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: user.email });
    let wallet;
    if (wallets.length === 0) {
      wallet = await base44.asServiceRole.entities.Wallet.create({
        user_id: user.email,
        balance: 0,
        currency: 'NGN'
      });
    } else {
      wallet = wallets[0];
    }

    // Create pending transaction
    await base44.asServiceRole.entities.Transaction.create({
      wallet_id: wallet.id,
      user_id: user.email,
      type: 'funding',
      amount,
      status: 'pending',
      reference: ref,
      description: `Wallet funding of ₦${amount.toLocaleString()}`
    });

    // Initialize Paystack payment
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        reference: ref,
        currency: 'NGN',
        metadata: {
          wallet_id: wallet.id,
          user_id: user.email,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return Response.json({ error: paystackData.message || 'Payment initialization failed' }, { status: 500 });
    }

    return Response.json({
      reference: ref,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});