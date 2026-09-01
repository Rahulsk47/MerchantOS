import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Bot,
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Percent,
  Sliders,
  DollarSign,
  Save,
  Info,
  Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, cn } from '@/lib/utils';
import type { Policy, TxnDecision } from '@/lib/types';
import { demoAgents } from '@/lib/mockData';

const categoryIcons = {
  financial: Wallet,
  agent: Bot,
  approval: ShieldCheck,
};

const categoryLabels = {
  financial: 'Financial Policies',
  agent: 'Agent Permissions & Safety',
  approval: 'Approval Tiers & Limits',
};

const quickAmountPresets = [2500, 6500, 12000, 28000];

export default function PoliciesPage() {
  const {
    policies,
    togglePolicy,
    merchant,
    updateMerchant,
    evaluateTransaction,
    agents,
    openTabs,
    pushToast,
  } = useApp();

  // Test Simulator State
  const [testAmount, setTestAmount] = useState(8000);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [testResult, setTestResult] = useState<null | {
    decision: TxnDecision;
    reason: string;
    checks: { id: string; label: string; passed: boolean; detail?: string }[];
  }>(null);
  const [testing, setTesting] = useState(false);

  // Editable Boundaries State
  const [maxDiscount, setMaxDiscount] = useState(merchant.boundaries?.maxDiscount ?? 15);
  const [minMargin, setMinMargin] = useState(merchant.boundaries?.minMargin ?? 12);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(
    merchant.boundaries?.autoApproveThreshold ?? 5000
  );
  const [maxTxnAmount, setMaxTxnAmount] = useState(
    merchant.boundaries?.maxTxnAmount ?? 25000
  );
  const [isSavingBoundaries, setIsSavingBoundaries] = useState(false);

  // Available agent choices for testing
  const activeAgentsList = agents && agents.length > 0 ? agents : demoAgents;
  const currentTestAgent =
    activeAgentsList.find((a) => a.id === selectedAgentId) ||
    activeAgentsList.find((a) => a.trustLevel === 'verified') ||
    activeAgentsList[0];

  const grouped = (['financial', 'agent', 'approval'] as const).map((cat) => ({
    cat,
    items: policies.filter((p) => p.category === cat),
  }));

  const handleSaveBoundaries = () => {
    setIsSavingBoundaries(true);
    setTimeout(() => {
      updateMerchant({
        boundaries: {
          maxDiscount: Number(maxDiscount),
          minMargin: Number(minMargin),
          autoApproveThreshold: Number(autoApproveThreshold),
          maxTxnAmount: Number(maxTxnAmount),
        },
      });
      setIsSavingBoundaries(false);
      pushToast({
        type: 'success',
        title: 'Safety Boundaries Updated',
        message: 'Deterministic thresholds updated and immediately enforced across all agent interactions.',
      });
    }, 400);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);

    const agentToUse = currentTestAgent;
    const activeTab = openTabs.find(
      (t) => t.status === 'active' && (t.agentId === agentToUse?.id || t.agentName === agentToUse?.name)
    );

    try {
      const result = await evaluateTransaction({
        agentId: agentToUse?.id || 'agent_01',
        products: [{ name: 'Test Catalog Item', price: testAmount }],
        openTabId: activeTab?.id,
      });

      const mappedChecks = result.stages.map((s) => ({
        id: s.id,
        label: s.label,
        passed: s.status === 'passed',
        detail: s.detail,
      }));

      setTestResult({
        decision: result.decision,
        reason: result.reason,
        checks: mappedChecks,
      });
    } catch (err) {
      console.error('Test evaluation error:', err);
      // Fallback deterministic simulation
      let decision: TxnDecision = 'approved';
      let reason = 'All policy checks passed. Within merchant auto-approval threshold.';
      if (testAmount > (merchant.boundaries?.maxTxnAmount || 25000)) {
        decision = 'declined';
        reason = `Amount exceeds absolute single-transaction ceiling of ${formatINR(merchant.boundaries?.maxTxnAmount || 25000)}.`;
      } else if (testAmount > (merchant.boundaries?.autoApproveThreshold || 5000)) {
        decision = 'escalated';
        reason = `Amount exceeds ${formatINR(merchant.boundaries?.autoApproveThreshold || 5000)} auto-approval threshold. Escalated to merchant review queue.`;
      }

      setTestResult({
        decision,
        reason,
        checks: [
          { id: 's1', label: 'Agent Request Initiated', passed: true, detail: `${agentToUse?.name || 'AI Assistant'} requested purchase` },
          { id: 's2', label: 'Identity Verification', passed: agentToUse?.trustLevel !== 'unknown', detail: `Trust level: ${agentToUse?.trustLevel || 'verified'}` },
          { id: 's3', label: 'Catalog Validation', passed: true, detail: 'SKU & price matched live inventory' },
          { id: 's4', label: 'Policy Check', passed: testAmount <= (merchant.boundaries?.maxTxnAmount || 25000), detail: `Cap limit: ${formatINR(merchant.boundaries?.maxTxnAmount || 25000)}` },
          { id: 's5', label: 'OpenTab / Scope Check', passed: true, detail: decision === 'escalated' ? 'Escalated for human approval' : 'Within scope' },
        ],
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Policy Center"
        subtitle="Deterministic rules that govern AI buyer agent actions. AI proposals can never override your policies."
        action={
          <Badge tone="success">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> All policies active & enforced
          </Badge>
        }
      />

      {/* Visual Approval Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Reveal delay={0.02}>
          <Card className="p-4 border-l-4 border-l-success-400 bg-success-500/5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-success-300">
                Tier 1: Instant Approval
              </span>
              <CheckCircle2 className="w-4 h-4 text-success-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5 font-mono">
              ≤ {formatINR(merchant.boundaries?.autoApproveThreshold || 5000)}
            </div>
            <p className="text-xs text-ink-300 mt-1">
              Zero friction. Verified agents execute purchase instantly if within budget.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.04}>
          <Card className="p-4 border-l-4 border-l-warning-400 bg-warning-500/5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-warning-300">
                Tier 2: Policy & Review Checks
              </span>
              <Sliders className="w-4 h-4 text-warning-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5 font-mono">
              {formatINR(merchant.boundaries?.autoApproveThreshold || 5000)} –{' '}
              {formatINR(merchant.boundaries?.maxTxnAmount || 25000)}
            </div>
            <p className="text-xs text-ink-300 mt-1">
              Evaluated against OpenTab authorization. Escalated to merchant review queue if tab is exceeded.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card className="p-4 border-l-4 border-l-danger-400 bg-danger-500/5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-danger-300">
                Tier 3: Hard Stop / Escalation
              </span>
              <Lock className="w-4 h-4 text-danger-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5 font-mono">
              &gt; {formatINR(merchant.boundaries?.maxTxnAmount || 25000)}
            </div>
            <p className="text-xs text-ink-300 mt-1">
              Strict limit. Hard blocked or requires mandatory manual 2FA merchant sign-off.
            </p>
          </Card>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Left Column: Editable Financial Boundaries & Discrete Policy Rules */}
        <div className="space-y-6">
          {/* Editable Boundary Form */}
          <Reveal delay={0.08}>
            <Card className="p-5 border-electric-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
                    <Settings className="w-4.5 h-4.5 text-electric-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Merchant Safety Boundaries</h3>
                    <p className="text-xs text-ink-400">
                      Core financial ceilings and discount guardrails.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveBoundaries}
                  disabled={isSavingBoundaries}
                  className="flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingBoundaries ? 'Saving...' : 'Save Boundaries'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-ink-200 block mb-1.5">
                    Max Auto-Discount Cap (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500"
                    />
                    <Percent className="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-2xs text-ink-500 mt-1">Agents cannot negotiate discounts exceeding this</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-200 block mb-1.5">
                    Min Profit Margin Floor (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={minMargin}
                      onChange={(e) => setMinMargin(Number(e.target.value))}
                      className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500"
                    />
                    <Percent className="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-2xs text-ink-500 mt-1">Transactions below this gross margin are rejected</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-200 block mb-1.5">
                    Auto-Approve Single Txn Cap (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={500}
                      max={50000}
                      step={500}
                      value={autoApproveThreshold}
                      onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
                      className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-electric-500"
                    />
                    <DollarSign className="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-2xs text-ink-500 mt-1">Amounts under this execute automatically</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-200 block mb-1.5">
                    Absolute Single Txn Ceiling (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1000}
                      max={200000}
                      step={1000}
                      value={maxTxnAmount}
                      onChange={(e) => setMaxTxnAmount(Number(e.target.value))}
                      className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-electric-500"
                    />
                    <DollarSign className="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-2xs text-ink-500 mt-1">Transactions above this require manual approval</p>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* Grouped Discrete Policies */}
          {grouped.map((group, gi) => {
            const Icon = categoryIcons[group.cat];
            return (
              <Reveal key={group.cat} delay={0.1 + gi * 0.05}>
                <Card className="p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-electric-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{categoryLabels[group.cat]}</h3>
                      <p className="text-xs text-ink-400">
                        {group.items.length} active deterministic rules
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {group.items.map((p) => (
                      <PolicyRow key={p.id} policy={p} onToggle={() => togglePolicy(p.id)} />
                    ))}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        {/* Right Column: Live Policy Preview Simulator */}
        <div>
          <Reveal delay={0.12}>
            <Card className="p-5 sticky top-24 border-accent-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-accent-400" />
                <h3 className="text-sm font-semibold text-white">Live Policy Simulator</h3>
              </div>
              <p className="text-xs text-ink-400 mb-4">
                Test any transaction amount against your live policy rules and inspect deterministic decisions.
              </p>

              {/* Agent Selector */}
              <div className="mb-4">
                <label className="text-xs font-medium text-ink-300 block mb-1.5">
                  Simulated Buyer Agent
                </label>
                <select
                  value={currentTestAgent?.id || ''}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-ink-800 border border-ink-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-500"
                >
                  {activeAgentsList.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.trustLevel} • {agent.organization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Slider & Presets */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-ink-300">Transaction Amount</label>
                  <span className="text-xs text-ink-400 font-mono">Range: ₹500 – ₹50,000</span>
                </div>

                <div className="text-center py-2.5 bg-ink-800/60 rounded-xl border border-ink-700/50 mb-2.5">
                  <p className="text-2xl font-bold text-electric-300 font-mono">
                    {formatINR(testAmount)}
                  </p>
                </div>

                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500 mb-2"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {quickAmountPresets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTestAmount(amt)}
                      className={cn(
                        'py-1 text-2xs font-mono font-medium rounded-lg border transition-all text-center',
                        testAmount === amt
                          ? 'bg-electric-500/20 border-electric-500/40 text-electric-300'
                          : 'bg-ink-800/40 border-ink-700/40 text-ink-400 hover:text-white'
                      )}
                    >
                      {formatINR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Indicators */}
              <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-ink-800/40 border border-ink-700/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Auto-Approval Ceiling:</span>
                  <span className="font-mono text-ink-200">
                    {formatINR(merchant.boundaries?.autoApproveThreshold || 5000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Max Single Txn Limit:</span>
                  <span className="font-mono text-ink-200">
                    {formatINR(merchant.boundaries?.maxTxnAmount || 25000)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-ink-700/50">
                  <span className="text-ink-400">Predicted Outcome:</span>
                  <span
                    className={cn(
                      'font-semibold uppercase text-2xs',
                      testAmount <= (merchant.boundaries?.autoApproveThreshold || 5000)
                        ? 'text-success-400'
                        : testAmount > (merchant.boundaries?.maxTxnAmount || 25000)
                        ? 'text-danger-400'
                        : 'text-warning-400'
                    )}
                  >
                    {testAmount <= (merchant.boundaries?.autoApproveThreshold || 5000)
                      ? 'Instant Auto-Approval'
                      : testAmount > (merchant.boundaries?.maxTxnAmount || 25000)
                      ? 'Declined / Blocked'
                      : 'Requires Review / OpenTab'}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={runTest} disabled={testing}>
                {testing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Evaluate Transaction
                  </>
                )}
              </Button>

              {/* Evaluation Output */}
              <AnimatePresence>
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 pt-4 border-t border-ink-700/50"
                  >
                    <div
                      className={cn(
                        'p-4 rounded-xl border mb-3',
                        testResult.decision === 'approved'
                          ? 'bg-success-500/10 border-success-500/30'
                          : testResult.decision === 'declined'
                          ? 'bg-danger-500/10 border-danger-500/30'
                          : 'bg-warning-500/10 border-warning-500/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {testResult.decision === 'approved' ? (
                          <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" />
                        ) : (
                          <AlertTriangle
                            className={cn(
                              'w-5 h-5 shrink-0',
                              testResult.decision === 'declined'
                                ? 'text-danger-400'
                                : 'text-warning-400'
                            )}
                          />
                        )}
                        <p
                          className={cn(
                            'text-sm font-bold uppercase tracking-wider',
                            testResult.decision === 'approved'
                              ? 'text-success-400'
                              : testResult.decision === 'declined'
                              ? 'text-danger-400'
                              : 'text-warning-400'
                          )}
                        >
                          {testResult.decision === 'approved'
                            ? 'Approved (Auto)'
                            : testResult.decision === 'declined'
                            ? 'Declined (Policy Hard Stop)'
                            : 'Escalated for Human Approval'}
                        </p>
                      </div>
                      <p className="text-xs text-ink-200 mt-1 leading-relaxed">
                        {testResult.reason}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                        Policy Evaluation Trace:
                      </p>
                      {testResult.checks.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 text-xs p-2 rounded-lg bg-ink-800/40 border border-ink-700/30"
                        >
                          {c.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-danger-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className={c.passed ? 'text-white font-medium' : 'text-danger-300 font-medium'}>
                              {c.label}
                            </span>
                            {c.detail && (
                              <p className="text-2xs text-ink-400 mt-0.5">{c.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 pt-3 border-t border-ink-700/40">
                <p className="text-2xs text-ink-500 flex items-center gap-1.5 leading-normal">
                  <Info className="w-3.5 h-3.5 shrink-0 text-electric-400" />
                  AI agents can propose purchases, but deterministic policies always hold final authority.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function PolicyRow({ policy, onToggle }: { policy: Policy; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/40 hover:border-ink-600/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{policy.name}</p>
        <p className="text-2xs text-ink-400 mt-0.5 leading-relaxed">{policy.description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-semibold text-electric-300 font-mono px-2 py-0.5 rounded bg-electric-500/10 border border-electric-500/20">
          {policy.value}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Toggle ${policy.name}`}
          className={cn(
            'relative w-10 h-5.5 rounded-full transition-colors focus:outline-none',
            policy.enabled ? 'bg-electric-500 shadow-glow-sm' : 'bg-ink-700'
          )}
          style={{ height: 22 }}
        >
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-white top-1"
            animate={{ left: policy.enabled ? 22 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}
