import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, Flag, Loader2, CheckCircle2 } from 'lucide-react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

const QUICK_TAGS = [
  'Smooth ride', 'Very polite', 'On time', 'Clean vehicle',
  'Safe driver', 'Good music', 'Helpful', 'Fast delivery',
];

export default function PassengerTripComplete() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.entities.Trip.get(tripId).then(setTrip);
  }, [tripId]);

  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    setLoading(true);
    const fullComment = [tags.join(', '), comment].filter(Boolean).join(' — ');
    await base44.entities.Review.create({
      trip_id: tripId,
      rating,
      comment: fullComment,
      reviewee_id: trip?.driver_id,
      reviewee_name: trip?.driver_name,
    });
    const allReviews = await base44.entities.Review.filter({ reviewee_id: trip?.driver_id });
    if (allReviews.length > 0) {
      const avg = +(allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length).toFixed(1);
      if (trip?.bid_id) await base44.entities.Bid.update(trip.bid_id, { driver_rating: avg }).catch(() => {});
    }
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => navigate('/passenger'), 2000);
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const activeRating = hoveredRating || rating;

  if (submitted) {
    return (
      <div className="min-h-screen bg-forge-navy flex flex-col items-center justify-center text-center px-8">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-5 shadow-xl">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Thanks for your feedback!</h2>
        <p className="text-white/50 text-sm">Your review helps the ForgeRide community.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
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
        <div className="bg-card rounded-2xl p-5 grid grid-cols-2 gap-4 shadow-sm">
          <div><p className="text-xs text-muted-foreground mb-1">Distance</p><p className="text-xl font-extrabold text-foreground">{trip?.distance_km || '—'} km</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Duration</p><p className="text-xl font-extrabold text-foreground">{trip?.duration_min || '—'} min</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Amount Paid</p><p className="text-xl font-extrabold text-forge-orange">₦{trip?.agreed_price?.toLocaleString() || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Trip Type</p><p className="text-xl font-extrabold text-foreground capitalize">{trip?.request_type || '—'}</p></div>
          {trip?.pickup_address && (
            <div className="col-span-2 border-t border-gray-100 pt-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-forge-orange flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{trip.pickup_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{trip.dropoff_address}</span>
              </div>
            </div>
          )}
        </div>

        {/* Rate driver */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Rate Your Driver</p>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 shadow">
              {initials(trip?.driver_name)}
            </div>
            <p className="font-extrabold text-foreground text-base">{trip?.driver_name || 'Your Driver'}</p>
            <p className="text-sm text-gray-400 mb-5">How was your experience?</p>

            {/* Stars */}
            <div className="flex gap-3 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform active:scale-90"
                >
                  <Star className={`w-10 h-10 transition-colors ${s <= activeRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                </button>
              ))}
            </div>
            {activeRating > 0 && (
              <p className={`text-sm font-bold transition-all ${activeRating >= 4 ? 'text-green-500' : activeRating >= 3 ? 'text-yellow-500' : 'text-red-400'}`}>
                {RATING_LABELS[activeRating]}
              </p>
            )}
          </div>
        </div>

        {/* Quick tags (only show if rating selected) */}
        {rating > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">What stood out?</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    tags.includes(tag)
                      ? 'bg-forge-orange text-white border-forge-orange'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {rating > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Add a comment (optional)</p>
            <textarea
              placeholder="Tell us about your experience…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange resize-none"
            />
            <button className="flex items-center gap-2 text-forge-orange text-sm mt-3 font-medium">
              <Flag className="w-4 h-4" /> Report an issue with this trip
            </button>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || rating === 0}
          className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Feedback'}
        </button>
        <button onClick={() => navigate('/passenger')} className="w-full text-center text-gray-400 text-sm pb-4">
          Skip for now
        </button>
      </div>
    </div>
  );
}