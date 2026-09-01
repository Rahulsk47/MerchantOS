import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Play,
  Clock,
  Bot,
  CreditCard,
  Package,
  ShieldCheck,
  Scale,
  Loader2,
  ChevronRight,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, DecisionBadge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, cn, uid } from '@/lib/utils';
import type { Transaction, TxnStage, TxnDecision } from '@/lib/types';

const scenarioDefinitions = [
  {
    id: 1,
    title: 'Standard Purchase within OpenTab',
    desc: 'Verified agent buys within OpenTab authorization cap and category scope.',
    expected: 'approved' as TxnDecision,
    expectedLabel: 'Approved',
    tone: 'success' as const,
    agentName: 'AI Shopping Assistant',
    products: [
      { name: 'Wireless Mouse Pro', price: 3200 },
      { name: 'Desk Lamp', price: 2400 },
    ],
    amount: 5600,
    tabCap: 15000,
    checks: [
      { name: 'Agent Trust Level', passed: true, detail: 'Verified by Aurora AI identity provider' },
      { name: 'OpenTab Status', passed: true, detail: 'Active OpenTab with ₹8,500 remaining balance' },
      { name: 'Category Scope', passed: true, detail: 'Accessories — permitted in OpenTab scope' },
      { name: 'Margin Boundary', passed: true, detail: 'Order margin 24.5% satisfies minimum 12%' },
      { name: 'Auto-Approval Ceiling', passed: true, detail: '₹5,600 is within merchant auto-approval threshold' },
    ],
    reason: 'All safety & financial policy checks passed. Within OpenTab scope and authorization.',
  },
  {
    id: 2,
    title: 'High-Value Order (Human Approval Required)',
    desc: 'Valid request from verified buyer agent that exceeds the automated approval ceiling.',
    expected: 'escalated' as TxnDecision,
    expectedLabel: 'Escalated',
    tone: 'warning' as const,
    agentName: 'Buyer Agent',
    products: [
      { name: 'Noise-Cancelling Headphones', price: 18900 },
    ],
    amount: 18900,
    tabCap: 8000,
    checks: [
      { name: 'Agent Trust Level', passed: true, detail: 'Verified by Helix Commerce OS' },
      { name: 'OpenTab Status', passed: true, detail: 'Active OpenTab found' },
      { name: 'Category Scope', passed: true, detail: 'Electronics — allowed category' },
      { name: 'Margin Boundary', passed: true, detail: 'Order margin 19.8% satisfies minimum 12%' },
      { name: 'Auto-Approval Ceiling', passed: false, detail: '₹18,900 exceeds auto-approval ceiling of ₹5,000' },
    ],
    reason: 'Transaction exceeds auto-approval ceiling. Human merchant approval required before settlement.',
  },
  {
    id: 3,
    title: 'Exceeds OpenTab Authorization Balance',
    desc: 'Purchase amount exceeds the remaining authorization limit granted on the OpenTab.',
    expected: 'declined' as TxnDecision,
    expectedLabel: 'Declined',
    tone: 'danger' as const,
    agentName: 'Procurement Agent',
    products: [
      { name: 'AeroBook Air', price: 78000 },
    ],
    amount: 78000,
    tabCap: 20000,
    checks: [
      { name: 'Agent Trust Level', passed: true, detail: 'Known trust identity' },
      { name: 'OpenTab Status', passed: false, detail: 'Remaining OpenTab balance is ₹0 (exhausted)' },
      { name: 'Category Scope', passed: true, detail: 'Electronics is permitted' },
      { name: 'Spending Cap', passed: false, detail: '₹78,000 exceeds maximum single transaction cap of ₹25,000' },
    ],
    reason: 'OpenTab authorization exhausted. Spending cap exceeded by ₹53,000.',
  },
  {
    id: 4,
    title: 'Unverified Agent / Policy Violation',
    desc: 'Direct purchase attempt from unauthenticated bot without verified identity or credentials.',
    expected: 'declined' as TxnDecision,
    expectedLabel: 'Restricted',
    tone: 'danger' as const,
    agentName: 'Research Agent',
    products: [
      { name: 'Mechanical Keyboard', price: 6900 },
    ],
    amount: 6900,
    checks: [
      { name: 'Agent Trust Level', passed: false, detail: 'Unknown / Unverified agent identity' },
      { name: 'Identity Proof', passed: false, detail: 'No cryptographic proof or OpenTab provided' },
      { name: 'Access Permissions', passed: false, detail: 'Restricted to public catalog browsing only' },
    ],
    reason: 'Agent identity not verified. No transaction authority granted. Restricted to public info only.',
  },
];

