import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, User, Package, Loader2, Users } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import '@/utils/leaflet';
import LocationSearchInput from '@/components/LocationSearchInput';
import MapViewUpdater from '@/components/MapViewUpdater';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

export default function NewRequest() {
  const navigate = useNavigate();
  const [pickupLoc, setPickupLoc] = useState(null);
  const [dropoffLoc, setDropoffLoc] = useState(null);
  const [type, setType] = useState('person');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const distanceKm = pickupLoc && dropoffLoc
    ? haversine(pickupLoc.lat, pickupLoc.lng, dropoffLoc.lat, dropoffLoc.lng)
    : null;
  const durationMin = distanceKm ? Math.round(distanceKm * 3) : null;

  const mapCenter = dropoffLoc && pickupLoc
    ? [(pickupLoc.lat + dropoffLoc.lat) / 2, (pickupLoc.lng + dropoffLoc.lng) / 2]
    : pickupLoc ? [pickupLoc.lat, pickupLoc.lng] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupLoc || !dropoffLoc) return;
    setLoading(true);
    const req = await base44.entities.RideRequest.create({
      pickup_address: pickupLoc.address,
      dropoff_address: dropoffLoc.address,
      pickup_lat: pickupLoc.lat,
      pickup_lng: pickupLoc.lng,
      dropoff_lat: dropoffLoc.lat,
      dropoff_lng: dropoffLoc.lng,
      request_type: type,
      notes,
      status: 'open',
      estimated_distance_km: distanceKm,
      estimated_duration_min: durationMin,
      passenger_name: user?.full_name || '',
      is_for_someone_else: forSomeoneElse,
      recipient_name: forSomeoneElse ? recipientName : '',
      recipient_phone: forSomeoneElse ? recipientPhone : '',
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

      <div className="h-52">
        <MapContainer center={[6.5244, 3.3792]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupLoc && <Marker position={[pickupLoc.lat, pickupLoc.lng]} />}
          {dropoffLoc && <Marker position={[dropoffLoc.lat, dropoffLoc.lng]} />}
          {mapCenter && <MapViewUpdater center={mapCenter} zoom={dropoffLoc ? 12 : 14} />}
        </MapContainer>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 flex-1 overflow-auto pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Route Details</p>

        <LocationSearchInput
          placeholder="Pickup location"
          value={pickupLoc}
          onChange={setPickupLoc}
          dotColor="bg-forge-orange"
        />

        <LocationSearchInput
          placeholder="Where are you going?"
          value={dropoffLoc}
          onChange={setDropoffLoc}
          dotColor="bg-gray-400"
        />

        {distanceKm && (
          <div className="flex gap-3 text-sm bg-forge-orange/10 rounded-2xl px-4 py-3">
            <span className="text-forge-orange font-bold">~{distanceKm} km</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 font-medium">~{durationMin} min drive</span>
          </div>
        )}

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

        {/* Book for someone else */}
        <button type="button" onClick={() => setForSomeoneElse(!forSomeoneElse)}
          className={`w-full flex items-center gap-3 py-4 px-4 rounded-2xl border-2 transition-colors ${
            forSomeoneElse ? 'border-forge-orange bg-forge-orange/5' : 'border-gray-200'
          }`}>
          <Users className={`w-5 h-5 ${forSomeoneElse ? 'text-forge-orange' : 'text-gray-400'}`} />
          <div className="text-left flex-1">
            <p className={`font-bold text-sm ${forSomeoneElse ? 'text-forge-orange' : 'text-gray-700'}`}>Book for someone else</p>
            <p className="text-xs text-gray-400">A family member, friend or colleague</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            forSomeoneElse ? 'border-forge-orange bg-forge-orange' : 'border-gray-300'
          }`}>
            {forSomeoneElse && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>

        {forSomeoneElse && (
          <div className="space-y-3 bg-forge-orange/5 rounded-2xl p-4">
            <p className="text-xs font-bold text-forge-orange uppercase tracking-widest">Recipient Details</p>
            <input
              type="text"
              placeholder="Recipient's full name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required={forSomeoneElse}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange bg-white"
            />
            <input
              type="tel"
              placeholder="Recipient's phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required={forSomeoneElse}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange bg-white"
            />
            <p className="text-xs text-gray-400">The driver will see this person's name and can call them directly.</p>
          </div>
        )}

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Notes — Optional</p>
        <textarea placeholder="Any special instructions for the driver" value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forge-orange resize-none" />

        <button type="submit" disabled={loading || !pickupLoc || !dropoffLoc}
          className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Request'}
        </button>
        <p className="text-center text-xs text-gray-400">Drivers nearby will receive your request instantly</p>
      </form>
    </div>
  );
}