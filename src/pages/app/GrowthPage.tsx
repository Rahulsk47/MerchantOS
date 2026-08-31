import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Package, Zap, Tag, CheckCircle2, XCircle, Play, ArrowRight, BarChart3, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import type { GrowthOpportunity } from '@/lib/types';

const typeIcons = {
  bundle: Package,
  catalog: TrendingUp,
  conversion: Zap,
  pricing: Tag,
};

export default function GrowthPage() {
  const { opportunities, setOpportunityStatus, pushToast, merchant } = useApp();
  const [simulating, setSimulating] = useState<GrowthOpportunity | null>(null);

  const handleApprove = (opp: GrowthOpportunity) => {
    setOpportunityStatus(opp.id, 'approved');
    pushToast({ type: 'success', title: 'Opportunity approved', message: `${opp.title} has been applied to your store.` });
  };

  const handleDismiss = (opp: GrowthOpportunity) => {
    setOpportunityStatus(opp.id, 'dismissed');
    pushToast({ type: 'info', title: 'Opportunity dismissed', message: `${opp.title} has been dismissed.` });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Growth Intelligence"
        subtitle="AI-powered revenue opportunities with estimated impact and confidence levels. Predictions are estimates — not guaranteed outcomes."
        action={<Badge tone="electric"><Sparkles className="w-3 h-3" /> {opportunities.filter((o) => o.status === 'new').length} new</Badge>}
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          {opportunities.map((opp, i) => {
            const Icon = typeIcons[opp.type];
            return (
              <Reveal key={opp.id} delay={i * 0.05}>
                <Card hover className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-electric-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xs font-semibold text-ink-500 uppercase tracking-wider">{opp.type}</span>
                          {opp.status === 'approved' && <Badge tone="success">Approved</Badge>}
                          {opp.status === 'dismissed' && <Badge tone="muted">Dismissed</Badge>}
                          {opp.status === 'simulated' && <Badge tone="electric">Simulated</Badge>}
                        </div>
                        <h3 className="text-base font-semibold text-white mt-1">{opp.title}</h3>
                        <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">{opp.description}</p>
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-ink-500" />
                            <span className="text-xs text-ink-400">Impact:</span>
                            <span className="text-xs font-semibold text-electric-300">{formatINR(opp.impact)}/mo</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-ink-400">Confidence:</span>
                            <Badge tone={opp.confidence === 'high' ? 'success' : opp.confidence === 'medium' ? 'warning' : 'muted'}>{opp.confidence}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-ink-400">Risk:</span>
                            <Badge tone={opp.risk === 'low' ? 'success' : opp.risk === 'medium' ? 'warning' : 'danger'}>{opp.risk}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    {opp.status === 'new' && (
                      <div className="flex sm:flex-col gap-2 sm:w-auto">
                        <Button size="sm" variant="outline" onClick={() => setSimulating(opp)}>
                          <Play className="w-3.5 h-3.5" /> Simulate
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(opp)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(opp)}>
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <Card className="p-5 sticky top-24">
            <h3 className="text-sm font-semibold text-white mb-4">Growth Summary</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-electric-500/10 border border-electric-500/20">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Total estimated impact</p>
                <p className="text-2xl font-bold text-electric-300 mt-1">{formatINR(opportunities.filter((o) => o.status !== 'dismissed').reduce((s, o) => s + o.impact, 0))}<span className="text-sm text-ink-400">/mo</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
                  <p className="text-2xs text-ink-500">Approved</p>
                  <p className="text-lg font-bold text-success-400 mt-1">{opportunities.filter((o) => o.status === 'approved').length}</p>
                </div>
                <div className="p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
                  <p className="text-2xs text-ink-500">Pending</p>
                  <p className="text-lg font-bold text-warning-400 mt-1">{opportunities.filter((o) => o.status === 'new').length}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-ink-700/40">
                <p className="text-2xs text-ink-500 uppercase tracking-wider mb-2">Your business boundaries</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-ink-400">Max discount</span><span className="text-ink-200">{merchant.boundaries.maxDiscount}%</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">Min margin</span><span className="text-ink-200">{merchant.boundaries.minMargin}%</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">Auto-approve</span><span className="text-ink-200">{formatINR(merchant.boundaries.autoApproveThreshold)}</span></div>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      <Modal open={!!simulating} onClose={() => setSimulating(null)} title="Simulating Opportunity" subtitle={simulating?.title} size="lg">
        {simulating && <SimulationView opp={simulating} onClose={() => setSimulating(null)} onApprove={() => { handleApprove(simulating); setSimulating(null); }} />}
      </Modal>
    </div>
  );
}

function SimulationView({ opp, onClose, onApprove }: { opp: GrowthOpportunity; onClose: () => void; onApprove: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Analyzing current performance', detail: 'Reviewing 90 days of sales data...' },
    { label: 'Estimating conversion impact', detail: 'Bundle visibility increases add-to-cart by ~12%' },
    { label: 'Calculating revenue increase', detail: `Projected: +${formatINR(opp.impact)}/month` },
    { label: 'Checking business boundaries', detail: 'All recommendations stay within your max discount and min margin' },
  ];

  if (step < steps.length) {
    setTimeout(() => setStep((s) => s + 1), 800);
  }

  return (
    <div className="p-5">
      <div className="space-y-3">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={i <= step ? { opacity: 1, x: 0 } : { opacity: 0.3 }} className="flex items-start gap-3 p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
            {i < step ? <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" /> : i === step ? <div className="w-5 h-5 border-2 border-electric-500/30 border-t-electric-400 rounded-full animate-spin shrink-0" /> : <div className="w-5 h-5 rounded-full border border-ink-600 shrink-0" />}
            <div>
              <p className="text-sm text-white">{s.label}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {step >= steps.length && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/40">
              <p className="text-2xs text-ink-500">Current AOV</p>
              <p className="text-xl font-bold text-white mt-1">{formatINR(78000)}</p>
            </div>
            <div className="p-4 rounded-xl bg-electric-500/10 border border-electric-500/20">
              <p className="text-2xs text-ink-400">Projected AOV</p>
              <p className="text-xl font-bold text-electric-300 mt-1">{formatINR(78000 + Math.round(opp.impact / 30))}</p>
            </div>
          </div>
          <p className="text-xs text-ink-500 mb-4">Estimates are based on historical data and are not guaranteed outcomes. Confidence: {opp.confidence}.</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onApprove}><CheckCircle2 className="w-4 h-4" /> Approve Opportunity</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
