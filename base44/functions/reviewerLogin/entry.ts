import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REVIEWER_EMAIL = "Ugozororunna@gmail.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Only allow the whitelisted reviewer email
    if (email.trim().toLowerCase() !== REVIEWER_EMAIL.toLowerCase()) {
      return Response.json({ error: 'Not authorized for reviewer access' }, { status: 403 });
    }

    // Find the user by email using service role (admin-level access)
    const users = await base44.asServiceRole.entities.User.filter({ email: email.trim() });
    if (!users || users.length === 0) {
      return Response.json({ error: 'Account not found. Please register first.' }, { status: 404 });
    }

    const user = users[0];

    // Auto-verify the user if not already verified
    if (!user.is_verified) {
      await base44.asServiceRole.entities.User.update(user.id, { is_verified: true });
    }

    // Call the login API directly to get an access token
    const appId = req.headers.get("Base44-App-Id") || Deno.env.get("BASE44_APP_ID");
    const serverUrl = req.headers.get("Base44-Api-Url") || "https://base44.app";

    const loginResponse = await fetch(`${serverUrl}/api/apps/${appId}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      return Response.json(
        { error: errorData.message || errorData.error || 'Login failed. Check your password.' },
        { status: loginResponse.status }
      );
    }

    const loginData = await loginResponse.json();
    return Response.json({ access_token: loginData.access_token, user: loginData.user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});