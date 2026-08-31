import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  tone?: 'electric' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneClasses = {
  electric: 'bg-electric-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

export function Progress({ value, max = 100, tone = 'electric', className }: ProgressProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn('w-full h-1.5 bg-ink-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', toneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
