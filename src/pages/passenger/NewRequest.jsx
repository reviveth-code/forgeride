import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, MapPin, User, Package, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import '@/utils/leaflet';

export default function NewRequest() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [type, setType] = useState('person');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const req = await base44.entities.RideRequest.create({
      pickup_address: pickup,
      dropoff_address: dropoff,
      request_type: type,
      notes,
      status: 'open',
      estimated_distance_km: 14,
      estimated_duration_min: 22,
      passenger_name: user?.full_name || '',
    });
    navigate(`/passenger/waiting/${req.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><X className="w-6 h-6 text-gray-600" /></button>
        <h1 className="text-lg font-bold text-gray-900">New Request</h1>
        <div className="w-6" />
      </div>

      {/* Map */}
      <div className="h-52">
        <MapContainer center={[6.5244, 3.3792]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[6.5244, 3.3792]} />
        </MapContainer>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 flex-1 overflow-auto pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Route Details</p>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-forge-orange" />
          <input placeholder="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)}
            className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Where are you going?" value={dropoff} onChange={(e) => setDropoff(e.target.value)}
            className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange" required />
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Request Type</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'person', icon: User, label: 'Person' },
            { key: 'goods', icon: Package, label: 'Goods' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-colors ${
                type === key ? 'bg-forge-orange border-forge-orange text-white' : 'border-gray-200 text-gray-600'
              }`}>
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Notes — Optional</p>
        <textarea placeholder="Any special instructions for the driver" value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange resize-none" />

        <button type="submit" disabled={loading}
          className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Request'}
        </button>
        <p className="text-center text-xs text-gray-400">Drivers nearby will receive your request instantly</p>
      </form>
    </div>
  );
}