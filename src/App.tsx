import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/lib/store';
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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/app" element={<AppLayout><OverviewPage /></AppLayout>} />
          <Route path="/app/growth" element={<AppLayout><GrowthPage /></AppLayout>} />
          <Route path="/app/catalog" element={<AppLayout><CatalogPage /></AppLayout>} />
          <Route path="/app/agents" element={<AppLayout><AgentTrafficPage /></AppLayout>} />
          <Route path="/app/identity" element={<AppLayout><AgentIdentityPage /></AppLayout>} />
          <Route path="/app/opentabs" element={<AppLayout><OpenTabsPage /></AppLayout>} />
          <Route path="/app/transactions" element={<AppLayout><TransactionsPage /></AppLayout>} />
          <Route path="/app/ledger" element={<AppLayout><TrustLedgerPage /></AppLayout>} />
          <Route path="/app/policies" element={<AppLayout><PoliciesPage /></AppLayout>} />
          <Route path="/app/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
