import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User, Phone, Shield, Star, ChevronRight, ChevronDown, Clock, Edit2, Loader2, X } from 'lucide-react';

function ExpandableSection({ icon: Icon, label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-forge-orange" />
        </div>
        <span className="flex-1 text-left font-semibold text-gray-900 text-sm">{label}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {children(setOpen)}
        </div>
      )}
    </div>
  );
}

export default function PassengerProfile() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setEditForm({ full_name: u?.full_name || '', phone: u?.phone || '' });
    });
  }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['passenger-trips', user?.email],
    queryFn: () => base44.entities.Trip.filter({ passenger_id: user.email }),
    enabled: !!user?.email,
  });

  const completedTrips = trips.filter(t => t.status === 'completed');
  const totalSpent = completedTrips.reduce((s, t) => s + (t.agreed_price || 0), 0);

  const handleSave = async (closeSection) => {
    setSaving(true);
    await base44.auth.updateMe(editForm);
    setUser(u => ({ ...u, ...editForm }));
    setSaving(false);
    closeSection(false);
  };

  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-forge-navy pt-12 pb-6 px-5 text-center">
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 bg-forge-orange rounded-full flex items-center justify-center text-white font-extrabold text-3xl">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">{user?.full_name || 'User'}</h1>
        <p className="text-white/50 text-sm mt-1">{user?.email}</p>
        {user?.phone && <p className="text-white/40 text-xs mt-0.5">{user.phone}</p>}
      </div>

      {/* Stats bar */}
      <div className="bg-forge-navy border-t border-white/10 px-5 pb-10">
        <div className="grid grid-cols-3 text-center">
          <div className="py-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-extrabold text-lg">{user?.rating || '—'}</span>
            </div>
            <p className="text-white/40 text-xs">Rating</p>
          </div>
          <div className="py-4 border-x border-white/10">
            <span className="text-white font-extrabold text-lg block mb-1">{completedTrips.length}</span>
            <p className="text-white/40 text-xs">Total Rides</p>
          </div>
          <div className="py-4">
            <span className="text-forge-orange font-extrabold text-lg block mb-1">₦{totalSpent >= 1000 ? (totalSpent/1000).toFixed(1)+'k' : totalSpent}</span>
            <p className="text-white/40 text-xs">Total Spent</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-3 pb-8">

        {/* Personal Information — expandable inline form */}
        <ExpandableSection icon={User} label="Personal Information">
          {(setOpen) => (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                <input
                  value={editForm?.full_name || ''}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Email</label>
                <input value={user?.email || ''} disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <button onClick={() => handleSave(setOpen)} disabled={saving}
                className="w-full bg-forge-orange text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          )}
        </ExpandableSection>

        {/* Phone Number — expandable inline */}
        <ExpandableSection icon={Phone} label="Phone Number">
          {(setOpen) => (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={editForm?.phone || ''}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 08012345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
                />
              </div>
              <button onClick={() => handleSave(setOpen)} disabled={saving}
                className="w-full bg-forge-orange text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          )}
        </ExpandableSection>

        {/* Trip History — navigate */}
        <button onClick={() => navigate('/passenger/trip-history')} className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Trip History</p>
            <p className="text-xs text-gray-400 mt-0.5">{completedTrips.length} completed rides</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Privacy & Security — expandable */}
        <ExpandableSection icon={Shield} label="Privacy & Security">
          {() => <p className="text-sm text-gray-500">Privacy and security settings coming soon.</p>}
        </ExpandableSection>

        {/* My Reviews — expandable */}
        <ExpandableSection icon={Star} label="My Reviews">
          {() => <p className="text-sm text-gray-500">You haven't received any reviews yet.</p>}
        </ExpandableSection>

        {/* Logout */}
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
            <p className="text-sm text-gray-400 text-center mb-6">You will need to log in again to access your account.</p>
            <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-base mb-3">Yes, Log Out</button>
            <button onClick={() => setShowLogout(false)} className="w-full border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-base">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}