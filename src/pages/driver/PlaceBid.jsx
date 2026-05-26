import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, Package, Loader2 } from 'lucide-react';

const PRESETS = [800, 1000, 1200, 1500, 2000];

export default function PlaceBid() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [price, setPrice] = useState(1500);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.RideRequest.get(requestId).then(setRequest);
    base44.auth.me().then(setUser);
  }, [requestId]);

  const handleSubmit = async () => {
    setLoading(true);
    const bid = await base44.entities.Bid.create({
      request_id: requestId,
      driver_id: user.email,
      driver_name: user.full_name,
      driver_rating: user.rating || 4.8,
      vehicle_type: user.vehicle_type || 'keke',
      price,
      message,
      status: 'pending',
      eta_min: 4,
      distance_from_pickup_km: 1.2,
    });
    navigate(`/driver/bid-submitted/${bid.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-900">Place Your Bid</h1>
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
                <p className="font-extrabold text-gray-900 text-sm">2 bids</p>
                <p className="text-xs text-gray-400">Competition</p>
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Price Offer</p>
          <div className="border-2 border-forge-orange rounded-2xl px-5 py-4 mb-4">
            <p className="text-3xl font-extrabold text-gray-900">₦ {price.toLocaleString()}</p>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setPrice(p)}
                className={`flex-1 min-w-14 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${price === p ? 'bg-forge-orange border-forge-orange text-white' : 'border-gray-200 text-gray-600 hover:border-forge-orange'}`}>
                ₦{(p/1000).toFixed(p % 1000 === 0 ? 0 : 1)}k
              </button>
            ))}
          </div>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forge-orange" placeholder="Custom price" />
          <p className="text-xs text-gray-400 mt-2">ℹ Average pricing from other drivers for this trip (~₦400).</p>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Message to Passenger (Optional)</p>
          <textarea placeholder="E.g. I am very close to your pickup, I can arrive in 3 minutes" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={120}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none" />
          <p className="text-right text-xs text-gray-300 mt-1">{message.length}/120</p>
        </div>

        <button onClick={handleSubmit} disabled={loading || !request}
          className="w-full bg-forge-orange text-white font-extrabold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center shadow-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `✓ Submit Bid — ₦${price.toLocaleString()}`}
        </button>
        <p className="text-center text-xs text-gray-400">Your bid is visible to the passenger immediately. Only the passenger can confirm.</p>
        <p className="text-center text-xs text-forge-orange">You have 2 minutes to edit this bid after submission.</p>
      </div>
    </div>
  );
}