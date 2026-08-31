import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CheckCircle2, XCircle, ShieldAlert, ArrowRight, Play, Clock, Bot, CreditCard, Package, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, DecisionBadge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, cn, uid } from '@/lib/utils';
import type { Transaction, TxnStage } from '@/lib/types';

export default function TransactionsPage() {
  const { transactions, agents, openTabs, evaluateTransaction, addTransaction, pushToast } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [scenario, setScenario] = useState(1);

  const [demoRunning, setDemoRunning] = useState(false);

  const runDemo = async () => {
    const verifiedAgent = agents.find((a) => a.name === 'AI Shopping Assistant');
    const activeTab = openTabs.find((t) => t.status === 'active' && t.agentName === 'AI Shopping Assistant');

    if (!verifiedAgent) {
      pushToast({ type: 'error', title: 'No verified agent found', message: 'Demo data is still loading.' });
      return;
    }

    let demoProducts: { name: string; price: number }[];
    let tabId: string | undefined;

    if (scenario === 1) {
      demoProducts = [{ name: 'Wireless Mouse Pro', price: 3200 }, { name: 'Desk Lamp', price: 2400 }];
      tabId = activeTab?.id;
    } else if (scenario === 2) {
      demoProducts = [{ name: 'Noise-Cancelling Headphones', price: 18900 }];
      tabId = activeTab?.id;
    } else {
      demoProducts = [{ name: 'AeroBook Air', price: 78000 }];
      tabId = activeTab?.id;
    }

    setDemoRunning(true);
    try {
      const result = await evaluateTransaction({ agentId: verifiedAgent.id, products: demoProducts, openTabId: tabId });

      const now = new Date();
      const txn: Transaction = {
        id: result.transactionId ?? uid('txn'),
        agentId: verifiedAgent.id,
        agentName: verifiedAgent.name,
        trustLevel: verifiedAgent.trustLevel,
        products: demoProducts,
        amount: result.amount,
        openTabId: tabId,
        decision: result.decision,
        reason: result.reason,
        paymentStatus: result.decision === 'approved' ? 'confirmed' : result.decision === 'escalated' ? 'awaiting_approval' : 'failed',
        stages: result.stages.map((s) => ({ ...s, timestamp: s.status === 'passed' ? now.toTimeString().slice(0, 8) : undefined })),
        timestamp: now.toISOString(),
      };

      addTransaction(txn);

      pushToast({
        type: result.decision === 'approved' ? 'success' : result.decision === 'escalated' ? 'warning' : 'error',
        title: result.decision === 'approved' ? 'Transaction Approved' : result.decision === 'escalated' ? 'Escalated for Human Approval' : 'Transaction Declined',
        message: result.reason,
      });

      setDemoOpen(false);
      setTimeout(() => setSelected(txn), 300);
    } catch {
      pushToast({ type: 'error', title: 'Transaction evaluation failed', message: 'Please try again.' });
    } finally {
      setDemoRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Transactions"
        subtitle="View the complete lifecycle of every AI agent transaction. Every stage is verified and audited."
        action={<Button onClick={() => setDemoOpen(true)}><Play className="w-4 h-4" /> Run Demo</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Approved', value: transactions.filter((t) => t.decision === 'approved').length, icon: CheckCircle2, tone: 'text-success-400' },
          { label: 'Declined', value: transactions.filter((t) => t.decision === 'declined').length, icon: XCircle, tone: 'text-danger-400' },
          { label: 'Escalated', value: transactions.filter((t) => t.decision === 'escalated').length, icon: ShieldAlert, tone: 'text-warning-400' },
          { label: 'Total Volume', value: formatINR(transactions.filter((t) => t.decision === 'approved').reduce((s, t) => s + t.amount, 0)), icon: Receipt, tone: 'text-electric-400' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.05}>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${m.tone}`} /><span className="text-2xs text-ink-500 uppercase tracking-wider">{m.label}</span></div>
                <p className="text-xl font-bold text-white">{m.value}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="space-y-3">
        {transactions.map((txn, i) => (
          <Reveal key={txn.id} delay={i * 0.03}>
            <Card hover className="p-4 cursor-pointer" >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4" onClick={() => setSelected(txn)}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-700/50 flex items-center justify-center shrink-0">
                    <Bot className="w-4.5 h-4.5 text-ink-300" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{txn.agentName}</p>
                      <TrustBadge level={txn.trustLevel} />
                      <DecisionBadge decision={txn.decision} />
                    </div>
                    <p className="text-xs text-ink-400 mt-1">{txn.products.map((p) => p.name).join(', ')} · {txn.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatINR(txn.amount)}</p>
                    <p className="text-2xs text-ink-500">{txn.paymentStatus}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-500" />
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Detail" subtitle={selected?.id} size="xl">
        {selected && <TransactionDetail txn={selected} />}
      </Modal>

      <Modal open={demoOpen} onClose={() => setDemoOpen(false)} title="Run Demo Scenario" subtitle="Simulate an AI agent purchase request through the policy engine" size="md">
        <div className="p-5">
          <p className="text-sm text-ink-300 mb-4">Choose a scenario to simulate. Each one demonstrates a different policy engine outcome.</p>
          <div className="space-y-3">
            <ScenarioCard num={1} title="Successful Purchase" desc="Verified agent requests a purchase within all policies." outcome="Approved" tone="success" selected={scenario === 1} onClick={() => setScenario(1)} />
            <ScenarioCard num={2} title="Authorization Cap Exceeded" desc="Purchase exceeds the OpenTab remaining authorization." outcome="Declined" tone="danger" selected={scenario === 2} onClick={() => setScenario(2)} />
            <ScenarioCard num={3} title="Human Approval Required" desc="Valid transaction but exceeds the auto-approval threshold." outcome="Escalated" tone="warning" selected={scenario === 3} onClick={() => setScenario(3)} />
          </div>
          <Button className="w-full mt-5" onClick={runDemo} disabled={demoRunning}>{demoRunning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play className="w-4 h-4" /> Run Scenario {scenario}</>}</Button>
        </div>
      </Modal>
    </div>
  );
}

function ScenarioCard({ num, title, desc, outcome, tone, selected, onClick }: { num: number; title: string; desc: string; outcome: string; tone: 'success' | 'danger' | 'warning'; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('w-full text-left p-4 rounded-xl border transition-all', selected ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600')}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700/50 flex items-center justify-center text-xs font-bold text-ink-300 shrink-0">{num}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{title}</p>
            <Badge tone={tone}>{outcome}</Badge>
          </div>
          <p className="text-xs text-ink-400 mt-1">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function TransactionDetail({ txn }: { txn: Transaction }) {
  const { approveEscalatedTransaction, declineEscalatedTransaction, pushToast } = useApp();
  const [stageIdx, setStageIdx] = useState(0);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    if (!animating) return;
    if (stageIdx >= txn.stages.length) { setAnimating(false); return; }
    const timer = setTimeout(() => setStageIdx((i) => i + 1), 500);
    return () => clearTimeout(timer);
  }, [stageIdx, animating, txn.stages.length]);

  const stageIcons = [Bot, ShieldCheck, Package, Scale, CreditCard, CreditCard, CheckCircle2];
  const stageTones: Record<string, string> = { passed: 'text-success-400', failed: 'text-danger-400', pending: 'text-ink-500', skipped: 'text-ink-600', running: 'text-electric-400' };
  const stageBg: Record<string, string> = { passed: 'bg-success-500/10 border-success-500/30', failed: 'bg-danger-500/10 border-danger-500/30', pending: 'bg-ink-800/40 border-ink-700/40', skipped: 'bg-ink-800/20 border-ink-700/30', running: 'bg-electric-500/10 border-electric-500/30' };

  return (
    <div className="p-5">
      <div className={cn('p-5 rounded-xl border mb-5', txn.decision === 'approved' ? 'bg-success-500/10 border-success-500/30' : txn.decision === 'declined' ? 'bg-danger-500/10 border-danger-500/30' : 'bg-warning-500/10 border-warning-500/30')}>
        <div className="flex items-center gap-3">
          {txn.decision === 'approved' ? <CheckCircle2 className="w-7 h-7 text-success-400" /> : txn.decision === 'declined' ? <XCircle className="w-7 h-7 text-danger-400" /> : <ShieldAlert className="w-7 h-7 text-warning-400" />}
          <div>
            <p className={cn('text-lg font-bold', txn.decision === 'approved' ? 'text-success-400' : txn.decision === 'declined' ? 'text-danger-400' : 'text-warning-400')}>
              {txn.decision === 'approved' ? 'TRANSACTION APPROVED' : txn.decision === 'declined' ? 'TRANSACTION DECLINED' : 'ESCALATED FOR HUMAN APPROVAL'}
            </p>
            <p className="text-sm text-ink-300 mt-0.5">{txn.reason}</p>
          </div>
        </div>
      </div>

      {txn.decision === 'escalated' && txn.paymentStatus === 'awaiting_approval' && (
        <div className="flex gap-2 mb-5">
          <Button className="flex-1" onClick={() => { approveEscalatedTransaction(txn.id); }}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
          <Button className="flex-1" variant="danger" onClick={() => { declineEscalatedTransaction(txn.id); }}><XCircle className="w-4 h-4" /> Decline</Button>
        </div>
      )}

      <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Transaction Lifecycle</h4>
      <div className="space-y-2 mb-5">
        {txn.stages.map((stage, i) => {
          const Icon = stageIcons[i] ?? Clock;
          const shown = i < stageIdx;
          const isRunning = i === stageIdx && animating;
          const status = isRunning ? 'running' : shown ? stage.status : 'pending';
          return (
            <motion.div key={stage.id} initial={{ opacity: 0, x: -10 }} animate={i <= stageIdx ? { opacity: 1, x: 0 } : { opacity: 0.3 }}
              className={cn('flex items-start gap-3 p-3 rounded-xl border', stageBg[status])}>
              <div className="w-8 h-8 rounded-lg bg-ink-900/60 flex items-center justify-center shrink-0">
                {isRunning ? <Loader2 className="w-4 h-4 text-electric-400 animate-spin" /> : <Icon className={cn('w-4 h-4', stageTones[status])} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{stage.label}</p>
                  {stage.timestamp && <span className="text-2xs text-ink-500 font-mono">{stage.timestamp}</span>}
                </div>
                {stage.detail && <p className="text-xs text-ink-400 mt-0.5">{stage.detail}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Details</h4>
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Agent" value={txn.agentName} />
        <DetailRow label="Trust Level" value={<TrustBadge level={txn.trustLevel} />} />
        <DetailRow label="Amount" value={formatINR(txn.amount)} />
        <DetailRow label="Payment Status" value={txn.paymentStatus} />
        <DetailRow label="Products" value={txn.products.map((p) => p.name).join(', ')} />
        <DetailRow label="OpenTab" value={txn.openTabId ?? 'None'} />
      </div>

      {txn.decision === 'declined' && (
        <div className="mt-5 p-4 rounded-xl bg-ink-800/40 border border-ink-700/40">
          <p className="text-xs font-semibold text-ink-300 mb-2">Suggested next actions:</p>
          <div className="space-y-1.5">
            {['Request human approval', 'Choose an alternative product', 'Create a separate payment request'].map((a) => (
              <div key={a} className="flex items-center gap-2 text-xs text-ink-400"><ArrowRight className="w-3 h-3" /> {a}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="surface-flat p-3">
      <p className="text-2xs text-ink-500 uppercase tracking-wider">{label}</p>
      <div className="text-sm text-white mt-1">{value}</div>
    </div>
  );
}

function Scale({ className }: { className?: string }) {
  return <Receipt className={className} />;
}
