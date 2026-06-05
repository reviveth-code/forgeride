import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User, Phone, Shield, Star, ChevronRight, Clock, Loader2, X } from 'lucide-react';

function CategoryModal({ title, onClose, onSave, saving, children }) {
  const overlayRef = useRef();
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header — always visible */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="px-5 pt-5 pb-4 overflow-y-auto flex-1">
          {children}
        </div>
        {/* Save button — always visible at bottom */}
        {onSave && (
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onSave} disabled={saving}
              className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PassengerProfile() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'personal' | 'phone' | 'privacy' | 'reviews'
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['passenger-trips', user?.email],
    queryFn: () => base44.entities.Trip.filter({ passenger_id: user.email }),
    enabled: !!user?.email,
  });

  const completedTrips = trips.filter(t => t.status === 'completed');
  const totalSpent = completedTrips.reduce((s, t) => s + (t.agreed_price || 0), 0);

  const openModal = (key) => {
    // Reset form to current user values when opening
    setEditForm({ full_name: user?.full_name || '', phone: user?.phone || '' });
    setActiveModal(key);
  };

  const closeModal = () => setActiveModal(null); // discard changes

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(editForm);
    setUser(u => ({ ...u, ...editForm }));
    setSaving(false);
    setActiveModal(null);
  };

  const handleLogout = () => base44.auth.logout('/');

  const menuItems = [
    { key: 'personal', icon: User, label: 'Personal Information', sub: user?.full_name || 'Edit your name' },
    { key: 'phone', icon: Phone, label: 'Phone Number', sub: user?.phone || 'Add phone number' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-forge-navy pt-12 pb-6 px-5 text-center">
        <div className="w-20 h-20 bg-forge-orange rounded-full flex items-center justify-center text-white font-extrabold text-3xl mx-auto mb-3">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h1 className="text-xl font-bold text-white">{user?.full_name || 'User'}</h1>
        <p className="text-white/50 text-sm mt-1">{user?.email}</p>
        {user?.phone && <p className="text-white/40 text-xs mt-0.5">{user.phone}</p>}
      </div>

      {/* Stats */}
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
            <span className="text-forge-orange font-extrabold text-lg block mb-1">
              ₦{totalSpent >= 1000 ? (totalSpent / 1000).toFixed(1) + 'k' : totalSpent}
            </span>
            <p className="text-white/40 text-xs">Total Spent</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-3 pb-8">
        {/* Personal & Phone */}
        {menuItems.map(({ key, icon: Icon, label, sub }) => (
          <button key={key} onClick={() => openModal(key)}
            className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-forge-orange" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}

        {/* Trip History */}
        <button onClick={() => navigate('/passenger/trip-history')}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Trip History</p>
            <p className="text-xs text-gray-400 mt-0.5">{completedTrips.length} completed rides</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Privacy & Security */}
        <button onClick={() => openModal('privacy')}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Privacy & Security</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* My Reviews */}
        <button onClick={() => openModal('reviews')}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">My Reviews</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Logout */}
        <button onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-red-100">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="font-semibold text-red-500 text-sm flex-1 text-left">Log Out</span>
        </button>
      </div>

      {/* Personal Information Modal */}
      {activeModal === 'personal' && (
        <CategoryModal title="Personal Information" onClose={closeModal} onSave={handleSave} saving={saving}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Full Name</label>
              <input
                value={editForm.full_name || ''}
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
          </div>
        </CategoryModal>
      )}

      {/* Phone Number Modal */}
      {activeModal === 'phone' && (
        <CategoryModal title="Phone Number" onClose={closeModal} onSave={handleSave} saving={saving}>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={editForm.phone || ''}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 08012345678"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange"
            />
          </div>
        </CategoryModal>
      )}

      {/* Privacy Modal */}
      {activeModal === 'privacy' && (
        <CategoryModal title="Privacy & Security" onClose={closeModal}>
          <p className="text-sm text-gray-500">Privacy and security settings coming soon.</p>
        </CategoryModal>
      )}

      {/* Reviews Modal */}
      {activeModal === 'reviews' && (
        <CategoryModal title="My Reviews" onClose={closeModal}>
          <p className="text-sm text-gray-500">You haven't received any reviews yet.</p>
        </CategoryModal>
      )}

      {/* Logout confirmation */}
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