import { useRef } from 'react';

const PERSONAS = [
  {
    id: 'passenger',
    label: 'Passenger',
    emoji: '👤',
    color: '#E85A0F',
    lightColor: '#FEF0E8',
    goal: 'Get transport or send goods quickly, safely, and affordably.',
    stages: [
      {
        name: 'Onboarding',
        icon: '📲',
        steps: [
          'Downloads or opens ForgeRide app',
          'Registers with full name, email, phone, and password',
          'Enters phone number without international code (auto-prefixed to +234)',
          'Verifies email via 6-digit OTP code',
          'Selects "Passenger" role',
          'Receives ₦50,000 welcome wallet balance automatically',
        ],
        touchpoints: ['Register page', 'Email OTP verification', 'createUserWallet + fundNewUserWallets automation'],
        painPoints: ['OTP might land in spam'],
        opportunities: ['Switch OTP delivery to SMS to avoid spam', 'Inline OTP resend feedback'],
      },
      {
        name: 'Booking a Ride',
        icon: '📍',
        steps: [
          'Opens Passenger Dashboard — sees live driver count and interactive map',
          'Draggable map shows nearby drivers as vehicle emojis within 25 km radius',
          'Passenger\'s own position shown as pulsing orange dot on the map',
          'Map auto-fits bounds to frame all visible drivers and the passenger',
          'Taps "Transport" or "Delivery" tile (or Post New Request)',
          'Selects payment method: Wallet or Cash',
          'Enters pickup and drop-off address with autocomplete',
          'Optionally marks trip as "for someone else" with recipient details',
          'Sees 10% convenience fee upfront before submitting',
          'Reviews estimated distance & duration, then submits request',
        ],
        touchpoints: ['Dashboard', 'DriversNearbyCard (25 km radius, 30s poll)', 'Interactive Leaflet map', 'New Request form', 'LocationSearchInput', 'Payment method selector'],
        painPoints: ['Autocomplete accuracy in rural areas', 'No price hint before posting'],
        opportunities: ['Show price range estimate before posting', 'Save frequent addresses'],
      },
      {
        name: 'Waiting for Offers',
        icon: '⏳',
        steps: [
          'Lands on Waiting screen with pulsing live indicator',
          'Sees request summary (pickup, dropoff, distance, type)',
          'Receives audio chime when new driver bids arrive',
          'Sees real-time bid count ("X offers so far")',
          'Taps "View All Offers" once bids are available',
        ],
        touchpoints: ['WaitingOffers page', 'Real-time Bid subscription', 'Audio chime'],
        painPoints: ['No sense of how long to wait', 'Anxiety if no bids arrive'],
        opportunities: ['Show time elapsed', 'ETA on first expected bid based on nearby drivers'],
      },
      {
        name: 'Selecting a Driver',
        icon: '✅',
        steps: [
          'Views all pending bids sorted by lowest price',
          'Sees driver name, star rating, vehicle, ETA, and distance',
          'Reads driver\'s optional message',
          '"Best Price" badge highlights cheapest offer',
          'Taps "Select Driver" to confirm',
        ],
        touchpoints: ['DriverOffers page', 'Bid entity'],
        painPoints: ['No vehicle photo or plate number visible', 'No way to counter-offer'],
        opportunities: ['Show vehicle photo', 'Allow passenger to propose a price'],
      },
      {
        name: 'Trip Tracking',
        icon: '🗺️',
        steps: [
          'Lands on Bolt-style live map showing driver\'s real-time location',
          'Passenger\'s position shown as a pulsing orange dot',
          'Driver vehicle marker animates smoothly via exponential moving average',
          'Full-screen map with floating back/phone buttons and expandable bottom sheet',
          'Sees ETA, distance, agreed price, and convenience fee breakdown',
          'Status changes: "Driver Arriving" → "Trip In Progress" → "Completed"',
          'Can call driver via phone button or collapse map for trip details only',
        ],
        touchpoints: ['TripTracking page', 'Trip entity (live polling + subscription)', 'SmoothDriverMarker animation', 'Leaflet full-screen map', 'Expandable bottom sheet'],
        painPoints: ['No in-app chat', 'Driver location lags if GPS is weak'],
        opportunities: ['In-app messaging', 'Show driver route overlay', 'Use WebSocket for true real-time updates'],
      },
      {
        name: 'Trip Completion & Payment',
        icon: '⭐',
        steps: [
          'Trip auto-completes when driver marks it done',
          'Wallet trips: passenger debited fare + 10% convenience fee, driver credited fare minus 10% Forge commission',
          'Cash trips: driver credited net fare minus commissions from collected cash',
          'Redirected to Trip Complete screen with fare summary',
          'Rates driver (1–5 stars) and optionally leaves a comment',
          'Transaction records created for both parties',
          'Returns to Dashboard',
        ],
        touchpoints: ['TripComplete page', 'Review entity', 'Trip History', 'settleTripPayment function', 'Wallet entity', 'Transaction entity'],
        painPoints: ['No email receipt', 'No dispute mechanism'],
        opportunities: ['Email receipt', 'Fare split / tip feature', 'Dispute resolution flow'],
      },
    ],
  },
  {
    id: 'driver',
    label: 'Driver',
    emoji: '🚗',
    color: '#0D1B3E',
    lightColor: '#E8EBF2',
    goal: 'Find and complete rides efficiently to maximise daily earnings.',
    stages: [
      {
        name: 'Onboarding',
        icon: '📲',
        steps: [
          'Registers with full name, email, phone, and password',
          'Enters phone number without international code (auto-prefixed to +234)',
          'Selects "Driver" role',
          'Chooses vehicle type via bottom-sheet picker (Keke, Okada, Car, Bus, Truck)',
          'Verifies email via OTP',
          'Completes profile with vehicle details (plate, model, colour, year)',
          'Receives ₦50,000 welcome wallet balance automatically',
        ],
        touchpoints: ['Register page', 'Email OTP verification', 'BottomSheetPicker (vehicle type)', 'VehicleDetailsSheet', 'createUserWallet + fundNewUserWallets automation'],
        painPoints: ['No document upload (licence, insurance) yet', 'No background check flow'],
        opportunities: ['Add document verification step', 'Driver onboarding checklist'],
      },
      {
        name: 'Going Online',
        icon: '🟢',
        steps: [
          'Opens Driver Dashboard',
          'Sees daily earnings summary and recent trip count',
          'Toggles online/offline status',
          'App starts sharing GPS location when online',
          'Nearby open ride requests appear immediately',
        ],
        touchpoints: ['Driver Dashboard', 'Geolocation API', 'RideRequest subscription'],
        painPoints: ['Battery drain from continuous GPS', 'No earnings goal tracker'],
        opportunities: ['Earnings goal widget', 'GPS optimisation (lower frequency when idle)'],
      },
      {
        name: 'Browsing Requests',
        icon: '🔍',
        steps: [
          'Views Nearby Requests list with 3-minute countdown per request',
          'Filters by "All / Person / Goods"',
          'Sees distance from their location to pickup (Haversine)',
          'Identifies already-bid requests (highlighted orange)',
          'Driver position broadcast live via GPS watchPosition',
          'Receives audio chime for new requests when online',
          'Taps "Place Bid" on a chosen request',
        ],
        touchpoints: ['NearbyRequests page', 'Haversine distance calc', 'Request TTL countdown (3 min)', 'getOnlineDrivers backend (25 km radius + proximity sort)', 'Audio chime notification'],
        painPoints: ['No map view of requests', 'Continuous GPS drains battery'],
        opportunities: ['Map view toggle showing open requests', 'GPS optimisation (adaptive frequency)'],
      },
      {
        name: 'Placing a Bid',
        icon: '💸',
        steps: [
          'Views full request details (route, distance, duration, type, payment method)',
          'Sees 3-minute countdown timer before request expires',
          'Wallet balance guard: blocked from bidding if balance < 10% commission on bid price',
          'Selects bid price via bottom-sheet picker (presets) or types custom amount',
          'Sees live competitor bid count on the request',
          'Optionally adds a message to the passenger (max 120 chars)',
          'ETA and current GPS distance to pickup pre-filled automatically',
          'Submits bid — app navigates immediately (optimistic UI), editable for 3 minutes',
        ],
        touchpoints: ['PlaceBid page', 'Bid entity', 'GPS location', 'BottomSheetPicker (price)', 'Wallet balance check'],
        painPoints: ['No suggested price range based on distance'],
        opportunities: ['Show market price hint based on distance'],
      },
      {
        name: 'Waiting for Acceptance',
        icon: '⏳',
        steps: [
          'Lands on Bid Submitted screen',
          'Sees "Passenger is viewing offers now" indicator when passenger opens offer list',
          'Real-time status monitor via subscription + polling',
          'Can cancel bid or go back to requests',
          'Auto-navigates to Active Trip when bid is accepted',
        ],
        touchpoints: ['BidSubmitted page', 'Bid subscription', 'RideRequest status poll'],
        painPoints: ['Uncertain wait time', 'No push notification on acceptance'],
        opportunities: ['Push / SMS notification on acceptance', 'Show bid rank among competitors'],
      },
      {
        name: 'Active Trip',
        icon: '🚀',
        steps: [
          'Navigates to Active Trip screen with full-screen map',
          '"Keep phone on" warning banner shown persistently during trip',
          'GPS continuously broadcasts live location to passenger via exponential smoothing',
          'Sees passenger name, trip type, agreed price, and payment method',
          'SOS button calls passenger directly',
          'Taps "Complete Trip" to end journey — pagehide event auto-terminates trip',
          'WakeLock keeps screen on for uninterrupted GPS tracking',
        ],
        touchpoints: ['ActiveTrip page', 'Trip entity (driver_lat/lng update)', 'Geolocation watchPosition', 'WakeLock API', 'SOS call button'],
        painPoints: ['No in-app navigation (only shows map)'],
        opportunities: ['Integrate Google Maps / Waze deep-link', 'Wire SOS to external emergency contacts'],
      },
      {
        name: 'Trip Completion & Earnings',
        icon: '🏁',
        steps: [
          'Marks trip as completed',
          'Sees trip earnings summary with fare, commission, and convenience fee breakdown',
          'Wallet credited automatically: fare minus 10% Forge commission',
          'Cash trips: driver keeps collected cash minus Forge commission debited from wallet',
          'Receives passenger rating (visible in profile)',
          'Can withdraw earnings via Paystack to bank account',
          'Returns to Dashboard with updated earnings and wallet balance',
        ],
        touchpoints: ['DriverTripComplete page', 'Review entity', 'Driver History', 'DriverWallet', 'settleTripPayment function', 'processWithdrawal function'],
        painPoints: ['No cumulative earnings report'],
        opportunities: ['Weekly earnings PDF export', 'Earnings goal tracker'],
      },
    ],
  },
  {
    id: 'goods_sender',
    label: 'Goods Sender',
    emoji: '📦',
    color: '#2563EB',
    lightColor: '#EFF6FF',
    goal: 'Send packages to a recipient quickly and reliably, without accompanying the shipment.',
    stages: [
      {
        name: 'Onboarding',
        icon: '📲',
        steps: [
          'Registers as a Passenger (goods senders use the passenger persona)',
          'Enters phone number without international code (auto-prefixed to +234)',
          'Completes email OTP verification',
          'No additional setup required',
        ],
        touchpoints: ['Register page', 'OTP verification'],
        painPoints: ['No separate "Sender" onboarding path', 'No package size/weight input at registration'],
        opportunities: ['Switch OTP to SMS', 'Add a "Sender" sub-role or dedicated onboarding', 'Package profile presets'],
      },
      {
        name: 'Creating a Delivery Request',
        icon: '📋',
        steps: [
          'Taps "Delivery" tile on Dashboard',
          'Selects request type: "Goods"',
          'Enters pickup and drop-off addresses',
          'Toggles "Booking for Someone Else" switch',
          'Enters recipient name and phone number',
          'Adds optional notes (fragile, urgent, etc.)',
          'Reviews estimated distance and submits',
        ],
        touchpoints: ['NewRequest page', 'RideRequest entity (is_for_someone_else, recipient fields)'],
        painPoints: ['No package description or photo upload', 'No weight or fragility flags'],
        opportunities: ['Package photo upload', 'Fragile / urgent toggles', 'Declared value for insurance'],
      },
      {
        name: 'Waiting for Delivery Driver',
        icon: '⏳',
        steps: [
          'Sees live waiting screen with pulsing indicator',
          'Receives chime alert as driver bids come in',
          'Views bid count in real time',
          'Can cancel request freely before matching',
        ],
        touchpoints: ['WaitingOffers page', 'Audio chime', 'Bid subscription'],
        painPoints: ['Same UX as person transport — not delivery-specific'],
        opportunities: ['Delivery-specific waiting copy ("Finding delivery riders near you")'],
      },
      {
        name: 'Selecting a Delivery Driver',
        icon: '✅',
        steps: [
          'Reviews driver offers (same flow as passenger)',
          'Selects most suitable driver based on price, rating, and ETA',
          'Trip created with recipient name and phone stored',
        ],
        touchpoints: ['DriverOffers page', 'Trip entity (recipient_name, recipient_phone)'],
        painPoints: ['No filtering by vehicle type suitable for goods (e.g. truck vs okada)'],
        opportunities: ['Filter bids by vehicle type', 'Show driver\'s cargo capacity'],
      },
      {
        name: 'Tracking the Delivery',
        icon: '🗺️',
        steps: [
          'Tracks driver on live map',
          'Sees trip status: "Driver Arriving" → "In Progress"',
          'Can call driver for updates',
          'Recipient can be notified separately (future)',
        ],
        touchpoints: ['TripTracking page', 'Trip entity'],
        painPoints: ['Recipient has no visibility into delivery status', 'No delivery confirmation from recipient'],
        opportunities: ['SMS tracking link to recipient', 'Recipient confirms receipt in app'],
      },
      {
        name: 'Delivery Completion',
        icon: '✅',
        steps: [
          'Trip auto-completes when driver marks delivery done',
          'Views delivery summary',
          'Rates driver on reliability and care of package',
          'Returns to Dashboard',
        ],
        touchpoints: ['TripComplete page', 'Review entity'],
        painPoints: ['No proof of delivery (photo) from driver', 'No rating category for package handling'],
        opportunities: ['Driver uploads delivery photo', 'Add "Package Condition" rating dimension'],
      },
    ],
  },
];

