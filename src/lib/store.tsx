import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type {
  RealtimeChannel,
} from '@supabase/supabase-js';

import type {
  AgentIdentity,
  Product,
  OpenTab,
  Transaction,
  LedgerEvent,
  GrowthOpportunity,
  Policy,
  MerchantProfile,
  Toast,
  TxnDecision,
  TxnStage,
} from './types';

import { supabase } from './supabase';
import { uid } from './utils';

/* ============================================================
   TYPES
============================================================ */

interface AppState {
  merchant: MerchantProfile;
  agents: AgentIdentity[];
  products: Product[];
  openTabs: OpenTab[];
  transactions: Transaction[];
  ledger: LedgerEvent[];
  opportunities: GrowthOpportunity[];
  policies: Policy[];
  toasts: Toast[];
  authed: boolean;
  loading: boolean;
}

interface AppContextValue extends AppState {
  setAuthed: (value: boolean) => void;

  updateMerchant: (
    patch: Partial<MerchantProfile>
  ) => void;

  updatePolicy: (
    id: string,
    patch: Partial<Policy>
  ) => void;

  togglePolicy: (
    id: string
  ) => Promise<void>;

  setOpportunityStatus: (
    id: string,
    status: GrowthOpportunity['status']
  ) => Promise<void>;

  setAgentStatus: (
    id: string,
    status: AgentIdentity['status']
  ) => Promise<void>;

  createOpenTab: (
    tab: Omit<
      OpenTab,
      'id' | 'createdAt' | 'remaining' | 'status'
    >
  ) => Promise<OpenTab>;

  pauseOpenTab: (
    id: string
  ) => Promise<void>;

  revokeOpenTab: (
    id: string
  ) => Promise<void>;

  addTransaction: (
    txn: Transaction
  ) => void;

  approveEscalatedTransaction: (
    id: string
  ) => Promise<void>;

  declineEscalatedTransaction: (
    id: string
  ) => Promise<void>;

  pushToast: (
    toast: Omit<Toast, 'id'>
  ) => void;

  dismissToast: (
    id: string
  ) => void;

  addLedgerEvent: (
    event: Omit<LedgerEvent, 'id'>
  ) => void;

  evaluateTransaction: (params: {
    agentId: string;
    products: {
      name: string;
      price: number;
    }[];
    openTabId?: string;
  }) => Promise<{
    decision: TxnDecision;
    reason: string;
    stages: TxnStage[];
    amount: number;
    transactionId?: string;
    transactionRequestId?: string;
  }>;

  signOut: () => Promise<void>;

  refreshData: () => Promise<void>;
}

/* ============================================================
   CONTEXT
============================================================ */

const AppContext =
  createContext<AppContextValue | null>(null);

/* ============================================================
   FALLBACK MERCHANT
============================================================ */

const fallbackMerchant: MerchantProfile = {
  businessName: '',
  industry: '',
  storeUrl: '',
  contactEmail: '',
  aiReadiness: 0,
  onboardingComplete: false,

  boundaries: {
    maxDiscount: 15,
    minMargin: 12,
    autoApproveThreshold: 5000,
    maxTxnAmount: 25000,
  },
};

/* ============================================================
   AVATAR COLORS
============================================================ */

const avatarColors = [
  'from-electric-500 to-accent-500',
  'from-success-500 to-accent-500',
  'from-warning-500 to-danger-500',
  'from-warning-500 to-electric-500',
];

/* ============================================================
   HELPERS
============================================================ */

