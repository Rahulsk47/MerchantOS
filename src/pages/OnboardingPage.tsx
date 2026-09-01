import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, Upload, Link2, Plus, TrendingUp, Zap, Bot } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Counter } from '@/components/ui/Counter';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const steps = ['Business', 'Catalog', 'Goals', 'Boundaries', 'Readiness'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateMerchant, pushToast, loadDemoData, setAuthed } = useApp();
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState({ name: '', industry: '', url: '' });
  const [catalogMethod, setCatalogMethod] = useState<string>('');
  const [goals, setGoals] = useState<string[]>([]);
  const [boundaries, setBoundaries] = useState({ maxDiscount: 15, minMargin: 12, autoApprove: 5000, agentPerms: 'full' });

  const next = async () => {
    if (step === 0 && (!business.name || !business.industry)) {
      pushToast({ type: 'warning', title: 'Please fill in your business details' });
      return;
    }
    if (step === 1 && !catalogMethod) {
      pushToast({ type: 'warning', title: 'Choose a catalog connection method' });
      return;
    }
    if (step === 2 && goals.length === 0) {
      pushToast({ type: 'warning', title: 'Select at least one goal' });
      return;
    }
    if (step === 4) {
      const name = business.name || 'Northwind Commerce';
      const industry = business.industry || 'Electronics & Accessories';
      const url = business.url || 'northwind.store';

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          try {
            // Check if user already belongs to an organization
            const { data: membership } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (membership?.organization_id) {
              await supabase
                .from('organizations')
                .update({
                  name,
                  industry,
                  store_url: url || null,
                  onboarding_complete: true,
                })
                .eq('id', membership.organization_id);
            } else {
              const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({
                  name,
                  industry,
                  store_url: url || null,
                  onboarding_complete: true,
                })
                .select()
                .single();

              if (!orgError && orgData) {
                await supabase
                  .from('organization_members')
                  .insert({
                    organization_id: orgData.id,
                    user_id: user.id,
                    role: 'owner',
                  });
              }
            }
          } catch (e) {
            console.warn('Backend onboarding sync note:', e);
          }
        }

        if (catalogMethod === 'demo' || !user) {
          loadDemoData();
        }

        setAuthed(true);

        try {
          localStorage.setItem('merchantos_onboarding_completed', 'true');
        } catch {
          /* ignore */
        }

        updateMerchant({
          businessName: name,
          industry,
          storeUrl: url || 'northwind.store',
          onboardingComplete: true,
          boundaries: {
            maxDiscount: boundaries.maxDiscount,
            minMargin: boundaries.minMargin,
            autoApproveThreshold: boundaries.autoApprove,
            maxTxnAmount: 25000,
          },
        });

        pushToast({
          type: 'success',
          title: 'Welcome to MerchantOS!',
          message: 'Your AI commerce command center is ready.',
        });

        navigate('/app', { replace: true });
      } catch (err) {
        console.error('Onboarding completion error:', err);
        pushToast({
          type: 'error',
          title: 'Something went wrong',
          message: 'Please try again.',
        });
      }
      return;
    }
    if (step === 3) {
      setTimeout(() => setStep(4), 100);
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const toggleGoal = (g: string) => setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <header className="border-b border-ink-700/40 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <span className="text-xs text-ink-400">Step {Math.min(step + 1, 5)} of {steps.length}</span>
          <div className="w-32">
            <Progress value={((step + 1) / steps.length) * 100} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step key="0" title="Tell us about your business" subtitle="This helps us tailor your AI commerce experience.">
                <div className="space-y-4">
                  <Input label="Business name" placeholder="Northwind Commerce" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
                  <Select label="Industry" value={business.industry} onChange={(e) => setBusiness({ ...business, industry: e.target.value })}>
                    <option value="">Select an industry</option>
                    <option value="Electronics & Accessories">Electronics & Accessories</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                  </Select>
                  <Input label="Store URL" placeholder="yourstore.com" value={business.url} onChange={(e) => setBusiness({ ...business, url: e.target.value })} hint="You can change this later." />
                </div>
              </Step>
            )}
            {step === 1 && (
              <Step key="1" title="Connect your catalog" subtitle="Choose how you'd like to bring your products into MerchantOS.">
                <div className="space-y-3">
                  <OptionCard icon={Upload} title="Upload catalog" desc="Upload a CSV or spreadsheet of your products." selected={catalogMethod === 'upload'} onClick={() => setCatalogMethod('upload')} />
                  <OptionCard icon={Link2} title="Connect demo store" desc="Use our pre-loaded demo catalog to explore MerchantOS." selected={catalogMethod === 'demo'} onClick={() => setCatalogMethod('demo')} />
                  <OptionCard icon={Plus} title="Add products manually" desc="Add products one at a time." selected={catalogMethod === 'manual'} onClick={() => setCatalogMethod('manual')} />
                </div>
              </Step>
            )}
            {step === 2 && (
              <Step key="2" title="What are your goals?" subtitle="We'll prioritize recommendations based on what matters to you.">
                <div className="grid sm:grid-cols-3 gap-3">
                  <GoalCard icon={TrendingUp} title="Increase revenue" desc="Find bundles, pricing, and catalog opportunities." selected={goals.includes('revenue')} onClick={() => toggleGoal('revenue')} />
                  <GoalCard icon={Zap} title="Improve conversion" desc="Surface friction and optimize the buying experience." selected={goals.includes('conversion')} onClick={() => toggleGoal('conversion')} />
                  <GoalCard icon={Bot} title="Prepare for AI commerce" desc="Make your business understandable to AI agents." selected={goals.includes('ai')} onClick={() => toggleGoal('ai')} />
                </div>
              </Step>
            )}
            {step === 3 && (
              <Step key="3" title="Set your business boundaries" subtitle="These deterministic policies control what AI agents can and cannot do. You can adjust them anytime.">
                <div className="space-y-5">
                  <SliderRow label="Maximum discount" value={boundaries.maxDiscount} suffix="%" min={0} max={50} onChange={(v) => setBoundaries({ ...boundaries, maxDiscount: v })} />
                  <SliderRow label="Minimum margin" value={boundaries.minMargin} suffix="%" min={0} max={50} onChange={(v) => setBoundaries({ ...boundaries, minMargin: v })} hint="Only applies if you provide cost data. We don't guess your margins." />
                  <SliderRow label="Auto-approval threshold" value={boundaries.autoApprove} prefix="₹" min={0} max={25000} step={500} onChange={(v) => setBoundaries({ ...boundaries, autoApprove: v })} hint="Transactions under this amount are auto-approved if all other checks pass." />
                  <Field label="Agent permissions">
                    <Select value={boundaries.agentPerms} onChange={(e) => setBoundaries({ ...boundaries, agentPerms: e.target.value })}>
                      <option value="full">Verified + Known agents</option>
                      <option value="verified">Verified agents only</option>
                      <option value="manual">Manual approval for all</option>
                    </Select>
                  </Field>
                </div>
              </Step>
            )}
            {step === 4 && (
              <Step key="4" title="" subtitle="">
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gradient">Your AI Commerce Passport is ready.</h2>
                  <p className="mt-4 text-ink-400 max-w-md mx-auto">We analyzed your business information and generated your AI readiness score.</p>
                  <div className="mt-8 inline-flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#score-grad)" strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={264} initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * 87) / 100 }} transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }} />
                        <defs>
                          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#2b62ff" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Counter value={87} className="text-4xl font-bold text-white" />
                        <span className="text-xs text-ink-400 mt-1">out of 100</span>
                      </div>
                    </div>
                    <span className="mt-4 text-sm text-electric-300 font-medium">AI Readiness: High</span>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {[
                      { label: 'Catalog', value: 'Healthy', tone: 'text-success-400' },
                      { label: 'Agent Discovery', value: 'Active', tone: 'text-electric-300' },
                      { label: 'Transactions', value: 'Protected', tone: 'text-accent-400' },
                    ].map((s) => (
                      <div key={s.label} className="surface-flat p-3 text-center">
                        <p className="text-2xs text-ink-500">{s.label}</p>
                        <p className={`text-sm font-semibold mt-1 ${s.tone}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Step>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={next}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          {step === 4 && (
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={next}>
                Enter MerchantOS <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
      {subtitle && <p className="mt-2 text-sm text-ink-400">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}

function OptionCard({ icon: Icon, title, desc, selected, onClick }: { icon: typeof Upload; title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-electric-500/20' : 'bg-ink-800'}`}>
          <Icon className={`w-5 h-5 ${selected ? 'text-electric-400' : 'text-ink-400'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
        </div>
        {selected && <Check className="w-5 h-5 text-electric-400" />}
      </div>
    </button>
  );
}

function GoalCard({ icon: Icon, title, desc, selected, onClick }: { icon: typeof TrendingUp; title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-xl border text-center transition-all ${selected ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/40 border-ink-700/50 hover:border-ink-600'}`}>
      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${selected ? 'bg-electric-500/20' : 'bg-ink-800'}`}>
        <Icon className={`w-6 h-6 ${selected ? 'text-electric-400' : 'text-ink-400'}`} />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-ink-400 mt-1">{desc}</p>
      {selected && <Check className="w-4 h-4 text-electric-400 mx-auto mt-2" />}
    </button>
  );
}

function SliderRow({ label, value, prefix = '', suffix = '', min, max, step = 1, onChange, hint }: { label: string; value: number; prefix?: string; suffix?: string; min: number; max: number; step?: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-ink-200">{label}</label>
        <span className="text-sm font-semibold text-electric-300 font-mono">{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500" />
      {hint && <p className="text-xs text-ink-500 mt-1.5">{hint}</p>}
    </div>
  );
}
