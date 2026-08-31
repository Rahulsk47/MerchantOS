import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter, Bot, ShieldCheck, Cpu, ChevronRight, Search, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, DecisionBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LedgerEvent } from '@/lib/types';

export default function TrustLedgerPage() {
  const { ledger } = useApp();
  const [selected, setSelected] = useState<LedgerEvent | null>(null);
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterDecision, setFilterDecision] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return ledger.filter((e) => {
      if (filterAgent !== 'all' && e.who !== filterAgent) return false;
      if (filterDecision !== 'all' && e.decision !== filterDecision) return false;
      if (search && !e.what.toLowerCase().includes(search.toLowerCase()) && !e.why.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ledger, filterAgent, filterDecision, search]);

  const agents = Array.from(new Set(ledger.map((e) => e.who)));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Trust Ledger" subtitle="Every event answers what happened, why it happened, who initiated it, when, and which policy was applied." />

      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..."
              className="w-full bg-ink-800/40 border border-ink-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/40" />
          </div>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="bg-ink-800/40 border border-ink-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-electric-500/40">
            <option value="all">All agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)} className="bg-ink-800/40 border border-ink-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-electric-500/40">
            <option value="all">All decisions</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </Card>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink-700/40 to-transparent" />
        <div className="space-y-2">
          {filtered.map((event, i) => {
            const Icon = event.whoType === 'agent' ? Bot : event.whoType === 'merchant' ? ShieldCheck : Cpu;
            const tone = event.whoType === 'agent' ? 'text-electric-400' : event.whoType === 'merchant' ? 'text-accent-400' : 'text-ink-400';
            return (
              <Reveal key={event.id} delay={Math.min(i * 0.02, 0.3)}>
                <button onClick={() => setSelected(event)} className="w-full text-left flex items-start gap-4 p-3 rounded-xl hover:bg-ink-800/30 transition-colors group relative">
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-ink-850 border border-ink-700/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-4.5 h-4.5 ${tone}`} style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{event.what}</p>
                      {event.decision && <DecisionBadge decision={event.decision} />}
                      {event.policy && <Badge tone="muted">{event.policy}</Badge>}
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{event.why}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xs text-ink-500">{event.who}</span>
                      <span className="text-2xs text-ink-600">·</span>
                      <span className="text-2xs text-ink-500">{event.time}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-600 group-hover:text-ink-400 transition-colors shrink-0 mt-1" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-8 h-8 text-ink-600 mx-auto mb-2" />
          <p className="text-sm text-ink-400">No events match your filters.</p>
        </Card>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Event Detail" subtitle={selected?.time}>
        {selected && (
          <div className="space-y-4">
            <div className="surface-flat p-4">
              <p className="text-2xs text-ink-500 uppercase tracking-wider">What happened?</p>
              <p className="text-sm text-white mt-1">{selected.what}</p>
            </div>
            <div className="surface-flat p-4">
              <p className="text-2xs text-ink-500 uppercase tracking-wider">Why did it happen?</p>
              <p className="text-sm text-ink-200 mt-1">{selected.why}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="surface-flat p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Who initiated?</p>
                <p className="text-sm text-white mt-1">{selected.who}</p>
                <p className="text-2xs text-ink-500 mt-0.5 capitalize">{selected.whoType}</p>
              </div>
              <div className="surface-flat p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">When?</p>
                <p className="text-sm text-white mt-1">{selected.time}</p>
              </div>
            </div>
            {selected.policy && (
              <div className="surface-flat p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Which policy was applied?</p>
                <div className="flex items-center gap-2 mt-1"><Badge tone="electric">{selected.policy}</Badge></div>
              </div>
            )}
            {selected.decision && (
              <div className="surface-flat p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Decision</p>
                <div className="mt-1"><DecisionBadge decision={selected.decision} /></div>
              </div>
            )}
            {selected.transactionId && (
              <div className="surface-flat p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Transaction</p>
                <p className="text-sm text-electric-300 mt-1 font-mono">{selected.transactionId}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
