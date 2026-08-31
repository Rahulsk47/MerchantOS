import { motion } from 'framer-motion';
import { User, Bot, ShieldCheck, CreditCard, BookOpen, Store, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

const flow = [
  { icon: User, label: 'Human Customer', detail: 'Authorizes an AI assistant', tone: 'text-ink-200' },
  { icon: Bot, label: 'Verified AI Agent', detail: 'Discovers and understands a merchant', tone: 'text-electric-300' },
  { icon: ShieldCheck, label: 'MerchantOS', detail: 'Verifies identity, permissions, and policies', tone: 'text-accent-400' },
  { icon: CreditCard, label: 'OpenTab', detail: 'Validates scoped transaction authority', tone: 'text-electric-300' },
  { icon: Store, label: 'Existing Payment Provider', detail: 'Handles the actual payment', tone: 'text-ink-200' },
  { icon: BookOpen, label: 'Trust Ledger', detail: 'Records what happened and why', tone: 'text-success-400' },
];

export function FlowSection() {
  return (
    <section id="security" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint opacity-20" />
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">The Complete Commerce Flow</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient leading-tight">
              Every step. Verified. Audited. Understood.
            </h2>
            <p className="mt-6 text-lg text-ink-300 leading-relaxed">
              From a human authorizing an AI agent to the Trust Ledger recording the outcome — MerchantOS makes AI commerce transparent, not a black box.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink-600/40 to-transparent hidden md:block" />
          <div className="space-y-4">
            {flow.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <div className={`flex items-center gap-4 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className="hidden md:block flex-1" />
                    <div className="relative z-10 w-12 h-12 rounded-full bg-ink-850 border border-ink-700/60 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${step.tone}`} />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-electric-500/0"
                        animate={{ borderColor: ['rgba(43,98,255,0)', 'rgba(43,98,255,0.3)', 'rgba(43,98,255,0)'], scale: [1, 1.15, 1] }}
                        transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex-1 surface-flat p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-mono text-ink-500">{String(i + 1).padStart(2, '0')}</span>
                        <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                      </div>
                      <p className="text-sm text-ink-400 mt-1">{step.detail}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-ink-400">
            <span className="px-3 py-1.5 rounded-full bg-ink-800/60 border border-ink-700/50 font-mono text-2xs">AI REQUESTS PURCHASE</span>
            <ArrowRight className="w-4 h-4 text-ink-600" />
            <span className="px-3 py-1.5 rounded-full bg-ink-800/60 border border-ink-700/50 font-mono text-2xs">IDENTITY VERIFIED</span>
            <ArrowRight className="w-4 h-4 text-ink-600" />
            <span className="px-3 py-1.5 rounded-full bg-ink-800/60 border border-ink-700/50 font-mono text-2xs">OPENTAB CHECKS AUTHORITY</span>
            <ArrowRight className="w-4 h-4 text-ink-600" />
            <span className="px-3 py-1.5 rounded-full bg-ink-800/60 border border-ink-700/50 font-mono text-2xs">PAYMENT PROCESSED</span>
            <ArrowRight className="w-4 h-4 text-ink-600" />
            <span className="px-3 py-1.5 rounded-full bg-success-500/10 border border-success-500/30 font-mono text-2xs text-success-400">RECORDED IN LEDGER</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