export default function CustomerJourneyMap() {
  const printRef = useRef();

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold text-gray-900 truncate">ForgeRide — Journey Map</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">3 Personas · Passenger · Driver · Goods Sender</p>
        </div>
        <button
          onClick={handleDownload}
          className="bg-forge-orange text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-forge-orange-dark transition-colors shadow flex-shrink-0"
        >
          <span>⬇</span> <span className="hidden sm:inline">Download / Print PDF</span><span className="sm:hidden">Print</span>
        </button>
      </div>

      <div ref={printRef} className="max-w-6xl mx-auto px-4 py-8 space-y-16">

        {/* Cover */}
        <div className="bg-forge-navy text-white rounded-2xl p-10 text-center print:rounded-none">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-4xl font-extrabold mb-2">ForgeRide</h1>
          <p className="text-white/60 text-lg mb-4">Customer Journey Map</p>
          <div className="flex justify-center gap-6 text-sm">
            {PERSONAS.map(p => (
              <span key={p.id} className="bg-white/10 px-4 py-2 rounded-full font-semibold">
                {p.emoji} {p.label}
              </span>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-6">Generated {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Each Persona */}
        {PERSONAS.map(persona => (
          <div key={persona.id} className="print:break-before-page">
            {/* Persona Header */}
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: persona.color }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
                  {persona.emoji}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{persona.label}</h2>
                  <p className="text-white/70 text-sm mt-1 max-w-xl">{persona.goal}</p>
                </div>
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-6">
              {persona.stages.map((stage, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Stage header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100" style={{ backgroundColor: persona.lightColor }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold border-2" style={{ borderColor: persona.color, color: persona.color, background: 'white' }}>
                      {idx + 1}
                    </div>
                    <span className="text-xl">{stage.icon}</span>
                    <h3 className="text-base font-extrabold text-gray-900">{stage.name}</h3>
                  </div>

                  {/* Stacked on mobile, 4-col on large screens */}
                  <div className="flex flex-col lg:flex-row lg:divide-x divide-gray-100">
                    {/* Steps */}
                    <div className="p-4 border-b border-gray-100 lg:border-b-0 lg:flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: persona.color }}>Steps</p>
                      <ol className="space-y-2">
                        {stage.steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5" style={{ backgroundColor: persona.color }}>
                              {i + 1}
                            </span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Touchpoints */}
                    <div className="p-4 border-b border-gray-100 lg:border-b-0 lg:flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3">Touchpoints</p>
                      <div className="space-y-1.5">
                        {stage.touchpoints.map((t, i) => (
                          <div key={i} className="text-xs text-gray-600 bg-blue-50 rounded-lg px-2.5 py-1.5 font-medium">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div className="p-4 border-b border-gray-100 lg:border-b-0 lg:flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Pain Points</p>
                      <div className="space-y-1.5">
                        {stage.painPoints.map((p, i) => (
                          <div key={i} className="text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">⚠</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opportunities */}
                    <div className="p-4 lg:flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3">Opportunities</p>
                      <div className="space-y-1.5">
                        {stage.opportunities.map((o, i) => (
                          <div key={i} className="text-xs text-green-800 bg-green-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">💡</span>
                            <span>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center text-xs text-gray-300 pb-4">
          ForgeRide Customer Journey Map · Confidential · {new Date().getFullYear()}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:rounded-none { border-radius: 0; }
        }
      `}</style>
    </div>
  );
}