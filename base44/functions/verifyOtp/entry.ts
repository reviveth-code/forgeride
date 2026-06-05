import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { otp } = await req.json();
    if (!otp) return Response.json({ error: 'OTP required' }, { status: 400 });

    // Fetch latest user data from service role to get stored OTP
    const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const userData = users?.[0];

    if (!userData?.otp_code) {
      return Response.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (new Date() > new Date(userData.otp_expires_at)) {
      return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (userData.otp_code !== otp) {
      return Response.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Mark phone as verified, clear OTP
    await base44.asServiceRole.entities.User.update(user.id, {
      phone: userData.otp_phone,
      phone_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_phone: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});