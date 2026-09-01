import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useApp } from '../lib/store';

export default function OnboardingPage() {
  const navigate = useNavigate();

  const {
    merchant,
    updateMerchant,
    refreshData,
  } = useApp();

  const [businessName, setBusinessName] =
    useState(
      merchant.businessName ?? ''
    );

  const [industry, setIndustry] =
    useState(
      merchant.industry ?? ''
    );

  const [storeUrl, setStoreUrl] =
    useState(
      merchant.storeUrl ?? ''
    );

  const [contactEmail, setContactEmail] =
    useState(
      merchant.contactEmail ?? ''
    );

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [error, setError] =
    useState('');

  /* ============================================================
     CHECK AUTH
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        navigate('/signin', {
          replace: true,
        });

        return;
      }

      setChecking(false);
    };

    void checkAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError('');

    const cleanBusinessName =
      businessName.trim();

    const cleanIndustry =
      industry.trim();

    const cleanStoreUrl =
      storeUrl.trim();

    const cleanContactEmail =
      contactEmail.trim();

    if (!cleanBusinessName) {
      setError(
        'Please enter your business name.'
      );

      return;
    }

    if (!cleanIndustry) {
      setError(
        'Please enter your industry.'
      );

      return;
    }

    setLoading(true);

    try {
      /* ========================================================
         GET AUTH USER
      ======================================================== */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        );
      }

      /* ========================================================
         CHECK EXISTING MEMBERSHIP
      ======================================================== */

      const {
        data: existingMembership,
        error: membershipLookupError,
      } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (membershipLookupError) {
        throw membershipLookupError;
      }

      let organizationId =
        existingMembership?.organization_id ??
        null;

      /* ========================================================
         CREATE ORGANIZATION IF NEEDED
      ======================================================== */

      if (!organizationId) {
        const {
          data: organization,
          error:
            organizationError,
        } = await supabase
          .from('organizations')
          .insert({
            name: cleanBusinessName,

            industry:
              cleanIndustry,

            store_url:
              cleanStoreUrl || null,

            contact_email:
              cleanContactEmail ||
              user.email ||
              null,
          })
          .select('id')
          .single();

        if (organizationError) {
          throw organizationError;
        }

        if (!organization?.id) {
          throw new Error(
            'Organization was created but no organization ID was returned.'
          );
        }

        organizationId =
          String(organization.id);

        /* ======================================================
           CREATE MEMBERSHIP
        ====================================================== */

        const {
          error:
            membershipError,
        } = await supabase
          .from('organization_members')
          .insert({
            organization_id:
              organizationId,

            user_id: user.id,

            role: 'owner',
          });

        if (membershipError) {
          /* -----------------------------------------------
             Cleanup orphan organization if membership
             creation fails.
          ------------------------------------------------ */

          await supabase
            .from('organizations')
            .delete()
            .eq(
              'id',
              organizationId
            );

          throw membershipError;
        }
      } else {
        /* ======================================================
           UPDATE EXISTING ORGANIZATION
        ====================================================== */

        const {
          error:
            organizationUpdateError,
        } = await supabase
          .from('organizations')
          .update({
            name: cleanBusinessName,

            industry:
              cleanIndustry,

            store_url:
              cleanStoreUrl || null,

            contact_email:
              cleanContactEmail ||
              user.email ||
              null,
          })
          .eq(
            'id',
            organizationId
          );

        if (organizationUpdateError) {
          throw organizationUpdateError;
        }
      }

      /* ========================================================
         UPDATE LOCAL STATE
      ======================================================== */

      updateMerchant({
        businessName:
          cleanBusinessName,

        industry:
          cleanIndustry,

        storeUrl:
          cleanStoreUrl,

        contactEmail:
          cleanContactEmail ||
          user.email ||
          '',

        onboardingComplete: true,
      });

      /* ========================================================
         REFRESH EVERYTHING FROM DATABASE
      ======================================================== */

      await refreshData();

      /* ========================================================
         GO TO APP
      ======================================================== */

      navigate('/app', {
        replace: true,
      });
    } catch (err) {
      console.error(
        'Onboarding error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete onboarding. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* HEADER */}

        <div className="mb-10">
          <div className="mb-5 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />

            <span>
              MerchantOS setup
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">
            Build your commerce command center.
          </h1>

          <p className="mt-4 max-w-xl text-zinc-400">
            Tell MerchantOS about your business.
            This information will be used to
            configure your merchant organization
            and AI commerce profile.
          </p>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* BUSINESS */}

          <div>
            <label
              htmlFor="businessName"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Business name
            </label>

            <input
              id="businessName"
              value={businessName}
              onChange={(event) =>
                setBusinessName(
                  event.target.value
                )
              }
              placeholder="Acme Commerce"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* INDUSTRY */}

          <div>
            <label
              htmlFor="industry"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Industry
            </label>

            <input
              id="industry"
              value={industry}
              onChange={(event) =>
                setIndustry(
                  event.target.value
                )
              }
              placeholder="Fashion, electronics, beauty..."
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* STORE URL */}

          <div>
            <label
              htmlFor="storeUrl"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Store URL
              <span className="ml-2 text-zinc-500">
                optional
              </span>
            </label>

            <input
              id="storeUrl"
              type="url"
              value={storeUrl}
              onChange={(event) =>
                setStoreUrl(
                  event.target.value
                )
              }
              placeholder="https://yourstore.com"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label
              htmlFor="contactEmail"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Business contact email
              <span className="ml-2 text-zinc-500">
                optional
              </span>
            </label>

            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(event) =>
                setContactEmail(
                  event.target.value
                )
              }
              placeholder="commerce@yourstore.com"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Setting up MerchantOS...
              </>
            ) : (
              <>
                Continue to MerchantOS

                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}