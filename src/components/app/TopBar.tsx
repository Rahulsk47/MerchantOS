import { useState } from 'react';
import { Search, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

export function TopBar({ onToggleAI }: { onToggleAI: () => void }) {
  const { merchant } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 bg-ink-950/80 backdrop-blur-xl border-b border-ink-700/40 flex items-center px-6 gap-4">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800/60 border border-ink-700/50 hover:border-ink-600 transition-colors">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-2xs font-bold text-white">
            {merchant.businessName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-white hidden sm:block">{merchant.businessName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
        </button>
        <span className="text-2xs text-ink-500 px-2 py-1 rounded-full bg-ink-800/60 border border-ink-700/40 hidden md:block">Demo Workspace</span>
      </div>

      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            placeholder="Search transactions, agents, products..."
            className="w-full bg-ink-800/40 border border-ink-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/40 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button onClick={onToggleAI} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-electric-500/10 border border-electric-500/30 text-electric-300 hover:bg-electric-500/20 transition-colors text-sm">
          <Sparkles className="w-4 h-4" /> <span className="hidden sm:block">AI Assistant</span>
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 rounded-xl bg-ink-800/60 border border-ink-700/50 flex items-center justify-center hover:border-ink-600 transition-colors">
            <Bell className="w-4 h-4 text-ink-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-400" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 surface p-4 shadow-glow z-50">
              <p className="text-sm font-semibold text-white mb-3">Notifications</p>
              <div className="space-y-3">
                {[
                  { title: 'New revenue opportunity', detail: 'Bundle: Laptop Sleeve + Wireless Mouse', time: '2m ago' },
                  { title: 'Transaction escalated', detail: 'Procurement Agent — ₹23,400', time: '3h ago' },
                  { title: 'OpenTab expiring soon', detail: 'AI Shopping Assistant — expires 6 PM', time: '1h ago' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-ink-700/40 last:border-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full bg-electric-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">{n.title}</p>
                      <p className="text-2xs text-ink-400 mt-0.5">{n.detail}</p>
                      <p className="text-2xs text-ink-500 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
          M
        </button>
      </div>
    </header>
  );
}
