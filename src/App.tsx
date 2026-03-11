import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { HelmetProvider } from 'react-helmet-async';
import { ROUTES } from './constants/routes';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Register = lazy(() => import('./pages/Register'));
const RegisterSuccess = lazy(() => import('./pages/RegisterSuccess'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const TeamProfile = lazy(() => import('./pages/TeamProfile'));
const PastEventDetail = lazy(() => import('./pages/PastEventDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.EVENTS} element={<Events />} />
                <Route path={ROUTES.EVENT_DETAIL} element={<EventDetails />} />
                <Route path={ROUTES.SCHEDULE} element={<Schedule />} />
                <Route path={ROUTES.REGISTER} element={<Register />} />
                <Route path={ROUTES.REGISTER_SUCCESS} element={<RegisterSuccess />} />
                <Route path={ROUTES.CONTACT} element={<Contact />} />
                <Route path={ROUTES.ABOUT} element={<About />} />
                <Route path={ROUTES.TEAM_PROFILE} element={<TeamProfile />} />
                <Route path={ROUTES.PAST_EVENT_DETAIL} element={<PastEventDetail />} />
                <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
                <Route
                  path={ROUTES.ADMIN}
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </ToastProvider>
    </HelmetProvider>
  );
}
