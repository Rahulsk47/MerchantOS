import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, User, Bot, Store, PackageOpen, ShoppingCart, CreditCard, ShieldCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const nodes = [
  { id: 'human', label: 'Human Customer', icon: User, x: 50, y: 8, tone: 'text-ink-200' },
  { id: 'agent', label: 'AI Agent', icon: Bot, x: 50, y: 28, tone: 'text-electric-300' },
  { id: 'merchant', label: 'Merchant', icon: Store, x: 22, y: 50, tone: 'text-accent-400' },
  { id: 'catalog', label: 'Catalog', icon: PackageOpen, x: 78, y: 50, tone: 'text-electric-300' },
  { id: 'request', label: 'Purchase Request', icon: ShoppingCart, x: 50, y: 50, tone: 'text-white' },
  { id: 'opentab', label: 'OpenTab', icon: CreditCard, x: 22, y: 72, tone: 'text-electric-300' },
  { id: 'policy', label: 'Policy Engine', icon: ShieldCheck, x: 78, y: 72, tone: 'text-accent-400' },
  { id: 'payment', label: 'Payment Provider', icon: CreditCard, x: 50, y: 72, tone: 'text-ink-200' },
  { id: 'ledger', label: 'Trust Ledger', icon: BookOpen, x: 50, y: 92, tone: 'text-success-400' },
];

const connections = [
  ['human', 'agent'],
  ['agent', 'merchant'],
  ['agent', 'catalog'],
  ['agent', 'request'],
  ['request', 'opentab'],
  ['request', 'policy'],
  ['opentab', 'payment'],
  ['policy', 'payment'],
  ['payment', 'ledger'],
];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const navigate = useNavigate();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-grid-faint opacity-40" />
      <div className="absolute inset-0 bg-radial-fade" />
      <motion.div style={{ y, opacity }} className="container-cinematic relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/30 text-2xs font-medium text-electric-300 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse" />
                Commerce built for humans and AI
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-gradient">
                Your next customer<br />might be an AI.
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-base sm:text-lg text-ink-300 leading-relaxed max-w-xl">
                MerchantOS helps businesses grow revenue, become understandable to AI agents, and safely serve autonomous buyers.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate('/onboarding')}>
                  Explore MerchantOS <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('shift')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="w-4 h-4" /> Watch How It Works
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="mt-6 text-xs text-ink-500 max-w-md">
                AI proposes. Policy decides. The merchant always remains in control.
              </p>
            </Reveal>
          </div>

          <div className="relative h-[480px] sm:h-[560px]">
            <CommerceNetwork />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CommerceNetwork() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2b62ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {connections.map(([from, to], i) => {
          const a = nodes.find((n) => n.id === from)!;
          const b = nodes.find((n) => n.id === to)!;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#line-grad)" strokeWidth="0.25" opacity="0.5" />
              <motion.circle
                r="0.6"
                fill="#4d83ff"
                initial={{ cx: a.x, cy: a.y, opacity: 0 }}
                animate={{ cx: [a.x, b.x], cy: [a.y, b.y], opacity: [0, 1, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, repeatDelay: 1.5 }}
              />
            </g>
          );
        })}
      </svg>
      {nodes.map((node, i) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={node.id}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-ink-850/90 border border-ink-700/60 backdrop-blur-sm flex items-center justify-center shadow-card group hover:border-electric-500/40 transition-colors">
                <Icon className={`w-5 h-5 ${node.tone}`} />
              </div>
              <span className="text-2xs text-ink-400 whitespace-nowrap font-medium hidden sm:block">{node.label}</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl border border-electric-500/0"
              animate={{ borderColor: ['rgba(43,98,255,0)', 'rgba(43,98,255,0.4)', 'rgba(43,98,255,0)'] }}
              transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
