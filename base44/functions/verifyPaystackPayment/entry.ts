import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify Paystack signature
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await req.text();
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');

    const hash = createHmac('sha512', secret).update(body).digest('hex');
    if (hash !== signature) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event !== 'charge.success') {
      return Response.json({ status: 'ignored', event: event.event });
    }

    const { reference, amount, metadata } = event.data;
    const amountNaira = amount / 100;

    // Find pending transaction
    const txs = await base44.asServiceRole.entities.Transaction.filter({ reference, status: 'pending' });
    if (txs.length === 0) {
      return Response.json({ error: 'No pending transaction found for this reference' }, { status: 404 });
    }

    const tx = txs[0];

    // Update transaction to success
    await base44.asServiceRole.entities.Transaction.update(tx.id, { status: 'success' });

    // Credit wallet
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: tx.user_id });
    if (wallets.length > 0) {
      const wallet = wallets[0];
      await base44.asServiceRole.entities.Wallet.update(wallet.id, {
        balance: (wallet.balance || 0) + amountNaira,
      });
    }

    return Response.json({ status: 'success', message: 'Wallet credited' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});