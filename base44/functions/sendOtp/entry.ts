import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone } = await req.json();
    if (!phone) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // Store OTP on the user record
    await base44.asServiceRole.entities.User.update(user.id, {
      otp_code: otp,
      otp_expires_at: expiresAt,
      otp_phone: phone,
    });

    // Send SMS via Africa's Talking
    const AT_API_KEY = Deno.env.get('AT_API_KEY');
    const AT_USERNAME = Deno.env.get('AT_USERNAME');

    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message: `Your ForgeRide verification code is: ${otp}. It expires in 10 minutes.`,
    });

    const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const result = await response.json();
    const msgData = result?.SMSMessageData;
    const recipient = msgData?.Recipients?.[0];

    if (recipient?.statusCode !== 101) {
      return Response.json({ error: `SMS failed: ${recipient?.status || 'unknown error'}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});