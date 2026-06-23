import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { TabNavigationProvider } from '@/components/TabNavigationProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { lazy, Suspense } from 'react';
import PageLoader from '@/components/PageLoader';

// Layouts — direct imports (needed immediately for route structure)
import PassengerLayout from './components/PassengerLayout';
import DriverLayout from './components/DriverLayout';

// Pages — lazy loaded for code splitting
const CustomerJourneyMap = lazy(() => import('./pages/CustomerJourneyMap'));
const Splash = lazy(() => import('./pages/Splash'));
const PassengerDashboard = lazy(() => import('./pages/passenger/Dashboard'));
const NewRequest = lazy(() => import('./pages/passenger/NewRequest'));
const WaitingOffers = lazy(() => import('./pages/passenger/WaitingOffers'));
const DriverOffers = lazy(() => import('./pages/passenger/DriverOffers'));
const TripTracking = lazy(() => import('./pages/passenger/TripTracking'));
const PassengerTripComplete = lazy(() => import('./pages/passenger/TripComplete'));
const PassengerRequests = lazy(() => import('./pages/passenger/Requests'));
const PassengerTrack = lazy(() => import('./pages/passenger/Track'));
const PassengerProfile = lazy(() => import('./pages/passenger/Profile'));
const TripHistory = lazy(() => import('./pages/passenger/TripHistory'));
const PassengerWallet = lazy(() => import('./pages/passenger/Wallet'));
const DriverDashboard = lazy(() => import('./pages/driver/Dashboard'));
const NearbyRequests = lazy(() => import('./pages/driver/NearbyRequests'));
const PlaceBid = lazy(() => import('./pages/driver/PlaceBid'));
const BidSubmitted = lazy(() => import('./pages/driver/BidSubmitted'));
const ActiveTrip = lazy(() => import('./pages/driver/ActiveTrip'));
const DriverTripComplete = lazy(() => import('./pages/driver/TripComplete'));
const DriverHistory = lazy(() => import('./pages/driver/History'));
const DriverWallet = lazy(() => import('./pages/driver/Wallet'));
const DriverProfile = lazy(() => import('./pages/driver/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const PlayStoreAssets = lazy(() => import('./pages/PlayStoreAssets'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
    <Suspense fallback={<PageLoader />}>
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageTransition><Splash /></PageTransition>} />
      <Route path="/journey-map" element={<PageTransition><CustomerJourneyMap /></PageTransition>} />
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
      <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
      <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
      <Route path="/play-store-assets" element={<PageTransition><PlayStoreAssets /></PageTransition>} />

      {/* Passenger standalone screens (no bottom nav) */}
      <Route path="/passenger/new-request" element={<PageTransition><NewRequest /></PageTransition>} />
      <Route path="/passenger/waiting/:requestId" element={<PageTransition><WaitingOffers /></PageTransition>} />
      <Route path="/passenger/offers/:requestId" element={<PageTransition><DriverOffers /></PageTransition>} />
      <Route path="/passenger/tracking/:tripId" element={<PageTransition><TripTracking /></PageTransition>} />
      <Route path="/passenger/trip-complete/:tripId" element={<PageTransition><PassengerTripComplete /></PageTransition>} />
      <Route path="/passenger/trip-history" element={<PageTransition><TripHistory /></PageTransition>} />

      {/* Passenger layout (bottom nav) */}
      <Route element={<PassengerLayout />}>
        <Route path="/passenger" element={<PassengerDashboard />} />
        <Route path="/passenger/requests" element={<PassengerRequests />} />
        <Route path="/passenger/track" element={<PassengerTrack />} />
        <Route path="/passenger/profile" element={<PassengerProfile />} />
        <Route path="/passenger/wallet" element={<PassengerWallet />} />
      </Route>

      {/* Driver standalone screens (no bottom nav) */}
      <Route path="/driver/bid/:requestId" element={<PageTransition><PlaceBid /></PageTransition>} />
      <Route path="/driver/bid-submitted/:bidId" element={<PageTransition><BidSubmitted /></PageTransition>} />
      <Route path="/driver/active-trip/:tripId" element={<PageTransition><ActiveTrip /></PageTransition>} />
      <Route path="/driver/trip-complete/:tripId" element={<PageTransition><DriverTripComplete /></PageTransition>} />

      {/* Driver layout (bottom nav) */}
      <Route element={<DriverLayout />}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/requests" element={<NearbyRequests />} />
        <Route path="/driver/history" element={<DriverHistory />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/wallet" element={<DriverWallet />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <TabNavigationProvider>
            <AuthenticatedApp />
          </TabNavigationProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App