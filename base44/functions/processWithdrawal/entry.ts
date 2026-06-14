import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, account_number, bank_code, account_name } = await req.json();
    if (!amount || amount < 500) {
      return Response.json({ error: 'Minimum withdrawal is ₦500' }, { status: 400 });
    }
    if (!account_number || !bank_code) {
      return Response.json({ error: 'Bank account details required' }, { status: 400 });
    }

    // Check wallet balance
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: user.email });
    if (wallets.length === 0 || wallets[0].balance < amount) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const wallet = wallets[0];
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const reference = `WDRW-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Step 1: Create transfer recipient
    const recipientBody = {
      type: 'nuban',
      name: account_name || user.full_name || 'Customer',
      account_number: String(account_number),
      bank_code: String(bank_code),
      currency: 'NGN',
    };

    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(recipientBody),
    });
    const recipientData = await recipientRes.json();

    if (!recipientData.status) {
      return Response.json({ error: recipientData.message || 'Failed to verify bank account' }, { status: 400 });
    }

    const recipientCode = recipientData.data.recipient_code;
    const resolvedName = recipientData.data.details?.account_name || account_name || user.full_name;

    // Step 2: Initiate transfer
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        reason: `ForgeRide withdrawal for ${user.email}`,
        amount: amount * 100, // in kobo
        recipient: recipientCode,
        reference,
      }),
    });
    const transferData = await transferRes.json();

    if (!transferData.status) {
      return Response.json({ error: transferData.message || 'Transfer failed' }, { status: 400 });
    }

    // Step 3: Deduct from wallet
    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: wallet.balance - amount,
    });

    // Step 4: Create withdrawal transaction
    await base44.asServiceRole.entities.Transaction.create({
      wallet_id: wallet.id,
      user_id: user.email,
      type: 'withdrawal',
      amount: amount,
      status: 'success',
      reference,
      description: `Withdrawal to ${resolvedName} (${bank_code})`,
      metadata: {
        withdrawal: true,
        paystack_transfer_code: transferData.data.transfer_code,
        account_number,
        bank_code,
        account_name: resolvedName,
      },
    });

    return Response.json({
      success: true,
      reference,
      account_name: resolvedName,
      message: `₦${amount.toLocaleString()} sent to your bank account`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});