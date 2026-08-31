import { motion } from 'framer-motion';
import { TrendingUp, Compass, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { useNavigate } from 'react-router-dom';

export function PillarsSection() {
  const navigate = useNavigate();
  return (
    <section id="product" className="relative py-28 overflow-hidden">
      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-electric-400 uppercase tracking-widest">Three Pillars</span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient">
              One foundation. Three ways to grow.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 space-y-6">
          <PillarCard
            index="01"
            icon={TrendingUp}
            tone="electric"
            title="Grow"
            tagline="Find the revenue you're leaving on the table."
            description="AI-powered revenue intelligence surfaces bundles, catalog improvements, and conversion insights. Useful today — even before AI agents become mainstream customers."
            points={['Revenue opportunities with estimated impact', 'Bundle and pricing recommendations', 'Conversion insights with confidence levels']}
            onClick={() => navigate('/app/growth')}
          />
          <PillarCard
            index="02"
            icon={Compass}
            tone="accent"
            title="Discover"
            tagline="Make your business understandable to AI."
            description="MerchantOS structures products, availability, shipping, returns, and policies so AI systems can understand your business. A commerce translation layer — not a proprietary standard everyone must adopt."
            points={['AI Commerce Passport for your business', 'Adapts to evolving AI and commerce formats', 'AI Readiness checker for every product']}
            onClick={() => navigate('/app/catalog')}
          />
          <PillarCard
            index="03"
            icon={CreditCard}
            tone="electric"
            title="Transact"
            tagline="Give AI agents a Tab, not a blank cheque."
            description="OpenTab gives AI agents scoped, capped, temporary, and revocable transaction authority. Every transaction passes deterministic checks. AI recommendations can never override merchant policies."
            points={['Scoped and capped authorization', 'Temporary and revocable at any time', 'Every transaction fully audited']}
            onClick={() => navigate('/app/opentabs')}
          />
        </div>

        <Reveal>
          <div className="mt-8 surface p-8 bg-gradient-to-br from-ink-850 to-ink-900 border-electric-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success-500/10 border border-success-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-success-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-success-400 uppercase tracking-widest">The Foundation</span>
                  <h3 className="text-2xl font-bold text-white mt-1">Trust</h3>
                </div>
              </div>
              <p className="text-sm text-ink-300 leading-relaxed flex-1">
                Underneath all three pillars: Agent Identity, a deterministic Policy Engine, Commerce Protection, and the Trust Ledger. Know who is acting. Know why decisions are made.
              </p>
              <button onClick={() => navigate('/app/ledger')} className="text-sm text-electric-400 hover:text-electric-300 font-medium flex items-center gap-1.5 shrink-0">
                Explore Trust Ledger <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PillarCard({ index, icon: Icon, tone, title, tagline, description, points, onClick }: {
  index: string;
  icon: typeof TrendingUp;
  tone: 'electric' | 'accent';
  title: string;
  tagline: string;
  description: string;
  points: string[];
  onClick: () => void;
}) {
  const toneClass = tone === 'electric' ? 'text-electric-400 bg-electric-500/10 border-electric-500/30' : 'text-accent-400 bg-accent-500/10 border-accent-500/30';
  return (
    <Reveal>
      <motion.div
        whileHover={{ y: -2 }}
        className="surface p-8 lg:p-10 group cursor-pointer hover:border-ink-600/80 transition-colors"
        onClick={onClick}
      >
        <div className="grid lg:grid-cols-[auto_1fr_auto] gap-8 items-start">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-ink-700 font-mono">{index}</span>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${toneClass}`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="mt-1 text-lg text-ink-200 font-medium">{tagline}</p>
            <p className="mt-3 text-sm text-ink-400 leading-relaxed max-w-xl">{description}</p>
            <ul className="mt-5 space-y-2">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-ink-300">
                  <span className="w-1 h-1 rounded-full bg-electric-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <ArrowRight className="w-5 h-5 text-ink-500 group-hover:text-electric-400 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </motion.div>
    </Reveal>
  );
}
