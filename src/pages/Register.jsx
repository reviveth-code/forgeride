import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { ArrowLeft, Loader2, Phone, User } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const phoneToEmail = (phone) => `${phone.replace(/\D/g, '')}@forgeride.app`;
const phoneToPassword = (phone) => `FR_${phone.replace(/\D/g, '')}_ride`;

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'email_otp'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('passenger');
  const [vehicleType, setVehicleType] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
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
    if (!agreed) return setError('Please agree to the Terms of Service.');
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return setError('Please enter your phone number.');
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, trimmedPhone, getVerifier());
      confirmationResultRef.current = result;
      setStep('otp');
    } catch (err) {
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
      await base44.auth.register({ email: phoneToEmail(phone.trim()), password: phoneToPassword(phone.trim()) });
      setStep('email_otp');
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtp = async () => {
    if (!emailOtpCode || emailOtpCode.length < 6) return setError('Enter the 6-digit code.');
    setError('');
    setLoading(true);
    try {
      const email = phoneToEmail(phone.trim());
      const result = await base44.auth.verifyOtp({ email, otpCode: emailOtpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      await base44.auth.updateMe({
        full_name: fullName,
        phone: phone.trim(),
        phone_verified: true,
        app_role: role,
        ...(vehicleType && { vehicle_type: vehicleType }),
      });
      window.location.href = role === 'driver' ? '/driver' : '/passenger';
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        <div id="recaptcha-anchor" style={{ position: 'absolute', bottom: 0, left: 0 }} />
        <div className="p-5">
          <button onClick={() => setStep('form')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 border-2 border-forge-orange rounded-full flex items-center justify-center mb-6">
            <Phone className="w-8 h-8 text-forge-orange" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Enter the code sent to <span className="font-semibold text-gray-700">{phone}</span>
          </p>
          {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm w-full text-center">{error}</div>}
          <div className="mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
              <InputOTPGroup className="gap-2">
                {[0,1,2,3,4,5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold border-2 border-gray-200 rounded-2xl data-[active]:border-forge-orange" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mb-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
          </button>
          <button onClick={() => setStep('form')} className="text-sm text-gray-400">← Change number</button>
        </div>
      </div>
    );
  }

  if (step === 'email_otp') {
    const silentEmail = phoneToEmail(phone.trim());
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-green-500 text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">One Last Step</h2>
          <p className="text-gray-400 text-sm text-center mb-1">We sent an activation code to</p>
          <p className="text-gray-600 text-sm font-semibold text-center mb-8">{silentEmail}</p>
          {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm w-full text-center">{error}</div>}
          <div className="mb-6">
            <InputOTP maxLength={6} value={emailOtpCode} onChange={setEmailOtpCode}>
              <InputOTPGroup className="gap-2">
                {[0,1,2,3,4,5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold border-2 border-gray-200 rounded-2xl data-[active]:border-forge-orange" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button onClick={handleEmailOtp} disabled={loading || emailOtpCode.length < 6}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mb-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Account'}
          </button>
          <button onClick={() => base44.auth.resendOtp(silentEmail)} className="text-sm text-forge-orange font-semibold">Resend Code</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">
      {/* Invisible reCAPTCHA anchor — must be in the DOM */}
      <div id="recaptcha-anchor" style={{ position: 'absolute', bottom: 0, left: 0 }} />

      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <Link to="/login"><ArrowLeft className="w-6 h-6 text-gray-700" /></Link>
        <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
      </div>

      <div className="px-5 py-5 pb-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Details</p>
        {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSendOtp} className="space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="tel" placeholder="Phone number (e.g. +2348012345678)" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>

          <div className="pt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">I Am A...</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'passenger', label: 'Passenger', sub: 'I Need Transport', emoji: '👤' },
                { key: 'driver', label: 'Driver', sub: 'I Provide Transport', emoji: '🚗' },
              ].map(({ key, label, sub, emoji }) => (
                <button key={key} type="button" onClick={() => setRole(key)}
                  className={`p-5 rounded-2xl border-2 text-center transition-all ${role === key ? 'border-forge-orange bg-forge-orange/5' : 'border-gray-200'}`}>
                  <div className="text-3xl mb-2">{emoji}</div>
                  <div className={`font-bold text-sm ${role === key ? 'text-forge-orange' : 'text-gray-900'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-1">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {role === 'driver' && (
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vehicle Type</p>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange bg-white text-gray-700">
                <option value="">Select vehicle type</option>
                <option value="keke">Keke Napep</option>
                <option value="okada">Okada (Motorcycle)</option>
                <option value="car">Car</option>
                <option value="bus">Bus/Minibus</option>
                <option value="truck">Truck</option>
              </select>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2">
            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-forge-orange cursor-pointer" />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the <span className="text-forge-orange font-semibold">Terms of Service</span> and{' '}
              <span className="text-forge-orange font-semibold">Privacy Policy</span>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-forge-orange font-bold">Log In</Link>
        </p>
      </div>
    </div>
  );
}