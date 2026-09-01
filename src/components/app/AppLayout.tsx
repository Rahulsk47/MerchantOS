import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Sidebar } from '@/components/app/Sidebar';
import { TopBar } from '@/components/app/TopBar';
import { AIAssistant } from '@/components/app/AIAssistant';
import { ToastContainer } from '@/components/ui/Toast';
import { useApp } from '@/lib/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { authed, loading } = useApp();
  const navigate = useNavigate();

  /*
   * Only redirect to Sign In when the user is
   * definitely not authenticated.
   *
   * IMPORTANT:
   * We do NOT redirect to /onboarding here.
   */
  useEffect(() => {
    if (!loading && !authed) {
      navigate('/signin', { replace: true });
    }
  }, [authed, loading, navigate]);

  /*
   * Wait until Supabase finishes checking the session.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-electric-500/30 border-t-electric-500 rounded-full animate-spin" />

          <p className="text-sm text-ink-400">
            Loading MerchantOS...
          </p>
        </div>
      </div>
    );
  }

  /*
   * If there is no authenticated session,
   * AppLayout should render nothing while
   * the redirect to /signin happens.
   */
  if (!authed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((previous) => !previous)}
      />

      {/* MAIN APPLICATION AREA */}
      <div
        className={[
          'min-h-screen',
          'transition-all',
          'duration-300',
          collapsed ? 'ml-[72px]' : 'ml-[248px]',
        ].join(' ')}
      >
        {/* TOP BAR */}
        <TopBar
          onToggleAI={() => setAiOpen(true)}
        />

        {/* PAGE CONTENT */}
        <main className="p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* AI ASSISTANT */}
      <AIAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
      />

      {/* TOASTS */}
      <ToastContainer />
    </div>
  );
}

/* ============================================================
   PAGE HEADER
============================================================ */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-ink-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}