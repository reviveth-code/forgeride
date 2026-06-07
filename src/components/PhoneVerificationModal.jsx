import { useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { base44 } from '@/api/base44Client';
import { X, Loader2, CheckCircle2, Phone, Camera, User } from 'lucide-react';

export default function PhoneVerificationModal({ onClose, onVerified }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'profile'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const fileInputRef = useRef(null);

  const getRecaptchaVerifier = () => {
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch {}
    }
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return setError('Please enter a phone number.');
    setError('');
    setLoading(true);
    try {
      const verifier = getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, trimmedPhone, verifier);
      confirmationResultRef.current = result;
      setStep('otp');
    } catch (err) {
      console.error('Firebase Phone Auth error:', err);
      setError(err.message || 'Failed to send OTP. Check the number format (e.g. +2348012345678) and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return setError('Please enter the code.');
    setError('');
    setLoading(true);
    try {
      await confirmationResultRef.current.confirm(otp.trim());
      await base44.auth.updateMe({ phone: phone.trim(), phone_verified: true });
      setStep('profile');
    } catch (err) {
      console.error('OTP confirm error:', err);
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setLoading(true);
    try {
      const updates = {};
      if (fullName.trim()) updates.full_name = fullName.trim();
      if (photoUrl) updates.profile_photo = photoUrl;
      if (Object.keys(updates).length > 0) {
        await base44.auth.updateMe(updates);
      }
      onVerified(phone.trim());
      onClose();
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div id="recaptcha-container" />

      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-gray-900">
            {step === 'phone' && 'Verify Phone Number'}
            {step === 'otp' && 'Enter Verification Code'}
            {step === 'profile' && 'Complete Your Profile'}
          </h3>
          {step !== 'profile' && (
            <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <>
            <div className="flex items-center gap-3 bg-forge-orange/10 rounded-2xl px-4 py-3 mb-5">
              <Phone className="w-5 h-5 text-forge-orange flex-shrink-0" />
              <p className="text-sm text-forge-orange font-medium">
                Use international format, e.g. <strong>+2348012345678</strong>
              </p>
            </div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+2348012345678"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </button>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Enter the 6-digit code sent to <span className="font-bold text-gray-800">{phone}</span>
            </p>
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
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mb-3 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><CheckCircle2 className="w-5 h-5" /> Verify</>
              )}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-center text-gray-400 text-sm">
              ← Change number / Resend
            </button>
          </>
        )}

        {/* Step 3: Profile */}
        {step === 'profile' && (
          <>
            {/* Success badge */}
            <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-4 py-3 mb-6">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Phone verified! Now set up your profile.</p>
            </div>

            {/* Profile photo */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-forge-orange rounded-full flex items-center justify-center shadow-md"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Tap to add photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Full name */}
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange mb-5"
            />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button onClick={handleSaveProfile} disabled={loading}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 mb-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
            </button>
            <button onClick={() => { onVerified(phone.trim()); onClose(); }}
              className="w-full text-center text-gray-400 text-sm">
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}