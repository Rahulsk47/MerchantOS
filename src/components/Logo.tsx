import { cn } from '@/lib/utils';

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-10 h-10' };
  const text = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('relative', dims[size])}>
        <div className="absolute inset-0 bg-gradient-to-br from-electric-500 to-accent-500 rounded-lg rotate-45 opacity-90" />
        <div className="absolute inset-[3px] bg-ink-950 rounded-md rotate-45 flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-electric-400 to-accent-400 rounded-sm -rotate-45" />
        </div>
      </div>
      <span className={cn('font-bold tracking-tight text-white', text[size])}>
        Merchant<span className="text-electric-400">OS</span>
      </span>
    </div>
  );
}
