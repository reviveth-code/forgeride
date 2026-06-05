import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, CheckCircle2, Phone } from 'lucide-react';

export default function PhoneVerificationModal({ onClose, onVerified }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!phone.trim()) return setError('Please enter a phone number.');
    setError('');
    setLoading(true);
    const res = await base44.functions.invoke('sendOtp', { phone: phone.trim() });
    setLoading(false);
    if (res.data?.success) {
      setStep('otp');
    } else {
      setError(res.data?.error || 'Failed to send OTP. Try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return setError('Please enter the code.');
    setError('');
    setLoading(true);
    const res = await base44.functions.invoke('verifyOtp', { otp: otp.trim() });
    setLoading(false);
    if (res.data?.success) {
      onVerified(phone);
      onClose();
    } else {
      setError(res.data?.error || 'Verification failed. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-gray-900">
            {step === 'phone' ? 'Verify Phone Number' : 'Enter Verification Code'}
          </h3>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {step === 'phone' ? (
          <>
            <div className="flex items-center gap-3 bg-forge-orange/10 rounded-2xl px-4 py-3 mb-5">
              <Phone className="w-5 h-5 text-forge-orange flex-shrink-0" />
              <p className="text-sm text-forge-orange font-medium">
                We'll send a 6-digit code to your phone via SMS.
              </p>
            </div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +2348012345678"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Enter the 6-digit code sent to <span className="font-bold text-gray-800">{phone}</span>
            </p>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Verification Code
            </label>
            <input
              type="number"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange mb-4 text-center text-2xl tracking-widest font-bold"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleVerifyOtp} disabled={loading}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mb-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><CheckCircle2 className="w-5 h-5" /> Verify</>
              )}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-center text-gray-400 text-sm">
              Resend code
            </button>
          </>
        )}
      </div>
    </div>
  );
}