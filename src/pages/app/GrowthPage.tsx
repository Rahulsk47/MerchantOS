import { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Check,
  X,
  Play,
  Package,
  Tag,
  Percent,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import type { GrowthOpportunity } from '@/lib/types';

const typeConfig: Record<
  string,
  { icon: typeof Package; label: string; color: string; bg: string; border: string }
> = {
  bundle: {
    icon: Package,
    label: 'Bundle Strategy',
    color: 'text-electric-300',
    bg: 'bg-electric-500/10',
    border: 'border-electric-500/30',
  },
  pricing: {
    icon: Tag,
    label: 'Pricing Optimization',
    color: 'text-warning-300',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/30',
  },
  catalog: {
    icon: AlertTriangle,
    label: 'Catalog Completeness',
    color: 'text-accent-300',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
  },
  conversion: {
    icon: TrendingUp,
    label: 'Conversion Recovery',
    color: 'text-success-300',
    bg: 'bg-success-500/10',
    border: 'border-success-500/30',
  },
};

const confidenceConfig = {
  high: { tone: 'success' as const, label: 'High confidence' },
  medium: { tone: 'warning' as const, label: 'Medium confidence' },
  low: { tone: 'muted' as const, label: 'Low confidence' },
};

export default function GrowthPage() {
  const { opportunities, setOpportunityStatus, pushToast, merchant } = useApp();
  const [simulating, setSimulating] = useState<GrowthOpportunity | null>(null);
  const [dismissing, setDismissing] = useState<GrowthOpportunity | null>(null);

  const handleApprove = (opp: GrowthOpportunity) => {
    setOpportunityStatus(opp.id, 'approved');
    pushToast({
      type: 'success',
      title: 'Strategy Approved',
      message: `"${opp.title}" has been applied to your active growth strategy.`,
    });
  };

  const handleDismiss = (opp: GrowthOpportunity) => {
    setOpportunityStatus(opp.id, 'dismissed');
    pushToast({
      type: 'info',
      title: 'Opportunity Dismissed',
      message: `"${opp.title}" has been dismissed. You can review strategies anytime in settings.`,
    });
    setDismissing(null);
  };

  const active = opportunities.filter((o) => o.status !== 'dismissed' && o.status !== 'approved');
  const approved = opportunities.filter((o) => o.status === 'approved');
  const totalEstImpact = active.reduce((s, o) => s + o.impact, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Growth Intelligence"
        subtitle="AI-powered revenue opportunities based on agent transaction demand, catalog gaps, and price elasticities. All estimates are labeled — never guaranteed outcomes."
        action={
          <Badge tone="electric">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> {active.length} active opportunities
          </Badge>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Opportunities',
            value: active.length,
            icon: Lightbulb,
            color: 'text-electric-300',
            bg: 'bg-electric-500/10',
            border: 'border-electric-500/20',
          },
          {
            label: 'Est. Monthly Impact',
            value: formatINR(totalEstImpact),
            suffix: '/mo',
            icon: DollarSign,
            color: 'text-success-300',
            bg: 'bg-success-500/10',
            border: 'border-success-500/20',
          },
          {
            label: 'High Confidence',
            value: active.filter((o) => o.confidence === 'high').length,
            icon: CheckCircle2,
            color: 'text-success-400',
            bg: 'bg-success-500/10',
            border: 'border-success-500/20',
          },
          {
            label: 'Approved Strategies',
            value: approved.length,
            icon: TrendingUp,
            color: 'text-accent-300',
            bg: 'bg-accent-500/10',
            border: 'border-accent-500/20',
          },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.label} delay={idx * 0.04}>
              <Card className={`p-4 border ${s.border}`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                    {s.label}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {s.value}
                  {s.suffix && <span className="text-xs text-ink-400 ml-1 font-normal">{s.suffix}</span>}
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Main Grid: Opportunities List + Boundaries Sidebar */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Active Opportunities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-2xs">
              Recommended Actions
            </h2>
            <span className="text-xs text-ink-400">
              Showing {active.length} opportunity{active.length === 1 ? '' : 'ies'}
            </span>
          </div>

          {active.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-success-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-semibold text-white">All opportunities addressed!</h3>
              <p className="text-xs text-ink-400 mt-1 max-w-md mx-auto">
                You have reviewed and acted on all current growth suggestions. New intelligence will appear as agents interact with your store.
              </p>
            </Card>
          ) : (
            active.map((opp, i) => {
              const tc = typeConfig[opp.type] || typeConfig.bundle;
              const Icon = tc.icon;
              const cc = confidenceConfig[opp.confidence] || confidenceConfig.medium;
              return (
                <Reveal key={opp.id} delay={i * 0.05}>
                  <Card hover className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <div
                            className={`w-7 h-7 rounded-lg ${tc.bg} border ${tc.border} flex items-center justify-center shrink-0`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${tc.color}`} />
                          </div>
                          <Badge tone="muted">{tc.label}</Badge>
                          <Badge tone={cc.tone}>{cc.label}</Badge>
                          <Badge
                            tone={
                              opp.risk === 'low'
                                ? 'success'
                                : opp.risk === 'medium'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {opp.risk} risk
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1.5">{opp.title}</h3>
                        <p className="text-xs text-ink-300 mb-3.5 leading-relaxed">
                          {opp.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs flex-wrap pt-2 border-t border-ink-800/80">
                          <div className="flex items-center gap-1.5">
                            <span className="text-ink-400">Estimated revenue impact:</span>
                            <span className="font-semibold text-success-300 font-mono">
                              +{formatINR(opp.impact)}/month
                            </span>
                          </div>
                          {opp.products.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-ink-400">Relevant items:</span>
                              <span className="text-ink-200">{opp.products.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-row lg:flex-col gap-2 justify-end shrink-0 pt-2 lg:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSimulating(opp)}
                          className="flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-electric-400" /> Simulate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(opp)}
                          className="flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDismissing(opp)}
                          className="text-ink-400 hover:text-danger-400"
                        >
                          <X className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })
          )}

          {/* Approved Strategies List */}
          {approved.length > 0 && (
            <Reveal delay={0.15}>
              <div className="mt-8 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-400" />
                    Active Approved Strategies ({approved.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {approved.map((opp) => (
                    <Card key={opp.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-success-500/10 border border-success-500/30 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-success-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{opp.title}</p>
                          <p className="text-2xs text-ink-400 capitalize">{opp.type} strategy active</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-success-300 font-mono">
                          +{formatINR(opp.impact)}/mo
                        </span>
                        <Badge tone="success" className="ml-2 hidden sm:inline-flex">
                          Live
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Sidebar Summary & Merchant Boundaries */}
        <div className="space-y-4">
          <Reveal delay={0.1}>
            <Card className="p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-electric-400" /> Boundary Compliance
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-electric-500/10 border border-electric-500/20">
                  <p className="text-2xs text-ink-400 uppercase tracking-wider">
                    Total Potential Monthly Lift
                  </p>
                  <p className="text-2xl font-bold text-electric-300 mt-1">
                    {formatINR(totalEstImpact)}
                    <span className="text-xs text-ink-400 font-normal"> /mo</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/40 space-y-2.5">
                  <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                    Merchant Policy Guardrails
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Max Discount Limit</span>
                      <span className="text-white font-mono">{merchant.boundaries.maxDiscount}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Minimum Net Margin</span>
                      <span className="text-white font-mono">{merchant.boundaries.minMargin}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Auto-Approve Threshold</span>
                      <span className="text-white font-mono">
                        {formatINR(merchant.boundaries.autoApproveThreshold)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-400">Max Single Txn Cap</span>
                      <span className="text-white font-mono">
                        {formatINR(merchant.boundaries.maxTxnAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-ink-900/60 border border-ink-700/30 text-2xs text-ink-400 leading-relaxed">
                  Every AI suggestion is automatically validated against your profit margins and discount limits before presentation.
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* Simulation Modal */}
      <Modal
        open={!!simulating}
        onClose={() => setSimulating(null)}
        title="Strategy Simulation Breakdown"
        subtitle={simulating?.title}
        size="lg"
      >
        {simulating && (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/50">
              <div className="text-2xs text-ink-400 uppercase tracking-wider mb-1">Opportunity</div>
              <div className="text-sm font-semibold text-white">{simulating.title}</div>
              <p className="text-xs text-ink-300 mt-1">{simulating.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'Current Performance Baseline',
                  value:
                    simulating.detail?.currentPerformance ||
                    'Baseline catalog engagement with standard accessory attachment.',
                  icon: TrendingUp,
                  color: 'text-ink-300',
                },
                {
                  label: 'Est. Conversion Impact',
                  value:
                    simulating.detail?.estimatedConversion ||
                    '+12.4% lift in buyer agent conversion rate.',
                  icon: Percent,
                  color: 'text-electric-300',
                },
                {
                  label: 'Est. Monthly Revenue Gain',
                  value:
                    simulating.detail?.estimatedRevenue ||
                    `+${formatINR(simulating.impact)} / month projected across buyer agents.`,
                  icon: DollarSign,
                  color: 'text-success-300',
                },
                {
                  label: 'Margin & Policy Impact',
                  value:
                    simulating.detail?.discountImpact ||
                    'Within max 15% discount and min 12% margin boundaries.',
                  icon: Tag,
                  color: 'text-warning-300',
                },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.label}
                    className="bg-ink-900/60 border border-ink-700/50 rounded-xl p-3.5"
                  >
                    <div className="flex items-center gap-1.5 text-2xs text-ink-400 uppercase tracking-wider mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${d.color}`} /> {d.label}
                    </div>
                    <div className="text-xs text-ink-100 font-medium leading-relaxed">
                      {d.value}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-warning-500/5 border border-warning-500/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" />
              <div className="text-2xs text-ink-300 leading-relaxed">
                These projections are estimates modeled on recent agent transactions and inquiries. Confidence level is{' '}
                <strong className="text-white capitalize">{simulating.confidence}</strong>. All executions strictly enforce your store's business boundaries.
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setSimulating(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleApprove(simulating);
                  setSimulating(null);
                }}
              >
                <Check className="w-4 h-4" /> Approve Opportunity
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dismiss Confirmation Modal */}
      <Modal
        open={!!dismissing}
        onClose={() => setDismissing(null)}
        title="Dismiss Opportunity?"
        size="sm"
      >
        {dismissing && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-ink-200">
              Are you sure you want to dismiss <strong className="text-white">"{dismissing.title}"</strong>?
            </p>
            <p className="text-xs text-ink-400">
              This will remove the recommendation from your active queue. You can always revisit dismissed opportunities later in Settings.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDismissing(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDismiss(dismissing)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
