import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Star, Loader2, Car, Clock } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const BID_TTL_MS = 3 * 60 * 1000;

function useBidCountdown(createdDate) {
  const [secsLeft, setSecsLeft] = useState(180);
  useEffect(() => {
    const tick = () => {
      const raw = createdDate;
      const ds = typeof raw === 'string' && !raw.endsWith('Z') ? raw + 'Z' : raw;
      setSecsLeft(Math.max(0, Math.floor((BID_TTL_MS - (Date.now() - new Date(ds).getTime())) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [createdDate]);
  return secsLeft;
}

export default function DriverOffers() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [selecting, setSelecting] = useState(null);

  const loadBids = () =>
    base44.entities.Bid.filter({ request_id: requestId, status: 'pending' }, 'price').then(setBids);

  useEffect(() => {
    base44.entities.RideRequest.get(requestId).then(setRequest);
    loadBids();
    const unsub = base44.entities.Bid.subscribe(loadBids);
    return unsub;
  }, [requestId]);

  const selectDriver = async (bid) => {
    setSelecting(bid.id);

    // Optimistic: immediately hide all other bids and mark this one as selected
    setBids(prev => prev.filter(b => b.id === bid.id));

    const user = await base44.auth.me();

    await base44.entities.Bid.update(bid.id, { status: 'accepted' });
    await base44.entities.RideRequest.update(requestId, { status: 'matched' });
    const trip = await base44.entities.Trip.create({
      request_id: requestId,
      bid_id: bid.id,
      driver_id: bid.driver_id,
      driver_name: bid.driver_name,
      passenger_id: user.email,
      passenger_name: request.passenger_name || user.display_name || user.full_name || 'Passenger',
      is_for_someone_else: request.is_for_someone_else || false,
      recipient_name: request.recipient_name || '',
      recipient_phone: request.recipient_phone || '',
      agreed_price: bid.price,
      status: 'driver_arriving',
      pickup_address: request.pickup_address,
      dropoff_address: request.dropoff_address,
      pickup_lat: request.pickup_lat,
      pickup_lng: request.pickup_lng,
      dropoff_lat: request.dropoff_lat,
      dropoff_lng: request.dropoff_lng,
      request_type: request.request_type,
      payment_method: request.payment_method || 'wallet',
      distance_km: request.estimated_distance_km,
      duration_min: request.estimated_duration_min,
    });
    navigate(`/passenger/tracking/${trip.id}`);
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  const BidCard = ({ bid, index }) => {
    const secsLeft = useBidCountdown(bid.created_date);
    const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
    const ss = String(secsLeft % 60).padStart(2, '0');
    const urgent = secsLeft < 30;
    const expired = secsLeft === 0;
    const parts = [bid.vehicle_type, bid.vehicle_color, bid.vehicle_model, bid.vehicle_plate].filter(Boolean);

    return (
      <div key={bid.id} className={`bg-card rounded-2xl p-4 shadow-sm border ${expired ? 'border-red-200 opacity-60' : 'border-border'}`}>
        {index === 0 && !expired && (
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">BEST PRICE</span>
        )}
        {expired && (
          <span className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">EXPIRED</span>
        )}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials(bid.driver_name)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">{bid.driver_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-500">{bid.driver_rating ?? 0}</span>
              <span className="text-xs text-green-500 ml-2">●Online now</span>
            </div>
            {parts.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Car className="w-3 h-3 flex-shrink-0" />
                {parts.join(' · ')}
              </p>
            )}
            {bid.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {bid.phone}</p>}
            {bid.message && <p className="text-xs text-gray-400 italic mt-1">"{bid.message}"</p>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forge-orange font-extrabold text-2xl">₦{bid.price?.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">+₦{Math.round(bid.price * 0.1).toLocaleString()} convenience fee</p>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span>~{bid.eta_min || 4} min</span>
              <span>~{bid.distance_from_pickup_km || 1} km away</span>
            </div>
          </div>
          <button onClick={() => !expired && selectDriver(bid)} disabled={!!selecting || expired} aria-label={`Select ${bid.driver_name} for ₦${bid.price?.toLocaleString()}`}
            className="bg-forge-orange text-white text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 disabled:opacity-60">
            {selecting === bid.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select Driver'}
          </button>
        </div>
        <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${expired ? 'text-red-400' : urgent ? 'text-red-500' : 'text-gray-400'}`}>
          <Clock className="w-3.5 h-3.5" />
          {expired ? 'Offer expired' : `Offer expires in ${mm}:${ss}`}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <AppHeader title="Driver Offers" onBack={() => navigate(-1)} />

      {request && (
        <div className="bg-card mx-5 mt-4 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-forge-orange" />
            <span className="text-sm font-semibold text-foreground">{request.pickup_address}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{request.dropoff_address}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span>{request.request_type === 'person' ? '👤 Person Transport' : '📦 Goods Delivery'}</span>
            <span>~{request.estimated_distance_km} km</span>
            <span>Posted just now</span>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-foreground">{bids.length} Offer{bids.length !== 1 ? 's' : ''}</p>
          <span className="text-forge-orange text-sm font-semibold">Sort: Lowest Price ▾</span>
        </div>

        {bids.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">
            No offers yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid, i) => (
              <BidCard key={bid.id} bid={bid} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}