import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase, DEMO_ORG_ID } from '@/lib/supabase';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return;
    }

    // Add user to demo organization as owner
    if (data.user) {
      await supabase.from('organization_members').upsert({
        organization_id: DEMO_ORG_ID,
        user_id: data.user.id,
        role: 'owner',
      }, { onConflict: 'organization_id,user_id' });
    }

    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative bg-ink-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint opacity-30" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative z-10 max-w-md">
          <Logo size="lg" />
          <h2 className="mt-8 text-3xl font-bold text-gradient leading-tight">
            Prepare your business for AI commerce.
          </h2>
          <div className="mt-8 space-y-3">
            {['Grow revenue with AI-powered insights.', 'Make your catalog understandable to AI agents.', 'Safely serve autonomous buyers with OpenTab.'].map((t) => (
              <div key={t} className="flex items-start gap-2.5 text-sm text-ink-300">
                <CheckCircle2 className="w-4 h-4 text-electric-400 mt-0.5 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-ink-400">Start building your AI commerce workspace.</p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-300 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Full name" placeholder="Jane Merchant" icon={<User className="w-4 h-4" />}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="Email" type="email" placeholder="you@business.com" icon={<Mail className="w-4 h-4" />}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            <Input label="Password" type="password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
            <Input label="Confirm password" type="password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />}
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-electric-400 hover:text-electric-300 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
