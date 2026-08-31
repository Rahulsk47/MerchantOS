import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/store';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { authed } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const links = [
    { label: 'Product', href: '#product' },
    { label: 'OpenTab', href: '#opentab' },
    { label: 'Developers', href: '#developers' },
    { label: 'Security', href: '#security' },
    { label: 'About', href: '#about' },
  ];

  const handleStartBuilding = () => {
    setMobileOpen(false);

    if (authed) {
      navigate('/app');
    } else {
      navigate('/signup');
    }
  };

  const handleSignIn = () => {
    setMobileOpen(false);
    navigate('/signin');
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-ink-950/80 backdrop-blur-xl border-b border-ink-700/40'
            : 'bg-transparent'
        }`}
      >
        <nav className="container-cinematic flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
            >
              Sign In
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleStartBuilding}
            >
              {authed ? 'Open Dashboard' : 'Create Account'}
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            className="md:hidden text-ink-200"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile navigation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              className="md:hidden overflow-hidden bg-ink-900/95 backdrop-blur-xl border-b border-ink-700/40"
            >
              <div className="px-5 py-4 flex flex-col gap-3">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="nav-link py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={handleStartBuilding}
                  >
                    {authed ? 'Dashboard' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}