export default function TransactionsPage() {
  const {
    transactions,
    agents,
    openTabs,
    addTransaction,
    pushToast,
  } = useApp();

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState(1);
  const [evaluating, setEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(0);
  const [evalCompleted, setEvalCompleted] = useState(false);
  const [simulatedTxn, setSimulatedTxn] = useState<Transaction | null>(null);

  // Filters & search
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize drawer selected transaction if it gets updated in store
  useEffect(() => {
    if (selectedTxn) {
      const current = transactions.find((t) => t.id === selectedTxn.id);
      if (
        current &&
        (current.decision !== selectedTxn.decision ||
          current.paymentStatus !== selectedTxn.paymentStatus)
      ) {
        setSelectedTxn(current);
      }
    }
  }, [transactions, selectedTxn]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filterDecision !== 'all' && txn.decision !== filterDecision) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesAgent = txn.agentName.toLowerCase().includes(query);
        const matchesId = txn.id.toLowerCase().includes(query);
        const matchesProduct = txn.products.some((p) =>
          p.name.toLowerCase().includes(query)
        );
        const matchesReason = txn.reason.toLowerCase().includes(query);
        if (!matchesAgent && !matchesId && !matchesProduct && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filterDecision, searchQuery]);

  const approvedCount = transactions.filter((t) => t.decision === 'approved').length;
  const declinedCount = transactions.filter((t) => t.decision === 'declined').length;
  const escalatedCount = transactions.filter((t) => t.decision === 'escalated').length;
  const totalVolume = transactions
    .filter((t) => t.decision === 'approved')
    .reduce((s, t) => s + t.amount, 0);

  const selectedScenario =
    scenarioDefinitions.find((s) => s.id === scenarioId) || scenarioDefinitions[0];

  // Start animated simulation
  const startSimulation = () => {
    setEvaluating(true);
    setEvalStep(0);
    setEvalCompleted(false);
    setSimulatedTxn(null);

    const totalChecks = selectedScenario.checks.length;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      setEvalStep(currentStep);

      if (currentStep >= totalChecks) {
        clearInterval(interval);
        setEvalCompleted(true);
        setEvaluating(false);

        // Build simulated transaction object
        const matchingAgent =
          agents.find((a) => a.name === selectedScenario.agentName) || agents[0];
        const matchingTab = openTabs.find(
          (t) => t.agentName === selectedScenario.agentName && t.status === 'active'
        );

        const now = new Date();
        const nowTimeStr = now.toTimeString().slice(0, 8);

        const stages: TxnStage[] = [
          {
            id: 's1',
            label: 'Agent Request',
            status: 'passed',
            timestamp: nowTimeStr,
            detail: `${selectedScenario.agentName} requested ${selectedScenario.products.map((p) => p.name).join(', ')}`,
          },
          {
            id: 's2',
            label: 'Identity Verification',
            status: selectedScenario.id === 4 ? 'failed' : 'passed',
            timestamp: nowTimeStr,
            detail:
              selectedScenario.id === 4
                ? 'Agent identity not cryptographically verified'
                : `Verified identity — ${matchingAgent?.organization || 'Authorized Provider'}`,
          },
          {
            id: 's3',
            label: 'Catalog Validation',
            status: selectedScenario.id === 4 ? 'skipped' : 'passed',
            timestamp: nowTimeStr,
            detail: 'Products identified in merchant catalog',
          },
          {
            id: 's4',
            label: 'Policy Check',
            status: selectedScenario.expected === 'declined' ? 'failed' : 'passed',
            timestamp: nowTimeStr,
            detail: selectedScenario.reason,
          },
          {
            id: 's5',
            label: 'OpenTab Validation',
            status:
              selectedScenario.expected === 'declined'
                ? 'failed'
                : selectedScenario.expected === 'escalated'
                  ? 'skipped'
                  : 'passed',
            timestamp: nowTimeStr,
            detail: matchingTab
              ? `Authorized on OpenTab (${matchingTab.id})`
              : 'Direct checkout validation',
          },
          {
            id: 's6',
            label: 'Payment Initiated',
            status: selectedScenario.expected === 'approved' ? 'passed' : 'skipped',
            timestamp: selectedScenario.expected === 'approved' ? nowTimeStr : undefined,
            detail:
              selectedScenario.expected === 'approved'
                ? 'Handed to payment gateway'
                : 'Payment on hold pending policy outcome',
          },
          {
            id: 's7',
            label: 'Payment Confirmed',
            status: selectedScenario.expected === 'approved' ? 'passed' : 'skipped',
            timestamp: selectedScenario.expected === 'approved' ? nowTimeStr : undefined,
            detail:
              selectedScenario.expected === 'approved'
                ? 'Gateway confirmed authorization & capture'
                : undefined,
          },
        ];

        const createdTxn: Transaction = {
          id: uid('txn'),
          agentId: matchingAgent?.id || 'agent_001',
          agentName: selectedScenario.agentName,
          trustLevel:
            selectedScenario.id === 4
              ? 'unknown'
              : matchingAgent?.trustLevel || 'verified',
          products: selectedScenario.products,
          amount: selectedScenario.amount,
          openTabId: matchingTab?.id,
          decision: selectedScenario.expected,
          reason: selectedScenario.reason,
          paymentStatus:
            selectedScenario.expected === 'approved'
              ? 'confirmed'
              : selectedScenario.expected === 'escalated'
                ? 'awaiting_approval'
                : 'failed',
          stages,
          timestamp: now.toISOString(),
        };

        setSimulatedTxn(createdTxn);
      }
    }, 450);
  };

  const handleRecordInLedger = () => {
    if (!simulatedTxn) return;
    addTransaction(simulatedTxn);
    pushToast({
      type:
        simulatedTxn.decision === 'approved'
          ? 'success'
          : simulatedTxn.decision === 'escalated'
            ? 'warning'
            : 'error',
      title:
        simulatedTxn.decision === 'approved'
          ? 'Transaction Recorded & Confirmed'
          : simulatedTxn.decision === 'escalated'
            ? 'Transaction Recorded (Awaiting Merchant Approval)'
            : 'Transaction Recorded (Declined)',
      message: simulatedTxn.reason,
    });
    setDemoOpen(false);
    setSelectedTxn(simulatedTxn);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Agent Transactions"
        subtitle="Complete lifecycle verification of every autonomous AI agent transaction with stage-by-stage audit trails."
        action={
          <Button onClick={() => { setDemoOpen(true); setEvalCompleted(false); setSimulatedTxn(null); }}>
            <Play className="w-4 h-4 mr-1.5" /> Run Simulation
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Settled Volume',
            value: formatINR(totalVolume),
            icon: Receipt,
            tone: 'text-electric-300',
            bg: 'bg-electric-500/10',
            border: 'border-electric-500/20',
          },
          {
            label: 'Approved Transactions',
            value: approvedCount,
            icon: CheckCircle2,
            tone: 'text-success-400',
            bg: 'bg-success-500/10',
            border: 'border-success-500/20',
          },
          {
            label: 'Human Review Required',
            value: escalatedCount,
            icon: ShieldAlert,
            tone: 'text-warning-400',
            bg: 'bg-warning-500/10',
            border: 'border-warning-500/20',
          },
          {
            label: 'Policy Blocked / Declined',
            value: declinedCount,
            icon: XCircle,
            tone: 'text-danger-400',
            bg: 'bg-danger-500/10',
            border: 'border-danger-500/20',
          },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={i * 0.04}>
              <Card className={cn('p-4 border', m.border)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                    {m.label}
                  </span>
                  <div className={cn('p-1.5 rounded-lg', m.bg)}>
                    <Icon className={cn('w-4 h-4', m.tone)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{m.value}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agent, product, or ID..."
              className="w-full bg-ink-800/60 border border-ink-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Transactions', count: transactions.length },
              { id: 'approved', label: 'Approved', count: approvedCount },
              { id: 'escalated', label: 'Escalated', count: escalatedCount },
              { id: 'declined', label: 'Declined', count: declinedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterDecision(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                  filterDecision === tab.id
                    ? 'bg-electric-500/20 text-electric-300 border border-electric-500/40'
                    : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/40'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-2xs font-mono',
                    filterDecision === tab.id
                      ? 'bg-electric-500/30 text-white'
                      : 'bg-ink-800 text-ink-500'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((txn, i) => (
          <Reveal key={txn.id} delay={Math.min(i * 0.03, 0.3)}>
            <Card hover className="p-4 cursor-pointer">
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-4"
                onClick={() => setSelectedTxn(txn)}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-700/50 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-electric-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white truncate">{txn.agentName}</p>
                      <TrustBadge level={txn.trustLevel} />
                      <DecisionBadge decision={txn.decision} />
                    </div>
                    <p className="text-xs text-ink-400 truncate">
                      {txn.products.map((p) => p.name).join(', ')} ·{' '}
                      <span className="font-mono text-ink-500 text-2xs">{txn.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-ink-800">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-white">{formatINR(txn.amount)}</p>
                    <p className="text-2xs text-ink-500 capitalize font-mono">
                      {txn.paymentStatus.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-500 group-hover:text-ink-300 transition-colors" />
                </div>
              </div>
            </Card>
          </Reveal>
        ))}

        {filteredTransactions.length === 0 && (
          <Card className="p-10 text-center">
            <Receipt className="w-10 h-10 text-ink-600 mx-auto mb-3" />
            <p className="text-base font-medium text-white mb-1">No transactions found</p>
            <p className="text-sm text-ink-400 max-w-md mx-auto mb-4">
              {searchQuery || filterDecision !== 'all'
                ? 'No transactions match your search filter criteria.'
                : 'Run a simulation to generate AI agent transaction lifecycles.'}
            </p>
            {searchQuery || filterDecision !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDecision('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setDemoOpen(true)}>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Run Simulation
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Transaction Detail Drawer */}
      <Drawer
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Lifecycle & Verification"
        subtitle={selectedTxn ? `Reference ID: ${selectedTxn.id}` : undefined}
        size="lg"
      >
        {selectedTxn && (
          <TransactionDetailContent
            txn={selectedTxn}
            onUpdated={(updated) => setSelectedTxn(updated)}
          />
        )}
      </Drawer>

      {/* Simulation Modal */}
      <Modal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Simulate Agent Purchase"
        subtitle="Evaluate automated policy checks against live merchant guardrails in real time."
        size="lg"
      >
        <div className="p-6 space-y-5">
          {/* Scenario Selector */}
          <div>
            <label className="text-xs font-semibold text-ink-300 uppercase tracking-wider block mb-2.5">
              Choose Test Scenario
            </label>
            <div className="space-y-2.5">
              {scenarioDefinitions.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setScenarioId(sc.id);
                    setEvalCompleted(false);
                    setSimulatedTxn(null);
                  }}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border transition-all',
                    scenarioId === sc.id
                      ? 'bg-electric-500/10 border-electric-500/50 shadow-sm shadow-electric-500/10'
                      : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                        scenarioId === sc.id
                          ? 'bg-electric-500 text-white'
                          : 'bg-ink-800 border border-ink-700/50 text-ink-300'
                      )}
                    >
                      {sc.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{sc.title}</p>
                        <Badge tone={sc.tone}>{sc.expectedLabel}</Badge>
                      </div>
                      <p className="text-xs text-ink-400 mt-1">{sc.desc}</p>
                      <div className="flex items-center gap-3 mt-2 text-2xs text-ink-500">
                        <span>Agent: <strong className="text-ink-300">{sc.agentName}</strong></span>
                        <span>•</span>
                        <span>Amount: <strong className="text-ink-300">{formatINR(sc.amount)}</strong></span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action or Progress */}
          {!evaluating && !evalCompleted && (
            <Button
              className="w-full mt-2"
              onClick={startSimulation}
            >
              <Play className="w-4 h-4 mr-2" /> Start Live Policy Evaluation
            </Button>
          )}

          {/* Live Evaluation Animated Stepper */}
          {(evaluating || evalCompleted) && (
            <div className="space-y-4 pt-2 border-t border-ink-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-300 uppercase tracking-wider">
                  Automated Policy Evaluation
                </span>
                {evaluating ? (
                  <span className="text-xs text-electric-400 flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating check {evalStep}/{selectedScenario.checks.length}...
                  </span>
                ) : (
                  <Badge tone={selectedScenario.tone}>
                    Evaluation Complete
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {selectedScenario.checks.map((check, idx) => {
                  const isFinished = evalStep > idx;
                  const isCurrent = evalStep === idx && evaluating;

                  return (
                    <motion.div
                      key={check.name}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border text-xs transition-colors',
                        isFinished
                          ? check.passed
                            ? 'bg-success-500/10 border-success-500/30'
                            : 'bg-danger-500/10 border-danger-500/30'
                          : isCurrent
                            ? 'bg-electric-500/10 border-electric-500/40'
                            : 'bg-ink-800/30 border-ink-700/30 text-ink-500'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {isFinished ? (
                          check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-success-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-danger-400 shrink-0" />
                          )
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-electric-400 animate-spin shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-ink-600 shrink-0" />
                        )}
                        <div>
                          <p className={cn('font-medium', isFinished ? 'text-white' : 'text-ink-300')}>
                            {check.name}
                          </p>
                          {isFinished && (
                            <p className="text-2xs text-ink-400 mt-0.5">{check.detail}</p>
                          )}
                        </div>
                      </div>

                      {isFinished && (
                        <span
                          className={cn(
                            'text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded',
                            check.passed ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'
                          )}
                        >
                          {check.passed ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {evalCompleted && simulatedTxn && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div
                    className={cn(
                      'p-4 rounded-xl border',
                      simulatedTxn.decision === 'approved'
                        ? 'bg-success-500/10 border-success-500/30'
                        : simulatedTxn.decision === 'escalated'
                          ? 'bg-warning-500/10 border-warning-500/30'
                          : 'bg-danger-500/10 border-danger-500/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Result: {simulatedTxn.decision.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-white font-semibold">
                        {formatINR(simulatedTxn.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-300">{simulatedTxn.reason}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={startSimulation}
                    >
                      Re-run Check
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleRecordInLedger}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" /> Record in Ledger & Inspect
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function TransactionDetailContent({
  txn,
  onUpdated,
}: {
  txn: Transaction;
  onUpdated?: (txn: Transaction) => void;
}) {
  const { approveEscalatedTransaction, declineEscalatedTransaction } = useApp();
  const [stageIdx, setStageIdx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    setStageIdx(0);
    setAnimating(true);
  }, [txn.id]);

  useEffect(() => {
    if (!animating) return;
    if (stageIdx >= (txn.stages?.length || 0)) {
      setAnimating(false);
      return;
    }
    const timer = setTimeout(() => setStageIdx((i) => i + 1), 250);
    return () => clearTimeout(timer);
  }, [stageIdx, animating, txn.stages]);

  const handleApprove = async () => {
    setIsActing(true);
    try {
      await approveEscalatedTransaction(txn.id);
      const updated: Transaction = {
        ...txn,
        decision: 'approved',
        paymentStatus: 'confirmed',
        reason: 'Manually approved and authorized by store owner.',
        stages: (txn.stages || []).map((s) =>
          s.id === 's6' || s.id === 's7'
            ? {
                ...s,
                status: 'passed',
                timestamp: new Date().toTimeString().slice(0, 8),
                detail: s.id === 's6' ? 'Approved & payment initiated' : 'Payment confirmed',
              }
            : s
        ),
      };
      onUpdated?.(updated);
    } finally {
      setIsActing(false);
    }
  };

  const handleDecline = async () => {
    setIsActing(true);
    try {
      await declineEscalatedTransaction(txn.id);
      const updated: Transaction = {
        ...txn,
        decision: 'declined',
        paymentStatus: 'failed',
        reason: 'Declined by merchant store owner during review.',
      };
      onUpdated?.(updated);
    } finally {
      setIsActing(false);
    }
  };

  const stageIcons = [
    Bot,
    ShieldCheck,
    Package,
    Scale,
    Wallet,
    CreditCard,
    CheckCircle2,
  ];

  return (
    <div className="space-y-6">
      {/* Decision Status Banner */}
      <div
        className={cn(
          'p-4 rounded-xl border',
          txn.decision === 'approved'
            ? 'bg-success-500/10 border-success-500/30'
            : txn.decision === 'declined'
              ? 'bg-danger-500/10 border-danger-500/30'
              : 'bg-warning-500/10 border-warning-500/30'
        )}
      >
        <div className="flex items-start gap-3">
          {txn.decision === 'approved' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-success-400 mt-0.5" />
          ) : txn.decision === 'declined' ? (
            <XCircle className="w-5 h-5 shrink-0 text-danger-400 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 text-warning-400 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {txn.decision === 'approved'
                  ? 'Transaction Approved'
                  : txn.decision === 'declined'
                    ? 'Transaction Declined'
                    : 'Escalated For Review'}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatINR(txn.amount)}
              </span>
            </div>
            <p className="text-xs text-ink-300 mt-1 leading-relaxed">{txn.reason}</p>
          </div>
        </div>
      </div>

      {/* Escalation Action Bar */}
      {txn.decision === 'escalated' && txn.paymentStatus === 'awaiting_approval' && (
        <div className="p-4 rounded-xl bg-ink-800/80 border border-warning-500/40 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-warning-400" />
            <span className="text-xs font-semibold text-warning-300">Merchant Action Required</span>
          </div>
          <p className="text-xs text-ink-300">
            This order exceeds your automated approval limit. Authorizing will deduct from OpenTab and capture payment.
          </p>
          <div className="flex gap-2.5">
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={isActing}
            >
              {isActing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Authorize & Settle
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              onClick={handleDecline}
              disabled={isActing}
            >
              {isActing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1.5" /> Decline Request
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Agent & Order Info */}
      <div className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-electric-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{txn.agentName}</p>
              <p className="text-2xs text-ink-500 font-mono">Agent ID: {txn.agentId}</p>
            </div>
          </div>
          <TrustBadge level={txn.trustLevel} />
        </div>

        <div className="pt-3 border-t border-ink-700/40 space-y-2">
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
            Items in Request
          </p>
          <div className="space-y-1.5">
            {txn.products.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-ink-200">{p.name}</span>
                <span className="text-white font-mono font-medium">{formatINR(p.price)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-ink-700/30 flex justify-between items-center text-xs font-semibold">
            <span className="text-ink-300">Total Charged</span>
            <span className="text-electric-300 font-mono text-sm">{formatINR(txn.amount)}</span>
          </div>
        </div>
      </div>

      {/* 7-Stage Verification Stepper */}
      <div>
        <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">
          7-Stage Verification Lifecycle
        </h4>
        <div className="space-y-2">
          {(txn.stages || []).map((stage, i) => {
            const Icon = stageIcons[i] ?? Clock;
            const shown = i < stageIdx;
            const isRunning = i === stageIdx && animating;
            const status = isRunning ? 'running' : shown ? stage.status : 'pending';

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -6 }}
                animate={i <= stageIdx ? { opacity: 1, x: 0 } : { opacity: 0.4 }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border text-xs',
                  status === 'passed'
                    ? 'bg-success-500/10 border-success-500/30'
                    : status === 'failed'
                      ? 'bg-danger-500/10 border-danger-500/30'
                      : status === 'running'
                        ? 'bg-electric-500/10 border-electric-500/40'
                        : 'bg-ink-800/30 border-ink-700/30 text-ink-500'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-ink-900/80 flex items-center justify-center shrink-0 mt-0.5">
                  {status === 'running' ? (
                    <Loader2 className="w-3.5 h-3.5 text-electric-400 animate-spin" />
                  ) : (
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5',
                        status === 'passed'
                          ? 'text-success-400'
                          : status === 'failed'
                            ? 'text-danger-400'
                            : 'text-ink-500'
                      )}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{stage.label}</p>
                    {stage.timestamp && (
                      <span className="text-2xs text-ink-500 font-mono">{stage.timestamp}</span>
                    )}
                  </div>
                  {stage.detail && (
                    <p className="text-2xs text-ink-400 mt-0.5 leading-relaxed">{stage.detail}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Metadata Table */}
      <div className="p-3.5 rounded-xl bg-ink-850 border border-ink-700/50 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-400">Transaction ID</span>
          <span className="font-mono text-ink-200">{txn.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">OpenTab ID</span>
          <span className="font-mono text-ink-200">{txn.openTabId || 'None (Direct)'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">Settlement Status</span>
          <span className="capitalize text-white font-mono">{txn.paymentStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">Timestamp</span>
          <span className="font-mono text-ink-200">
            {new Date(txn.timestamp).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
