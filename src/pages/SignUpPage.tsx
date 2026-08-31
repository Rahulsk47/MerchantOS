import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      errs.name = 'Name is required';
    }

    if (!email) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Enter a valid email';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 6) {
      errs.password = 'At least 6 characters';
    }

    if (!form.confirm) {
      errs.confirm = 'Please confirm your password';
    } else if (form.confirm !== form.password) {
      errs.confirm = 'Passwords do not match';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setAuthError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      /*
       * If Supabase email confirmation is enabled,
       * data.session will be null and the user must
       * verify their email first.
       */
      if (data.user && !data.session) {
        setSuccessMessage(
          'Account created successfully. Please check your email to verify your account.'
        );

        return;
      }

      /*
       * If email confirmation is disabled,
       * Supabase creates an active session immediately.
       */
      if (data.user && data.session) {
        navigate('/onboarding');
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative bg-ink-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint opacity-30" />
        <div className="absolute inset-0 bg-radial-fade" />

        <div className="relative z-10 max-w-md">
          <Logo size="lg" />

          <h2 className="mt-8 text-3xl font-bold text-gradient leading-tight">
            Prepare your business for AI commerce.
          </h2>

          <div className="mt-8 space-y-3">
            {[
              'Grow revenue with AI-powered insights.',
              'Make your catalog understandable to AI agents.',
              'Safely serve autonomous buyers with OpenTab.',
            ].map((text) => (
              <div
                key={text}
                className="flex items-start gap-2.5 text-sm text-ink-300"
              >
                <CheckCircle2 className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign up */}
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
            Create your account
          </h1>

          <p className="mt-2 text-sm text-ink-400">
            Start building your AI commerce workspace.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm">
              {authError}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-success-500/10 border border-success-500/30 text-success-300 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Full name"
              placeholder="Jane Merchant"
              icon={<User className="w-4 h-4" />}
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              error={errors.name}
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@business.com"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              error={errors.password}
              autoComplete="new-password"
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={form.confirm}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirm: e.target.value,
                })
              }
              error={errors.confirm}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-electric-400 hover:text-electric-300 font-medium"
            >
              Sign in
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