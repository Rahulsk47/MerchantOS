import { TrendingUp, Bot, Percent, CreditCard, ArrowUpRight, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Counter } from '@/components/ui/Counter';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, formatINRShort } from '@/lib/utils';
import { revenueData } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

export default function OverviewPage() {
  const { merchant, opportunities, openTabs, ledger } = useApp();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const activeOpps = opportunities.filter((o) => o.status === 'new');
  const activeTabs = openTabs.filter((t) => t.status === 'active');

  const metrics = [
    { label: 'Revenue Opportunities', value: activeOpps.length, suffix: '', icon: TrendingUp, tone: 'text-electric-400', sub: `${formatINR(activeOpps.reduce((s, o) => s + o.impact, 0))} estimated impact` },
    { label: 'AI Agent Interactions', value: 24, suffix: '', icon: Bot, tone: 'text-accent-400', sub: 'This week' },
    { label: 'Agent Conversion', value: 38, suffix: '%', icon: Percent, tone: 'text-success-400', sub: '+6% vs last week' },
    { label: 'Active OpenTabs', value: activeTabs.length, suffix: '', icon: CreditCard, tone: 'text-electric-400', sub: `${formatINR(activeTabs.reduce((s, t) => s + t.remaining, 0))} authorized` },
  ];

  const statusItems = [
    { label: 'AI Readiness', value: `${merchant.aiReadiness}/100`, tone: 'text-electric-300', status: 'good' },
    { label: 'Catalog', value: 'Healthy', tone: 'text-success-400', status: 'good' },
    { label: 'Agent Discovery', value: 'Active', tone: 'text-accent-400', status: 'good' },
    { label: 'Transactions', value: 'Protected', tone: 'text-success-400', status: 'good' },
  ];

  const recentActivity = [
    ...ledger.slice(0, 6).map((e) => ({
      icon: e.decision === 'approved' ? CheckCircle2 : e.decision === 'declined' ? AlertTriangle : Clock,
      tone: e.decision === 'approved' ? 'text-success-400' : e.decision === 'declined' ? 'text-danger-400' : 'text-ink-400',
      title: e.what,
      detail: e.why,
      time: e.time,
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={`${greeting}, ${merchant.businessName}`}
        subtitle="Your business is ready for AI commerce. We found 3 revenue opportunities and processed 24 verified agent interactions this week."
        action={
          <Badge tone="electric"><Sparkles className="w-3 h-3" /> Demo Mode Active</Badge>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.05}>
              <Card hover className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-ink-800/60 border border-ink-700/50 flex items-center justify-center">
                    <Icon className={`w-4.5 h-4.5 ${m.tone}`} style={{ width: 18, height: 18 }} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-600" />
                </div>
                <p className="text-3xl font-bold text-white">
                  <Counter value={m.value} suffix={m.suffix} />
                </p>
                <p className="text-xs text-ink-400 mt-1">{m.label}</p>
                <p className="text-2xs text-ink-500 mt-1.5">{m.sub}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Reveal delay={0.1} className="lg:col-span-2">
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue vs Agent-Driven Revenue</h3>
                <p className="text-xs text-ink-400 mt-0.5">Last 6 months</p>
              </div>
              <Badge tone="success">+48% agent revenue</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2b62ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2b62ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="agent-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatINRShort(v)} />
                <Tooltip
                  contentStyle={{ background: '#0e111b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#b8bed6' }}
                  formatter={(v) => formatINR(Number(v))}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2b62ff" strokeWidth={2} fill="url(#rev-grad)" name="Total Revenue" />
                <Area type="monotone" dataKey="agent" stroke="#22d3ee" strokeWidth={2} fill="url(#agent-grad)" name="Agent Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card className="p-5 h-full">
            <h3 className="text-sm font-semibold text-white mb-4">AI Commerce Status</h3>
            <div className="space-y-3">
              {statusItems.map((s) => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-ink-400" />
                    <span className="text-sm text-ink-300">{s.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${s.tone}`}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-electric-500/10 to-accent-500/5 border border-electric-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-electric-400" />
                <span className="text-xs font-semibold text-electric-300">Recommendation</span>
              </div>
              <p className="text-xs text-ink-300 leading-relaxed">3 revenue opportunities ready for review. Highest impact: bundle Laptop Sleeve + Wireless Mouse (+₹18,400/mo).</p>
              <button onClick={() => navigate('/app/growth')} className="mt-3 text-xs text-electric-400 hover:text-electric-300 flex items-center gap-1">
                Review opportunities <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Reveal delay={0.2}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Agent Interactions</h3>
              <button onClick={() => navigate('/app/agents')} className="text-xs text-electric-400 hover:text-electric-300">View all</button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { day: 'Mon', interactions: 18, conversions: 6 },
                { day: 'Tue', interactions: 24, conversions: 9 },
                { day: 'Wed', interactions: 31, conversions: 12 },
                { day: 'Thu', interactions: 28, conversions: 11 },
                { day: 'Fri', interactions: 42, conversions: 18 },
                { day: 'Sat', interactions: 35, conversions: 14 },
                { day: 'Sun', interactions: 22, conversions: 8 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5b6485" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0e111b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="interactions" fill="#2b62ff" radius={[4, 4, 0, 0]} name="Interactions" />
                <Bar dataKey="conversions" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Reveal>

        <Reveal delay={0.25}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <button onClick={() => navigate('/app/ledger')} className="text-xs text-electric-400 hover:text-electric-300">View ledger</button>
            </div>
            <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin">
              {recentActivity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-ink-800/60 border border-ink-700/40 flex items-center justify-center shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${a.tone}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{a.title}</p>
                      <p className="text-2xs text-ink-500 truncate">{a.detail}</p>
                    </div>
                    <span className="text-2xs text-ink-500 shrink-0">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
