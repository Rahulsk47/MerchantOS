import { motion } from 'framer-motion';
import { User, Bot, Store, CreditCard, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

export function ShiftSection() {
  return (
    <section id="shift" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint opacity-20" />
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">The Shift</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient leading-tight">
              The internet was built for people. Commerce is about to have another customer.
            </h2>
            <p className="mt-6 text-lg text-ink-300 leading-relaxed">
              AI agents will increasingly search, compare, recommend, and transact on behalf of people. MerchantOS helps businesses prepare — without rebuilding their commerce systems.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-6">
          <Reveal delay={0.1}>
            <div className="surface p-8 h-full">
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Today</span>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <FlowNode icon={User} label="Human" tone="text-ink-200" />
                <FlowArrow />
                <FlowNode icon={Store} label="Website" tone="text-ink-200" />
                <FlowArrow />
                <FlowNode icon={CreditCard} label="Checkout" tone="text-ink-200" />
              </div>
              <p className="mt-6 text-sm text-ink-400">
                A person visits a website, browses, and completes checkout themselves.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="surface p-8 h-full border-electric-500/20">
              <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">Tomorrow</span>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <FlowNode icon={User} label="Human" tone="text-ink-200" />
                <FlowArrow />
                <FlowNode icon={Bot} label="AI Agent" tone="text-electric-300" highlight />
                <FlowArrow />
                <FlowNode icon={Store} label="MerchantOS" tone="text-accent-400" highlight />
                <FlowArrow />
                <FlowNode icon={Store} label="Merchant" tone="text-ink-200" />
                <FlowArrow />
                <FlowNode icon={CreditCard} label="Payment" tone="text-ink-200" />
              </div>
              <p className="mt-6 text-sm text-ink-300">
                A person authorizes an AI agent. The agent discovers, understands, and requests — within merchant-defined boundaries.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FlowNode({ icon: Icon, label, tone, highlight }: { icon: typeof User; label: string; tone: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${highlight ? 'scale-105' : ''}`}>
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${highlight ? 'bg-electric-500/10 border-electric-500/40' : 'bg-ink-800/60 border-ink-700/60'}`}>
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
      <span className="text-2xs text-ink-400 font-medium">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <motion.div
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <ArrowRight className="w-4 h-4 text-ink-500" />
    </motion.div>
  );
}
