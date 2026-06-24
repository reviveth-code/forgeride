import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, CheckCircle, XCircle, Clock, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import AppHeader from '@/components/AppHeader';

const statusConfig = {
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50', icon: XCircle },
  in_progress: { label: 'In Progress', color: 'text-blue-600 bg-blue-50', icon: Clock },
  driver_arriving: { label: 'Driver Arriving', color: 'text-forge-orange bg-forge-orange/10', icon: Clock },
};

export default function TripHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['passenger-trips', user?.email],
    queryFn: () => base44.entities.Trip.filter({ passenger_id: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const totalSpent = trips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.agreed_price || 0), 0);
  const completedCount = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <AppHeader title="Trip History" onBack={() => navigate(-1)} variant="dark" />
      <div className="bg-forge-navy px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <p className="text-white font-extrabold text-2xl">{completedCount}</p>
            <p className="text-white/50 text-xs mt-1">Completed Rides</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <p className="text-forge-orange font-extrabold text-2xl">₦{totalSpent.toLocaleString()}</p>
            <p className="text-white/50 text-xs mt-1">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Trip list */}
      <div className="px-5 py-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold">No trips yet</p>
            <p className="text-gray-400 text-sm mt-1">Your ride history will appear here</p>
          </div>
        ) : (
          trips.map(trip => {
            const cfg = statusConfig[trip.status] || statusConfig.completed;
            const StatusIcon = cfg.icon;
            return (
              <div key={trip.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                {/* Status + date row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">{format(new Date(trip.created_date), 'd MMM yyyy, h:mm a')}</span>
                </div>

                {/* Route */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-forge-orange mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground font-medium leading-snug">{trip.pickup_address || 'Pickup location'}</p>
                  </div>
                  <div className="ml-1 border-l-2 border-dashed border-gray-200 h-3" />
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground font-medium leading-snug">{trip.dropoff_address || 'Dropoff location'}</p>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      {trip.request_type === 'goods' ? <Package className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      {trip.request_type === 'goods' ? 'Goods' : 'Person'}
                    </span>
                    {trip.distance_km && <span>{trip.distance_km} km</span>}
                    {trip.driver_name && <span>· {trip.driver_name}</span>}
                  </div>
                  <p className="text-forge-orange font-extrabold text-base">
                    {trip.agreed_price ? `₦${trip.agreed_price.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}