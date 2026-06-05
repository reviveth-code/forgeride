import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Star, Shield, ChevronRight, Car, TrendingUp, Briefcase, Edit2, X, Loader2 } from 'lucide-react';
import VehicleDetailsSheet from '@/components/driver/VehicleDetailsSheet';
import EditDriverProfileSheet from '@/components/driver/EditDriverProfileSheet';

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

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'vehicle' | 'personal' | 'privacy' | 'reviews'
  const [showVehicleSheet, setShowVehicleSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['driver-trips', user?.email],
    queryFn: () => base44.entities.Trip.filter({ driver_id: user.email }),
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['driver-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: user.email }),
    enabled: !!user?.email,
  });

  const completedTrips = trips.filter(t => t.status === 'completed');
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';

  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-forge-navy pt-12 pb-6 px-5 text-center">
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
            {user?.profile_photo
              ? <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-white font-extrabold text-3xl">
                  {(user?.display_name || user?.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                </span>
            }
          </div>
          <button onClick={() => setShowEditSheet(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-forge-orange rounded-full flex items-center justify-center shadow-lg">
            <Edit2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <h1 className="text-xl font-bold text-white">{user?.display_name || user?.full_name || 'Driver'}</h1>
        <p className="text-white/40 text-sm mt-1">{user?.phone || user?.email}</p>
        <p className="text-white/50 text-xs mt-1 capitalize">
          {[user?.vehicle_type, user?.vehicle_plate].filter(Boolean).join(' • ') || 'No vehicle set'}
        </p>
      </div>

      {/* Stats */}
      <div className="bg-forge-navy border-t border-white/10 px-5 pb-10">
        <div className="grid grid-cols-3 text-center">
          <div className="py-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-extrabold text-lg">{avgRating}</span>
            </div>
            <p className="text-white/40 text-xs">Avg Rating</p>
          </div>
          <div className="py-4 border-x border-white/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase className="w-4 h-4 text-forge-orange" />
              <span className="text-white font-extrabold text-lg">{completedTrips.length}</span>
            </div>
            <p className="text-white/40 text-xs">Total Jobs</p>
          </div>
          <div className="py-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white font-extrabold text-lg">{reviews.length}</span>
            </div>
            <p className="text-white/40 text-xs">Reviews</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-3 pb-8">
        {/* Vehicle Information */}
        <button onClick={() => setShowVehicleSheet(true)}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Vehicle Information</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {[user?.vehicle_type, user?.vehicle_model, user?.vehicle_plate].filter(Boolean).join(' • ') || 'Tap to add vehicle details'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Personal Information */}
        <button onClick={() => setShowEditSheet(true)}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Edit2 className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Personal Information</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.display_name || user?.full_name || 'Edit your name & phone'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {/* Privacy & Security */}
        <button onClick={() => setActiveModal('privacy')}
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
        <button onClick={() => setActiveModal('reviews')}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">My Reviews & Ratings</p>
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

      {/* Privacy Modal */}
      {activeModal === 'privacy' && (
        <CategoryModal title="Privacy & Security" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-gray-500">Privacy and security settings coming soon.</p>
        </CategoryModal>
      )}

      {/* Reviews Modal */}
      {activeModal === 'reviews' && (
        <CategoryModal title="My Reviews & Ratings" onClose={() => setActiveModal(null)}>
          {reviews.length === 0
            ? <p className="text-sm text-gray-500">No reviews yet.</p>
            : <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
          }
        </CategoryModal>
      )}

      {/* Vehicle Sheet (existing component) */}
      {showVehicleSheet && user && (
        <VehicleDetailsSheet
          user={user}
          onClose={() => setShowVehicleSheet(false)}
          onSaved={(data) => setUser(u => ({ ...u, ...data }))}
        />
      )}

      {/* Edit Profile Sheet (existing component) */}
      {showEditSheet && user && (
        <EditDriverProfileSheet
          user={user}
          onClose={() => setShowEditSheet(false)}
          onSaved={(data) => setUser(u => ({ ...u, ...data }))}
        />
      )}

      {/* Logout confirmation */}
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