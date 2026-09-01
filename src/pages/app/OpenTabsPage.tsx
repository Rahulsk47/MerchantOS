import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Pause,
  RotateCcw,
  Eye,
  Clock,
  Wallet,
  Tag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Bot,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { demoAgents } from '@/lib/mockData';
import { formatINR, cn } from '@/lib/utils';
import type { OpenTab, AgentIdentity } from '@/lib/types';

const createSteps = ['Agent', 'Scope', 'Cap', 'Auto-Approve', 'Expiry', 'Policies', 'Review'];

export default function OpenTabsPage() {
  const { openTabs, agents, products, createOpenTab, pauseOpenTab, revokeOpenTab, pushToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(0);
  const [agentSearch, setAgentSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<'all' | 'verified' | 'known'>('all');

  // Ensure there are always available agents to select from
  const availableAgents: AgentIdentity[] = useMemo(() => {
    if (agents && agents.length > 0) {
      const existingIds = new Set(agents.map((a) => a.id));
      const supplementary = demoAgents.filter((d) => !existingIds.has(d.id));
      return [...agents, ...supplementary];
    }
    return demoAgents;
  }, [agents]);

  // Dynamic categories from catalog products + defaults
  const availableCategories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const defaults = ['Electronics', 'Accessories', 'Audio & Wearables', 'Smart Home', 'Office & Productivity'];
    const merged = Array.from(new Set([...fromProducts, ...defaults]));
    return merged;
  }, [products]);

  const [form, setForm] = useState({
    agentId: '',
    scope: ['Electronics', 'Accessories'] as string[],
    cap: 10000,
    autoApprove: 5000,
    expiry: '6 hours',
    policies: ['rate-limit', 'duplicate-prevention'],
  });

  const [activated, setActivated] = useState(false);

  // Auto-select first verified agent when opening create modal if none selected
  useEffect(() => {
    if (showCreate && !form.agentId && availableAgents.length > 0) {
      const firstVerified = availableAgents.find((a) => a.trustLevel === 'verified') || availableAgents[0];
      if (firstVerified) {
        setForm((f) => ({ ...f, agentId: firstVerified.id }));
      }
    }
  }, [showCreate, availableAgents, form.agentId]);

  const filteredAgents = useMemo(() => {
    return availableAgents.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.organization.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.provider.toLowerCase().includes(agentSearch.toLowerCase());

      if (!matchesSearch) return false;
      if (agentFilter === 'verified') return a.trustLevel === 'verified';
      if (agentFilter === 'known') return a.trustLevel === 'known' || a.trustLevel === 'verified';
      return true;
    });
  }, [availableAgents, agentSearch, agentFilter]);

  const selectedAgent = useMemo(() => {
    return availableAgents.find((a) => a.id === form.agentId);
  }, [availableAgents, form.agentId]);

  const handleCreate = async () => {
    const agent = selectedAgent;
    if (!agent) {
      pushToast({ type: 'warning', title: 'Agent required', message: 'Please select an agent to create an OpenTab.' });
      return;
    }
    try {
      await createOpenTab({
        agentId: agent.id,
        agentName: agent.name,
        trustLevel: agent.trustLevel,
        scope: form.scope.length > 0 ? form.scope : availableCategories.slice(0, 2),
        cap: form.cap,
        autoApproveCeiling: form.autoApprove,
        expiresAt: form.expiry,
      });
      setActivated(true);
      pushToast({
        type: 'success',
        title: 'OpenTab activated',
        message: `Transaction authority granted to ${agent.name}.`,
      });
      setTimeout(() => {
        setShowCreate(false);
        setActivated(false);
        setStep(0);
        setForm({
          agentId: '',
          scope: ['Electronics', 'Accessories'],
          cap: 10000,
          autoApprove: 5000,
          expiry: '6 hours',
          policies: ['rate-limit', 'duplicate-prevention'],
        });
      }, 2000);
    } catch {
      pushToast({ type: 'error', title: 'Failed to create OpenTab', message: 'Please try again.' });
    }
  };

  const toggleScope = (cat: string) => {
    setForm((f) => ({
      ...f,
      scope: f.scope.includes(cat) ? f.scope.filter((s) => s !== cat) : [...f.scope, cat],
    }));
  };

  const selectAllScope = () => {
    setForm((f) => ({ ...f, scope: [...availableCategories] }));
  };

  const next = () => {
    if (step === 0) {
      if (!form.agentId) {
        if (availableAgents.length > 0) {
          setForm((f) => ({ ...f, agentId: availableAgents[0].id }));
          setStep(1);
          return;
        }
        pushToast({ type: 'warning', title: 'Select an agent first' });
        return;
      }
    }
    if (step === 1 && form.scope.length === 0) {
      pushToast({ type: 'warning', title: 'Select at least one category', message: 'The agent needs authorized product categories.' });
      return;
    }
    if (step === createSteps.length - 1) {
      handleCreate();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="OpenTabs"
        subtitle="Manage AI agent transaction authority. Each OpenTab is scoped, capped, temporary, and revocable."
        action={
          <Button
            onClick={() => {
              if (availableAgents.length > 0 && !form.agentId) {
                setForm((f) => ({ ...f, agentId: availableAgents[0].id }));
              }
              setShowCreate(true);
            }}
          >
            <Plus className="w-4 h-4" /> Create OpenTab
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {openTabs.map((tab, i) => (
          <Reveal key={tab.id} delay={i * 0.05}>
            <OpenTabCard tab={tab} onPause={() => pauseOpenTab(tab.id)} onRevoke={() => revokeOpenTab(tab.id)} />
          </Reveal>
        ))}
        {openTabs.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <CreditCard className="w-10 h-10 text-ink-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No active OpenTabs</h3>
            <p className="text-sm text-ink-400 max-w-md mx-auto mb-4">
              OpenTabs give autonomous AI agents pre-authorized, scoped, and capped spending authority so they can complete purchases seamlessly.
            </p>
            <Button
              onClick={() => {
                if (availableAgents.length > 0) {
                  setForm((f) => ({ ...f, agentId: availableAgents[0].id }));
                }
                setShowCreate(true);
              }}
            >
              <Plus className="w-4 h-4" /> Issue First OpenTab
            </Button>
          </Card>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => !activated && setShowCreate(false)}
        title="Create OpenTab"
        subtitle="Give an AI agent scoped, capped, temporary transaction authority"
        size="lg"
      >
        {activated ? (
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-success-500 to-accent-500 flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white">OpenTab is active</h3>
            <p className="text-sm text-ink-300 mt-2 max-w-sm mx-auto mb-6">
              Authority granted to <span className="font-semibold text-white">{selectedAgent?.name || 'Selected Agent'}</span>.
              The agent can now request transactions within these safety boundaries.
            </p>
            <Button
              onClick={() => {
                setShowCreate(false);
                setActivated(false);
                setStep(0);
                setForm({
                  agentId: '',
                  scope: ['Electronics', 'Accessories'],
                  cap: 10000,
                  autoApprove: 5000,
                  expiry: '6 hours',
                  policies: ['rate-limit', 'duplicate-prevention'],
                });
              }}
              className="mx-auto"
            >
              Done &bull; View Active OpenTabs
            </Button>
          </div>
        ) : (
          <div className="p-5">
            {/* Step Indicators */}
            <div className="flex items-center gap-1 mb-6">
              {createSteps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-2xs font-semibold transition-colors',
                      i <= step ? 'bg-electric-500 text-white' : 'bg-ink-800 text-ink-500'
                    )}
                  >
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </button>
                  {i < createSteps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-1 transition-colors',
                        i < step ? 'bg-electric-500' : 'bg-ink-700'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* STEP 0: AGENT SELECTION */}
                {step === 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Select Agent Identity</h3>
                        <p className="text-xs text-ink-400 mt-0.5">
                          Choose the AI shopping or procurement agent to grant transaction authority.
                        </p>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex items-center gap-1 bg-ink-900/60 p-1 rounded-lg border border-ink-800 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setAgentFilter('all')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                            agentFilter === 'all'
                              ? 'bg-electric-500/20 text-electric-300 border border-electric-500/30'
                              : 'text-ink-400 hover:text-white'
                          )}
                        >
                          All ({availableAgents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgentFilter('verified')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                            agentFilter === 'verified'
                              ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                              : 'text-ink-400 hover:text-white'
                          )}
                        >
                          Verified
                        </button>
                      </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        type="text"
                        placeholder="Search agent by name, provider, or organization..."
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        className="w-full bg-ink-900/80 border border-ink-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-ink-500 focus:outline-none focus:border-electric-500 transition-colors"
                      />
                    </div>

                    {/* Agent Cards List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredAgents.map((a) => {
                        const isSelected = form.agentId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setForm({ ...form, agentId: a.id })}
                            className={cn(
                              'w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between',
                              isSelected
                                ? 'bg-electric-500/15 border-electric-500 ring-1 ring-electric-500/50 shadow-sm'
                                : 'bg-ink-800/40 border-ink-700/60 hover:bg-ink-800/80 hover:border-ink-600'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm',
                                  a.avatarColor || 'from-electric-500 to-accent-500'
                                )}
                              >
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                                  {isSelected && (
                                    <span className="text-2xs font-bold text-electric-400 bg-electric-500/20 px-1.5 py-0.5 rounded">
                                      SELECTED
                                    </span>
                                  )}
                                </div>
                                <p className="text-2xs text-ink-400 truncate">
                                  {a.organization} &bull; <span className="font-mono text-ink-500">{a.provider}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <TrustBadge level={a.trustLevel} />
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
                                  isSelected
                                    ? 'bg-electric-500 border-electric-500 text-white'
                                    : 'border-ink-600 bg-ink-900/50'
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {filteredAgents.length === 0 && (
                        <div className="p-6 text-center border border-dashed border-ink-700 rounded-xl">
                          <Bot className="w-8 h-8 text-ink-500 mx-auto mb-2" />
                          <p className="text-xs text-ink-300 font-medium">No agents found matching your filter</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => {
                              setAgentSearch('');
                              setAgentFilter('all');
                            }}
                          >
                            Reset filters
                          </Button>
                        </div>
                      )}
                    </div>

                    {selectedAgent && (
                      <div className="mt-4 p-3 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-electric-300">
                          <Sparkles className="w-4 h-4 text-electric-400" />
                          <span>Ready to authorize: <strong>{selectedAgent.name}</strong></span>
                        </div>
                        <span className="text-2xs text-ink-400">Click Continue below &rarr;</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 1: SCOPE */}
                {step === 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Allowed Product Categories</h3>
                        <p className="text-xs text-ink-400">Select which categories the agent can transact in.</p>
                      </div>
                      <button
                        type="button"
                        onClick={selectAllScope}
                        className="text-xs text-electric-400 hover:text-electric-300 font-medium transition-colors"
                      >
                        Select All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {availableCategories.map((cat) => {
                        const isIncluded = form.scope.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleScope(cat)}
                            className={cn(
                              'text-left p-3.5 rounded-xl border transition-all flex items-center justify-between',
                              isIncluded
                                ? 'bg-electric-500/15 border-electric-500 text-white'
                                : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600 text-ink-300'
                            )}
                          >
                            <span className="text-xs font-medium">{cat}</span>
                            <div
                              className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center',
                                isIncluded ? 'bg-electric-500 border-electric-500 text-white' : 'border-ink-600'
                              )}
                            >
                              {isIncluded && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {form.scope.length === 0 && (
                      <div className="mt-3 p-2.5 rounded-lg bg-warning-500/10 border border-warning-500/30 flex items-center gap-2 text-xs text-warning-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Please select at least one product category for this OpenTab.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: SPENDING CAP */}
                {step === 2 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Spending / Authorization Cap</h3>
                    <p className="text-xs text-ink-400 mb-4">
                      The maximum total amount the agent can authorize across all transactions.
                    </p>
                    <div className="text-center py-6 bg-ink-900/40 border border-ink-800 rounded-2xl">
                      <p className="text-4xl font-bold text-electric-300">{formatINR(form.cap)}</p>
                      <p className="text-xs text-ink-500 mt-1">Maximum lifetime limit for this session</p>
                      <input
                        type="range"
                        min={1000}
                        max={50000}
                        step={1000}
                        value={form.cap}
                        onChange={(e) => setForm({ ...form, cap: Number(e.target.value) })}
                        className="w-full max-w-sm mx-auto mt-6 h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500"
                      />
                      <div className="flex justify-between text-2xs text-ink-500 max-w-sm mx-auto mt-1 px-1">
                        <span>₹1,000</span>
                        <span>₹25,000</span>
                        <span>₹50,000</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUTO-APPROVE CEILING */}
                {step === 3 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Auto-Approval Ceiling</h3>
                    <p className="text-xs text-ink-400 mb-4">
                      Transactions under this amount are auto-approved without human intervention.
                    </p>
                    <div className="text-center py-6 bg-ink-900/40 border border-ink-800 rounded-2xl">
                      <p className="text-4xl font-bold text-accent-400">{formatINR(form.autoApprove)}</p>
                      <p className="text-xs text-ink-500 mt-1">Orders exceeding this will require manual confirmation</p>
                      <input
                        type="range"
                        min={0}
                        max={Math.min(form.cap, 25000)}
                        step={500}
                        value={form.autoApprove}
                        onChange={(e) => setForm({ ...form, autoApprove: Number(e.target.value) })}
                        className="w-full max-w-sm mx-auto mt-6 h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-accent-500"
                      />
                      <div className="flex justify-between text-2xs text-ink-500 max-w-sm mx-auto mt-1 px-1">
                        <span>₹0 (Manual all)</span>
                        <span>{formatINR(Math.min(form.cap, 25000))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: EXPIRY TIME */}
                {step === 4 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Session Expiry Time</h3>
                    <p className="text-xs text-ink-400 mb-4">
                      When this authorization expires. Autonomous agent authority should always be time-bound.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {['1 hour', '6 hours', '24 hours', '7 days'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, expiry: t })}
                          className={cn(
                            'p-4 rounded-xl border text-left transition-all flex items-center justify-between',
                            form.expiry === t
                              ? 'bg-electric-500/15 border-electric-500 text-white'
                              : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600 text-ink-300'
                          )}
                        >
                          <div>
                            <span className="text-sm font-semibold block text-white">{t}</span>
                            <span className="text-2xs text-ink-500">
                              {t === '1 hour' ? 'Flash shopping' : t === '6 hours' ? 'Standard session' : 'Extended authority'}
                            </span>
                          </div>
                          {form.expiry === t && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: POLICIES */}
                {step === 5 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Additional Guardrails</h3>
                    <p className="text-xs text-ink-400 mb-4">Extra safeguards applied to this OpenTab session.</p>
                    <div className="space-y-2">
                      {[
                        { id: 'rate-limit', label: 'Rate Limiting', desc: 'Max 10 transaction requests per minute' },
                        { id: 'duplicate-prevention', label: 'Duplicate Prevention', desc: 'Block identical cart requests within 30 seconds' },
                        { id: 'inventory-reservation', label: 'Inventory Reservation Limit', desc: 'Max 5 items reserved at once' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              policies: f.policies.includes(p.id)
                                ? f.policies.filter((x) => x !== p.id)
                                : [...f.policies, p.id],
                            }))
                          }
                          className={cn(
                            'w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between',
                            form.policies.includes(p.id)
                              ? 'bg-electric-500/15 border-electric-500/40'
                              : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600'
                          )}
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{p.label}</p>
                            <p className="text-2xs text-ink-400 mt-0.5">{p.desc}</p>
                          </div>
                          {form.policies.includes(p.id) && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 6: REVIEW */}
                {step === 6 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Review & Authorize OpenTab</h3>
                    <div className="surface-flat p-4 rounded-xl border border-ink-700/60 space-y-3">
                      <ReviewRow icon={Bot} label="Target Agent" value={selectedAgent?.name ?? 'Selected Agent'} />
                      <ReviewRow icon={Tag} label="Scope" value={form.scope.join(', ') || 'All categories'} />
                      <ReviewRow icon={Wallet} label="Cap" value={formatINR(form.cap)} tone="text-electric-300" />
                      <ReviewRow icon={CheckCircle2} label="Auto-approve" value={formatINR(form.autoApprove)} tone="text-accent-400" />
                      <ReviewRow icon={Clock} label="Expires" value={form.expiry} tone="text-warning-400" />
                      <ReviewRow icon={ShieldCheck} label="Active Guardrails" value={`${form.policies.length} enabled`} />
                    </div>
                    <p className="text-2xs text-ink-500 mt-3">
                      OpenTabs establish transaction boundaries. Real fund settlements occur safely via your integrated payment provider.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-800">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={next}>
                {step === createSteps.length - 1 ? (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Activate OpenTab
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function OpenTabCard({ tab, onPause, onRevoke }: { tab: OpenTab; onPause: () => void; onRevoke: () => void }) {
  const pct = tab.cap > 0 ? (tab.remaining / tab.cap) * 100 : 0;
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-electric-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{tab.agentName}</h3>
            <TrustBadge level={tab.trustLevel} />
          </div>
        </div>
        {tab.status === 'active' && <Badge tone="success">Active</Badge>}
        {tab.status === 'paused' && <Badge tone="warning">Paused</Badge>}
        {tab.status === 'revoked' && <Badge tone="danger">Revoked</Badge>}
        {tab.status === 'expired' && <Badge tone="muted">Expired</Badge>}
      </div>

      <div className="space-y-2.5 mb-4">
        <Row icon={Tag} label="Scope" value={tab.scope.join(', ')} />
        <Row icon={Wallet} label="Remaining" value={`${formatINR(tab.remaining)} of ${formatINR(tab.cap)}`} tone="text-electric-300" />
        <Row icon={CheckCircle2} label="Auto-approve" value={`Under ${formatINR(tab.autoApproveCeiling)}`} />
        <Row icon={Clock} label="Expires" value={tab.expiresAt} tone="text-warning-400" />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-2xs text-ink-500 mb-1.5">
          <span>Authorization used</span>
          <span>{Math.round(100 - pct)}%</span>
        </div>
        <Progress value={100 - pct} tone={pct > 50 ? 'success' : pct > 20 ? 'warning' : 'danger'} />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="w-3.5 h-3.5" /> Details
        </Button>
        {tab.status === 'active' && (
          <>
            <Button size="sm" variant="ghost" onClick={onPause} title="Pause OpenTab">
              <Pause className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-danger-400" onClick={onRevoke} title="Revoke OpenTab">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  tone = 'text-ink-200',
}: {
  icon: typeof Tag;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <span className={`text-xs font-medium ${tone}`}>{value}</span>
    </div>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  tone = 'text-ink-200',
}: {
  icon: typeof Tag;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <span className={`text-xs font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
