import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Search,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Play,
  Package,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { agentTrafficData, agentTrafficTable as initialTrafficTable } from '@/lib/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn, formatINR, uid } from '@/lib/utils';
import type { TrustLevel } from '@/lib/types';

interface TrafficActivityRow {
  id: string;
  agent: string;
  agentId?: string;
  organization?: string;
  trust: TrustLevel;
  intent: string;
  product: string;
  amount?: number;
  outcome: 'Purchased' | 'Approved' | 'Escalated' | 'Public Info Only' | 'Rate Limited';
  timestamp: string;
  details?: {
    rawPrompt?: string;
    catalogMatches?: string[];
    policyVerdict?: string;
  };
}

export default function AgentTrafficPage() {
  const { agents, products, pushToast } = useApp();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<TrafficActivityRow | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);

  // Live activity log state with initial mock data
  const [activityLog, setActivityLog] = useState<TrafficActivityRow[]>(() => {
    return initialTrafficTable.map((row, idx) => ({
      id: `act_${idx + 1}`,
      agent: row.agent,
      trust: row.trust,
      intent: row.intent,
      product: row.product,
      outcome: row.outcome as TrafficActivityRow['outcome'],
      timestamp: idx === 0 ? '2 mins ago' : idx === 1 ? '18 mins ago' : idx === 2 ? '1 hour ago' : `${idx * 45} mins ago`,
      amount: row.product === 'AeroBook Pro' ? 112000 : row.product === 'Desk Lamp' ? 2400 : row.product === 'Mechanical Keyboard' ? 6900 : row.product === 'Wireless Mouse Pro' ? 3200 : undefined,
      organization: row.agent === 'AI Shopping Assistant' ? 'Aurora AI' : row.agent === 'Buyer Agent' ? 'Helix Commerce' : row.agent === 'Procurement Agent' ? 'Meridian Labs' : 'Independent Crawler',
      details: {
        rawPrompt: `Autonomous search request for "${row.intent}" matching merchant catalog keywords and price brackets.`,
        catalogMatches: row.product !== '—' ? [row.product] : ['No direct stock match'],
        policyVerdict: row.outcome === 'Purchased' ? 'Passed all trust & OpenTab financial checks' : row.outcome === 'Public Info Only' ? 'Unauthenticated bot restricted to public schemas' : row.outcome === 'Escalated' ? 'Amount exceeded auto-approval threshold' : 'Approved by store rules',
      },
    }));
  });

  // Simulated traffic inputs
  const [simAgent, setSimAgent] = useState('AI Shopping Assistant');
  const [simQuery, setSimQuery] = useState('Lightweight laptop under ₹1,00,000');
  const [simTargetProduct, setSimTargetProduct] = useState('AeroBook Air');

  const totalInteractions = useMemo(() => {
    const multiplier = timeframe === '30d' ? 4.2 : timeframe === 'all' ? 12 : 1;
    return Math.round(agentTrafficData.reduce((s, d) => s + d.interactions, 0) * multiplier);
  }, [timeframe]);

  const totalConversions = useMemo(() => {
    const multiplier = timeframe === '30d' ? 4.2 : timeframe === 'all' ? 12 : 1;
    return Math.round(agentTrafficData.reduce((s, d) => s + d.conversions, 0) * multiplier);
  }, [timeframe]);

  const conversionRate = Math.round((totalConversions / Math.max(1, totalInteractions)) * 100);

  const topProducts = [
    { name: 'AeroBook Pro', requests: 14, conversions: 8, category: 'Electronics', price: 112000 },
    { name: 'Wireless Mouse Pro', requests: 11, conversions: 6, category: 'Accessories', price: 3200 },
    { name: 'Desk Lamp', requests: 8, conversions: 5, category: 'Accessories', price: 2400 },
    { name: 'Noise-Cancelling Headphones', requests: 6, conversions: 3, category: 'Electronics', price: 18900 },
  ];

  const searchIntents = [
    { intent: 'Laptop under ₹50K', count: 12, category: 'Electronics', rate: '66% match' },
    { intent: 'Office accessories', count: 9, category: 'Accessories', rate: '78% match' },
    { intent: 'Wireless mouse', count: 7, category: 'Accessories', rate: '85% match' },
    { intent: 'Gaming headset', count: 5, category: 'Audio', rate: '40% match' },
    { intent: 'Keyboard under ₹8K', count: 4, category: 'Peripherals', rate: '75% match' },
  ];

  const filteredActivity = useMemo(() => {
    return activityLog.filter((row) => {
      if (outcomeFilter !== 'all' && row.outcome !== outcomeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAgent = row.agent.toLowerCase().includes(q);
        const matchIntent = row.intent.toLowerCase().includes(q);
        const matchProduct = row.product.toLowerCase().includes(q);
        if (!matchAgent && !matchIntent && !matchProduct) return false;
      }
      return true;
    });
  }, [activityLog, outcomeFilter, searchQuery]);

  const handleSimulateInboundTraffic = () => {
    const selectedAgentObj = agents.find((a) => a.name === simAgent) || agents[0];
    const selectedProdObj = products.find((p) => p.name === simTargetProduct) || products[0];

    const isVerified = selectedAgentObj?.trustLevel === 'verified';
    const isKnown = selectedAgentObj?.trustLevel === 'known';
    const outcome: TrafficActivityRow['outcome'] = isVerified
      ? 'Purchased'
      : isKnown
        ? 'Escalated'
        : 'Public Info Only';

    const newActivity: TrafficActivityRow = {
      id: uid('act'),
      agent: selectedAgentObj?.name || simAgent,
      agentId: selectedAgentObj?.id,
      organization: selectedAgentObj?.organization || 'External AI Agent',
      trust: selectedAgentObj?.trustLevel || 'unknown',
      intent: simQuery,
      product: selectedProdObj?.name || simTargetProduct,
      amount: selectedProdObj?.price || 5000,
      outcome,
      timestamp: 'Just now',
      details: {
        rawPrompt: `Incoming agent discovery query: "${simQuery}". Matched product "${selectedProdObj?.name || simTargetProduct}" with AI passport compatibility.`,
        catalogMatches: [selectedProdObj?.name || simTargetProduct],
        policyVerdict:
          outcome === 'Purchased'
            ? 'Verified agent with active authorization. Converted to purchase.'
            : outcome === 'Escalated'
              ? 'Agent is known; purchase amount flagged for review.'
              : 'Unknown bot granted public schema read only.',
      },
    };

    setActivityLog((prev) => [newActivity, ...prev]);
    pushToast({
      type: outcome === 'Purchased' ? 'success' : outcome === 'Escalated' ? 'warning' : 'info',
      title: 'Agent Interaction Logged',
      message: `${newActivity.agent} queried "${simQuery}" → Outcome: ${outcome}`,
    });

    setSimulateOpen(false);
    setSelectedActivity(newActivity);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="AI Agent Traffic"
        subtitle="Real-time telemetry, inbound discovery queries, and conversion signals from external autonomous shopping agents."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulateOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-electric-400" /> Simulate Discovery
            </Button>
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-ink-700/60 text-xs">
              {(['7d', '30d', 'all'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-colors uppercase tracking-wider text-2xs',
                    timeframe === tf
                      ? 'bg-electric-500 text-white shadow-sm'
                      : 'text-ink-400 hover:text-ink-200'
                  )}
                >
                  {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Inbound Interactions',
            value: totalInteractions,
            trend: '+24.6% vs last period',
            icon: Bot,
            tone: 'text-electric-400',
            bg: 'bg-electric-500/10',
            border: 'border-electric-500/20',
          },
          {
            label: 'Agent Conversions',
            value: totalConversions,
            trend: '+18.2% conversion lift',
            icon: CheckCircle2,
            tone: 'text-success-400',
            bg: 'bg-success-500/10',
            border: 'border-success-500/20',
          },
          {
            label: 'Channel Conversion Rate',
            value: `${conversionRate}%`,
            trend: '+4.2pp vs human buyers',
            icon: TrendingUp,
            tone: 'text-accent-400',
            bg: 'bg-accent-500/10',
            border: 'border-accent-500/20',
          },
          {
            label: 'Guardrails Enforced',
            value: 3,
            trend: '100% boundary safety',
            icon: ShieldCheck,
            tone: 'text-warning-400',
            bg: 'bg-warning-500/10',
            border: 'border-warning-500/20',
          },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.04}>
              <Card className={cn('p-4 border', m.border)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs text-ink-400 font-semibold uppercase tracking-wider">
                    {m.label}
                  </span>
                  <div className={cn('p-1.5 rounded-lg', m.bg)}>
                    <Icon className={cn('w-4 h-4', m.tone)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{m.value}</p>
                <p className="text-2xs text-ink-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-success-400" /> {m.trend}
                </p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Main Grid: Telemetry Area Chart + Top Search Intents */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Reveal delay={0.1} className="lg:col-span-2">
          <Card className="p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Agent Interactions & Conversions</h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Hourly request volume from verified buyer agents vs. completed checkouts
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-electric-500" />
                    <span className="text-ink-300 text-2xs">Inbound Requests</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-400" />
                    <span className="text-ink-300 text-2xs">Conversions</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={agentTrafficData}>
                    <defs>
                      <linearGradient id="interactionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2b62ff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2b62ff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="conversionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="day"
                      stroke="#5b6485"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#5b6485"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0e111b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="interactions"
                      stroke="#2b62ff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#interactionsGrad)"
                      name="Inbound Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#conversionsGrad)"
                      name="Completed Purchases"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-800 flex items-center justify-between text-2xs text-ink-400">
              <span>Peak traffic hour: Friday 4:00 PM – 6:00 PM</span>
              <span className="text-electric-300 font-medium">99.98% Agent API Uptime</span>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card className="p-5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-electric-400" /> Top Search & Discovery Intents
              </h3>
              <p className="text-xs text-ink-400 mb-4">
                What autonomous agents are querying in your product passport
              </p>

              <div className="space-y-3.5">
                {searchIntents.map((s, i) => (
                  <div key={s.intent} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium">{s.intent}</span>
                        <span className="text-2xs text-ink-500 font-mono">({s.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-mono text-electric-300">{s.rate}</span>
                        <span className="text-2xs font-bold text-ink-400">{s.count} queries</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-electric-500 to-accent-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / 12) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-ink-900/60 border border-ink-700/30 text-2xs text-ink-400">
              Agents rely on exact schema tags in your Product Passports to evaluate compatibility.
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Most Requested Products Grid */}
      <Reveal delay={0.2}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Most Requested Products by AI Agents</h3>
              <p className="text-xs text-ink-400 mt-0.5">
                Products with highest autonomous agent discovery and checkout velocity
              </p>
            </div>
            <Badge tone="electric">
              <Package className="w-3 h-3 mr-1" /> Live Catalog Attachment
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topProducts.map((p) => {
              const convRate = Math.round((p.conversions / p.requests) * 100);
              return (
                <div
                  key={p.name}
                  className="surface-flat p-4 rounded-xl border border-ink-800/80 hover:border-electric-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <span className="text-2xs font-mono text-ink-400">{formatINR(p.price)}</span>
                  </div>
                  <p className="text-2xs text-ink-500 mt-0.5">{p.category}</p>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink-800/80 text-center">
                    <div>
                      <span className="text-2xs text-ink-500 block">Queries</span>
                      <p className="text-base font-bold text-electric-300 font-mono">{p.requests}</p>
                    </div>
                    <div>
                      <span className="text-2xs text-ink-500 block">Sold</span>
                      <p className="text-base font-bold text-success-400 font-mono">{p.conversions}</p>
                    </div>
                    <div>
                      <span className="text-2xs text-ink-500 block">Conv. %</span>
                      <p className="text-base font-bold text-accent-400 font-mono">{convRate}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>

      {/* Agent Activity Log Table */}
      <Reveal delay={0.25}>
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-ink-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Agent Telemetry & Activity Log</h3>
              <p className="text-xs text-ink-400 mt-0.5">
                Real-time request trace of agent search queries, validation checks, and outcomes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by agent or intent..."
                  className="w-full bg-ink-800/70 border border-ink-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'Purchased', label: 'Purchased' },
                  { id: 'Approved', label: 'Approved' },
                  { id: 'Escalated', label: 'Escalated' },
                  { id: 'Public Info Only', label: 'Restricted' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOutcomeFilter(f.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-2xs font-medium whitespace-nowrap transition-colors',
                      outcomeFilter === f.id
                        ? 'bg-electric-500/20 text-electric-300 border border-electric-500/40'
                        : 'text-ink-400 hover:text-ink-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-700/40 bg-ink-850/40">
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Initiating Agent
                  </th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Trust Level
                  </th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Search Intent / Query
                  </th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Product Target
                  </th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Outcome
                  </th>
                  <th className="text-right text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedActivity(row)}
                    className="border-b border-ink-700/30 hover:bg-ink-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-electric-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{row.agent}</p>
                          <p className="text-2xs text-ink-500">{row.organization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <TrustBadge level={row.trust} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-200 max-w-xs truncate">
                      "{row.intent}"
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-300">
                      {row.product !== '—' ? (
                        <span className="font-medium text-white">{row.product}</span>
                      ) : (
                        <span className="text-ink-500">None matched</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {row.outcome === 'Purchased' && (
                        <Badge tone="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Purchased
                        </Badge>
                      )}
                      {row.outcome === 'Approved' && (
                        <Badge tone="electric">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                        </Badge>
                      )}
                      {row.outcome === 'Escalated' && (
                        <Badge tone="warning">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Escalated
                        </Badge>
                      )}
                      {row.outcome === 'Public Info Only' && (
                        <Badge tone="muted">
                          <Eye className="w-3 h-3 mr-1" /> Public Info
                        </Badge>
                      )}
                      {row.outcome === 'Rate Limited' && (
                        <Badge tone="danger">
                          <XCircle className="w-3 h-3 mr-1" /> Rate Limited
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-2xs text-ink-500 font-mono whitespace-nowrap">
                      {row.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>

      {/* Activity Inspection Drawer */}
      <Drawer
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title="Agent Query Telemetry"
        subtitle={selectedActivity ? `Trace Reference: ${selectedActivity.id}` : undefined}
        size="md"
      >
        {selectedActivity && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-ink-800/60 border border-ink-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-electric-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{selectedActivity.agent}</h4>
                    <p className="text-2xs text-ink-400">{selectedActivity.organization}</p>
                  </div>
                </div>
                <TrustBadge level={selectedActivity.trust} />
              </div>

              <div className="pt-3 border-t border-ink-700/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-400">Outcome</span>
                  <span className="font-semibold text-white">{selectedActivity.outcome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Timestamp</span>
                  <span className="font-mono text-ink-300">{selectedActivity.timestamp}</span>
                </div>
                {selectedActivity.amount && (
                  <div className="flex justify-between">
                    <span className="text-ink-400">Order Volume</span>
                    <span className="font-mono text-electric-300 font-bold">
                      {formatINR(selectedActivity.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Inbound Search Prompt */}
            <div className="p-4 rounded-xl bg-ink-900/80 border border-ink-700/40 space-y-2">
              <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider block">
                Inbound Search Intent
              </span>
              <p className="text-sm text-white font-medium leading-relaxed">
                "{selectedActivity.intent}"
              </p>
              {selectedActivity.details?.rawPrompt && (
                <p className="text-xs text-ink-400 pt-2 border-t border-ink-800 leading-relaxed">
                  {selectedActivity.details.rawPrompt}
                </p>
              )}
            </div>

            {/* Catalog Discovery Resolution */}
            <div className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/50 space-y-2">
              <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider block">
                Product Passport Resolution
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-300">Target Product:</span>
                <span className="font-semibold text-white">{selectedActivity.product}</span>
              </div>
              <div className="pt-2 border-t border-ink-700/30 text-2xs text-ink-400 leading-relaxed">
                Policy Verdict: {selectedActivity.details?.policyVerdict}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setSelectedActivity(null)}
            >
              Close Telemetry
            </Button>
          </div>
        )}
      </Drawer>

      {/* Simulate Inbound Query Modal */}
      <Modal
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        title="Simulate Inbound Agent Query"
        subtitle="Simulate an autonomous shopping agent searching and requesting items from your catalog."
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-300 uppercase tracking-wider block mb-2">
              Select Querying Agent
            </label>
            <select
              value={simAgent}
              onChange={(e) => setSimAgent(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-electric-500/50"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.trustLevel.toUpperCase()} · {a.organization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-300 uppercase tracking-wider block mb-2">
              Search Intent / NL Query
            </label>
            <input
              type="text"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              placeholder="e.g. Ultralight laptop with 20h battery"
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-electric-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-300 uppercase tracking-wider block mb-2">
              Target Catalog Product
            </label>
            <select
              value={simTargetProduct}
              onChange={(e) => setSimTargetProduct(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-electric-500/50"
            >
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({formatINR(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSimulateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSimulateInboundTraffic}>
              <Play className="w-4 h-4 mr-1.5" /> Dispatch Query
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
