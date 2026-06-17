import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FORGE_COMMISSION_RATE = 0.1; // 10%

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    // Support both automation payload (event.entity_id) and direct call (trip_id)
    const trip_id = payload?.event?.entity_id || payload?.trip_id;
    if (!trip_id) return Response.json({ error: 'trip_id required' }, { status: 400 });

    // Load trip with service role (automation calls run as system)
    const trip = await base44.asServiceRole.entities.Trip.get(trip_id);
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });
    if (trip.status !== 'completed') return Response.json({ error: 'Trip not completed' }, { status: 400 });

    const { agreed_price, passenger_id, driver_id, passenger_name, driver_name, payment_method } = trip;
    if (!agreed_price || !passenger_id || !driver_id) {
      return Response.json({ error: 'Trip missing required fields' }, { status: 400 });
    }

    const forgeFee = Math.round(agreed_price * FORGE_COMMISSION_RATE);
    const driverEarning = agreed_price - forgeFee;

    // Cash trips — no wallet movement, just record for bookkeeping
    if (payment_method === 'cash') {
      // Record passenger cash payment
      await base44.asServiceRole.entities.Transaction.create({
        wallet_id: 'cash',
        user_id: passenger_id,
        type: 'payment',
        amount: agreed_price,
        status: 'success',
        reference: `TRIP-CASH-${trip_id}`,
        description: `Cash payment to ${driver_name}`,
        metadata: { trip_id, driver_id, forge_fee: forgeFee, payment_method: 'cash' },
      });

      // Record driver cash earning
      await base44.asServiceRole.entities.Transaction.create({
        wallet_id: 'cash',
        user_id: driver_id,
        type: 'earning',
        amount: driverEarning,
        status: 'success',
        reference: `TRIP-CASH-EARN-${trip_id}`,
        description: `Cash fare from ${passenger_name} (₦${forgeFee} Forge fee)`,
        metadata: { trip_id, passenger_id, forge_fee: forgeFee, gross_fare: agreed_price, payment_method: 'cash' },
      });

      return Response.json({
        success: true,
        payment_method: 'cash',
        passenger_paid: agreed_price,
        driver_earned_cash: driverEarning,
        forge_fee: forgeFee,
      });
    }

    // Wallet trips — full settlement
    // 1. Deduct from passenger wallet
    const passengerWallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: passenger_id });
    let passengerWallet;
    if (passengerWallets.length > 0) {
      passengerWallet = passengerWallets[0];
      const newBalance = Math.max(0, (passengerWallet.balance || 0) - agreed_price);
      await base44.asServiceRole.entities.Wallet.update(passengerWallet.id, { balance: newBalance });
    } else {
      // No wallet — create one with negative balance to track the debt
      passengerWallet = await base44.asServiceRole.entities.Wallet.create({
        user_id: passenger_id,
        balance: -agreed_price,
        currency: 'NGN',
      });
    }

    // Record passenger payment
    await base44.asServiceRole.entities.Transaction.create({
      wallet_id: passengerWallet.id,
      user_id: passenger_id,
      type: 'payment',
      amount: agreed_price,
      status: 'success',
      reference: `TRIP-PAY-${trip_id}`,
      description: `Ride payment to ${driver_name}`,
      metadata: { trip_id, driver_id, forge_fee: forgeFee, payment_method: 'wallet' },
    });

    // 2. Credit driver wallet (minus Forge commission)
    const driverWallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: driver_id });
    let driverWallet;
    if (driverWallets.length > 0) {
      driverWallet = driverWallets[0];
      await base44.asServiceRole.entities.Wallet.update(driverWallet.id, {
        balance: (driverWallet.balance || 0) + driverEarning,
      });
    } else {
      driverWallet = await base44.asServiceRole.entities.Wallet.create({
        user_id: driver_id,
        balance: driverEarning,
        currency: 'NGN',
      });
    }

    // Record driver earning
    await base44.asServiceRole.entities.Transaction.create({
      wallet_id: driverWallet.id,
      user_id: driver_id,
      type: 'earning',
      amount: driverEarning,
      status: 'success',
      reference: `TRIP-EARN-${trip_id}`,
      description: `Trip fare from ${passenger_name} (₦${forgeFee} Forge fee)`,
      metadata: { trip_id, passenger_id, forge_fee: forgeFee, gross_fare: agreed_price, payment_method: 'wallet' },
    });

    return Response.json({
      success: true,
      payment_method: 'wallet',
      passenger_debited: agreed_price,
      driver_credited: driverEarning,
      forge_fee: forgeFee,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});