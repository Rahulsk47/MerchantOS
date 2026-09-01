import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

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

  const [businessName, setBusinessName] = useState(
    merchant.businessName ?? ''
  );

  const [industry, setIndustry] = useState(
    merchant.industry ?? ''
  );

  const [storeUrl, setStoreUrl] = useState(
    merchant.storeUrl ?? ''
  );

  const [contactEmail, setContactEmail] = useState(
    merchant.contactEmail ?? ''
  );

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  /*
   * ------------------------------------------------------------
   * CHECK AUTH
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError) {
          console.error(
            'Authentication check failed:',
            authError
          );

          navigate('/signin', {
            replace: true,
          });

          return;
        }

        if (!user) {
          navigate('/signin', {
            replace: true,
          });

          return;
        }

        setChecking(false);
      } catch (err) {
        console.error(
          'Auth check error:',
          err
        );

        if (mounted) {
          navigate('/signin', {
            replace: true,
          });
        }
      }
    };

    void checkAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /*
   * ------------------------------------------------------------
   * NORMALIZE STORE URL
   * ------------------------------------------------------------
   */

  const normalizeStoreUrl = (
    value: string
  ): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const url = trimmed.startsWith('http://') ||
        trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;

      new URL(url);

      return url;
    } catch {
      throw new Error(
        'Please enter a valid store URL.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * SUBMIT ONBOARDING
   * ------------------------------------------------------------
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    const cleanBusinessName =
      businessName.trim();

    const cleanIndustry =
      industry.trim();

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

    if (
      cleanContactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanContactEmail
      )
    ) {
      setError(
        'Please enter a valid business contact email.'
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * ----------------------------------------------------------
       * 1. GET CURRENT USER
       * ----------------------------------------------------------
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          `Authentication error: ${userError.message}`
        );
      }

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        );
      }

      /*
       * ----------------------------------------------------------
       * 2. NORMALIZE STORE URL
       * ----------------------------------------------------------
       */

      const cleanStoreUrl =
        normalizeStoreUrl(storeUrl);

      /*
       * ----------------------------------------------------------
       * 3. FIND EXISTING ORGANIZATION MEMBERSHIP
       * ----------------------------------------------------------
       */

      const {
        data: membership,
        error: membershipError,
      } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw new Error(
          `Unable to check your organization: ${membershipError.message}`
        );
      }

      let organizationId =
        membership?.organization_id
          ? String(membership.organization_id)
          : null;

      /*
       * ----------------------------------------------------------
       * 4. CREATE OR UPDATE ORGANIZATION
       * ----------------------------------------------------------
       */

      if (organizationId) {
        /*
         * Existing organization
         */

        const {
          error: updateError,
        } = await supabase
          .from('organizations')
          .update({
            name: cleanBusinessName,
            industry: cleanIndustry,
            store_url: cleanStoreUrl,
            contact_email:
              cleanContactEmail ||
              user.email ||
              null,
          })
          .eq('id', organizationId);

        if (updateError) {
          throw new Error(
            `Unable to update organization: ${updateError.message}`
          );
        }
      } else {
        /*
         * New organization
         */

        const {
          data: organization,
          error: organizationError,
        } = await supabase
          .from('organizations')
          .insert({
            name: cleanBusinessName,
            industry: cleanIndustry,
            store_url: cleanStoreUrl,
            contact_email:
              cleanContactEmail ||
              user.email ||
              null,
          })
          .select('id')
          .single();

        if (organizationError) {
          console.error(
            'Organization creation failed:',
            organizationError
          );

          throw new Error(
            `Unable to create your organization: ${organizationError.message}`
          );
        }

        if (!organization?.id) {
          throw new Error(
            'Organization was created, but no organization ID was returned.'
          );
        }

        organizationId = String(
          organization.id
        );

        /*
         * --------------------------------------------------------
         * 5. CREATE OWNER MEMBERSHIP
         * --------------------------------------------------------
         */

        const {
          error: createMembershipError,
        } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organizationId,
            user_id: user.id,
            role: 'owner',
          });

        if (createMembershipError) {
          console.error(
            'Membership creation failed:',
            createMembershipError
          );

          /*
           * Best-effort cleanup.
           */
          await supabase
            .from('organizations')
            .delete()
            .eq('id', organizationId);

          throw new Error(
            `Unable to create organization membership: ${createMembershipError.message}`
          );
        }
      }

      /*
       * ----------------------------------------------------------
       * 6. UPDATE LOCAL MERCHANT STATE
       * ----------------------------------------------------------
       */

      updateMerchant({
        businessName:
          cleanBusinessName,

        industry:
          cleanIndustry,

        storeUrl:
          cleanStoreUrl ?? '',

        contactEmail:
          cleanContactEmail ||
          user.email ||
          '',

        onboardingComplete: true,
      });

      /*
       * ----------------------------------------------------------
       * 7. REFRESH DATA
       * ----------------------------------------------------------
       */

      await refreshData();

      /*
       * ----------------------------------------------------------
       * 8. GO TO MERCHANTOS
       * ----------------------------------------------------------
       */

      navigate('/app', {
        replace: true,
      });
    } catch (err) {
      console.error(
        'Onboarding failed:',
        err
      );

      let message =
        'Unable to complete onboarding. Please try again.';

      if (err instanceof Error) {
        message = err.message;
      }

      /*
       * Give a useful message for common Supabase/RLS errors.
       */

      if (
        message.toLowerCase().includes(
          'row-level security'
        )
      ) {
        message =
          'Supabase blocked organization creation because of Row Level Security. Please check the organizations INSERT policy.';
      }

      if (
        message.toLowerCase().includes(
          'permission denied'
        )
      ) {
        message =
          'Supabase denied access to the organization tables. Please check your RLS policies.';
      }

      if (
        message.toLowerCase().includes(
          'duplicate'
        )
      ) {
        message =
          'This account already has an organization. Please refresh and continue.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

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

          {/* BUSINESS NAME */}

          <div>
            <label
              htmlFor="businessName"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Business name
            </label>

            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(event) =>
                setBusinessName(
                  event.target.value
                )
              }
              placeholder="Acme Commerce"
              disabled={loading}
              autoComplete="organization"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
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
              type="text"
              value={industry}
              onChange={(event) =>
                setIndustry(
                  event.target.value
                )
              }
              placeholder="Fashion, electronics, beauty..."
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
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
              type="text"
              inputMode="url"
              value={storeUrl}
              onChange={(event) =>
                setStoreUrl(
                  event.target.value
                )
              }
              placeholder="https://yourstore.com"
              disabled={loading}
              autoComplete="url"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* CONTACT EMAIL */}

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
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
            >
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