import { motion } from 'framer-motion';
import { Code2, ShieldCheck, Building2, Lock, FileJson, Webhook, Eye, Scale } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Accordion } from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';

export function DevelopersSection() {
  return (
    <section id="developers" className="relative py-28 overflow-hidden">
      <div className="container-cinematic relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Reveal>
              <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">Developers</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-gradient leading-tight">
                Built for integration. Structured for the future.
              </h2>
              <p className="mt-6 text-lg text-ink-300 leading-relaxed">
                MerchantOS is designed so backend APIs and real payment providers can be integrated later. Clean architecture, structured data, and a commerce translation layer that adapts as standards evolve.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 surface bg-ink-900/80 p-5 font-mono text-xs leading-relaxed overflow-x-auto scrollbar-thin">
                <div className="text-ink-500 mb-2">{"// AI Commerce Passport — structured merchant profile"}</div>
                <div><span className="text-electric-300">"merchant"</span>: <span className="text-accent-400">"Northwind Commerce"</span>,</div>
                <div><span className="text-electric-300">"products"</span>: [</div>
                <div className="pl-4">{'{'}</div>
                <div className="pl-8"><span className="text-electric-300">"name"</span>: <span className="text-accent-400">"AeroBook Pro"</span>,</div>
                <div className="pl-8"><span className="text-electric-300">"price"</span>: <span className="text-warning-400">112000</span>,</div>
                <div className="pl-8"><span className="text-electric-300">"availability"</span>: <span className="text-success-400">"in_stock"</span>,</div>
                <div className="pl-8"><span className="text-electric-300">"shipping"</span>: <span className="text-accent-400">"1-2 business days"</span>,</div>
                <div className="pl-8"><span className="text-electric-300">"returns"</span>: <span className="text-accent-400">"15-day window"</span></div>
                <div className="pl-4">{'}'}</div>
                <div>],</div>
                <div><span className="text-electric-300">"capabilities"</span>: <span className="text-accent-400">"agent_transactions, opentab"</span></div>
              </div>
            </Reveal>
          </div>

          <div className="space-y-4">
            <Reveal delay={0.1}>
              <FeatureRow icon={FileJson} title="Commerce Translation Layer" desc="MerchantOS adapts your existing data to compatible AI and commerce formats as standards evolve — not a proprietary standard everyone must adopt." />
            </Reveal>
            <Reveal delay={0.15}>
              <FeatureRow icon={Webhook} title="Payment Provider Agnostic" desc="OpenTab is an authorization layer before payment. Your existing payment provider handles actual money movement." />
            </Reveal>
            <Reveal delay={0.2}>
              <FeatureRow icon={Code2} title="Clean Architecture" desc="Structured for future backend APIs, real payment integrations, and live agent traffic — without rewriting the interface." />
            </Reveal>
            <Reveal delay={0.25}>
              <FeatureRow icon={Eye} title="Agent View" desc="See exactly how AI systems understand your catalog, policies, and capabilities — in structured, plain-language form." />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ icon: Icon, title, desc }: { icon: typeof Code2; title: string; desc: string }) {
  return (
    <div className="surface p-5 hover:border-ink-600/80 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-electric-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-sm text-ink-400 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export function SecuritySection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-radial-fade opacity-40" />
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">Security & Realism</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-gradient leading-tight">
              Honest about what's real. Clear about what's simulated.
            </h2>
            <p className="mt-6 text-lg text-ink-300 leading-relaxed">
              We don't fake security claims. This prototype clearly distinguishes simulated payments from real ones, uses mock transaction IDs, and is structured for future real integrations.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: 'Simulated Identity', desc: 'Agent identity and authorization states are clearly labeled as simulated for this prototype.' },
            { icon: ShieldCheck, title: 'Deterministic Policies', desc: 'Merchant policies are enforced deterministically. AI can never override them.' },
            { icon: Scale, title: 'Idempotency Logic', desc: 'Duplicate simulated transactions are prevented using idempotency keys.' },
            { icon: Eye, title: 'Full Audit Trail', desc: 'Every event in the Trust Ledger answers what, why, who, when, and which policy.' },
            { icon: Lock, title: 'Pending & Confirmed States', desc: 'Transactions track pending, approved, declined, escalated, and confirmed states.' },
            { icon: Building2, title: 'Built for Real Integrations', desc: 'Structured for future payment providers and real backend APIs — no rewrite needed.' },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="surface p-5 h-full">
                <div className="w-10 h-10 rounded-xl bg-ink-800/60 border border-ink-700/60 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-ink-300" />
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-12">
            <Accordion items={[
              { q: 'Does OpenTab hold or move customer money?', a: 'No. OpenTab is an authorization layer that validates whether an AI agent has scoped, capped, temporary, and revocable permission to request a transaction. Actual payment is handled separately by your integrated payment provider.' },
              { q: 'Are the AI agent identities real?', a: 'No. For this prototype, agent identities and authorization states are simulated and clearly labeled as demo data. The system is structured so real identity verification could be integrated later.' },
              { q: 'Can AI recommendations override merchant policies?', a: 'Never. AI can recommend, discover, and request actions, but deterministic merchant policies always control what is actually allowed. This is the core principle: AI proposes, policy decides.' },
              { q: 'What happens when a transaction is escalated?', a: 'When a transaction exceeds the auto-approval ceiling but is otherwise valid, it is escalated for human approval. The merchant can approve or decline it, and the outcome is recorded in the Trust Ledger with alternatives offered instead of a dead end.' },
            ]} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="relative py-28 overflow-hidden">
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <Badge tone="electric">About MerchantOS</Badge>
            <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient leading-tight">
              AI agents will become customers. MerchantOS gives businesses the intelligence, infrastructure, trust, and control to serve them safely.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: '01', title: 'Grow', desc: 'Find opportunities. Grow today.' },
            { num: '02', title: 'Discover', desc: 'Make your business understandable to AI.' },
            { num: '03', title: 'Transact', desc: 'Give AI agents a Tab, not a blank cheque.' },
            { num: '04', title: 'Trust', desc: 'Know who is acting. Know why decisions are made.' },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <motion.div whileHover={{ y: -3 }} className="surface p-6 h-full text-center">
                <span className="text-3xl font-bold text-ink-700 font-mono">{item.num}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-400">{item.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
