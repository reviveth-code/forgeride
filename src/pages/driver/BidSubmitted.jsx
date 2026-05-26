import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';

export default function BidSubmitted() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const [bid, setBid] = useState(null);

  useEffect(() => {
    base44.entities.Bid.get(bidId).then(setBid);
    const unsub = base44.entities.Bid.subscribe((event) => {
      if (event.id === bidId) {
        setBid(event.data);
        if (event.data?.status === 'accepted') navigate(`/driver/active-trip/${bidId}`);
      }
    });
    return unsub;
  }, [bidId]);

  const cancelBid = async () => {
    await base44.entities.Bid.update(bidId, { status: 'cancelled' });
    navigate('/driver/requests');
  };

  return (
    <div className="min-h-screen bg-forge-navy flex flex-col max-w-md mx-auto">
      <div className="px-5 pt-8">
        <button onClick={() => navigate('/driver/requests')}>
          <ArrowLeft className="w-6 h-6 text-white" />
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
          <p className="text-forge-orange text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forge-orange inline-block" />
            Monitoring in background
          </p>
          {bid && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-2 h-2 rounded-full bg-forge-orange" /> From pickup to destination
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>~{14} km</span>
                <span>~{22} min drive</span>
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
        <button className="w-full border-2 border-white/30 text-white font-bold py-4 rounded-2xl text-base">
          Edit My Bid
        </button>
        <button onClick={cancelBid} className="w-full text-center text-red-400 text-sm font-semibold">
          Cancel This Bid
        </button>
      </div>
    </div>
  );
}