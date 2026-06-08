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
        ],
        touchpoints: ['Register page', 'Email OTP verification'],
        painPoints: ['OTP might land in spam — SMS OTP via Africa\'s Talking planned', 'Phone format now simplified (no +234 needed)'],
        opportunities: ['Switch OTP delivery to SMS to avoid spam', 'Inline OTP resend feedback'],
      },
      {
        name: 'Booking a Ride',
        icon: '📍',
        steps: [
          'Opens Passenger Dashboard — sees live driver count within 3 km',
          'Live map shows nearby drivers as vehicle emojis updating every second',
          'Passenger\'s own position shown as pulsing orange dot on the map',
          'Map auto-snaps its bounds to frame all visible drivers and the passenger',
          'Taps "Transport" or "Delivery" tile (or Post New Request)',
          'Enters pickup and drop-off address with autocomplete',
          'Optionally marks trip as "for someone else" with recipient details',
          'Reviews estimated distance & duration, then submits request',
        ],
        touchpoints: ['Dashboard', 'DriversNearbyCard (3 km radius, 1s poll)', 'Leaflet map with fitBounds', 'New Request form', 'LocationSearchInput'],
        painPoints: ['Autocomplete accuracy in rural areas', 'No price hint before posting', '1-second polling increases backend load'],
        opportunities: ['Show price range estimate before posting', 'Save frequent addresses', 'Throttle poll to entity subscription for efficiency'],
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
          'Lands on live map showing driver\'s real-time location',
          'Passenger\'s position shown as a pulsing orange dot',
          'Driver\'s vehicle emoji marker moves on map every second',
          'Map bounds auto-fit to always show both passenger and driver',
          'Sees ETA, distance to pickup, and agreed price',
          'Status changes from "Driver Arriving" → "Trip In Progress"',
          'Can call driver via phone button',
        ],
        touchpoints: ['TripTracking page', 'Trip entity (1s live polling)', 'DriversNearbyCard MapBoundsFitter', 'Leaflet map'],
        painPoints: ['No in-app chat', 'Driver location lags if GPS is weak', '1s poll may strain backend under load'],
        opportunities: ['In-app messaging', 'Show driver route overlay', 'Use WebSocket for true real-time updates'],
      },
      {
        name: 'Trip Completion & Review',
        icon: '⭐',
        steps: [
          'Trip auto-completes when driver marks it done',
          'Redirected to Trip Complete screen with summary',
          'Rates driver (1–5 stars) and selects feedback tags',
          'Optionally leaves a written comment',
          'Returns to Dashboard',
        ],
        touchpoints: ['TripComplete page', 'Review entity', 'Trip History'],
        painPoints: ['No receipt or fare breakdown', 'No dispute mechanism'],
        opportunities: ['Email receipt', 'Fare split / tip feature'],
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
        ],
        touchpoints: ['Register page', 'Email OTP verification', 'BottomSheetPicker (vehicle type)', 'VehicleDetailsSheet'],
        painPoints: ['No document upload (licence, insurance) yet', 'No background check flow'],
        opportunities: ['Switch OTP to SMS', 'Add document verification step', 'Driver onboarding checklist'],
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
          'Views Nearby Requests list with 2-minute countdown per request',
          'Filters by "All / Person / Goods"',
          'Sees distance from their location to pickup (Haversine)',
          'Identifies already-bid requests (highlighted orange)',
          'Driver position broadcast live via GPS watchPosition every second',
          'Taps "Place Bid" on a chosen request',
        ],
        touchpoints: ['NearbyRequests page', 'Haversine distance calc', 'Request TTL countdown', 'getOnlineDrivers backend (radius + proximity sort)'],
        painPoints: ['No map view of requests', 'High-demand requests expire too fast', 'Continuous GPS drains battery'],
        opportunities: ['Map view toggle showing open requests', 'Adjustable TTL or priority queue', 'GPS optimisation (adaptive frequency)'],
      },
      {
        name: 'Placing a Bid',
        icon: '💸',
        steps: [
          'Views full request details (route, distance, duration, type)',
          'Sees 2-minute countdown timer before request expires',
          'Selects bid price via bottom-sheet picker (presets) or types custom amount',
          'Sees live competitor bid count on the request',
          'Optionally adds a message to the passenger (max 120 chars)',
          'ETA and current GPS distance to pickup pre-filled automatically',
          'Submits bid — app navigates immediately (optimistic UI)',
        ],
        touchpoints: ['PlaceBid page', 'Bid entity', 'GPS location', 'BottomSheetPicker (price)'],
        painPoints: ['No suggested price range based on distance', 'Requests expire in only 2 minutes'],
        opportunities: ['Show market price hint based on distance', 'Adjustable request TTL'],
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
          'Navigates to Active Trip screen',
          'GPS continuously broadcasts live location to passenger',
          'Sees passenger name, trip type, and agreed price',
          'Can access SOS emergency button',
          'Taps "Complete Trip" when journey ends',
        ],
        touchpoints: ['ActiveTrip page', 'Trip entity (driver_lat/lng update)', 'Geolocation watchPosition'],
        painPoints: ['No in-app navigation (only shows map)', 'SOS has no backend action yet'],
        opportunities: ['Integrate Google Maps / Waze deep-link', 'Wire SOS to emergency contact or support'],
      },
      {
        name: 'Trip Completion',
        icon: '🏁',
        steps: [
          'Marks trip as completed',
          'Sees trip earnings summary',
          'Receives passenger rating (visible in profile)',
          'Returns to Dashboard with updated earnings',
        ],
        touchpoints: ['DriverTripComplete page', 'Review entity', 'Driver History'],
        painPoints: ['No wallet or payout flow', 'No cumulative earnings report'],
        opportunities: ['In-app wallet / payout integration', 'Weekly earnings PDF export'],
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

                  {/* 4 columns on desktop, stacked on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x-0 lg:divide-x divide-gray-100">
                    {/* Steps */}
                    <div className="p-4 sm:border-b lg:border-b-0 sm:col-span-2 lg:col-span-1">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: persona.color }}>Steps</p>
                      <ol className="space-y-2">
                        {stage.steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5" style={{ backgroundColor: persona.color }}>
                              {i + 1}
                            </span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Touchpoints */}
                    <div className="p-4 sm:border-b lg:border-b-0 sm:border-l lg:border-l divide-gray-100">
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
                    <div className="p-4 sm:border-t-0 lg:border-l divide-gray-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Pain Points</p>
                      <div className="space-y-1.5">
                        {stage.painPoints.map((p, i) => (
                          <div key={i} className="text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">⚠</span>
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opportunities */}
                    <div className="p-4 sm:border-l lg:border-l divide-gray-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3">Opportunities</p>
                      <div className="space-y-1.5">
                        {stage.opportunities.map((o, i) => (
                          <div key={i} className="text-xs text-green-800 bg-green-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">💡</span>
                            {o}
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