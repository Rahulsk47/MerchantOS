import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Wallet, Bot, ShieldCheck, Play, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, cn } from '@/lib/utils';
import type { Policy } from '@/lib/types';

const categoryIcons = { financial: Wallet, agent: Bot, approval: ShieldCheck };
const categoryLabels = { financial: 'Financial Policies', agent: 'Agent Policies', approval: 'Approval Rules' };

export default function PoliciesPage() {
  const { policies, togglePolicy, merchant, evaluateTransaction, agents, openTabs, pushToast } = useApp();
  const [testAmount, setTestAmount] = useState(8000);
  const [testResult, setTestResult] = useState<null | { decision: string; reason: string; checks: { label: string; passed: boolean }[] }>(null);
  const [testing, setTesting] = useState(false);

  const grouped = (['financial', 'agent', 'approval'] as const).map((cat) => ({
    cat,
    items: policies.filter((p) => p.category === cat),
  }));

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const verifiedAgent = agents.find((a) => a.name === 'AI Shopping Assistant');
    const activeTab = openTabs.find((t) => t.status === 'active' && t.agentName === 'AI Shopping Assistant');
    if (!verifiedAgent) {
      pushToast({ type: 'error', title: 'No verified agent found', message: 'Demo data is still loading.' });
      setTesting(false);
      return;
    }
    try {
      const result = await evaluateTransaction({
        agentId: verifiedAgent.id,
        products: [{ name: 'Wireless Mouse Pro', price: testAmount }],
        openTabId: activeTab?.id,
      });
      setTestResult({
        decision: result.decision,
        reason: result.reason,
        checks: result.stages.filter((s) => s.status === 'passed' || s.status === 'failed').map((s) => ({ label: s.label, passed: s.status === 'passed' })),
      });
    } catch {
      pushToast({ type: 'error', title: 'Evaluation failed', message: 'Please try again.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Policy Center" subtitle="Deterministic policies that control what AI agents can and cannot do. AI recommendations can never override merchant policies." />

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          {grouped.map((group, gi) => {
            const Icon = categoryIcons[group.cat];
            return (
              <Reveal key={group.cat} delay={gi * 0.05}>
                <Card className="p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-electric-400" style={{ width: 18, height: 18 }} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{categoryLabels[group.cat]}</h3>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((p) => <PolicyRow key={p.id} policy={p} onToggle={() => togglePolicy(p.id)} />)}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <Card className="p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Live Policy Preview</h3>
            </div>
            <p className="text-xs text-ink-400 mb-4">Test a sample transaction and see exactly how it would be evaluated against your policies.</p>

            <div className="mb-4">
              <label className="text-xs font-medium text-ink-200 mb-2 block">Test transaction amount</label>
              <div className="text-center py-3">
                <p className="text-3xl font-bold text-electric-300">{formatINR(testAmount)}</p>
              </div>
              <input type="range" min={500} max={30000} step={500} value={testAmount} onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500" />
              <div className="flex justify-between text-2xs text-ink-500 mt-1">
                <span>₹500</span><span>₹30,000</span>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className={cn('w-2 h-2 rounded-full', testAmount <= merchant.boundaries.autoApproveThreshold ? 'bg-success-400' : 'bg-warning-400')} />
                {testAmount <= merchant.boundaries.autoApproveThreshold ? 'Auto-approval range' : 'Requires additional checks'}
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className={cn('w-2 h-2 rounded-full', testAmount > merchant.boundaries.maxTxnAmount ? 'bg-danger-400' : 'bg-success-400')} />
                {testAmount > merchant.boundaries.maxTxnAmount ? 'Exceeds max transaction limit' : 'Within max transaction limit'}
              </div>
            </div>

            <Button className="w-full" onClick={runTest} disabled={testing}>
              {testing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play className="w-4 h-4" /> Evaluate Transaction</>}
            </Button>

            {testResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className={cn('p-4 rounded-xl border mb-3', testResult.decision === 'approved' ? 'bg-success-500/10 border-success-500/30' : testResult.decision === 'declined' ? 'bg-danger-500/10 border-danger-500/30' : 'bg-warning-500/10 border-warning-500/30')}>
                  <div className="flex items-center gap-2">
                    {testResult.decision === 'approved' ? <CheckCircle2 className="w-5 h-5 text-success-400" /> : <AlertTriangle className="w-5 h-5 text-warning-400" />}
                    <p className={cn('text-sm font-bold uppercase', testResult.decision === 'approved' ? 'text-success-400' : testResult.decision === 'declined' ? 'text-danger-400' : 'text-warning-400')}>{testResult.decision}</p>
                  </div>
                  <p className="text-xs text-ink-300 mt-1">{testResult.reason}</p>
                </div>
                <div className="space-y-1.5">
                  {testResult.checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {c.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-success-400 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-danger-400 shrink-0" />}
                      <span className={c.passed ? 'text-ink-300' : 'text-ink-400'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="mt-5 pt-4 border-t border-ink-700/40">
              <p className="text-2xs text-ink-500 uppercase tracking-wider mb-2">Approval Tiers</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs"><span className="text-ink-400">Under {formatINR(merchant.boundaries.autoApproveThreshold)}</span><Badge tone="success">Auto-approved</Badge></div>
                <div className="flex items-center justify-between text-xs"><span className="text-ink-400">{formatINR(merchant.boundaries.autoApproveThreshold)} – {formatINR(merchant.boundaries.maxTxnAmount)}</span><Badge tone="warning">Policy checks</Badge></div>
                <div className="flex items-center justify-between text-xs"><span className="text-ink-400">Above {formatINR(merchant.boundaries.maxTxnAmount)}</span><Badge tone="danger">Human approval</Badge></div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function PolicyRow({ policy, onToggle }: { policy: Policy; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{policy.name}</p>
        <p className="text-2xs text-ink-500 mt-0.5">{policy.description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-electric-300 font-mono">{policy.value}</span>
        <button onClick={onToggle} className={cn('relative w-10 h-5.5 rounded-full transition-colors', policy.enabled ? 'bg-electric-500' : 'bg-ink-700')} style={{ height: 22 }}>
          <motion.div className="absolute w-4 h-4 rounded-full bg-white top-1" animate={{ left: policy.enabled ? 22 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        </button>
      </div>
    </div>
  );
}
