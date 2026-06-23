import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuth) => {
      if (isAuth) {
        const user = await base44.auth.me();
        if (!user.app_role) return; // Stay on splash, let them choose
        navigate(user.app_role === 'driver' ? '/driver' : '/passenger');
      }
    });
  }, []);

  const features = [
    { emoji: '📦', label: 'Post A Request.' },
    { emoji: '🚗', label: 'Drivers Bid..' },
    { emoji: '✅', label: 'You Choose...' },
  ];

  return (
    <div className="min-h-screen bg-forge-navy flex flex-col items-center justify-between px-8 pt-20 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex flex-col items-center">
          <img src="https://media.base44.com/images/public/6a1573c7d7c314d5744004ba/e7cf22d08_ForgeRideIcon.png" alt="ForgeRide" className="w-28 h-28 mb-4 object-contain" />
          <h1 className="text-6xl font-extrabold text-white tracking-tight">
            Forge<span className="text-forge-orange">Ride</span>
          </h1>
          <p className="text-blue-300 text-sm mt-2 leading-relaxed">Africa's Real-Time Transport<br />Marketplace</p>
        </div>

        <div className="flex gap-10 text-center mt-12">
          {features.map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
                {emoji}
              </div>
              <span className="text-white/70 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Link to="/register">
          <button className="w-full bg-forge-orange text-white font-bold py-5 rounded-full text-lg shadow-lg">
            Get Started
          </button>
        </Link>
        <p className="text-center text-white/50 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-forge-orange font-semibold">Log In</Link>
        </p>
      </div>
    </div>
  );
}