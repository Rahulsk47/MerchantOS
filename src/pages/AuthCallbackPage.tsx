import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const handleAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        if (data.session) {
          navigate('/onboarding', { replace: true });
        } else {
          setError(
            'Email verification could not be completed. Please try signing in.'
          );
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Verification failed. Please try again.'
        );
      }
    };

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <Logo />

        {!error ? (
          <>
            <div className="mt-8 mx-auto w-10 h-10 border-2 border-white/20 border-t-electric-400 rounded-full animate-spin" />

            <h1 className="mt-6 text-xl font-bold text-white">
              Verifying your account
            </h1>

            <p className="mt-2 text-sm text-ink-400">
              Please wait while we finish setting up your MerchantOS account.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-xl font-bold text-white">
              Verification problem
            </h1>

            <p className="mt-3 text-sm text-danger-300">
              {error}
            </p>

            <button
              onClick={() => navigate('/signin')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-electric-500 text-white text-sm font-medium"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}