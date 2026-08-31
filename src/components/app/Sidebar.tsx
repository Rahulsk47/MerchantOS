import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Package, Bot, ShieldCheck, CreditCard, Receipt, BookOpen, Scale, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/growth', label: 'Growth Intelligence', icon: TrendingUp },
  { to: '/app/catalog', label: 'Catalog', icon: Package },
  { to: '/app/agents', label: 'AI Agent Traffic', icon: Bot },
  { to: '/app/identity', label: 'Agent Identity', icon: ShieldCheck },
  { to: '/app/opentabs', label: 'OpenTabs', icon: CreditCard },
  { to: '/app/transactions', label: 'Transactions', icon: Receipt },
  { to: '/app/ledger', label: 'Trust Ledger', icon: BookOpen },
  { to: '/app/policies', label: 'Policies', icon: Scale },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const { merchant, signOut } = useApp();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed left-0 top-0 bottom-0 z-30 bg-ink-900 border-r border-ink-700/40 flex flex-col"
    >
      <div className="h-16 flex items-center px-4 border-b border-ink-700/40">
        {collapsed ? <Logo size="sm" /> : <Logo />}
      </div>

      <div className="px-3 py-3">
        <button onClick={onToggle} className="w-full flex items-center justify-end text-ink-400 hover:text-white transition-colors p-1">
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative',
                isActive ? 'text-white bg-electric-500/10' : 'text-ink-400 hover:text-white hover:bg-ink-800/50',
                collapsed && 'justify-center'
              )}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-electric-500 rounded-r-full" />}
                  <Icon className={cn('w-4.5 h-4.5 shrink-0', isActive && 'text-electric-400')} style={{ width: 18, height: 18 }} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-ink-700/40">
        <div className={cn('surface-flat p-3', collapsed && 'flex justify-center')}>
          {!collapsed && (
            <div>
              <p className="text-xs font-semibold text-white truncate">{merchant.businessName}</p>
              <p className="text-2xs text-ink-500 truncate">{merchant.industry}</p>
            </div>
          )}
          <button onClick={() => { signOut(); navigate('/'); }}
            className={cn('mt-2 flex items-center gap-2 text-xs text-ink-400 hover:text-danger-400 transition-colors', collapsed && 'mt-0 justify-center')}>
            <LogOut className="w-3.5 h-3.5" /> {!collapsed && 'Sign out'}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
