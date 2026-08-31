import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

export function CTAFooter() {
  const navigate = useNavigate();

  return (
    <footer className="relative pt-28 pb-12 overflow-hidden">
      <div className="absolute inset-0 bg-radial-fade opacity-40" />

      <div className="container-cinematic relative z-10">
        <Reveal>
          <div className="surface p-10 lg:p-16 text-center bg-gradient-to-br from-ink-850 to-ink-900 border-electric-500/20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient leading-tight max-w-3xl mx-auto">
              Prepare your business for the next customer.
            </h2>

            <p className="mt-6 text-lg text-ink-300 max-w-xl mx-auto">
              Start with a guided demo — create an OpenTab,
              simulate an AI purchase, and watch the policy
              engine decide.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-4 gap-8">
          <div>
            <Logo />

            <p className="mt-4 text-xs text-ink-400 leading-relaxed max-w-xs">
              Commerce built for humans and AI. The
              intelligence, trust, and authorization layer
              between AI agents and merchants.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              'Overview',
              'OpenTab',
              'Growth Intelligence',
              'Trust Ledger',
              'Policies',
            ]}
          />

          <FooterCol
            title="Developers"
            links={[
              'Commerce Translation Layer',
              'Agent View',
              'API Reference',
              'Integration Guide',
              'Demo Mode',
            ]}
          />

          <FooterCol
            title="Company"
            links={[
              'About',
              'Security',
              'Privacy',
              'Contact',
              'Careers',
            ]}
          />
        </div>

        <div className="mt-12 pt-8 border-t border-ink-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-500">
            © 2026 MerchantOS. All rights reserved. Demo data
            — not a real financial product.
          </p>

          <div className="flex items-center gap-4 text-xs text-ink-500">
            <span>AI proposes. Policy decides.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: string[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-white uppercase tracking-widest">
        {title}
      </h4>

      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-sm text-ink-400 hover:text-electric-300 transition-colors"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}