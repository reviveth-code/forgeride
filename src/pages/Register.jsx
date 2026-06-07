import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, ChevronDown } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import BottomSheetPicker from '@/components/BottomSheetPicker';

const VEHICLE_OPTIONS = [
  { value: 'keke', label: 'Keke Napep' },
  { value: 'okada', label: 'Okada (Motorcycle)' },
  { value: 'car', label: 'Car' },
  { value: 'bus', label: 'Bus / Minibus' },
  { value: 'truck', label: 'Truck' },
];

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('passenger');
  const [vehicleType, setVehicleType] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) return setError('Please agree to the Terms of Service.');
    setError('');
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) return setError('Enter the 6-digit code.');
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim(), otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      const formatted = phone.replace(/^0/, '');
      const fullPhone = `+234${formatted}`;
      await base44.auth.updateMe({
        full_name: fullName,
        phone: fullPhone,
        app_role: role,
        ...(vehicleType && { vehicle_type: vehicleType }),
      });
      window.location.href = role === 'driver' ? '/driver' : '/passenger';
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        <div className="p-5">
          <button onClick={() => setStep('form')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 border-2 border-forge-orange rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-forge-orange" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Enter the code sent to <span className="font-semibold text-gray-700">{email}</span>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
          </button>
          <button onClick={() => base44.auth.resendOtp(email.trim())} className="text-sm text-forge-orange font-semibold">
            Resend Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <Link to="/login"><ArrowLeft className="w-6 h-6 text-gray-700" /></Link>
        <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
      </div>

      <div className="px-5 py-5 pb-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Details</p>
        {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">+234</span>
            <input type="tel" placeholder="08012345678" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-16 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
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
              <button type="button" onClick={() => setShowVehiclePicker(true)}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-sm text-left flex items-center justify-between focus:outline-none focus:border-forge-orange bg-white"
              >
                <span className={vehicleType ? 'text-gray-800' : 'text-gray-400'}>
                  {vehicleType ? VEHICLE_OPTIONS.find(o => o.value === vehicleType)?.label : 'Select vehicle type'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <BottomSheetPicker
                open={showVehiclePicker}
                onClose={() => setShowVehiclePicker(false)}
                title="Vehicle Type"
                options={VEHICLE_OPTIONS}
                value={vehicleType}
                onChange={setVehicleType}
              />
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
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