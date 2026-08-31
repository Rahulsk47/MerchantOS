import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldAlert, Clock, Wallet, Tag, Sparkles, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/utils';

type CheckStatus = 'pending' | 'passed' | 'failed';

interface Check {
  id: number;
  label: string;
  status: CheckStatus;
}

const scenario1Checks: Check[] = [
  { id: 1, label: 'Agent identity verified', status: 'pending' },
  { id: 2, label: 'Within allowed scope (Electronics + Accessories)', status: 'pending' },
  { id: 3, label: 'Inventory available', status: 'pending' },
  { id: 4, label: 'Within remaining authorization', status: 'pending' },
  { id: 5, label: 'Merchant policy satisfied', status: 'pending' },
];

export function OpenTabStory() {
  const [scenario, setScenario] = useState<1 | 2>(1);
  const [checks, setChecks] = useState<Check[]>(scenario1Checks);
  const [result, setResult] = useState<'idle' | 'running' | 'approved' | 'escalated'>('idle');
  const [activeCheck, setActiveCheck] = useState(0);

  const runScenario = (s: 1 | 2) => {
    setScenario(s);
    setResult('idle');
    setChecks(scenario1Checks.map((c) => ({ ...c, status: 'pending' })));
    setActiveCheck(0);
  };

  useEffect(() => {
    if (result !== 'running') return;
    if (activeCheck >= checks.length) {
      setResult(scenario === 1 ? 'approved' : 'escalated');
      return;
    }
    const timer = setTimeout(() => {
      setChecks((prev) => prev.map((c, i) => (i === activeCheck ? { ...c, status: 'passed' } : c)));
      setActiveCheck((prev) => prev + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [result, activeCheck, checks.length, scenario]);

  const startEvaluation = () => {
    setResult('running');
    setChecks(scenario1Checks.map((c) => ({ ...c, status: 'pending' })));
    setActiveCheck(0);
  };

  return (
    <section id="opentab" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-radial-fade opacity-50" />
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">OpenTab</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient leading-tight">
              Trust isn't unlimited access.
            </h2>
            <p className="mt-6 text-lg text-ink-300 leading-relaxed">
              Instead of giving an AI agent unlimited permission to spend money, give it a scoped, capped, temporary, and revocable OpenTab.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid lg:grid-cols-[360px_1fr] gap-6">
          <Reveal delay={0.1}>
            <div className="surface p-6 h-fit sticky top-24">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Active OpenTab</span>
                <Badge tone="success">Active</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">AI Shopping Assistant</h3>
              <div className="mt-4 space-y-3">
                <SpecRow icon={ShieldAlert} label="Identity" value="Verified" tone="text-success-400" />
                <SpecRow icon={Tag} label="Allowed" value="Electronics + Accessories" />
                <SpecRow icon={Wallet} label="Spending Cap" value={formatINR(15000)} />
                <SpecRow icon={Sparkles} label="Remaining" value={formatINR(8500)} tone="text-electric-300" />
                <SpecRow icon={CheckCircle2} label="Auto Approve" value={`Under ${formatINR(5000)}`} />
                <SpecRow icon={Clock} label="Expires" value="Today, 6:00 PM" tone="text-warning-400" />
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-2xs text-ink-400 mb-1.5">
                  <span>Authorization used</span>
                  <span>{formatINR(6500)} / {formatINR(15000)}</span>
                </div>
                <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-electric-500 to-accent-500 rounded-full" initial={{ width: 0 }} animate={{ width: '43%' }} transition={{ duration: 1, delay: 0.3 }} />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="surface p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Button size="sm" variant={scenario === 1 ? 'primary' : 'secondary'} onClick={() => runScenario(1)}>Scenario 1: Within limits</Button>
                <Button size="sm" variant={scenario === 2 ? 'primary' : 'secondary'} onClick={() => runScenario(2)}>Scenario 2: Cap exceeded</Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="surface-flat p-4">
                  <p className="text-xs text-ink-400 mb-2">AI requests to purchase</p>
                  <p className="text-base font-semibold text-white">{scenario === 1 ? 'Laptop + Mouse' : 'Headphones + Keyboard'}</p>
                  <p className="text-2xl font-bold text-electric-300 mt-1">{formatINR(scenario === 1 ? 12500 : 18000)}</p>
                </div>
                <div className="surface-flat p-4">
                  <p className="text-xs text-ink-400 mb-2">Available authorization</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatINR(15000)}</p>
                  <p className={`text-xs mt-1 ${scenario === 2 ? 'text-danger-400' : 'text-ink-500'}`}>
                    {scenario === 2 ? `Exceeds by ${formatINR(3000)}` : 'Within remaining balance'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 min-h-[280px]">
                <AnimatePresence mode="popLayout">
                  {checks.map((check, i) => (
                    <motion.div
                      key={check.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        check.status === 'passed' ? 'bg-success-500/5 border-success-500/20' :
                        check.status === 'failed' ? 'bg-danger-500/5 border-danger-500/20' :
                        i === activeCheck && result === 'running' ? 'bg-electric-500/5 border-electric-500/20' : 'bg-ink-800/30 border-ink-700/40'
                      }`}
                    >
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" />
                      ) : check.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-danger-400 shrink-0" />
                      ) : i === activeCheck && result === 'running' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <div className="w-5 h-5 border-2 border-electric-500/30 border-t-electric-400 rounded-full shrink-0" />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-ink-600 shrink-0" />
                      )}
                      <span className={`text-sm ${check.status === 'passed' ? 'text-ink-200' : 'text-ink-400'}`}>{check.label}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {result === 'idle' && (
                <Button className="mt-6 w-full" onClick={startEvaluation}>
                  <ShieldAlert className="w-4 h-4" /> Evaluate Transaction
                </Button>
              )}

              <AnimatePresence>
                {result === 'approved' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-xl bg-success-500/10 border border-success-500/30 text-center">
                    <CheckCircle2 className="w-8 h-8 text-success-400 mx-auto mb-2" />
                    <p className="text-xl font-bold text-success-400">Transaction Approved</p>
                    <p className="text-sm text-ink-300 mt-1">All policy checks passed. Payment handed to the payment provider.</p>
                  </motion.div>
                )}
                {result === 'escalated' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-xl bg-warning-500/10 border border-warning-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-6 h-6 text-warning-400" />
                      <p className="text-lg font-bold text-warning-400">Needs Additional Authorization</p>
                    </div>
                    <p className="text-sm text-ink-300">The requested amount exceeds the remaining OpenTab authorization by {formatINR(3000)}.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline"><ArrowRight className="w-3.5 h-3.5" /> Request human approval</Button>
                      <Button size="sm" variant="ghost">Choose an alternative</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <p className="mt-6 text-center text-xs text-ink-500 max-w-2xl mx-auto">
            AI recommendations can never override deterministic merchant policies. OpenTab is an authorization layer — actual payment is handled separately by your integrated payment provider.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function SpecRow({ icon: Icon, label, value, tone = 'text-ink-200' }: { icon: typeof ShieldAlert; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <span className={`text-xs font-medium ${tone}`}>{value}</span>
    </div>
  );
}
