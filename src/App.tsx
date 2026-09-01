import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { useEffect, useState } from 'react';

import { AppProvider } from '@/lib/store';
import { supabase } from '@/lib/supabase';

import LandingPage from '@/pages/LandingPage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';

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
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            'Auth callback error:',
            error
          );

          setMessage(
            'Verification failed. Please sign in again.'
          );

          redirectTimer = window.setTimeout(() => {
            if (mounted) {
              window.location.replace('/signin');
            }
          }, 1500);

          return;
        }

        /*
         * If Supabase created a session after email
         * verification, go directly to the dashboard.
         *
         * IMPORTANT:
         * We intentionally DO NOT redirect to /onboarding.
         */
        if (data.session) {
          setMessage(
            'Email verified. Opening MerchantOS...'
          );

          redirectTimer = window.setTimeout(() => {
            if (mounted) {
              window.location.replace('/app');
            }
          }, 500);

          return;
        }

        /*
         * No session means the user still needs to
         * sign in manually.
         */
        setMessage(
          'Email verified. Please sign in to continue.'
        );

        redirectTimer = window.setTimeout(() => {
          if (mounted) {
            window.location.replace('/signin');
          }
        }, 1200);
      } catch (error) {
        console.error(
          'Auth callback exception:',
          error
        );

        if (!mounted) return;

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
        window.clearTimeout(redirectTimer);
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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>

          {/* ==================================================
              PUBLIC LANDING
          ================================================== */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* ==================================================
              AUTH
          ================================================== */}

          <Route
            path="/signin"
            element={<SignInPage />}
          />

          <Route
            path="/signup"
            element={<SignUpPage />}
          />

          {/* ==================================================
              EMAIL VERIFICATION
          ================================================== */}

          <Route
            path="/auth/callback"
            element={<AuthCallbackPage />}
          />

          {/* ==================================================
              MERCHANTOS APPLICATION
          ================================================== */}

          <Route
            path="/app"
            element={
              <AppLayout>
                <OverviewPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/growth"
            element={
              <AppLayout>
                <GrowthPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/catalog"
            element={
              <AppLayout>
                <CatalogPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/agents"
            element={
              <AppLayout>
                <AgentTrafficPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/identity"
            element={
              <AppLayout>
                <AgentIdentityPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/opentabs"
            element={
              <AppLayout>
                <OpenTabsPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/transactions"
            element={
              <AppLayout>
                <TransactionsPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/ledger"
            element={
              <AppLayout>
                <TrustLedgerPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/policies"
            element={
              <AppLayout>
                <PoliciesPage />
              </AppLayout>
            }
          />

          <Route
            path="/app/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />

          {/* ==================================================
              OLD ONBOARDING URL
              
              Keep this route so an old bookmark/link does not
              break. It now sends the user to the dashboard.
          ================================================== */}

          <Route
            path="/onboarding"
            element={
              <Navigate
                to="/app"
                replace
              />
            }
          />

          {/* ==================================================
              FALLBACK
          ================================================== */}

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
      </BrowserRouter>
    </AppProvider>
  );
}