import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-ink-200 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full bg-ink-800/60 border border-ink-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 transition-all focus:outline-none focus:border-electric-500/50 focus:bg-ink-800',
            icon && 'pl-10',
            error && 'border-danger-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-400 mt-1.5">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-500 mt-1.5">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-ink-200 mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full bg-ink-800/60 border border-ink-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white transition-all focus:outline-none focus:border-electric-500/50',
          error && 'border-danger-500/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger-400 mt-1.5">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-ink-200 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink-500 mt-1.5">{hint}</p>}
    </div>
  );
}
