// Whitelisted reviewer email — bypasses OTP verification.
// The review team can register and login with this email without email access.
export const REVIEWER_EMAIL = "Ugozororunna@gmail.com";

export const isReviewerEmail = (email) =>
  email?.trim().toLowerCase() === REVIEWER_EMAIL.toLowerCase();