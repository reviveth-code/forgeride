import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// This endpoint is called by Africa's Talking sandbox simulator as a webhook.
// It requires no user authentication.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // AT sends data as URL-encoded form body
    const text = await req.text();
    const params = new URLSearchParams(text);

    const from = params.get('from');
    const to = params.get('to');
    const text_ = params.get('text');
    const date = params.get('date');

    console.log('AT Webhook received:', { from, to, text: text_, date });

    // Just acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('AT Webhook error:', error.message);
    return new Response('Error', { status: 500 });
  }
});