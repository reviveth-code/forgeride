import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, Package, Loader2, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import BottomSheetPicker from '@/components/BottomSheetPicker';

const PRICE_OPTIONS = [
  { value: '800', label: '₦800' },
  { value: '1000', label: '₦1,000' },
  { value: '1200', label: '₦1,200' },
  { value: '1500', label: '₦1,500' },
  { value: '2000', label: '₦2,000' },
  { value: '2500', label: '₦2,500' },
  { value: '3000', label: '₦3,000' },
  { value: '5000', label: '₦5,000' },
];

function haversine(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
}

const REQUEST_TTL_MS = 3 * 60 * 1000;

export default function PlaceBid() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [price, setPrice] = useState(1500);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [secsLeft, setSecsLeft] = useState(180);
  const [existingBid, setExistingBid] = useState(null);
  const [competitorCount, setCompetitorCount] = useState(0);
  const [showPricePicker, setShowPricePicker] = useState(false);

  useEffect(() => {
    base44.entities.RideRequest.get(requestId).then(setRequest);
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        // Check for existing bid by this driver on this request
        const existing = await base44.entities.Bid.filter({ request_id: requestId, driver_id: u.email });
        const active = existing.find(b => b.status === 'pending' || b.status === 'accepted');
        if (active) setExistingBid(active);
        // Count competitors
        const allBids = await base44.entities.Bid.filter({ request_id: requestId, status: 'pending' });
        setCompetitorCount(allBids.filter(b => b.driver_id !== u.email).length);
      }
    });

    // Real-time driver GPS
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => setDriverPos({ lat: coords.latitude, lng: coords.longitude }),
      null,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation?.clearWatch(watchId);
  }, [requestId]);

  // Countdown timer based on request created_date
  useEffect(() => {
    if (!request) return;
    const tick = () => {
      const rawDate = request.created_date;
      const dateStr = typeof rawDate === 'string' && !rawDate.endsWith('Z') ? rawDate + 'Z' : rawDate;
      const elapsed = Date.now() - new Date(dateStr).getTime();
      const secs = Math.max(0, Math.floor((REQUEST_TTL_MS - elapsed) / 1000));
      setSecsLeft(secs);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [request]);

  const distFromPickup = haversine(driverPos?.lat, driverPos?.lng, request?.pickup_lat, request?.pickup_lng);
  const etaMin = distFromPickup ? Math.max(1, Math.round(distFromPickup * 3)) : 4;
  const isExpired = secsLeft === 0;
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const ss = String(secsLeft % 60).padStart(2, '0');

  const handleSubmit = async () => {
    if (existingBid) { navigate(`/driver/bid-submitted/${existingBid.id}`); return; }
    setLoading(true);
    // Optimistic: navigate immediately with a temp placeholder, then resolve
    const bidData = {
      request_id: requestId,
      driver_id: user.email,
      driver_name: user.display_name || user.full_name,
      driver_rating: user.rating || 4.8,
      vehicle_type: user.vehicle_type || 'keke',
      price,
      message,
      status: 'pending',
      eta_min: etaMin,
      distance_from_pickup_km: distFromPickup || 1.0,
    };
    const bid = await base44.entities.Bid.create(bidData);
    navigate(`/driver/bid-submitted/${bid.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-gray-100" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-900">Place Your Bid</h1>
      </div>

      {/* Existing bid warning */}
      {existingBid && (
        <div className="mx-5 mt-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-yellow-700">You already placed a bid</p>
            <p className="text-xs text-yellow-600">You have a pending bid of ₦{existingBid.price?.toLocaleString()} for this request.</p>
          </div>
          <button onClick={() => navigate(`/driver/bid-submitted/${existingBid.id}`)}
            className="text-xs font-bold text-forge-orange whitespace-nowrap">View →</button>
        </div>
      )}

      {/* Expiry countdown */}
      <div className={`mx-5 mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 ${isExpired ? 'bg-red-50 border border-red-200' : secsLeft < 30 ? 'bg-red-50 border border-red-200' : 'bg-forge-orange/10 border border-forge-orange/20'}`}>
        <Clock className={`w-5 h-5 flex-shrink-0 ${isExpired || secsLeft < 30 ? 'text-red-500' : 'text-forge-orange'}`} />
        {isExpired
          ? <p className="text-sm font-bold text-red-600">This request has expired. You can no longer bid.</p>
          : <p className={`text-sm font-bold ${secsLeft < 30 ? 'text-red-600' : 'text-forge-orange'}`}>
              Request expires in <span className="font-extrabold text-lg">{mm}:{ss}</span>
            </p>
        }
      </div>

      <div className="px-5 py-4 space-y-4 pb-8">
        {/* Job Details */}
        {request && (
          <div className="bg-white rounded-2xl p-5 border-2 border-forge-orange/20 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Job Details</p>
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white ${request.request_type === 'person' ? 'bg-forge-orange' : 'bg-blue-500'}`}>
                {request.request_type === 'person' ? <User className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                {request.request_type === 'person' ? 'Person Transport' : 'Goods Delivery'}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-forge-orange flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-900">{request.pickup_address}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-gray-900 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-900">{request.dropoff_address}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center border-t border-gray-100 pt-4">
              <div>
                <p className="font-extrabold text-gray-900 text-sm">~{request.estimated_distance_km} km</p>
                <p className="text-xs text-gray-400">Distance</p>
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-sm">~{request.estimated_duration_min} min</p>
                <p className="text-xs text-gray-400">Drive Time</p>
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-sm">{distFromPickup ? `${distFromPickup} km` : 'Getting GPS…'}</p>
                <p className="text-xs text-gray-400">You → Pickup</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center border-t border-gray-100 pt-4">
              <div>
                <p className="font-extrabold text-forge-orange text-sm">{competitorCount} bid{competitorCount !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400">Competition</p>
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Price Offer</p>
          <button
            type="button"
            onClick={() => setShowPricePicker(true)}
            className="w-full border-2 border-forge-orange rounded-2xl px-5 py-4 mb-3 flex items-center justify-between"
          >
            <p className="text-3xl font-extrabold text-gray-900">₦ {price.toLocaleString()}</p>
            <ChevronDown className="w-5 h-5 text-forge-orange" />
          </button>
          <BottomSheetPicker
            open={showPricePicker}
            onClose={() => setShowPricePicker(false)}
            title="Select Your Price"
            options={PRICE_OPTIONS}
            value={String(price)}
            onChange={(val) => setPrice(Number(val))}
          />
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forge-orange" placeholder="Or type a custom price" />
          <p className="text-xs text-gray-400 mt-2">ℹ Tap the amount above to pick from presets, or type a custom amount.</p>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Message to Passenger (Optional)</p>
          <textarea placeholder="E.g. I am very close to your pickup, I can arrive in 3 minutes" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={120}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none" />
          <p className="text-right text-xs text-gray-300 mt-1">{message.length}/120</p>
        </div>

        <button onClick={handleSubmit} disabled={loading || !request || isExpired || !!existingBid}
          className="w-full bg-forge-orange text-white font-extrabold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center shadow-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `✓ Submit Bid — ₦${price.toLocaleString()}`}
        </button>
        <p className="text-center text-xs text-gray-400">Your bid is visible to the passenger immediately. Only the passenger can confirm.</p>
        <p className="text-center text-xs text-forge-orange">You have 3 minutes to edit this bid after submission.</p>
      </div>
    </div>
  );
}