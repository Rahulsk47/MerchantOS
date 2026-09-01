import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      try {
        /*
         * Supabase may return the verification link with:
         *
         * ?code=xxxx
         *
         * We must exchange that code for a session.
         */

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        /*
         * After exchanging the code, retrieve the session.
         */

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) return;

        if (session) {
          /*
           * Verification successful.
           *
           * Send verified user to onboarding.
           */

          navigate('/onboarding', {
            replace: true,
          });

          return;
        }

        setError(
          'Your email could not be verified. The verification link may have expired. Please request a new verification email.'
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Email verification failed. Please try again.'
        );
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <Logo />

        {!error ? (
          <>
            <div className="mt-8 mx-auto w-10 h-10 border-2 border-white/20 border-t-electric-400 rounded-full animate-spin" />

            <h1 className="mt-6 text-xl font-bold text-white">
              Verifying your email
            </h1>

            <p className="mt-2 text-sm text-ink-400">
              Please wait while we verify your MerchantOS account.
            </p>
          </>
        ) : (
          <>
            <div className="mt-8 mx-auto w-12 h-12 rounded-full bg-danger-500/10 border border-danger-500/30 flex items-center justify-center">
              <span className="text-danger-400 text-xl">!</span>
            </div>

            <h1 className="mt-6 text-xl font-bold text-white">
              Verification failed
            </h1>

            <p className="mt-3 text-sm text-danger-300">
              {error}
            </p>

            <button
              onClick={() => navigate('/signin', { replace: true })}
              className="mt-6 px-5 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-white text-sm font-medium transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}