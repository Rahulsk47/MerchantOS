import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Pause, RotateCcw, Eye, Clock, Wallet, Tag, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR, cn } from '@/lib/utils';
import type { OpenTab } from '@/lib/types';

const createSteps = ['Agent', 'Scope', 'Cap', 'Auto-Approve', 'Expiry', 'Policies', 'Review'];

export default function OpenTabsPage() {
  const { openTabs, agents, createOpenTab, pauseOpenTab, revokeOpenTab, pushToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    agentId: '',
    scope: [] as string[],
    cap: 10000,
    autoApprove: 5000,
    expiry: '6 hours',
    policies: ['rate-limit', 'duplicate-prevention'],
  });
  const [activated, setActivated] = useState(false);

  const handleCreate = async () => {
    const agent = agents.find((a) => a.id === form.agentId);
    if (!agent) return;
    try {
      await createOpenTab({
        agentId: agent.id,
        agentName: agent.name,
        trustLevel: agent.trustLevel,
        scope: form.scope,
        cap: form.cap,
        autoApproveCeiling: form.autoApprove,
        expiresAt: form.expiry,
      });
      setActivated(true);
      setTimeout(() => {
        setShowCreate(false);
        setActivated(false);
        setStep(0);
        setForm({ agentId: '', scope: [], cap: 10000, autoApprove: 5000, expiry: '6 hours', policies: ['rate-limit', 'duplicate-prevention'] });
      }, 2500);
    } catch {
      pushToast({ type: 'error', title: 'Failed to create OpenTab', message: 'Please try again.' });
    }
  };

  const toggleScope = (cat: string) => setForm((f) => ({ ...f, scope: f.scope.includes(cat) ? f.scope.filter((s) => s !== cat) : [...f.scope, cat] }));

  const categories = ['Electronics', 'Accessories'];
  const next = () => {
    if (step === 0 && !form.agentId) { pushToast({ type: 'warning', title: 'Select an agent first' }); return; }
    if (step === 1 && form.scope.length === 0) { pushToast({ type: 'warning', title: 'Select at least one category' }); return; }
    if (step === createSteps.length - 1) { handleCreate(); return; }
    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="OpenTabs"
        subtitle="Manage AI agent transaction authority. Each OpenTab is scoped, capped, temporary, and revocable."
        action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create OpenTab</Button>}
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
            <p className="text-sm text-ink-400">No active OpenTabs. Create one to give an AI agent transaction authority.</p>
          </Card>
        )}
      </div>

      <Modal open={showCreate} onClose={() => !activated && setShowCreate(false)} title="Create OpenTab" subtitle="Give an AI agent scoped, capped, temporary transaction authority" size="lg">
        {activated ? (
          <div className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-success-500 to-accent-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-white">OpenTab is active</h3>
            <p className="text-sm text-ink-300 mt-2 max-w-sm mx-auto">The agent can now request transactions within these boundaries. Actual payment is handled separately by your integrated payment provider.</p>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-center gap-1 mb-6">
              {createSteps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-2xs font-semibold transition-colors', i <= step ? 'bg-electric-500 text-white' : 'bg-ink-800 text-ink-500')}>
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < createSteps.length - 1 && <div className={cn('h-0.5 flex-1 mx-1 transition-colors', i < step ? 'bg-electric-500' : 'bg-ink-700')} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {step === 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Select or verify Agent Identity</h3>
                    <div className="space-y-2">
                      {agents.filter((a) => a.trustLevel !== 'unknown').map((a) => (
                        <button key={a.id} onClick={() => setForm({ ...form, agentId: a.id })}
                          className={cn('w-full text-left p-4 rounded-xl border transition-all', form.agentId === a.id ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600')}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br', a.avatarColor, 'flex items-center justify-center')}>
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{a.name}</p>
                                <p className="text-2xs text-ink-500">{a.organization}</p>
                              </div>
                            </div>
                            <TrustBadge level={a.trustLevel} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Allowed Scope</h3>
                    <p className="text-xs text-ink-400 mb-4">Select which product categories the agent can transact in.</p>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <button key={cat} onClick={() => toggleScope(cat)}
                          className={cn('w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between', form.scope.includes(cat) ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600')}>
                          <span className="text-sm text-white">{cat}</span>
                          {form.scope.includes(cat) && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Spending / Authorization Cap</h3>
                    <p className="text-xs text-ink-400 mb-4">The maximum total amount the agent can authorize across all transactions.</p>
                    <div className="text-center py-6">
                      <p className="text-4xl font-bold text-electric-300">{formatINR(form.cap)}</p>
                      <input type="range" min={1000} max={50000} step={1000} value={form.cap} onChange={(e) => setForm({ ...form, cap: Number(e.target.value) })}
                        className="w-full max-w-sm mx-auto mt-6 h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500" />
                      <div className="flex justify-between text-2xs text-ink-500 max-w-sm mx-auto mt-1">
                        <span>₹1,000</span><span>₹50,000</span>
                      </div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Auto-Approval Ceiling</h3>
                    <p className="text-xs text-ink-400 mb-4">Transactions under this amount are auto-approved if all other checks pass.</p>
                    <div className="text-center py-6">
                      <p className="text-4xl font-bold text-accent-400">{formatINR(form.autoApprove)}</p>
                      <input type="range" min={0} max={Math.min(form.cap, 25000)} step={500} value={form.autoApprove} onChange={(e) => setForm({ ...form, autoApprove: Number(e.target.value) })}
                        className="w-full max-w-sm mx-auto mt-6 h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-accent-500" />
                      <p className="text-xs text-ink-500 mt-4 max-w-sm mx-auto">Transactions above this ceiling but within the cap will be escalated for human approval.</p>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Expiry Time</h3>
                    <p className="text-xs text-ink-400 mb-4">When this OpenTab expires. Temporary authority is a core safety feature.</p>
                    <div className="space-y-2">
                      {['1 hour', '6 hours', '24 hours', '7 days'].map((t) => (
                        <button key={t} onClick={() => setForm({ ...form, expiry: t })}
                          className={cn('w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between', form.expiry === t ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600')}>
                          <span className="text-sm text-white">{t}</span>
                          {form.expiry === t && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 5 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Additional Policies</h3>
                    <p className="text-xs text-ink-400 mb-4">Extra safeguards applied to this OpenTab.</p>
                    <div className="space-y-2">
                      {[
                        { id: 'rate-limit', label: 'Rate limiting', desc: 'Max 10 requests per minute' },
                        { id: 'duplicate-prevention', label: 'Duplicate prevention', desc: 'Block identical requests within 30 seconds' },
                        { id: 'inventory-reservation', label: 'Inventory reservation limit', desc: 'Max 5 items reserved at once' },
                      ].map((p) => (
                        <button key={p.id} onClick={() => setForm((f) => ({ ...f, policies: f.policies.includes(p.id) ? f.policies.filter((x) => x !== p.id) : [...f.policies, p.id] }))}
                          className={cn('w-full text-left p-4 rounded-xl border transition-all', form.policies.includes(p.id) ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600')}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">{p.label}</p>
                              <p className="text-2xs text-ink-500 mt-0.5">{p.desc}</p>
                            </div>
                            {form.policies.includes(p.id) && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 6 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Review and Activate</h3>
                    <div className="surface-flat p-5 space-y-3">
                      {(() => {
                        const agent = agents.find((a) => a.id === form.agentId);
                        return (
                          <>
                            <ReviewRow icon={Sparkles} label="Agent" value={agent?.name ?? '—'} />
                            <ReviewRow icon={Tag} label="Scope" value={form.scope.join(', ')} />
                            <ReviewRow icon={Wallet} label="Cap" value={formatINR(form.cap)} tone="text-electric-300" />
                            <ReviewRow icon={CheckCircle2} label="Auto-approve" value={formatINR(form.autoApprove)} tone="text-accent-400" />
                            <ReviewRow icon={Clock} label="Expires" value={form.expiry} tone="text-warning-400" />
                            <ReviewRow icon={ShieldCheck} label="Policies" value={`${form.policies.length} active`} />
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-ink-500 mt-4">This is an authorization layer. Actual payment is handled separately by your integrated payment provider.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft className="w-4 h-4" /> Back</Button>
              <Button onClick={next}>{step === createSteps.length - 1 ? <><ShieldCheck className="w-4 h-4" /> Activate</> : <>Continue <ArrowRight className="w-4 h-4" /></>}</Button>
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
          <span>Authorization used</span><span>{Math.round(100 - pct)}%</span>
        </div>
        <Progress value={100 - pct} tone={pct > 50 ? 'success' : pct > 20 ? 'warning' : 'danger'} />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1"><Eye className="w-3.5 h-3.5" /> Details</Button>
        {tab.status === 'active' && (
          <>
            <Button size="sm" variant="ghost" onClick={onPause}><Pause className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" className="text-danger-400" onClick={onRevoke}><RotateCcw className="w-3.5 h-3.5" /></Button>
          </>
        )}
      </div>
    </Card>
  );
}

function Row({ icon: Icon, label, value, tone = 'text-ink-200' }: { icon: typeof Tag; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-ink-400"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <span className={`text-xs font-medium ${tone}`}>{value}</span>
    </div>
  );
}

function ReviewRow({ icon: Icon, label, value, tone = 'text-ink-200' }: { icon: typeof Tag; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-ink-400"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <span className={`text-xs font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
