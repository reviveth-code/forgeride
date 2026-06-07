import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { auth } from '@/lib/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { Loader2, Phone } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const phoneToEmail = (phone) => `${phone.replace(/\D/g, '')}@forgeride.app`;
const phoneToPassword = (phone) => `FR_${phone.replace(/\D/g, '')}_ride`;

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);

  const getVerifier = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-anchor', {
        size: 'invisible',
      });
    }
    return recaptchaRef.current;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return setError('Please enter your phone number.');
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, trimmedPhone, getVerifier());
      confirmationResultRef.current = result;
      setStep('otp');
    } catch (err) {
      // Reset verifier on error so it can be recreated
      try { recaptchaRef.current?.clear(); } catch {}
      recaptchaRef.current = null;
      setError('Failed to send OTP. Use international format e.g. +2348012345678');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) return setError('Enter the 6-digit code.');
    setError('');
    setLoading(true);
    try {
      await confirmationResultRef.current.confirm(otpCode);
      await base44.auth.loginViaEmailPassword(phoneToEmail(phone.trim()), phoneToPassword(phone.trim()));
      const user = await base44.auth.me();
      window.location.href = user.app_role === 'driver' ? '/driver' : '/passenger';
    } catch {
      setError('Login failed. Make sure you have an account or sign up first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      {/* Invisible reCAPTCHA anchor — must be in the DOM */}
      <div id="recaptcha-anchor" style={{ position: 'absolute', bottom: 0, left: 0 }} />

      <div className="bg-forge-navy pt-16 pb-24 flex flex-col items-center">
        <div className="w-16 h-16 bg-forge-orange rounded-2xl mb-4 shadow-lg" />
        <h1 className="text-white text-2xl font-bold">ForgeRide</h1>
        <p className="text-white/50 text-sm mt-1">Welcome back</p>
      </div>

      <div className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pt-8 pb-10 shadow-2xl">
        {step === 'phone' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Log In</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your phone number to receive a code</p>
            {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" placeholder="+2348012345678" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Code</h2>
            <p className="text-gray-400 text-sm mb-6">Sent to <span className="font-semibold text-gray-700">{phone}</span></p>
            {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup className="gap-2">
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold border-2 border-gray-200 rounded-2xl data-[active]:border-forge-orange" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mb-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>
            <button onClick={() => { setStep('phone'); setOtpCode(''); setError(''); }}
              className="w-full text-center text-gray-400 text-sm">← Change number</button>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-forge-orange font-bold">Sign Up</Link>
        </p>
        <p className="text-center text-xs text-gray-300 mt-4">🔒 Your data is secure and encrypted</p>
      </div>
    </div>
  );
}