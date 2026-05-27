import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      <div className="bg-forge-navy pt-16 pb-24 flex flex-col items-center">
        <div className="w-16 h-16 bg-forge-orange rounded-2xl mb-4 shadow-lg" />
        <h1 className="text-white text-2xl font-bold">ForgeRide</h1>
        <p className="text-white/50 text-sm mt-1">Password Reset</p>
      </div>

      <div className="bg-white rounded-t-3xl -mt-6 flex-1 px-6 pt-8 pb-10 shadow-2xl">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-400 text-sm">If an account exists with that email, you'll receive a password reset link shortly.</p>
            <Link to="/login" className="mt-6 inline-block text-forge-orange font-bold text-sm">Return to Login</Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
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
              <button type="submit" disabled={loading}
                className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}