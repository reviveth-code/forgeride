import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError('Please enter your email and password.');
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      const user = await base44.auth.me();
      window.location.href = user.app_role === 'driver' ? '/driver' : '/passenger';
    } catch {
      setError('Login failed. Check your credentials or sign up first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      <div className="bg-forge-navy pt-16 pb-24 flex flex-col items-center">
        <div className="w-16 h-16 bg-forge-orange rounded-2xl mb-4 shadow-lg" />
        <h1 className="text-white text-2xl font-bold">ForgeRide</h1>
        <p className="text-white/50 text-sm mt-1">Welcome back</p>
      </div>

      <div className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pt-8 pb-10 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Log In</h2>
        <p className="text-gray-400 text-sm mb-6">Enter your email and password</p>

        {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
              required
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-forge-orange font-bold">Sign Up</Link>
        </p>
        <p className="text-center text-xs text-gray-300 mt-4">🔒 Your data is secure and encrypted</p>
      </div>
    </div>
  );
}