import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TrustLevel, TxnDecision } from '@/lib/types';

type Tone = 'neutral' | 'electric' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-700/60 text-ink-200 border-ink-600/50',
  electric: 'bg-electric-500/10 text-electric-300 border-electric-500/30',
  success: 'bg-success-500/10 text-success-400 border-success-500/30',
  warning: 'bg-warning-500/10 text-warning-400 border-warning-500/30',
  danger: 'bg-danger-500/10 text-danger-400 border-danger-500/30',
  accent: 'bg-accent-500/10 text-accent-400 border-accent-500/30',
  muted: 'bg-ink-800/60 text-ink-400 border-ink-700/50',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium uppercase tracking-wider border', tones[tone], className)}>
      {children}
    </span>
  );
}

export function TrustBadge({ level }: { level: TrustLevel }) {
  if (level === 'verified') return <Badge tone="success">Verified</Badge>;
  if (level === 'known') return <Badge tone="warning">Known</Badge>;
  return <Badge tone="danger">Unknown</Badge>;
}

export function DecisionBadge({ decision }: { decision: TxnDecision }) {
  if (decision === 'approved') return <Badge tone="success">Approved</Badge>;
  if (decision === 'declined') return <Badge tone="danger">Declined</Badge>;
  return <Badge tone="warning">Escalated</Badge>;
}
