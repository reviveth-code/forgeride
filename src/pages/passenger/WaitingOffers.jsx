import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, X, Clock } from 'lucide-react';

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

const CANCEL_REASONS = [
  'Driver is taking too long to arrive',
  'I found another ride',
  'I entered the wrong destination',
  'Driver asked me to cancel',
  'I no longer need the ride',
  'Other reason',
];

export default function WaitingOffers() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const prevBidCountRef = useRef(0);

  const loadBids = () => base44.entities.Bid.filter({ request_id: requestId, status: 'pending' }).then(newBids => {
    if (newBids.length > prevBidCountRef.current) playChime();
    prevBidCountRef.current = newBids.length;
    setBids(newBids);
  });

  useEffect(() => {
    base44.entities.RideRequest.get(requestId).then(setRequest);
    loadBids();
    const unsub = base44.entities.Bid.subscribe(() => loadBids());
    // Count online drivers
    base44.entities.Bid.filter({ status: 'pending' }).then(allBids => {
      const uniqueDrivers = new Set(allBids.map(b => b.driver_id));
      setNearbyDrivers(uniqueDrivers.size || null);
    });
    return unsub;
  }, [requestId]);

  const handleCancel = async () => {
    await base44.entities.RideRequest.update(requestId, { status: 'cancelled' });
    navigate('/passenger');
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <div className="flex items-center justify-between px-5 py-4 bg-card border-b border-border">
        <button onClick={() => navigate('/passenger')}><ArrowLeft className="w-6 h-6 text-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Waiting for Offers</h1>
        <button onClick={() => setShowCancelModal(true)}><X className="w-5 h-5 text-gray-400" /></button>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Pulsing indicator */}
        <div className="flex flex-col items-center py-4 text-center">
          <div className="relative mb-5">
            <div className="w-5 h-5 bg-forge-orange rounded-full animate-ping absolute top-0 left-0" />
            <div className="w-5 h-5 bg-forge-orange rounded-full relative" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2">Looking for drivers near you...</h2>
          {nearbyDrivers !== null && (
            <p className="text-green-600 text-sm font-semibold">● {nearbyDrivers} driver{nearbyDrivers !== 1 ? 's' : ''} active nearby</p>
          )}
          <p className="text-gray-400 text-xs mt-1">Request posted just now</p>
        </div>

        {/* Request summary */}
        {request && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Your Request</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-forge-orange flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{request.pickup_address}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-muted-foreground flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{request.dropoff_address}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-forge-orange/10 text-forge-orange text-xs px-3 py-1 rounded-full font-bold capitalize">
                {request.request_type === 'person' ? 'Person Transport' : 'Goods Delivery'}
              </span>
              <span className="text-gray-400 text-xs">~{request.estimated_distance_km} km</span>
              <span className="text-gray-400 text-xs">~{request.estimated_duration_min} min drive</span>
            </div>
            <div className="mt-3 bg-green-50 text-green-700 text-xs px-4 py-2 rounded-xl font-semibold">
              ● Request is Live — Drivers can see this now
            </div>
          </div>
        )}

        {/* Offers */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Offers Received</p>
            <span className="text-xs text-gray-400 font-medium">{bids.length} so far</span>
          </div>
          {bids.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Driver offers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bids.map(bid => (
                <div key={bid.id} className="bg-card rounded-2xl p-4 flex justify-between items-center border border-border">
                  <div>
                    <p className="font-bold text-foreground text-sm">{bid.driver_name}</p>
                    <p className="text-forge-orange font-extrabold text-lg">₦{bid.price?.toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-gray-400">~{bid.eta_min || 4} min away</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => bids.length > 0 && navigate(`/passenger/offers/${requestId}`)}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${bids.length > 0 ? 'bg-forge-orange text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          View All Offers
        </button>
        <button onClick={() => setShowCancelModal(true)}
          className="w-full py-4 rounded-2xl font-bold text-base border-2 border-red-400 text-red-400">
          Cancel Request
        </button>
        <p className="text-center text-xs text-gray-400">Cancelling before a driver is selected is free.</p>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-card w-full rounded-t-3xl p-6 max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-2xl font-bold">!</span>
              </div>
            </div>
            <button onClick={() => setShowCancelModal(false)} className="absolute top-6 right-6">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h3 className="text-xl font-extrabold text-center mb-2 text-foreground">Cancel Your Request?</h3>
            <p className="text-sm text-gray-400 text-center mb-5">Please tell us why you are cancelling. This helps us improve the ForgeRide experience.</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select A Reason</p>
            <div className="space-y-2 mb-4 max-h-56 overflow-auto">
              {CANCEL_REASONS.map(r => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-colors ${cancelReason === r ? 'border-forge-orange bg-forge-orange/5' : 'border-gray-100'}`}>
                  <input type="radio" name="reason" value={r} checked={cancelReason === r} onChange={() => setCancelReason(r)} className="accent-forge-orange" />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl text-xs text-blue-600 mb-4">
              ℹ After a driver starts moving to you, a cancellation fee of ₦200 may apply.
            </div>
            <button onClick={handleCancel} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-base">
              Confirm Cancellation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}