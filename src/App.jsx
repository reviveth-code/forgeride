import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Splash from './pages/Splash';
import PassengerLayout from './components/PassengerLayout';
import DriverLayout from './components/DriverLayout';
import PassengerDashboard from './pages/passenger/Dashboard';
import NewRequest from './pages/passenger/NewRequest';
import WaitingOffers from './pages/passenger/WaitingOffers';
import DriverOffers from './pages/passenger/DriverOffers';
import TripTracking from './pages/passenger/TripTracking';
import PassengerTripComplete from './pages/passenger/TripComplete';
import PassengerRequests from './pages/passenger/Requests';
import PassengerTrack from './pages/passenger/Track';
import PassengerProfile from './pages/passenger/Profile';
import TripHistory from './pages/passenger/TripHistory';
import DriverDashboard from './pages/driver/Dashboard';
import NearbyRequests from './pages/driver/NearbyRequests';
import PlaceBid from './pages/driver/PlaceBid';
import BidSubmitted from './pages/driver/BidSubmitted';
import ActiveTrip from './pages/driver/ActiveTrip';
import DriverTripComplete from './pages/driver/TripComplete';
import DriverHistory from './pages/driver/History';
import DriverProfile from './pages/driver/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Passenger standalone screens (no bottom nav) */}
      <Route path="/passenger/new-request" element={<NewRequest />} />
      <Route path="/passenger/waiting/:requestId" element={<WaitingOffers />} />
      <Route path="/passenger/offers/:requestId" element={<DriverOffers />} />
      <Route path="/passenger/tracking/:tripId" element={<TripTracking />} />
      <Route path="/passenger/trip-complete/:tripId" element={<PassengerTripComplete />} />
      <Route path="/passenger/trip-history" element={<TripHistory />} />

      {/* Passenger layout (bottom nav) */}
      <Route element={<PassengerLayout />}>
        <Route path="/passenger" element={<PassengerDashboard />} />
        <Route path="/passenger/requests" element={<PassengerRequests />} />
        <Route path="/passenger/track" element={<PassengerTrack />} />
        <Route path="/passenger/profile" element={<PassengerProfile />} />
      </Route>

      {/* Driver standalone screens (no bottom nav) */}
      <Route path="/driver/bid/:requestId" element={<PlaceBid />} />
      <Route path="/driver/bid-submitted/:bidId" element={<BidSubmitted />} />
      <Route path="/driver/active-trip/:tripId" element={<ActiveTrip />} />
      <Route path="/driver/trip-complete/:tripId" element={<DriverTripComplete />} />

      {/* Driver layout (bottom nav) */}
      <Route element={<DriverLayout />}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/requests" element={<NearbyRequests />} />
        <Route path="/driver/history" element={<DriverHistory />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App