function timeAgoShort(
  iso: string
): string {
  const timestamp =
    new Date(iso).getTime();

  if (Number.isNaN(timestamp)) {
    return '—';
  }

  const diff =
    Math.max(
      0,
      Date.now() - timestamp
    );

  const mins =
    Math.floor(diff / 60000);

  if (mins < 1) {
    return 'just now';
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs =
    Math.floor(mins / 60);

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  return `${Math.floor(hrs / 24)}d ago`;
}

/* ============================================================
   MAP AGENT
============================================================ */

function mapAgent(
  row: Record<string, unknown>,
  index: number
): AgentIdentity {
  const permissions =
    row.permissions &&
    typeof row.permissions === 'object'
      ? (row.permissions as Record<
          string,
          unknown
        >)
      : {};

  const permissionLevel =
    permissions.max_scope === 'full'
      ? 'full'
      : permissions.max_scope === 'limited'
        ? 'limited'
        : 'public';

  const authStatus =
    row.trust_level === 'unknown'
      ? 'unauthenticated'
      : 'authenticated';

  return {
    id: String(row.id ?? ''),

    name: String(
      row.agent_name ?? ''
    ),

    organization: String(
      row.provider_name ?? ''
    ),

    provider: String(
      row.agent_identifier ?? ''
    ),

    trustLevel:
      row.trust_level as AgentIdentity['trustLevel'],

    authStatus:
      authStatus as AgentIdentity['authStatus'],

    permissionLevel:
      permissionLevel as AgentIdentity['permissionLevel'],

    status:
      row.status as AgentIdentity['status'],

    lastActivity: row.last_activity_at
      ? timeAgoShort(
          String(row.last_activity_at)
        )
      : '—',

    avatarColor:
      avatarColors[
        index % avatarColors.length
      ],

    activity: [],
  };
}

/* ============================================================
   MAP PRODUCT
============================================================ */

function mapProduct(
  row: Record<string, unknown>
): Product {
  return {
    id: String(row.id ?? ''),

    name: String(
      row.name ?? ''
    ),

    category: String(
      row.category ?? ''
    ),

    price: Number(
      row.price ?? 0
    ),

    inventory: Number(
      row.inventory_quantity ?? 0
    ),

    image: String(
      row.image_url ?? 'package'
    ),

    aiReadiness:
      row.ai_readiness_status ===
      'healthy'
        ? 90
        : row.ai_readiness_status ===
            'needs_attention'
          ? 72
          : 50,

    readinessIssues: [],

    description: String(
      row.description ?? ''
    ),

    shipping: String(
      row.shipping_info ?? ''
    ),

    returns: String(
      row.return_policy ?? ''
    ),
  };
}

/* ============================================================
   MAP OPEN TAB
============================================================ */

function mapOpenTab(
  row: Record<string, unknown>,
  agentName: string,
  trustLevel: string
): OpenTab {
  const allowedCategories =
    Array.isArray(
      row.allowed_categories
    )
      ? row.allowed_categories.filter(
          (item): item is string =>
            typeof item === 'string'
        )
      : [];

  return {
    id: String(row.id ?? ''),

    agentId: String(
      row.agent_id ?? ''
    ),

    agentName,

    trustLevel:
      trustLevel as OpenTab['trustLevel'],

    scope: allowedCategories,

    cap: Number(
      row.authorization_cap ?? 0
    ),

    remaining: Number(
      row.remaining_amount ?? 0
    ),

    autoApproveCeiling: Number(
      row.auto_approval_ceiling ?? 0
    ),

    expiresAt: row.expires_at
      ? new Date(
          String(row.expires_at)
        ).toLocaleString(
          'en-IN',
          {
            hour: 'numeric',
            minute: '2-digit',
          }
        )
      : '—',

    status:
      row.status as OpenTab['status'],

    createdAt: row.created_at
      ? new Date(
          String(row.created_at)
        ).toLocaleString(
          'en-IN',
          {
            hour: 'numeric',
            minute: '2-digit',
          }
        )
      : '—',
  };
}

/* ============================================================
   MAP TRANSACTION
============================================================ */

function mapTransaction(
  row: Record<string, unknown>,
  agentName: string,
  trustLevel: string
): Transaction {
  const status = String(
    row.status ?? 'pending'
  );

  const decision: TxnDecision =
    status === 'approved' ||
    status === 'confirmed'
      ? 'approved'
      : status === 'declined'
        ? 'declined'
        : 'escalated';

  const paymentStatus: Transaction['paymentStatus'] =
    status === 'confirmed'
      ? 'confirmed'
      : status === 'payment_pending'
        ? 'initiated'
        : status === 'declined'
          ? 'failed'
          : status === 'escalated'
            ? 'awaiting_approval'
            : 'pending';

  const transactionProducts =
    Array.isArray(row.products)
      ? row.products.filter(
          (
            item
          ): item is {
            name: string;
            price: number;
          } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (
              item as {
                name?: unknown;
              }
            ).name === 'string'
        ).map((item) => ({
          name: item.name,
          price: Number(
            item.price ?? 0
          ),
        }))
      : [];

  return {
    id: String(row.id ?? ''),

    agentId: String(
      row.agent_id ?? ''
    ),

    agentName,

    trustLevel:
      trustLevel as Transaction['trustLevel'],

    products: transactionProducts,

    amount: Number(
      row.amount ?? 0
    ),

    openTabId: row.open_tab_id
      ? String(row.open_tab_id)
      : undefined,

    decision,

    reason: String(
      row.decision_reason ?? ''
    ),

    paymentStatus,

    stages: [],

    timestamp: row.created_at
      ? String(row.created_at)
      : new Date().toISOString(),
  };
}

/* ============================================================
   MAP LEDGER
============================================================ */

function mapLedger(
  row: Record<string, unknown>
): LedgerEvent {
  const eventType = String(
    row.event_type ?? ''
  );

  return {
    id: String(
      row.id ?? ''
    ),

    time: row.created_at
      ? new Date(
          String(row.created_at)
        ).toLocaleTimeString(
          'en-IN',
          {
            hour: 'numeric',
            minute: '2-digit',
          }
        )
      : '—',

    what:
      eventTypeToLabel(
        eventType
      ),

    why: String(
      row.reason ?? ''
    ),

    who: String(
      row.actor_id ?? ''
    ),

    whoType:
      row.actor_type as LedgerEvent['whoType'],

    transactionId:
      row.transaction_id
        ? String(
            row.transaction_id
          )
        : undefined,

    decision:
      eventType.includes(
        'APPROVED'
      )
        ? 'approved'
        : eventType.includes(
              'DECLINED'
            )
          ? 'declined'
          : undefined,
  };
}

/* ============================================================
   MAP OPPORTUNITY
============================================================ */

function mapOpportunity(
  row: Record<string, unknown>
): GrowthOpportunity {
  const supportingData =
    row.supporting_data &&
    typeof row.supporting_data ===
      'object'
      ? (row.supporting_data as Record<
          string,
          unknown
        >)
      : {};

  const opportunityProducts =
    Array.isArray(
      supportingData.products
    )
      ? supportingData.products.filter(
          (
            item
          ): item is string =>
            typeof item === 'string'
        )
      : [];

  return {
    id: String(
      row.id ?? ''
    ),

    type: String(
      row.opportunity_type ??
        'general'
    ) as GrowthOpportunity['type'],

    title: String(
      row.title ?? ''
    ),

    description: String(
      row.description ?? ''
    ),

    impact: Number(
      row.estimated_revenue_impact ??
        row.estimated_revenue ??
        0
    ),

    confidence: String(
      row.confidence_level ??
        'medium'
    ) as GrowthOpportunity['confidence'],

    risk: String(
      row.risk_level ??
        'medium'
    ) as GrowthOpportunity['risk'],

    products:
      opportunityProducts,

    status: String(
      row.status ?? 'new'
    ) as GrowthOpportunity['status'],
  };
}

/* ============================================================
   MAP POLICY
============================================================ */

function mapPolicy(
  row: Record<string, unknown>
): Policy {
  const rules =
    row.rules &&
    typeof row.rules === 'object'
      ? (row.rules as Record<
          string,
          unknown
        >)
      : {};

  let value = '';

  if (
    rules.max_discount_percent !==
    undefined
  ) {
    value = `${rules.max_discount_percent}%`;
  } else if (
    rules.min_margin_percent !==
    undefined
  ) {
    value = `${rules.min_margin_percent}%`;
  } else if (
    rules.max_txn_amount !==
    undefined
  ) {
    value = `₹${Number(
      rules.max_txn_amount
    ).toLocaleString('en-IN')}`;
  } else if (
    Array.isArray(
      rules.allowed_categories
    )
  ) {
    value =
      rules.allowed_categories
        .filter(
          (
            item
          ): item is string =>
            typeof item === 'string'
        )
        .join(', ');
  } else if (
    rules.max_requests_per_min !==
    undefined
  ) {
    value = `${rules.max_requests_per_min} / min`;
  } else if (
    Array.isArray(
      rules.allowed_trust_levels
    )
  ) {
    value =
      rules.allowed_trust_levels
        .filter(
          (
            item
          ): item is string =>
            typeof item === 'string'
        )
        .join(' + ');
  } else if (
    rules.auto_approve_ceiling !==
    undefined
  ) {
    value = `₹${Number(
      rules.auto_approve_ceiling
    ).toLocaleString('en-IN')}`;
  } else if (
    rules.human_approval_threshold !==
    undefined
  ) {
    value = `₹${Number(
      rules.human_approval_threshold
    ).toLocaleString('en-IN')}`;
  }

  return {
    id: String(
      row.id ?? ''
    ),

    category: String(
      row.policy_type ?? ''
    ) as Policy['category'],

    name: String(
      row.name ?? ''
    ),

    description: String(
      row.description ?? ''
    ),

    value,

    enabled:
      Boolean(row.enabled),
  };
}

/* ============================================================
   EVENT LABELS
============================================================ */

function eventTypeToLabel(
  eventType: string
): string {
  const labels: Record<
    string,
    string
  > = {
    PAYMENT_CONFIRMED:
      'Payment confirmed',

    TRANSACTION_APPROVED:
      'Transaction approved',

    TRANSACTION_DECLINED:
      'Transaction declined',

    POLICY_EVALUATED:
      'Merchant policy satisfied',

    OPEN_TAB_VALIDATED:
      'Spending limit validated',

    OPEN_TAB_CREATED:
      'OpenTab activated',

    OPEN_TAB_PAUSED:
      'Agent paused by merchant',

    OPEN_TAB_REVOKED:
      'OpenTab revoked',

    TRANSACTION_REQUESTED:
      'Agent requested purchase',

    AGENT_DISCOVERED_CATALOG:
      'Verified AI agent discovered catalog',

    HUMAN_APPROVAL_REQUESTED:
      'Human approval requested',

    AGENT_VERIFIED:
      'Agent verified',

    PAYMENT_SIMULATED:
      'Payment simulated',

    IDENTITY_VALIDATED:
      'Identity validated',
  };

  return (
    labels[eventType] ??
    eventType
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    merchant,
    setMerchant,
  ] =
    useState<MerchantProfile>(
      fallbackMerchant
    );

  const [
    agents,
    setAgents,
  ] = useState<AgentIdentity[]>(
    []
  );

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    []
  );

  const [
    openTabs,
    setOpenTabs,
  ] = useState<OpenTab[]>(
    []
  );

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>(
    []
  );

  const [
    ledger,
    setLedger,
  ] = useState<LedgerEvent[]>(
    []
  );

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<GrowthOpportunity[]>(
      []
    );

  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>(
    []
  );

  const [
    toasts,
    setToasts,
  ] = useState<Toast[]>(
    []
  );

  const [
    authed,
    setAuthed,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const organizationIdRef =
    useRef<string | null>(
      null
    );

  const realtimeChannels =
    useRef<RealtimeChannel[]>(
      []
    );

  const refreshInProgress =
    useRef(false);

  /* ============================================================
     TOASTS
  ============================================================ */

  const pushToast = useCallback(
    (
      toast: Omit<Toast, 'id'>
    ) => {
      const id = uid('toast');

      setToasts(
        (previous) => [
          ...previous,
          {
            ...toast,
            id,
          },
        ]
      );

      window.setTimeout(
        () => {
          setToasts(
            (previous) =>
              previous.filter(
                (item) =>
                  item.id !== id
              )
          );
        },
        toast.duration ?? 4000
      );
    },
    []
  );

  const dismissToast =
    useCallback(
      (id: string) => {
        setToasts(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !== id
            )
        );
      },
      []
    );

  /* ============================================================
     ORGANIZATION
  ============================================================ */

  const getCurrentOrganizationId =
    useCallback(
      async (): Promise<
        string | null
      > => {
        if (
          organizationIdRef.current
        ) {
          return organizationIdRef.current;
        }

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          return null;
        }

        const {
          data: membership,
          error,
        } =
          await supabase
            .from(
              'organization_members'
            )
            .select(
              'organization_id'
            )
            .eq(
              'user_id',
              user.id
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            )
            .limit(1)
            .maybeSingle();

        if (error) {
          console.error(
            'Organization lookup failed:',
            error
          );

          return null;
        }

        if (
          !membership?.organization_id
        ) {
          return null;
        }

        organizationIdRef.current =
          String(
            membership.organization_id
          );

        return organizationIdRef.current;
      },
      []
    );

  /* ============================================================
     CLEAR DATA
  ============================================================ */

  const clearData =
    useCallback(() => {
      organizationIdRef.current =
        null;

      setMerchant(
        fallbackMerchant
      );

      setAgents([]);
      setProducts([]);
      setOpenTabs([]);
      setTransactions([]);
      setLedger([]);
      setOpportunities([]);
      setPolicies([]);
    }, []);

  /* ============================================================
     REFRESH DATA
  ============================================================ */

  const refreshData =
    useCallback(
      async () => {
        if (
          refreshInProgress.current
        ) {
          return;
        }

        refreshInProgress.current =
          true;

        try {
          const organizationId =
            await getCurrentOrganizationId();

          if (!organizationId) {
            clearData();
            return;
          }

          const [
            agentsRes,
            productsRes,
            tabsRes,
            txnsRes,
            ledgerRes,
            oppsRes,
            policiesRes,
            orgRes,
          ] =
            await Promise.all([
              supabase
                .from('agents')
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at'
                ),

              supabase
                .from('products')
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at'
                ),

              supabase
                .from('open_tabs')
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from('transactions')
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from(
                  'trust_ledger_events'
                )
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  }
                )
                .limit(50),

              supabase
                .from(
                  'revenue_opportunities'
                )
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'created_at'
                ),

              supabase
                .from('policies')
                .select('*')
                .eq(
                  'organization_id',
                  organizationId
                )
                .order(
                  'priority'
                ),

              supabase
                .from(
                  'organizations'
                )
                .select('*')
                .eq(
                  'id',
                  organizationId
                )
                .maybeSingle(),
            ]);

          if (agentsRes.error) {
            console.error(
              'Agents:',
              agentsRes.error
            );
          }

          if (productsRes.error) {
            console.error(
              'Products:',
              productsRes.error
            );
          }

          if (tabsRes.error) {
            console.error(
              'OpenTabs:',
              tabsRes.error
            );
          }

          if (txnsRes.error) {
            console.error(
              'Transactions:',
              txnsRes.error
            );
          }

          if (ledgerRes.error) {
            console.error(
              'Ledger:',
              ledgerRes.error
            );
          }

          if (oppsRes.error) {
            console.error(
              'Opportunities:',
              oppsRes.error
            );
          }

          if (policiesRes.error) {
            console.error(
              'Policies:',
              policiesRes.error
            );
          }

          if (orgRes.error) {
            console.error(
              'Organization:',
              orgRes.error
            );
          }

          /* ----------------------------------------------------
             AGENTS
          ---------------------------------------------------- */

          const agentRows =
            (agentsRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          const mappedAgents =
            agentRows.map(
              mapAgent
            );

          setAgents(
            mappedAgents
          );

          /* ----------------------------------------------------
             PRODUCTS
          ---------------------------------------------------- */

          const productRows =
            (productsRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setProducts(
            productRows.map(
              mapProduct
            )
          );

          /* ----------------------------------------------------
             AGENT MAP
          ---------------------------------------------------- */

          const agentMap =
            new Map(
              mappedAgents.map(
                (agent) => [
                  agent.id,
                  agent,
                ]
              )
            );

          /* ----------------------------------------------------
             OPEN TABS
          ---------------------------------------------------- */

          const tabRows =
            (tabsRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setOpenTabs(
            tabRows.map(
              (row) => {
                const agent =
                  agentMap.get(
                    String(
                      row.agent_id ??
                        ''
                    )
                  );

                return mapOpenTab(
                  row,
                  agent?.name ??
                    'Unknown',
                  agent?.trustLevel ??
                    'unknown'
                );
              }
            )
          );

          /* ----------------------------------------------------
             TRANSACTIONS
          ---------------------------------------------------- */

          const txnRows =
            (txnsRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setTransactions(
            txnRows.map(
              (row) => {
                const agent =
                  agentMap.get(
                    String(
                      row.agent_id ??
                        ''
                    )
                  );

                return mapTransaction(
                  row,
                  agent?.name ??
                    'Unknown',
                  agent?.trustLevel ??
                    'unknown'
                );
              }
            )
          );

          /* ----------------------------------------------------
             LEDGER
          ---------------------------------------------------- */

          const ledgerRows =
            (ledgerRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setLedger(
            ledgerRows.map(
              mapLedger
            )
          );

          /* ----------------------------------------------------
             OPPORTUNITIES
          ---------------------------------------------------- */

          const opportunityRows =
            (oppsRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setOpportunities(
            opportunityRows.map(
              mapOpportunity
            )
          );

          /* ----------------------------------------------------
             POLICIES
          ---------------------------------------------------- */

          const policyRows =
            (policiesRes.data ??
              []) as Record<
              string,
              unknown
            >[];

          setPolicies(
            policyRows.map(
              mapPolicy
            )
          );

          /* ----------------------------------------------------
             ORGANIZATION
          ---------------------------------------------------- */

          if (
            orgRes.data
          ) {
            const org =
              orgRes.data as Record<
                string,
                unknown
              >;

            setMerchant(
              (previous) => ({
                ...previous,

                businessName:
                  String(
                    org.name ??
                      previous.businessName ??
                      ''
                  ),

                industry:
                  String(
                    org.industry ??
                      previous.industry ??
                      ''
                  ),

                storeUrl:
                  String(
                    org.store_url ??
                      previous.storeUrl ??
                      ''
                  ),

                contactEmail:
                  String(
                    org.contact_email ??
                      previous.contactEmail ??
                      ''
                  ),

                onboardingComplete:
                  true,
              })
            );
          }
        } catch (error) {
          console.error(
            'refreshData error:',
            error
          );
        } finally {
          refreshInProgress.current =
            false;
        }
      },
      [
        getCurrentOrganizationId,
        clearData,
      ]
    );

  /* ============================================================
     AUTH INITIALIZATION
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        try {
          const {
            data: {
              session,
            },
            error,
          } =
            await supabase.auth.getSession();

          if (!mounted) {
            return;
          }

          if (error) {
            console.error(
              'Session lookup error:',
              error
            );

            setAuthed(false);
            clearData();

            return;
          }

          if (session) {
            setAuthed(true);

            organizationIdRef.current =
              null;

            await refreshData();
          } else {
            setAuthed(false);
            clearData();
          }
        } catch (error) {
          console.error(
            'Auth initialization error:',
            error
          );

          if (mounted) {
            setAuthed(false);
            clearData();
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    void initializeAuth();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          if (!session) {
            setAuthed(false);
            clearData();
            return;
          }

          setAuthed(true);

          organizationIdRef.current =
            null;

          /*
           * Do not perform Supabase calls directly
           * inside onAuthStateChange.
           */
          window.setTimeout(() => {
            if (mounted) {
              void refreshData();
            }
          }, 0);
        }
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, [
    clearData,
    refreshData,
  ]);

  /* ============================================================
     REALTIME
  ============================================================ */

  useEffect(() => {
    if (!authed) {
      return;
    }

    const channel =
      supabase
        .channel(
          `merchantos-realtime-${uid(
            'channel'
          )}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'transaction_requests',
          },
          () => {
            void refreshData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'transactions',
          },
          () => {
            void refreshData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'open_tabs',
          },
          () => {
            void refreshData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'trust_ledger_events',
          },
          () => {
            void refreshData();
          }
        )
        .subscribe();

    realtimeChannels.current =
      [
        ...realtimeChannels.current,
        channel,
      ];

    return () => {
      void supabase.removeChannel(
        channel
      );

      realtimeChannels.current =
        realtimeChannels.current.filter(
          (item) =>
            item !== channel
        );
    };
  }, [
    authed,
    refreshData,
  ]);

  /* ============================================================
     MERCHANT
  ============================================================ */

  const updateMerchant =
    useCallback(
      (
        patch: Partial<MerchantProfile>
      ) => {
        setMerchant(
          (previous) => ({
            ...previous,
            ...patch,
          })
        );
      },
      []
    );

  /* ============================================================
     POLICY
  ============================================================ */

  const updatePolicy =
    useCallback(
      (
        id: string,
        patch: Partial<Policy>
      ) => {
        setPolicies(
          (previous) =>
            previous.map(
              (policy) =>
                policy.id === id
                  ? {
                      ...policy,
                      ...patch,
                    }
                  : policy
            )
        );
      },
      []
    );

  const togglePolicy =
    useCallback(
      async (id: string) => {
        const policy =
          policies.find(
            (item) =>
              item.id === id
          );

        if (!policy) {
          return;
        }

        const enabled =
          !policy.enabled;

        setPolicies(
          (previous) =>
            previous.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      enabled,
                    }
                  : item
            )
        );

        const { error } =
          await supabase
            .from('policies')
            .update({
              enabled,
            })
            .eq(
              'id',
              id
            );

        if (error) {
          setPolicies(
            (previous) =>
              previous.map(
                (item) =>
                  item.id === id
                    ? {
                        ...item,
                        enabled:
                          policy.enabled,
                      }
                    : item
              )
          );

          pushToast({
            type: 'error',
            title:
              'Policy update failed',
            message:
              error.message,
          });
        }
      },
      [
        policies,
        pushToast,
      ]
    );

  /* ============================================================
     OPPORTUNITY
  ============================================================ */

  const setOpportunityStatus =
    useCallback(
      async (
        id: string,
        status: GrowthOpportunity['status']
      ) => {
        const previous =
          opportunities.find(
            (item) =>
              item.id === id
          );

        setOpportunities(
          (items) =>
            items.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      status,
                    }
                  : item
            )
        );

        const { error } =
          await supabase
            .from(
              'revenue_opportunities'
            )
            .update({
              status,
            })
            .eq(
              'id',
              id
            );

        if (error) {
          console.error(
            'Opportunity update error:',
            error
          );

          if (previous) {
            setOpportunities(
              (items) =>
                items.map(
                  (item) =>
                    item.id === id
                      ? previous
                      : item
                )
            );
          }

          pushToast({
            type: 'error',
            title:
              'Opportunity update failed',
            message:
              error.message,
          });
        }
      },
      [
        opportunities,
        pushToast,
      ]
    );

  /* ============================================================
     AGENT STATUS
  ============================================================ */

  const setAgentStatus =
    useCallback(
      async (
        id: string,
        status: AgentIdentity['status']
      ) => {
        const previousAgent =
          agents.find(
            (agent) =>
              agent.id === id
          );

        setAgents(
          (previous) =>
            previous.map(
              (agent) =>
                agent.id === id
                  ? {
                      ...agent,
                      status,
                    }
                  : agent
            )
        );

        const { error } =
          await supabase
            .from('agents')
            .update({
              status,
            })
            .eq(
              'id',
              id
            );

        if (error) {
          console.error(
            'Agent status update error:',
            error
          );

          if (previousAgent) {
            setAgents(
              (previous) =>
                previous.map(
                  (agent) =>
                    agent.id === id
                      ? previousAgent
                      : agent
                )
            );
          }

          pushToast({
            type: 'error',
            title:
              'Agent status update failed',
            message:
              error.message,
          });
        }
      },
      [
        agents,
        pushToast,
      ]
    );

  /* ============================================================
     LEDGER
  ============================================================ */

  const addLedgerEvent =
    useCallback(
      (
        event: Omit<
          LedgerEvent,
          'id'
        >
      ) => {
        setLedger(
          (previous) => [
            {
              ...event,
              id: uid('e'),
            },
            ...previous,
          ]
        );
      },
      []
    );

  /* ============================================================
     EDGE FUNCTION HELPER
     
     The Supabase client handles the publishable key.
     The authenticated session is sent automatically.
  ============================================================ */

  const invokeFunction =
    useCallback(
      async <T,>(
        functionName: string,
        body: Record<
          string,
          unknown
        >
      ): Promise<T> => {
        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError
        ) {
          throw new Error(
            sessionError.message
          );
        }

        if (!session) {
          throw new Error(
            'You must be signed in.'
          );
        }

        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            functionName,
            {
              body,
            }
          );

        if (error) {
          throw new Error(
            error.message ||
              `Failed to call ${functionName}.`
          );
        }

        return data as T;
      },
      []
    );

  /* ============================================================
     CREATE OPEN TAB
  ============================================================ */

  const createOpenTab =
    useCallback(
      async (
        tab: Omit<
          OpenTab,
          | 'id'
          | 'createdAt'
          | 'remaining'
          | 'status'
        >
      ): Promise<OpenTab> => {
        const organizationId =
          await getCurrentOrganizationId();

        if (!organizationId) {
          throw new Error(
            'No organization found for the current user.'
          );
        }

        type CreateTabResponse = {
          success?: boolean;

          data?: {
            open_tab?: {
              id?: string;
            };
          };

          error?: {
            message?: string;
          };
        };

        const result =
          await invokeFunction<CreateTabResponse>(
            'create-open-tab',
            {
              organization_id:
                organizationId,

              agent_id:
                tab.agentId,

              name: tab.agentName
                ? `${tab.agentName} Tab`
                : 'OpenTab',

              authorization_cap:
                tab.cap,

              auto_approval_ceiling:
                tab.autoApproveCeiling,

              allowed_categories:
                tab.scope,
            }
          );

        if (
          !result.success ||
          !result.data?.open_tab?.id
        ) {
          throw new Error(
            result.error?.message ??
              'Failed to create OpenTab.'
          );
        }

        const newTab: OpenTab =
          {
            ...tab,

            id: String(
              result.data.open_tab.id
            ),

            remaining:
              tab.cap,

            status:
              'active',

            createdAt:
              'Just now',
          };

        setOpenTabs(
          (previous) => [
            newTab,
            ...previous,
          ]
        );

        addLedgerEvent({
          time: 'Just now',

          what:
            'OpenTab activated',

          why: `New OpenTab created for ${tab.agentName}`,

          who:
            tab.agentName,

          whoType:
            'merchant',

          policy:
            'opentab-scope',
        });

        return newTab;
      },
      [
        getCurrentOrganizationId,
        invokeFunction,
        addLedgerEvent,
      ]
    );

  /* ============================================================
     PAUSE OPEN TAB
  ============================================================ */

  const pauseOpenTab =
    useCallback(
      async (id: string) => {
        const { error } =
          await supabase
            .from('open_tabs')
            .update({
              status: 'paused',

              paused_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              id
            );

        if (error) {
          pushToast({
            type: 'error',
            title:
              'Unable to pause OpenTab',
            message:
              error.message,
          });

          return;
        }

        setOpenTabs(
          (previous) =>
            previous.map(
              (tab) =>
                tab.id === id
                  ? {
                      ...tab,
                      status:
                        'paused',
                    }
                  : tab
            )
        );

        pushToast({
          type: 'info',
          title:
            'OpenTab paused',
          message:
            'The agent can no longer request transactions.',
        });
      },
      [pushToast]
    );

  /* ============================================================
     REVOKE OPEN TAB
  ============================================================ */

  const revokeOpenTab =
    useCallback(
      async (id: string) => {
        const { error } =
          await supabase
            .from('open_tabs')
            .update({
              status: 'revoked',

              remaining_amount:
                0,

              revoked_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              id
            );

        if (error) {
          pushToast({
            type: 'error',
            title:
              'Unable to revoke OpenTab',
            message:
              error.message,
          });

          return;
        }

        setOpenTabs(
          (previous) =>
            previous.map(
              (tab) =>
                tab.id === id
                  ? {
                      ...tab,
                      status:
                        'revoked',
                      remaining:
                        0,
                    }
                  : tab
            )
        );

        pushToast({
          type: 'warning',
          title:
            'OpenTab revoked',
          message:
            'All transaction authority has been removed.',
        });
      },
      [pushToast]
    );

  /* ============================================================
     TRANSACTIONS
  ============================================================ */

  const addTransaction =
    useCallback(
      (txn: Transaction) => {
        setTransactions(
          (previous) => [
            txn,
            ...previous,
          ]
        );
      },
      []
    );

  /* ============================================================
     APPROVE TRANSACTION
  ============================================================ */

  const approveEscalatedTransaction =
    useCallback(
      async (id: string) => {
        try {
          const organizationId =
            await getCurrentOrganizationId();

          if (!organizationId) {
            pushToast({
              type: 'error',
              title:
                'Organization not found',
              message:
                'Your merchant organization could not be found.',
            });

            return;
          }

          type Result = {
            success?: boolean;

            error?: {
              message?: string;
            };
          };

          const result =
            await invokeFunction<Result>(
              'approve-transaction',
              {
                transaction_id:
                  id,

                organization_id:
                  organizationId,
              }
            );

          if (!result.success) {
            pushToast({
              type: 'error',
              title:
                'Approval failed',
              message:
                result.error?.message ??
                'Failed to approve transaction.',
            });

            return;
          }

          pushToast({
            type: 'success',
            title:
              'Transaction approved',
            message:
              'Payment has been confirmed.',
          });

          await refreshData();
        } catch (error) {
          pushToast({
            type: 'error',
            title:
              'Approval failed',
            message:
              error instanceof
                Error
                ? error.message
                : 'Unexpected error.',
          });
        }
      },
      [
        getCurrentOrganizationId,
        invokeFunction,
        pushToast,
        refreshData,
      ]
    );

  /* ============================================================
     DECLINE TRANSACTION
  ============================================================ */

  const declineEscalatedTransaction =
    useCallback(
      async (id: string) => {
        try {
          const organizationId =
            await getCurrentOrganizationId();

          if (!organizationId) {
            pushToast({
              type: 'error',
              title:
                'Organization not found',
              message:
                'Your merchant organization could not be found.',
            });

            return;
          }

          type Result = {
            success?: boolean;

            error?: {
              message?: string;
            };
          };

          const result =
            await invokeFunction<Result>(
              'decline-transaction',
              {
                transaction_id:
                  id,

                organization_id:
                  organizationId,
              }
            );

          if (!result.success) {
            pushToast({
              type: 'error',
              title:
                'Decline failed',
              message:
                result.error?.message ??
                'Failed to decline transaction.',
            });

            return;
          }

          pushToast({
            type: 'warning',
            title:
              'Transaction declined',
            message:
              'The request has been denied.',
          });

          await refreshData();
        } catch (error) {
          pushToast({
            type: 'error',
            title:
              'Decline failed',
            message:
              error instanceof
                Error
                ? error.message
                : 'Unexpected error.',
          });
        }
      },
      [
        getCurrentOrganizationId,
        invokeFunction,
        pushToast,
        refreshData,
      ]
    );

  /* ============================================================
     EVALUATE TRANSACTION
  ============================================================ */

  const evaluateTransaction =
    useCallback(
      async (params: {
        agentId: string;

        products: {
          name: string;
          price: number;
        }[];

        openTabId?: string;
      }) => {
        const amount =
          params.products.reduce(
            (
              sum,
              product
            ) =>
              sum +
              Number(
                product.price || 0
              ),
            0
          );

        const idempotencyKey =
          `idem-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;

        const stages: TxnStage[] =
          [
            {
              id: 's1',
              label:
                'Agent Request',
              status:
                'pending',
              detail: `Agent requested purchase of ${params.products
                .map(
                  (product) =>
                    product.name
                )
                .join(', ')}`,
            },

            {
              id: 's2',
              label:
                'Identity Verification',
              status:
                'pending',
            },

            {
              id: 's3',
              label:
                'Catalog Validation',
              status:
                'pending',
            },

            {
              id: 's4',
              label:
                'Policy Check',
              status:
                'pending',
            },

            {
              id: 's5',
              label:
                'OpenTab Validation',
              status:
                'pending',
            },

            {
              id: 's6',
              label:
                'Payment Initiated',
              status:
                'pending',
            },

            {
              id: 's7',
              label:
                'Payment Confirmed',
              status:
                'pending',
            },
          ];

        try {
          const organizationId =
            await getCurrentOrganizationId();

          if (!organizationId) {
            return {
              decision:
                'declined' as TxnDecision,

              reason:
                'No merchant organization was found for this account.',

              stages,

              amount,
            };
          }

          stages[0] = {
            ...stages[0],
            status:
              'passed',
          };

          type EvaluationResult = {
            success?: boolean;

            data?: {
              decision?: TxnDecision;

              reason?: string;

              checks?: Array<{
                label?: string;
                passed?: boolean;
                detail?: string;
              }>;

              transaction_id?: string;

              transaction_request_id?: string;
            };

            error?: {
              message?: string;
            };
          };

          const result =
            await invokeFunction<EvaluationResult>(
              'evaluate-transaction',
              {
                organization_id:
                  organizationId,

                agent_id:
                  params.agentId,

                products:
                  params.products,

                idempotency_key:
                  idempotencyKey,

                open_tab_id:
                  params.openTabId ??
                  null,
              }
            );

          if (!result.data) {
            return {
              decision:
                'declined' as TxnDecision,

              reason:
                result.error?.message ??
                'Transaction evaluation failed.',

              stages,

              amount,
            };
          }

          const data =
            result.data;

          const decision: TxnDecision =
            data.decision ===
              'approved' ||
            data.decision ===
              'declined' ||
            data.decision ===
              'escalated'
              ? data.decision
              : 'declined';

          const checks =
            data.checks ?? [];

          checks.forEach(
            (check) => {
              const label =
                String(
                  check.label ??
                    ''
                ).toLowerCase();

              let index = -1;

              if (
                label.includes(
                  'identity'
                )
              ) {
                index = 1;
              } else if (
                label.includes(
                  'catalog'
                )
              ) {
                index = 2;
              } else if (
                label.includes(
                  'policy'
                )
              ) {
                index = 3;
              } else if (
                label.includes(
                  'opentab'
                ) ||
                label.includes(
                  'open tab'
                )
              ) {
                index = 4;
              } else if (
                label.includes(
                  'payment'
                )
              ) {
                index = 5;
              }

              if (index >= 0) {
                stages[index] =
                  {
                    ...stages[index],

                    status:
                      check.passed
                        ? 'passed'
                        : 'failed',

                    detail:
                      check.detail ??
                      '',
                  };
              }
            }
          );

          if (
            decision ===
            'approved'
          ) {
            stages[5] = {
              ...stages[5],

              status:
                'passed',

              detail:
                'Payment handed to provider.',
            };

            stages[6] = {
              ...stages[6],

              status:
                'passed',

              detail:
                'Payment provider confirmed.',
            };
          }

          if (
            decision ===
            'escalated'
          ) {
            stages[5] = {
              ...stages[5],

              status:
                'skipped',

              detail:
                'Waiting for merchant approval.',
            };

            stages[6] = {
              ...stages[6],

              status:
                'skipped',

              detail:
                'Waiting for merchant approval.',
            };
          }

          if (
            decision ===
            'declined'
          ) {
            stages[5] = {
              ...stages[5],

              status:
                'skipped',
            };

            stages[6] = {
              ...stages[6],

              status:
                'skipped',
            };
          }

          await refreshData();

          return {
            decision,

            reason:
              data.reason ?? '',

            stages,

            amount,

            transactionId:
              data.transaction_id,

            transactionRequestId:
              data.transaction_request_id,
          };
        } catch (error) {
          console.error(
            'evaluateTransaction error:',
            error
          );

          return {
            decision:
              'declined' as TxnDecision,

            reason:
              error instanceof
                Error
                ? error.message
                : 'Unexpected transaction error.',

            stages,

            amount,
          };
        }
      },
      [
        getCurrentOrganizationId,
        invokeFunction,
        refreshData,
      ]
    );

  /* ============================================================
     SIGN OUT
  ============================================================ */

  const signOut =
    useCallback(
      async () => {
        try {
          const {
            error,
          } =
            await supabase.auth.signOut();

          if (error) {
            throw error;
          }

          clearData();
          setAuthed(false);
        } catch (error) {
          console.error(
            'Sign out error:',
            error
          );

          pushToast({
            type: 'error',
            title:
              'Sign out failed',
            message:
              error instanceof
                Error
                ? error.message
                : 'Unable to sign out.',
          });

          throw error;
        }
      },
      [
        clearData,
        pushToast,
      ]
    );

  /* ============================================================
     CONTEXT VALUE
  ============================================================ */

  const value: AppContextValue =
    {
      merchant,

      agents,

      products,

      openTabs,

      transactions,

      ledger,

      opportunities,

      policies,

      toasts,

      authed,

      loading,

      setAuthed,

      updateMerchant,

      updatePolicy,

      togglePolicy,

      setOpportunityStatus,

      setAgentStatus,

      createOpenTab,

      pauseOpenTab,

      revokeOpenTab,

      addTransaction,

      approveEscalatedTransaction,

      declineEscalatedTransaction,

      pushToast,

      dismissToast,

      addLedgerEvent,

      evaluateTransaction,

      signOut,

      refreshData,
    };

  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useApp() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within AppProvider'
    );
  }

  return context;
}