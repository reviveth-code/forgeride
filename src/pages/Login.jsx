import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('passenger');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const user = await base44.auth.me();
      window.location.href = user.app_role === 'driver' ? '/driver' : '/passenger';
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      {/* Dark header */}
      <div className="bg-forge-navy pt-16 pb-24 flex flex-col items-center">
        <div className="w-16 h-16 bg-forge-orange rounded-2xl mb-4 shadow-lg" />
        <h1 className="text-white text-2xl font-bold">ForgeRide</h1>
        <p className="text-white/50 text-sm mt-1">Welcome back</p>
      </div>

      {/* White card */}
      <div className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pt-8 pb-10 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Log In to Your Account</h2>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange transition-colors"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-forge-orange font-semibold">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center transition-opacity"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-sm text-gray-400 mb-3">Logging in as:</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { key: 'passenger', label: '👤 Customer' },
            { key: 'driver', label: '🚗 Driver' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={`py-3 rounded-2xl border-2 text-sm font-semibold transition-colors ${
                role === key ? 'border-forge-orange text-forge-orange bg-forge-orange/5' : 'border-gray-200 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-forge-orange font-bold">Sign Up</Link>
        </p>
        <p className="text-center text-xs text-gray-300 mt-6">🔒 Your data is secure and encrypted</p>
      </div>
    </div>
  );
}