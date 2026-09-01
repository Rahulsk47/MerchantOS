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

type FormState = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

type FormErrors = Record<string, string>;

export default function SignUpPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));

    setAuthError('');
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrors({});
    setAuthError('');
    setSuccessMessage('');

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    const validationErrors: FormErrors = {};

    if (!name) {
      validationErrors.name = 'Name is required.';
    }

    if (!email) {
      validationErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = 'Enter a valid email.';
    }

    if (!form.password) {
      validationErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      validationErrors.password = 'At least 6 characters.';
    }

    if (!form.confirm) {
      validationErrors.confirm = 'Please confirm your password.';
    } else if (form.confirm !== form.password) {
      validationErrors.confirm = 'Passwords do not match.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (!data.user) {
        setAuthError(
          'Account creation failed. Please try again.'
        );
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          'Account created successfully. Check your email and click the verification link to continue.'
        );
        return;
      }

      navigate('/onboarding', {
        replace: true,
      });
    } catch (error) {
      console.error('Sign up error:', error);

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
      {/* LEFT PANEL */}
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

      {/* SIGN UP */}
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
            <div
              role="alert"
              className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm"
            >
              {authError}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mt-4 p-4 rounded-xl bg-success-500/10 border border-success-500/30 text-success-300 text-sm"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />

                <div>
                  <p className="font-medium">
                    Check your email
                  </p>

                  <p className="mt-1 text-success-300/80">
                    {successMessage}
                  </p>

                  <p className="mt-3 text-xs text-success-300/60">
                    Open the verification email and click the
                    verification button. You will then be taken to
                    MerchantOS onboarding.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
            noValidate
          >
            <Input
              label="Full name"
              placeholder="Jane Merchant"
              icon={<User className="w-4 h-4" />}
              value={form.name}
              onChange={(event) =>
                updateField('name', event.target.value)
              }
              error={errors.name}
              autoComplete="name"
              disabled={loading}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@business.com"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(event) =>
                updateField('email', event.target.value)
              }
              error={errors.email}
              autoComplete="email"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(event) =>
                updateField('password', event.target.value)
              }
              error={errors.password}
              autoComplete="new-password"
              disabled={loading}
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={form.confirm}
              onChange={(event) =>
                updateField('confirm', event.target.value)
              }
              error={errors.confirm}
              autoComplete="new-password"
              disabled={loading}
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