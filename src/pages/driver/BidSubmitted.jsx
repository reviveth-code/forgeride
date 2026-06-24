import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Clock } from 'lucide-react';

const BID_TTL_MS = 3 * 60 * 1000;

export default function BidSubmitted() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const [bid, setBid] = useState(null);
  const [request, setRequest] = useState(null);
  const [passengerViewing, setPassengerViewing] = useState(false);
  const [secsLeft, setSecsLeft] = useState(180);
  const [expired, setExpired] = useState(false);
  const countdownTimerRef = useRef(null);

  const goToTrip = (attempts = 0) => {
    base44.entities.Trip.filter({ bid_id: bidId }).then(trips => {
      if (trips.length > 0) {
        navigate(`/driver/active-trip/${trips[0].id}`);
      } else if (attempts < 8) {
        setTimeout(() => goToTrip(attempts + 1), 1500);
      }
    });
  };

  useEffect(() => {
    base44.entities.Bid.get(bidId).then(bid => {
      setBid(bid);
      if (bid?.status === 'accepted') goToTrip();
      if (bid?.request_id) {
        base44.entities.RideRequest.get(bid.request_id).then(setRequest);
        base44.entities.RideRequest.get(bid.request_id).then(r => {
          setPassengerViewing(r?.status === 'open' || r?.status === 'matched');
        });
      }

      // Countdown based on bid's own created_date — same logic as passenger side
      if (bid?.created_date) {
        let hasExpired = false;
        let timer;
        const raw = bid.created_date;
        const dateStr = typeof raw === 'string' && !raw.endsWith('Z') ? raw + 'Z' : raw;
        const getRemaining = () => Math.max(0, Math.floor((BID_TTL_MS - (Date.now() - new Date(dateStr).getTime())) / 1000));
        // Set immediately so driver and passenger start from the same value
        setSecsLeft(getRemaining());
        timer = setInterval(() => {
          const remaining = getRemaining();
          setSecsLeft(remaining);
          if (remaining === 0 && !hasExpired) {
            hasExpired = true;
            setExpired(true);
            clearInterval(timer);
            base44.entities.Bid.update(bidId, { status: 'cancelled' });
          }
        }, 1000);
        countdownTimerRef.current = timer;
      }
    });

    // Poll request status to show "passenger viewing"
    const viewPoll = setInterval(async () => {
      const b = await base44.entities.Bid.get(bidId);
      if (b?.request_id) {
        const r = await base44.entities.RideRequest.get(b.request_id);
        setPassengerViewing(r?.status === 'open' || r?.status === 'matched');
      }
    }, 5000);

    const unsub = base44.entities.Bid.subscribe((event) => {
      if (event.id === bidId) {
        setBid(event.data);
        if (event.data?.status === 'accepted') goToTrip();
      }
    });

    // Fallback polling every 4 seconds
    const poll = setInterval(async () => {
      const bid = await base44.entities.Bid.get(bidId);
      setBid(bid);
      if (bid?.status === 'accepted') { clearInterval(poll); goToTrip(); }
    }, 4000);

    return () => { unsub(); clearInterval(poll); clearInterval(viewPoll); clearInterval(countdownTimerRef.current); };
  }, [bidId]);

  const cancelBid = async () => {
    await base44.entities.Bid.update(bidId, { status: 'cancelled' });
    navigate('/driver/requests');
  };

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const ss = String(secsLeft % 60).padStart(2, '0');
  const urgent = secsLeft < 30;

  if (expired) {
    return (
      <div className="min-h-screen bg-forge-navy flex flex-col items-center justify-center px-5 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">Bid Expired</h2>
        <p className="text-white/50 text-sm mb-6">The passenger didn't respond in time. You can go back and place a new bid.</p>
        <button onClick={() => navigate('/driver/requests')}
          className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base">
          Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forge-navy flex flex-col max-w-md mx-auto">
      <div className="px-5 pt-8">
        <button onClick={() => navigate('/driver/requests')} aria-label="Go back"
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <div className="w-24 h-24 bg-forge-orange rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <span className="text-white text-5xl font-bold">✓</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Bid Submitted!</h1>
        <p className="text-white/50 text-sm mb-10">
          Your offer of ₦{bid?.price?.toLocaleString()} has been sent to the customer.
        </p>

        <div className="bg-white/10 rounded-2xl p-5 w-full text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-forge-orange animate-pulse" />
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Waiting for Response</p>
          </div>
          <p className="text-white font-bold mb-1">Customer has not selected yet</p>
          {passengerViewing ? (
            <p className="text-green-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              Passenger is viewing offers now
            </p>
          ) : (
            <p className="text-forge-orange text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forge-orange inline-block" />
              Monitoring in background
            </p>
          )}
          <div className={`mt-3 flex items-center gap-2 text-sm font-bold ${urgent ? 'text-red-400' : 'text-white/60'}`}>
            <Clock className="w-4 h-4" />
            <span>Bid expires in <span className="font-extrabold">{mm}:{ss}</span></span>
          </div>
          {bid && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-2 h-2 rounded-full bg-forge-orange" /> From pickup to destination
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>~{request?.estimated_distance_km || bid?.distance_from_pickup_km || '—'} km</span>
                <span>~{request?.estimated_duration_min || '—'} min drive</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-10 space-y-3">
        <button onClick={() => navigate('/driver/requests')}
          className="w-full bg-white text-gray-900 font-extrabold py-4 rounded-2xl text-base">
          Back to Requests
        </button>
        <button onClick={() => navigate(`/driver/bid/${bid?.request_id}`)}
          className="w-full border-2 border-white/30 text-white font-bold py-4 rounded-2xl text-base">
          Edit My Bid
        </button>
        <button onClick={cancelBid} className="w-full text-center text-red-400 text-sm font-semibold">
          Cancel This Bid
        </button>
      </div>
    </div>
  );
}