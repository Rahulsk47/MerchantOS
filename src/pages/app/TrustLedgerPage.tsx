import { useState, useMemo } from 'react';
import {
  BookOpen,
  Bot,
  ShieldCheck,
  Cpu,
  ChevronRight,
  Search,
  Download,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, DecisionBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LedgerEvent } from '@/lib/types';

export default function TrustLedgerPage() {
  const { ledger } = useApp();
  const [selected, setSelected] = useState<LedgerEvent | null>(null);
  const [filterWhoType, setFilterWhoType] = useState<string>('all');
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filtered = useMemo(() => {
    return ledger.filter((e) => {
      if (filterWhoType !== 'all' && e.whoType !== filterWhoType) return false;
      if (filterDecision !== 'all' && e.decision !== filterDecision) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesWhat = e.what.toLowerCase().includes(query);
        const matchesWhy = e.why.toLowerCase().includes(query);
        const matchesWho = e.who.toLowerCase().includes(query);
        const matchesPolicy = (e.policy ?? '').toLowerCase().includes(query);
        const matchesTxn = (e.transactionId ?? '').toLowerCase().includes(query);
        if (!matchesWhat && !matchesWhy && !matchesWho && !matchesPolicy && !matchesTxn) {
          return false;
        }
      }
      return true;
    });
  }, [ledger, filterWhoType, filterDecision, search]);

  const totalEvents = ledger.length;
  const agentEvents = ledger.filter((e) => e.whoType === 'agent').length;
  const humanInterventions = ledger.filter((e) => e.whoType === 'merchant' || e.decision === 'escalated').length;
  const approvedEvents = ledger.filter((e) => e.decision === 'approved').length;

  const exportAuditLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ledger, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trust_ledger_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Trust Ledger"
        subtitle="Immutable, explainable audit trail detailing what happened, why it happened, who initiated it, when, and which policy applied."
        action={
          <Button variant="outline" onClick={exportAuditLog} size="sm">
            <Download className="w-4 h-4" /> Export Ledger
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Audit Logs',
            value: totalEvents,
            icon: BookOpen,
            tone: 'text-electric-400',
            bg: 'bg-electric-500/10',
          },
          {
            label: 'Agent Actions',
            value: agentEvents,
            icon: Bot,
            tone: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
          },
          {
            label: 'Store Interventions',
            value: humanInterventions,
            icon: ShieldAlert,
            tone: 'text-warning-400',
            bg: 'bg-warning-500/10',
          },
          {
            label: 'Approved Authorizations',
            value: approvedEvents,
            icon: CheckCircle2,
            tone: 'text-success-400',
            bg: 'bg-success-500/10',
          },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.05}>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('p-1.5 rounded-lg', m.bg)}>
                    <Icon className={cn('w-4 h-4', m.tone)} />
                  </div>
                  <span className="text-2xs text-ink-400 uppercase tracking-wider font-semibold">
                    {m.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{m.value}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by event, reason, initiator, or policy..."
              className="w-full bg-ink-800/60 border border-ink-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterWhoType}
              onChange={(e) => setFilterWhoType(e.target.value)}
              className="bg-ink-800/80 border border-ink-700/70 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-electric-500/50"
            >
              <option value="all">All Initiators</option>
              <option value="agent">Agents only</option>
              <option value="merchant">Merchant Store</option>
              <option value="system">System / Provider</option>
            </select>

            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="bg-ink-800/80 border border-ink-700/70 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-electric-500/50"
            >
              <option value="all">All Decisions</option>
              <option value="approved">Approved</option>
              <option value="escalated">Escalated</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ledger Feed */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-electric-500/20 via-ink-700/40 to-transparent" />
        <div className="space-y-2.5">
          {filtered.map((event, i) => {
            const Icon =
              event.whoType === 'agent'
                ? Bot
                : event.whoType === 'merchant'
                ? ShieldCheck
                : Cpu;
            const tone =
              event.whoType === 'agent'
                ? 'text-electric-400'
                : event.whoType === 'merchant'
                ? 'text-accent-400'
                : 'text-ink-400';

            return (
              <Reveal key={event.id} delay={Math.min(i * 0.02, 0.3)}>
                <button
                  type="button"
                  onClick={() => setSelected(event)}
                  className="w-full text-left flex items-start gap-4 p-3.5 rounded-xl bg-ink-900/40 hover:bg-ink-800/50 border border-ink-800 hover:border-ink-700 transition-all group relative"
                >
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-ink-850 border border-ink-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Icon className={cn('w-5 h-5', tone)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white">{event.what}</p>
                      {event.decision && <DecisionBadge decision={event.decision} />}
                      {event.policy && (
                        <Badge tone="muted">
                          <Layers className="w-3 h-3 mr-1 inline" />
                          {event.policy}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-300 leading-relaxed">{event.why}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-2xs text-ink-400 font-medium">{event.who}</span>
                      <span className="text-2xs text-ink-600">·</span>
                      <span className="text-2xs text-ink-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 inline text-ink-600" />
                        {event.time}
                      </span>
                      {event.transactionId && (
                        <>
                          <span className="text-2xs text-ink-600">·</span>
                          <span className="text-2xs text-electric-400 font-mono">
                            {event.transactionId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-600 group-hover:text-ink-300 transition-colors shrink-0 mt-2" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <Card className="p-10 text-center">
          <BookOpen className="w-10 h-10 text-ink-600 mx-auto mb-3" />
          <p className="text-base font-medium text-white mb-1">No trust ledger events found</p>
          <p className="text-sm text-ink-400 max-w-md mx-auto mb-4">
            No events match your current filter and search conditions.
          </p>
          {(search || filterWhoType !== 'all' || filterDecision !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterWhoType('all');
                setFilterDecision('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Drawer Detail */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Trust Ledger Audit Record"
        subtitle={selected ? `Event Log ${selected.id}` : undefined}
      >
        {selected && (
          <div className="space-y-4 p-1">
            <div className="p-3 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-electric-400" />
                <span className="text-xs font-semibold text-electric-300">Cryptographically Audited Entry</span>
              </div>
              <span className="text-2xs font-mono text-ink-400">{selected.id}</span>
            </div>

            <div className="surface-flat p-4 rounded-xl border border-ink-800">
              <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">What happened?</p>
              <p className="text-sm font-medium text-white mt-1">{selected.what}</p>
            </div>

            <div className="surface-flat p-4 rounded-xl border border-ink-800">
              <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">Why did it happen?</p>
              <p className="text-sm text-ink-200 mt-1 leading-relaxed">{selected.why}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="surface-flat p-4 rounded-xl border border-ink-800">
                <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">Who initiated?</p>
                <p className="text-sm font-medium text-white mt-1">{selected.who}</p>
                <p className="text-2xs text-ink-400 mt-0.5 capitalize">Entity Type: {selected.whoType}</p>
              </div>
              <div className="surface-flat p-4 rounded-xl border border-ink-800">
                <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">When?</p>
                <p className="text-sm font-medium text-white mt-1 font-mono">{selected.time}</p>
                <p className="text-2xs text-ink-400 mt-0.5">Live Local Clock</p>
              </div>
            </div>

            {selected.policy && (
              <div className="surface-flat p-4 rounded-xl border border-ink-800">
                <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">Applied Policy Rule</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge tone="electric">{selected.policy}</Badge>
                </div>
              </div>
            )}

            {selected.decision && (
              <div className="surface-flat p-4 rounded-xl border border-ink-800">
                <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">Authorization Decision</p>
                <div className="mt-1.5">
                  <DecisionBadge decision={selected.decision} />
                </div>
              </div>
            )}

            {selected.transactionId && (
              <div className="surface-flat p-4 rounded-xl border border-ink-800">
                <p className="text-2xs text-ink-500 uppercase tracking-wider font-semibold">Related Transaction</p>
                <p className="text-sm text-electric-300 mt-1 font-mono">{selected.transactionId}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
