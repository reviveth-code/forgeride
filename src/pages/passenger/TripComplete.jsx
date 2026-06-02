import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, Flag, Loader2 } from 'lucide-react';

export default function PassengerTripComplete() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(setTrip);
  }, [tripId]);

  const handleSubmit = async () => {
    setLoading(true);
    await base44.entities.Review.create({
      trip_id: tripId,
      rating,
      comment,
      reviewee_id: trip?.driver_id,
      reviewee_name: trip?.driver_name,
    });
    // Recompute driver's average rating from all their reviews and save it
    const allReviews = await base44.entities.Review.filter({ reviewee_id: trip?.driver_id });
    if (allReviews.length > 0) {
      const avg = +(allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length).toFixed(1);
      // Store on the trip bid so DriverOffers can surface live rating going forward
      if (trip?.bid_id) await base44.entities.Bid.update(trip.bid_id, { driver_rating: avg }).catch(() => {});
    }
    navigate('/passenger');
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Celebration header */}
      <div className="bg-forge-navy pt-14 pb-10 px-5 text-center relative overflow-hidden">
        <div className="absolute top-4 left-8 text-2xl opacity-60">🎉</div>
        <div className="absolute top-6 right-10 text-xl opacity-60">✨</div>
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl font-bold">✓</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">You have arrived!</h1>
        <p className="text-white/50 text-sm">Trip Completed</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Trip stats */}
        <div className="bg-white rounded-2xl p-5 grid grid-cols-2 gap-4 shadow-sm">
          <div><p className="text-xs text-gray-400 mb-1">Distance</p><p className="text-xl font-extrabold text-gray-900">{trip?.distance_km || 14.3} km</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Duration</p><p className="text-xl font-extrabold text-gray-900">{trip?.duration_min || 26} min</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Amount Paid</p><p className="text-xl font-extrabold text-forge-orange">₦{trip?.agreed_price?.toLocaleString() || '1,500'}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Trip Type</p><p className="text-xl font-extrabold text-gray-900 capitalize">{trip?.request_type || 'Person'}</p></div>
          {trip?.pickup_address && (
            <div className="col-span-2 border-t border-gray-100 pt-3 flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-forge-orange flex-shrink-0" />
              <span className="text-sm text-gray-500">{trip.pickup_address}</span>
              <span className="text-gray-300">→</span>
              <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">{trip.dropoff_address}</span>
            </div>
          )}
        </div>

        {/* Rate driver */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Rate Your Driver</p>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
              {initials(trip?.driver_name)}
            </div>
            <p className="font-bold text-gray-900 mb-0.5">{trip?.driver_name || 'Your Driver'}</p>
            <p className="text-sm text-gray-400 mb-4">Keke Napep</p>
            <div className="flex gap-2 mb-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoveredRating(s)} onMouseLeave={() => setHoveredRating(0)}>
                  <Star className={`w-9 h-9 transition-colors ${s <= (hoveredRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-sm text-gray-500 font-medium">Your Rating: {rating} stars</p>}
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Leave A Comment (Optional)</p>
          <textarea placeholder="Tell us about your experience..." value={comment} onChange={(e) => setComment(e.target.value)}
            rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none resize-none" />
          <button className="flex items-center gap-2 text-forge-orange text-sm mt-3 font-medium">
            <Flag className="w-4 h-4" /> Report an issue with this trip
          </button>
        </div>

        <button onClick={handleSubmit} disabled={loading || rating === 0}
          className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Rating'}
        </button>
        <button onClick={() => navigate('/passenger')} className="w-full text-center text-gray-400 text-sm">Skip for now</button>
      </div>
    </div>
  );
}