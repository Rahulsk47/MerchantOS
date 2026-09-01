import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useEffect, useState, type ReactNode } from 'react';

import { AppProvider, useApp } from '@/lib/store';

import LandingPage from '@/pages/LandingPage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import OnboardingPage from '@/pages/OnboardingPage';

import { AppLayout } from '@/components/app/AppLayout';

import OverviewPage from '@/pages/app/OverviewPage';
import GrowthPage from '@/pages/app/GrowthPage';
import CatalogPage from '@/pages/app/CatalogPage';
import AgentTrafficPage from '@/pages/app/AgentTrafficPage';
import AgentIdentityPage from '@/pages/app/AgentIdentityPage';
import OpenTabsPage from '@/pages/app/OpenTabsPage';
import TransactionsPage from '@/pages/app/TransactionsPage';
import TrustLedgerPage from '@/pages/app/TrustLedgerPage';
import PoliciesPage from '@/pages/app/PoliciesPage';
import SettingsPage from '@/pages/app/SettingsPage';

/* ============================================================
   LOADING SCREEN
============================================================ */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-electric-400/30 border-t-electric-400 rounded-full animate-spin" />
        </div>

        <h1 className="text-xl font-semibold text-white">
          MerchantOS
        </h1>

        <p className="mt-3 text-sm text-ink-400">
          Loading your commerce command center...
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   AUTH GUARD
============================================================ */

function RequireAuth({
  children,
}: {
  children: ReactNode;
}) {
  const {
    authed,
    loading,
    merchant,
  } = useApp();

  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authed) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
   * A signed-in user who has not completed onboarding
   * must always go through onboarding before using the app.
   */
  if (
    !merchant.onboardingComplete &&
    location.pathname !== '/onboarding'
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* ============================================================
   ONBOARDING GUARD
============================================================ */

function OnboardingRoute() {
  const {
    authed,
    loading,
    merchant,
  } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authed) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  /*
   * If onboarding is already completed, do not show
   * onboarding again.
   */
  if (merchant.onboardingComplete) {
    return (
      <Navigate
        to="/app"
        replace
      />
    );
  }

  return <OnboardingPage />;
}

/* ============================================================
   EMAIL AUTH CALLBACK
============================================================ */

function AuthCallbackPage() {
  const [message, setMessage] = useState(
    'Verifying your account...'
  );

  useEffect(() => {
    let mounted = true;
    let redirectTimer: number | undefined;

    const handleCallback = async () => {
      try {
        /*
         * We intentionally do not decide whether the user
         * should go to /app or /onboarding here.
         *
         * AppProvider is responsible for loading the user's
         * organization/onboarding state.
         */
        if (!mounted) {
          return;
        }

        setMessage(
          'Email verified. Loading your account...'
        );

        redirectTimer = window.setTimeout(() => {
          if (mounted) {
            window.location.replace('/onboarding');
          }
        }, 300);
      } catch (error) {
        console.error(
          'Auth callback exception:',
          error
        );

        if (!mounted) {
          return;
        }

        setMessage(
          'Something went wrong. Please sign in again.'
        );

        redirectTimer = window.setTimeout(() => {
          if (mounted) {
            window.location.replace('/signin');
          }
        }, 1500);
      }
    };

    void handleCallback();

    return () => {
      mounted = false;

      if (redirectTimer) {
        window.clearTimeout(
          redirectTimer
        );
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-6 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-electric-400/30 border-t-electric-400 rounded-full animate-spin" />
        </div>

        <h1 className="text-xl font-semibold text-white">
          MerchantOS
        </h1>

        <p className="mt-3 text-sm text-ink-400">
          {message}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   APP ROUTER
============================================================ */

function AppRoutes() {
  return (
    <Routes>
      {/* ======================================================
          PUBLIC
      ====================================================== */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/signin"
        element={<SignInPage />}
      />

      <Route
        path="/signup"
        element={<SignUpPage />}
      />

      <Route
        path="/auth/callback"
        element={<AuthCallbackPage />}
      />

      {/* ======================================================
          ONBOARDING
      ====================================================== */}

      <Route
        path="/onboarding"
        element={<OnboardingRoute />}
      />

      {/* ======================================================
          APPLICATION
      ====================================================== */}

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout>
              <OverviewPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/growth"
        element={
          <RequireAuth>
            <AppLayout>
              <GrowthPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/catalog"
        element={
          <RequireAuth>
            <AppLayout>
              <CatalogPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/agents"
        element={
          <RequireAuth>
            <AppLayout>
              <AgentTrafficPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/identity"
        element={
          <RequireAuth>
            <AppLayout>
              <AgentIdentityPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/opentabs"
        element={
          <RequireAuth>
            <AppLayout>
              <OpenTabsPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/transactions"
        element={
          <RequireAuth>
            <AppLayout>
              <TransactionsPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/ledger"
        element={
          <RequireAuth>
            <AppLayout>
              <TrustLedgerPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/policies"
        element={
          <RequireAuth>
            <AppLayout>
              <PoliciesPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/app/settings"
        element={
          <RequireAuth>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* ======================================================
          FALLBACK
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

/* ============================================================
   ROOT APP
============================================================ */

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}