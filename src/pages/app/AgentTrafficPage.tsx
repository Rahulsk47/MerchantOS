import { motion } from 'framer-motion';
import { Bot, Search, TrendingUp, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Reveal } from '@/components/ui/Reveal';
import { agentTrafficData, agentTrafficTable } from '@/lib/mockData';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AgentTrafficPage() {
  const totalInteractions = agentTrafficData.reduce((s, d) => s + d.interactions, 0);
  const totalConversions = agentTrafficData.reduce((s, d) => s + d.conversions, 0);
  const conversionRate = Math.round((totalConversions / totalInteractions) * 100);

  const topProducts = [
    { name: 'AeroBook Pro', requests: 14, conversions: 8 },
    { name: 'Wireless Mouse Pro', requests: 11, conversions: 6 },
    { name: 'Desk Lamp', requests: 8, conversions: 5 },
    { name: 'Noise-Cancelling Headphones', requests: 6, conversions: 3 },
  ];

  const searchIntents = [
    { intent: 'Laptop under ₹50K', count: 12 },
    { intent: 'Office accessories', count: 9 },
    { intent: 'Wireless mouse', count: 7 },
    { intent: 'Gaming headset', count: 5 },
    { intent: 'Keyboard under ₹8K', count: 4 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="AI Agent Traffic" subtitle="Understand AI agents as a new customer channel. All data shown is demo data." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Interactions', value: totalInteractions, icon: Bot, tone: 'text-electric-400' },
          { label: 'Conversions', value: totalConversions, icon: CheckCircle2, tone: 'text-success-400' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, tone: 'text-accent-400' },
          { label: 'Declined', value: 3, icon: XCircle, tone: 'text-danger-400' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.05}>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${m.tone}`} />
                  <span className="text-2xs text-ink-500 uppercase tracking-wider">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{m.value}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Reveal delay={0.1} className="lg:col-span-2">
          <Card className="p-5 h-full">
            <h3 className="text-sm font-semibold text-white mb-4">Agent Interactions Over Time</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={agentTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0e111b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="interactions" stroke="#2b62ff" strokeWidth={2} dot={{ fill: '#2b62ff', r: 3 }} name="Interactions" />
                <Line type="monotone" dataKey="conversions" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card className="p-5 h-full">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Search className="w-4 h-4 text-ink-400" /> Top Search Intents</h3>
            <div className="space-y-3">
              {searchIntents.map((s, i) => (
                <div key={s.intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-300">{s.intent}</span>
                    <span className="text-xs text-ink-500">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-electric-500 to-accent-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(s.count / 12) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Most Requested Products</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="surface-flat p-4">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div><span className="text-2xs text-ink-500">Requests</span><p className="text-lg font-bold text-electric-300">{p.requests}</p></div>
                  <div><span className="text-2xs text-ink-500">Converted</span><p className="text-lg font-bold text-success-400">{p.conversions}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.25}>
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-ink-700/40">
            <h3 className="text-sm font-semibold text-white">Agent Activity Log</h3>
            <p className="text-xs text-ink-400 mt-0.5">Recent interactions between AI agents and your store</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-700/40">
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Agent</th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Trust Level</th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Intent</th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {agentTrafficTable.map((row, i) => (
                  <tr key={i} className="border-b border-ink-700/30 hover:bg-ink-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-white font-medium">{row.agent}</td>
                    <td className="px-5 py-3.5"><TrustBadge level={row.trust} /></td>
                    <td className="px-5 py-3.5 text-sm text-ink-300">{row.intent}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-300">{row.product}</td>
                    <td className="px-5 py-3.5">
                      {row.outcome === 'Purchased' && <Badge tone="success">Purchased</Badge>}
                      {row.outcome === 'Approved' && <Badge tone="electric">Approved</Badge>}
                      {row.outcome === 'Escalated' && <Badge tone="warning">Escalated</Badge>}
                      {row.outcome === 'Public Info Only' && <Badge tone="muted"><Eye className="w-3 h-3 inline mr-1" />Public Info Only</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
