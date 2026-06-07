// This function is no longer used.
// Phone OTP is now handled entirely on the frontend via Firebase Phone Authentication.
// See components/PhoneVerificationModal.jsx

Deno.serve(async () => {
  return Response.json({ message: 'Deprecated. Phone auth is handled via Firebase on the frontend.' }, { status: 410 });
});