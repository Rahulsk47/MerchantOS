import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: {
      email?: string;
      password?: string;
    } = {};

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email
    if (!trimmedEmail) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Enter a valid email';
    }

    // Validate password
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setAuthError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (!data.session || !data.user) {
        setAuthError(
          'Unable to create a session. Please verify your email and try again.'
        );
        return;
      }

      /*
       * IMPORTANT:
       *
       * A verified user can sign in from any device.
       * We check the local onboarding state after authentication.
       *
       * If onboarding has not been completed:
       *     /onboarding
       *
       * If onboarding was completed:
       *     /app
       *
       * The auth session itself is managed by Supabase.
       */

      const onboardingComplete =
        data.user.user_metadata?.onboarding_complete === true;

      if (onboardingComplete) {
        navigate('/app', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 relative bg-ink-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint opacity-30" />
        <div className="absolute inset-0 bg-radial-fade" />

        <div className="relative z-10 max-w-md">
          <Logo size="lg" />

          <h2 className="mt-8 text-3xl font-bold text-gradient leading-tight">
            Welcome back to your commerce command center.
          </h2>

          <p className="mt-4 text-ink-400">
            Manage AI agent traffic, OpenTabs, policies, and the Trust Ledger
            — all in one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'AI proposes. Policy decides.',
              'Every transaction audited.',
              'The merchant always remains in control.',
            ].map((text) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-sm text-ink-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIGN IN PANEL */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-ink-400">
            Enter your credentials to access your workspace.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@business.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ink-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-ink-600 bg-ink-800"
                />
                Remember me
              </label>

              <button
                type="button"
                className="text-electric-400 hover:text-electric-300"
                onClick={() =>
                  setAuthError(
                    'Password reset is not configured yet.'
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-electric-400 hover:text-electric-300 font-medium"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/"
              className="text-xs text-ink-500 hover:text-ink-300 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}