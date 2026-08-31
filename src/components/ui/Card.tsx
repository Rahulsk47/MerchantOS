import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn('surface shadow-card', hover && 'transition-all duration-300 hover:border-ink-600/80 hover:shadow-glow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-700/50">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-ink-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
