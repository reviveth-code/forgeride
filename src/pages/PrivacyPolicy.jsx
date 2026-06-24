export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto font-inter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-forge-orange flex items-center justify-center">
          <span className="text-white font-black text-lg">F</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-forge-navy">ForgeRide</h1>
          <p className="text-xs text-gray-400">Privacy Policy</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-8">
        <strong>Effective Date:</strong> June 24, 2026 &nbsp;·&nbsp;
        <strong>Last Updated:</strong> June 24, 2026
      </p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">1. Introduction</h2>
          <p>
            ForgeRide ("we", "our", or "us") is a ride-hailing and goods-delivery platform operating in Nigeria.
            This Privacy Policy explains how we collect, use, store, share, and protect your personal information when
            you use the ForgeRide mobile application and related services.
          </p>
          <p className="mt-2">
            By downloading, installing, or using ForgeRide, you agree to the practices described in this policy.
            If you do not agree, please do not use the app.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">2. Information We Collect</h2>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">2.1 Personal Information (Account Registration)</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Full name</strong> — to identify you to drivers, passengers, and on trip records.</li>
            <li><strong>Email address</strong> — used as your unique account identifier and for communication.</li>
            <li><strong>Phone number</strong> — collected in international format (+234) and shared with the other party in a booking to facilitate coordination.</li>
            <li><strong>Account role</strong> — whether you register as a passenger or a driver.</li>
            <li><strong>Password</strong> — stored as a securely hashed credential; we never see or store your password in plain text.</li>
            <li><strong>Vehicle information (drivers only)</strong> — vehicle type, model, colour, and plate number, to display to passengers during bidding.</li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">2.2 Precise Location Data</h3>
          <p>
            ForgeRide collects <strong>precise GPS location</strong> from your device to power its core mobility and
            fleet-tracking features. The specifics of how and why we collect location are detailed in Section 3 below.
          </p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">2.3 Device and Technical Information</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Device type and model</strong></li>
            <li><strong>Operating system and version</strong></li>
            <li><strong>Unique device identifiers</strong> — used for authentication, session security, and fraud prevention.</li>
            <li><strong>IP address</strong> — used for network communication and security.</li>
            <li><strong>App usage data</strong> — crash reports and performance metrics to improve stability.</li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">2.4 Trip and Transaction Data</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Trip data</strong> — pickup and drop-off addresses, coordinates, estimated and actual distance, duration, agreed fare, convenience fee, payment method (wallet or cash), and trip status.</li>
            <li><strong>Wallet and payment data</strong> — wallet balance, funding and withdrawal records, transaction history, and payment references processed through Paystack.</li>
            <li><strong>Bidding data</strong> — bids placed by drivers, including offered price, estimated arrival time, and distance from pickup.</li>
            <li><strong>Reviews and ratings</strong> — ratings and comments you submit or receive after a completed trip.</li>
            <li><strong>In-app communications</strong> — optional notes or messages attached to a ride request.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">3. Location Data — Detailed Disclosures</h2>
          <p>
            ForgeRide relies on precise location to function. Below is a detailed explanation of how and why we access your location.
          </p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">3.1 Foreground Location (App in Use)</h3>
          <p className="font-semibold text-gray-800 mt-2">Passengers:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>When you create a ride or delivery request, we use your precise location to auto-detect your pickup point and display it on a map.</li>
            <li>We use your location to calculate estimated trip distance and duration.</li>
            <li>We use your location to show you nearby available drivers.</li>
            <li>During an active trip, your location is used to track the trip in real time and display the driver's approaching position on the map.</li>
          </ul>
          <p className="font-semibold text-gray-800 mt-2">Drivers:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>While you are online and available, we continuously collect your precise GPS location to broadcast your position to nearby passengers seeking rides.</li>
            <li>During an active trip, we track your live location so the passenger can follow your progress on the map in real time.</li>
            <li>We use your location to calculate your distance from a pickup point and estimate your arrival time.</li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">3.2 Background Location</h3>
          <p>
            ForgeRide may continue to collect your precise location <strong>while the app is in the background</strong> in the following limited circumstances:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Active trips:</strong> When a trip is in progress, we continue to track the driver's live location so the passenger receives real-time updates even if the driver switches to another app (e.g., to use navigation). This background tracking stops automatically when the trip is completed or cancelled.</li>
            <li><strong>Driver availability:</strong> While a driver is marked "online" and available to receive ride requests, we periodically collect their location in the background to match them with nearby passengers. This stops when the driver goes offline.</li>
          </ul>
          <p className="mt-2">
            Background location access is essential for the real-time mobility and fleet-tracking features of ForgeRide.
            Without it, drivers could not be matched with passengers while their phone is locked or the app is minimised,
            and passengers could not track their driver during a trip.
          </p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">3.3 Your Control Over Location</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can revoke location permission at any time through your device settings (Settings → Apps → ForgeRide → Permissions → Location).</li>
            <li>Revoking location permission will prevent you from booking rides, receiving ride requests (as a driver), and tracking trips, but you may continue to access your wallet and trip history.</li>
            <li>When location permission is revoked, we stop collecting new location data immediately.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">4. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and authenticate your account.</li>
            <li>Match passengers with available drivers in real time.</li>
            <li>Facilitate and track ongoing trips, including live driver location.</li>
            <li>Calculate estimated distances, durations, and fares.</li>
            <li>Process wallet funding, payments, driver earnings, and withdrawals.</li>
            <li>Enable communication between passengers and drivers within a booking.</li>
            <li>Display driver vehicle details, ratings, and contact information.</li>
            <li>Collect and display reviews and ratings after trips.</li>
            <li>Send service notifications (e.g., trip status updates, bid offers).</li>
            <li>Detect, prevent, and respond to fraud, security incidents, and policy violations.</li>
            <li>Resolve disputes between users.</li>
            <li>Improve app performance, stability, and user experience.</li>
            <li>Comply with applicable Nigerian laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">5. Data Sharing and Disclosure</h2>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">5.1 We Do Not Sell Your Data</h3>
          <p>
            ForgeRide <strong>does not sell your personal data</strong> to any third party, advertiser, or data broker.
            Your information is never monetised through sale.
          </p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">5.2 Sharing Between Users</h3>
          <p>To facilitate a booking, we share limited information between the passenger and the assigned driver:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Passenger → Driver:</strong> First name, phone number (if the trip is booked for someone else, the recipient's name and phone), and pickup/drop-off locations.</li>
            <li><strong>Driver → Passenger:</strong> Driver name, phone number, vehicle type, model, colour, plate number, rating, and live location during the trip.</li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">5.3 Third-Party Services and Infrastructure Providers</h3>
          <p>We share or process data through the following third-party services, each under their own privacy and security standards:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Paystack</strong> — Payment processing for wallet funding and withdrawals. Transaction amounts, references, and payment metadata are shared. Card and bank details are handled directly by Paystack; we do not store full card numbers.</li>
            <li><strong>Google Maps / Mapping Services</strong> — Map display, address search, and reverse geocoding. Pickup and drop-off coordinates and addresses are shared.</li>
            <li><strong>Cloud Infrastructure Provider</strong> — Hosting, database storage, and application backend. All app data is stored on secure cloud servers managed by our platform provider.</li>
            <li><strong>Email Service Provider</strong> — Sending OTP verification codes and service emails. Email address and verification codes are shared.</li>
          </ul>
          <p className="mt-2">
            Each third-party provider processes data only as necessary to deliver the specified service and is contractually bound to protect your information.
          </p>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">5.4 Legal Disclosures</h3>
          <p>
            We may disclose your information if required to do so by Nigerian law, regulation, legal process, or a
            government request, or if we believe in good faith that disclosure is necessary to protect the rights,
            property, or safety of ForgeRide, our users, or others.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">6. Data Security</h2>
          <p>We take reasonable measures to protect your personal information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Encryption in transit:</strong> All data transmitted between your device and our servers uses HTTPS/TLS encryption.</li>
            <li><strong>Secure authentication:</strong> Authentication tokens and passwords are stored as hashed credentials; we never store passwords in plain text.</li>
            <li><strong>Access controls:</strong> Access to personal data is restricted to authorised personnel and systems on a need-to-know basis.</li>
            <li><strong>Role-based data access:</strong> User data is protected by role-based security rules so that users can only access data they are authorised to see (e.g., you can only view your own wallet, trips, and bids).</li>
            <li><strong>Payment security:</strong> Payment card and bank details are handled entirely by our PCI-compliant payment partner, Paystack. ForgeRide does not store full card numbers or bank account credentials.</li>
          </ul>
          <p className="mt-2">
            No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect
            your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">7. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We retain your account information for as long as your account is active.</li>
            <li><strong>Trip history</strong> is retained for up to <strong>2 years</strong> after completion for dispute resolution, fraud prevention, and service improvement.</li>
            <li><strong>Transaction records</strong> are retained for up to <strong>7 years</strong> as required for financial record-keeping and audit compliance.</li>
            <li><strong>Location data</strong> from active trips is retained for up to <strong>90 days</strong> after trip completion, then automatically deleted, unless needed for an active dispute investigation.</li>
            <li>When you request account deletion, we delete your personal data within <strong>30 days</strong>, except where retention is required by law (e.g., financial transaction records).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">8. Children's Privacy</h2>
          <p>
            ForgeRide is not intended for users under the age of <strong>18</strong>. We do not knowingly
            collect personal information from minors. If we become aware that a minor has registered an account, we will
            delete that account and its associated data promptly.
          </p>
          <p className="mt-2">
            If you believe a minor has provided us with personal information, please contact us at the email in Section 11.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">9. Your Rights and Data Deletion</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
            <li><strong>Withdraw consent:</strong> Revoke location permission or other consents at any time through your device settings.</li>
            <li><strong>Opt out of communications:</strong> Unsubscribe from non-essential service notifications.</li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 mt-4 mb-1">How to Request Account or Data Deletion</h3>
          <p>You can request deletion of your account and personal data in any of the following ways:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li><strong>In-app:</strong> Go to your Profile page → tap "Delete Account" and confirm. Your account and personal data will be scheduled for deletion within 30 days.</li>
            <li><strong>By email:</strong> Send a deletion request to <strong>forgerides@gmail.com</strong> with the subject line "Account Deletion Request" and include the email address registered on your ForgeRide account. We will process your request within 30 days of receipt.</li>
            <li><strong>By phone:</strong> Contact our support team and provide your registered email for verification.</li>
          </ol>
          <p className="mt-2">Upon deletion:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your personal information (name, email, phone, vehicle details) will be permanently removed.</li>
            <li>Your wallet will be closed; any remaining balance will be processed per our withdrawal policy.</li>
            <li>Your trip history and reviews will be deleted, except where retention is legally required.</li>
            <li>Anonymised, aggregated data that cannot identify you may be retained for analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will update the
            "Last Updated" date at the top of this policy and notify you through the app or by email for significant
            changes. Continued use of ForgeRide after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">11. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
          </p>
          <div className="mt-2 bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-bold text-forge-navy">ForgeRide Support</p>
            <p className="text-gray-600 mt-1">📧 forgerides@gmail.com</p>
            <p className="text-gray-600">🌍 Nigeria</p>
            <p className="text-gray-600 mt-1">We will respond to your inquiry within 14 days of receipt.</p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} ForgeRide. All rights reserved.
      </div>
    </div>
  );
}