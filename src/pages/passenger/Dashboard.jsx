import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, MapPin, User, Package, ChevronRight, Plus, Info, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DriversNearbyCard from '@/components/passenger/DriversNearbyCard';
import useCurrentLocation from '@/hooks/useCurrentLocation';
import PullToRefresh from '@/components/PullToRefresh';

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  matched: 'bg-blue-100 text-blue-700',
  active: 'bg-orange-100 text-forge-orange',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
};

export default function PassengerDashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();
  const { address: currentAddress, coords, loading: locationLoading } = useCurrentLocation();

  useEffect(() => {
    let userId = null;
    base44.auth.me().then(u => {
      setUser(u);
      userId = u?.id;
      loadRequests(u?.id);
      if (u?.email) {
        base44.entities.Wallet.filter({ user_id: u.email }).then(wallets => {
          setWalletBalance(wallets.length > 0 ? wallets[0].balance : 0);
        });
      }
    }).catch(() => navigate('/login'));

    const unsub = base44.entities.RideRequest.subscribe(() => loadRequests(userId));
    return unsub;
  }, []);

  const loadRequests = (userId) => {
    if (!userId) return;
    base44.entities.RideRequest.filter({ created_by_id: userId }, '-created_date', 20)
      .then(all => setRequests(all.filter(r => ['open', 'matched', 'active'].includes(r.status))));
  };

  const handleRefresh = async () => {
    const u = await base44.auth.me();
    setUser(u);
    loadRequests(u?.id);
    if (u?.email) {
      const wallets = await base44.entities.Wallet.filter({ user_id: u.email });
      setWalletBalance(wallets.length > 0 ? wallets[0].balance : 0);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-2xl font-extrabold text-gray-900">{(user?.display_name || user?.full_name || 'User').split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/passenger/wallet" aria-label="View wallet" className="flex items-center gap-1.5 bg-muted rounded-full pl-3 pr-3 py-2.5 min-h-[44px]">
              <Wallet className="w-4 h-4 text-foreground" aria-hidden="true" />
              <span className="text-xs font-bold text-foreground">
                {walletBalance != null ? `₦${walletBalance.toLocaleString()}` : '···'}
              </span>
            </Link>
            <button onClick={() => setNotifOpen(true)} aria-label="View notifications" className="relative w-11 h-11 bg-muted rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-forge-orange rounded-full" />
            </button>
            <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
              <DialogContent className="max-w-sm mx-auto rounded-2xl px-5 pb-8">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="flex items-start gap-3 p-4 bg-forge-orange/5 rounded-2xl border border-forge-orange/20">
                    <Info className="w-5 h-5 text-forge-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">Welcome to ForgeRide!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Post a ride or delivery request to get started.</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="w-10 h-10 bg-forge-orange rounded-full flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-forge-orange-light rounded-2xl px-4 py-3">
          <MapPin className="w-5 h-5 text-forge-orange flex-shrink-0" />
          <span className="text-sm font-semibold text-forge-orange truncate">
            {locationLoading ? 'Getting location…' : (currentAddress || 'Location unavailable')}
          </span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* What do you need */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">What Do You Need?</p>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/passenger/new-request" className="bg-white p-5 rounded-2xl border border-gray-100 text-center cursor-pointer hover:border-forge-orange transition-colors">
              <User className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="font-bold text-sm text-gray-900">Transport</p>
              <p className="text-xs text-muted-foreground">Move Yourself</p>
            </Link>
            <Link to="/passenger/new-request" className="bg-white p-5 rounded-2xl border border-gray-100 text-center cursor-pointer hover:border-forge-orange transition-colors">
              <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="font-bold text-sm text-gray-900">Delivery</p>
              <p className="text-xs text-muted-foreground">Send Goods</p>
            </Link>
          </div>
        </div>

        <Link to="/passenger/new-request">
          <button className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm">
            <Plus className="w-5 h-5" /> Post a New Request
          </button>
        </Link>

        {/* Drivers Nearby */}
        <DriversNearbyCard userLat={coords?.lat} userLng={coords?.lng} />

        {/* Active Requests */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Active Requests</p>
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No active requests. Post one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 mr-3">
                      <p className="font-bold text-sm text-gray-900">Pickup: {req.pickup_address}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Drop off: {req.dropoff_address}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-500'}`}>
                      {req.status}
                    </span>
                  </div>
                  <Link to={`/passenger/offers/${req.id}`} className="text-forge-orange text-xs font-bold flex items-center gap-1 mt-2">
                    View Offers <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}