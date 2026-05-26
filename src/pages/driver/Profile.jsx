import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LogOut, Star, Shield, ChevronRight, Car } from 'lucide-react';

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-forge-navy pt-12 pb-16 px-5 text-center">
        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white font-extrabold text-3xl mx-auto mb-3">
          {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'DR'}
        </div>
        <h1 className="text-xl font-bold text-white">{user?.full_name || 'Driver'}</h1>
        <p className="text-white/40 text-sm mt-1">{user?.email}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-bold">{user?.rating || '4.9'}</span>
          </div>
          <span className="text-white/30">•</span>
          <span className="text-white/60 text-sm">{user?.trips_count || 0} trips</span>
          <span className="text-white/30">•</span>
          <span className="text-green-400 text-sm font-semibold capitalize">{user?.vehicle_type || 'Keke'}</span>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-3">
        {[
          { icon: Car, label: 'Vehicle Information', value: `${user?.vehicle_type || 'Not set'} • ${user?.vehicle_plate || 'No plate'}` },
          { icon: Shield, label: 'Privacy & Security' },
          { icon: Star, label: 'My Reviews & Ratings' },
        ].map(({ icon: Icon, label, value }) => (
          <button key={label} className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-forge-orange" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              {value && <p className="text-xs text-gray-400 mt-0.5 capitalize">{value}</p>}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}

        <button onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-red-100">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="font-semibold text-red-500 text-sm flex-1 text-left">Log Out</span>
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-forge-orange" />
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2 text-gray-900">Log Out?</h3>
            <p className="text-sm text-gray-400 text-center mb-2">You will need to log in again to access your account. Any active trips will not be affected.</p>
            <div className="bg-forge-orange/10 border border-forge-orange/20 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2">
              <span className="text-forge-orange text-lg">⚠</span>
              <p className="text-sm text-forge-orange font-medium">You are currently Online. Going offline before logging out is recommended.</p>
            </div>
            <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-base mb-3">Yes, Log Out</button>
            <button onClick={() => setShowLogout(false)} className="w-full border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-base">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}