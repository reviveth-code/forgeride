import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, User, Phone, Shield, Star, ChevronRight } from 'lucide-react';

export default function PassengerProfile() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-forge-navy pt-12 pb-16 px-5 text-center">
        <div className="w-20 h-20 bg-forge-orange rounded-full flex items-center justify-center text-white font-extrabold text-3xl mx-auto mb-3">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h1 className="text-xl font-bold text-white">{user?.full_name || 'User'}</h1>
        <p className="text-white/50 text-sm mt-1">{user?.email}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm font-semibold">{user?.rating || '4.8'} rating</span>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-3">
        {[
          { icon: User, label: 'Personal Information', action: () => {} },
          { icon: Phone, label: 'Phone Number', value: user?.phone || 'Not set', action: () => {} },
          { icon: Shield, label: 'Privacy & Security', action: () => {} },
          { icon: Star, label: 'My Reviews', action: () => {} },
        ].map(({ icon: Icon, label, value, action }) => (
          <button key={label} onClick={action} className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-forge-orange" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              {value && <p className="text-xs text-gray-400 mt-0.5">{value}</p>}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}

        <button onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-red-100">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="font-semibold text-red-500 text-sm flex-1 text-left">Log Out</span>
        </button>
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-forge-orange" />
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2 text-gray-900">Log Out?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">You will need to log in again to access your account. Any active trips will not be affected.</p>
            <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-base mb-3">Yes, Log Out</button>
            <button onClick={() => setShowLogout(false)} className="w-full border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-base">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}