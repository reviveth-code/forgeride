import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('passenger');
  const [vehicleType, setVehicleType] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please agree to Terms of Service'); return; }
    setError('');
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      await base44.auth.updateMe({ full_name: fullName, role, vehicle_type: vehicleType });
      window.location.href = role === 'driver' ? '/driver' : '/passenger';
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        <div className="p-5">
          <button onClick={() => setShowOtp(false)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 border-2 border-forge-orange rounded-full flex items-center justify-center mb-6">
            <span className="text-forge-orange text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Number</h2>
          <p className="text-gray-400 text-sm text-center mb-8">We sent a 6-digit code to {email}</p>
          {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm w-full text-center">{error}</div>}
          <div className="mb-4">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
              <InputOTPGroup className="gap-2">
                {[0,1,2,3,4,5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold border-2 border-gray-200 rounded-2xl data-[active]:border-forge-orange" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button
            onClick={handleVerify}
            disabled={loading || otpCode.length < 6}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mb-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            Didn't receive a code?{' '}
            <button onClick={() => base44.auth.resendOtp(email)} className="text-forge-orange font-semibold">Resend OTP</button>
          </p>
          <p className="text-center text-xs text-gray-300 mt-4">Didn't receive a code? Check your email inbox or request a new code above.</p>
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Information</p>

        {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} placeholder="Create a Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vehicle Details...</p>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange bg-white text-gray-700">
                <option value="">Vehicle Type</option>
                <option value="keke">Keke Napep</option>
                <option value="okada">Okada (Motorcycle)</option>
                <option value="car">Car</option>
                <option value="bus">Bus/Minibus</option>
                <option value="truck">Truck</option>
              </select>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2">
            <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-forge-orange cursor-pointer" />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the <span className="text-forge-orange font-semibold">Terms of Service</span> and{' '}
              <span className="text-forge-orange font-semibold">Privacy Policy</span>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
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