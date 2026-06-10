import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

function CopyBlock({ label, content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">{label}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap bg-gray-50 rounded-2xl p-4 text-sm text-gray-700 border border-gray-100 font-sans leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

const SHORT_DESC = `Book rides & deliveries instantly. Fast, affordable, safe — ForgeRide.`;

const FULL_DESC = `ForgeRide is Nigeria's smart ride-hailing and goods delivery platform built for speed, affordability, and trust.

Whether you need a quick ride across town or want to send a package to someone across the city, ForgeRide connects you with verified drivers in minutes — no haggling, no stress.

🚗 FOR PASSENGERS
• Post a ride or delivery request in seconds
• Get competitive offers from nearby drivers
• Choose your driver based on price, rating & vehicle type
• Track your driver live on the map
• Book for yourself or someone else
• Safe, cashless-friendly experience

🏍️ FOR DRIVERS
• See nearby ride and delivery requests in real time
• Place competitive bids and set your own price
• Manage your online status and availability
• Track your daily earnings and trip history
• Build your rating and grow your reputation

📦 GOODS DELIVERY
• Send packages across town with trusted drivers
• Add recipient name and phone number for direct handoff
• Track your delivery in real time

🔒 SAFE & SECURE
• Verified driver profiles
• Real-time trip tracking for every journey
• Review and rating system for accountability
• Transparent pricing — no hidden charges

📍 CURRENTLY SERVING NIGERIA
ForgeRide is growing fast. More cities coming soon.

Download ForgeRide today and experience a smarter way to move.`;

const DATA_SAFETY = `=== LOCATION ===
Precise location collected: YES
Collected in background: NO (foreground only, while app is open)
Why: App functionality — matching passengers with nearby drivers
Shared with third parties: NO

=== PERSONAL INFO ===
Name
  Collected: YES
  Shared: With other users (driver sees passenger name)
  Purpose: App functionality

Email address
  Collected: YES
  Shared: NO
  Purpose: Account management

Phone number
  Collected: YES
  Shared: NO
  Purpose: Account security / OTP verification

=== APP ACTIVITY ===
App interactions
  Collected: YES
  Shared: NO
  Purpose: Analytics / app improvement

In-app search history: NOT COLLECTED

=== OTHER ===
Data encrypted in transit: YES
Users can request data deletion: YES (Profile page → Delete Account)
Data collected from children under 13: NO`;

const SECTIONS = [
  { label: 'Short Description (80 chars)', content: SHORT_DESC },
  { label: 'Full Description', content: FULL_DESC },
  { label: 'Data Safety Form', content: DATA_SAFETY },
];

export default function PlayStoreAssets() {
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto px-5 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🚀</span>
          <h1 className="text-2xl font-bold text-gray-900">Play Store Assets</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">Copy each section and paste into Google Play Console</p>
      </div>

      {SECTIONS.map(s => (
        <CopyBlock key={s.label} label={s.label} content={s.content} />
      ))}

      <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">📸 Screenshots</p>
        <p className="text-sm text-amber-800">
          Capture these screens from the app: Splash, Passenger Dashboard (map + drivers), New Request form, Driver Offers list, Trip Tracking map, Driver Dashboard. Minimum 2, aim for 4–6 at 1080×1920px.
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">ForgeRide · Internal Use Only</p>
    </div>
  );
}