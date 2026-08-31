import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/app/Sidebar';
import { TopBar } from '@/components/app/TopBar';
import { AIAssistant } from '@/components/app/AIAssistant';
import { ToastContainer } from '@/components/ui/Toast';
import { useApp } from '@/lib/store';
import { useEffect } from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { authed, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authed) {
      navigate('/signin');
    }
  }, [authed, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-electric-500/30 border-t-electric-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-ink-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[248px]'}`}>
        <TopBar onToggleAI={() => setAiOpen(true)} />
        <main className="p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <ToastContainer />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
