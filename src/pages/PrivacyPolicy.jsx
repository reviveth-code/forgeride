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
        <strong>Effective Date:</strong> June 9, 2025 &nbsp;·&nbsp;
        <strong>Last Updated:</strong> June 9, 2026
      </p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">1. Introduction</h2>
          <p>
            ForgeRide ("we", "our", or "us") is a ride-hailing and goods-delivery platform operating in Nigeria.
            This Privacy Policy explains how we collect, use, store, and protect your personal information when
            you use the ForgeRide mobile application and related services.
          </p>
          <p className="mt-2">
            By using ForgeRide, you agree to the practices described in this policy. If you do not agree,
            please stop using the app.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Information:</strong> Full name, email address, phone number, and role (passenger or driver).</li>
            <li><strong>Location Data:</strong> Real-time GPS coordinates while the app is in use, to match passengers with nearby drivers and track active trips.</li>
            <li><strong>Trip Data:</strong> Pickup/drop-off addresses, trip distance, duration, and agreed fares.</li>
            <li><strong>Driver Information:</strong> Vehicle type, driver rating, and online/offline status.</li>
            <li><strong>Communications:</strong> Notes or messages sent between passengers and drivers within the platform.</li>
            <li><strong>Device Information:</strong> Device type and operating system, used for app performance and security.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To match passengers with available drivers in real time.</li>
            <li>To facilitate and track ongoing trips.</li>
            <li>To calculate estimated distances and trip durations.</li>
            <li>To enable driver-passenger communication within the app.</li>
            <li>To improve app performance and user experience.</li>
            <li>To resolve disputes and ensure platform safety.</li>
            <li>To send important service notifications (e.g., trip status updates via SMS).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">4. Location Data</h2>
          <p>
            ForgeRide requires access to your device's precise location (<strong>GPS</strong>) to function correctly.
            Location is collected:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Passengers:</strong> When booking a ride, to auto-fill pickup location and show nearby drivers.</li>
            <li><strong>Drivers:</strong> While online/active, to broadcast their position to passengers seeking rides.</li>
          </ul>
          <p className="mt-2">
            Location is only actively tracked during an active session. You can revoke location permission at any
            time through your device settings, though this will limit app functionality.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">5. Sharing of Information</h2>
          <p>We do <strong>not</strong> sell your personal data. We may share limited information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Between passengers and drivers:</strong> Name and trip details are shared to facilitate a booking.</li>
            <li><strong>SMS providers (Africa's Talking):</strong> Phone numbers are used solely to deliver OTP verification codes.</li>
            <li><strong>Legal requirements:</strong> If required by Nigerian law or a court order.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Trip history is retained for
            up to <strong>2 years</strong> for dispute resolution and service improvement. You may request
            account deletion at any time through the Profile page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">7. Security</h2>
          <p>
            We use industry-standard security practices to protect your data, including encrypted data
            transmission (HTTPS) and secure authentication tokens. No method of transmission over the internet
            is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">8. Children's Privacy</h2>
          <p>
            ForgeRide is not intended for users under the age of <strong>18</strong>. We do not knowingly
            collect personal information from minors. If we become aware that a minor has registered, we will
            delete their account promptly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for location access at any time.</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact us at the email below.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            via the app or by email. Continued use of ForgeRide after changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-forge-navy mb-2">11. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us:
          </p>
          <div className="mt-2 bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-bold text-forge-navy">ForgeRide Support</p>
            <p className="text-gray-600 mt-1">📧 support@forgeride.com</p>
            <p className="text-gray-600">🌍 Nigeria</p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} ForgeRide. All rights reserved.
      </div>
    </div>
  );
}