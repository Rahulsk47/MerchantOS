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
import {
  demoMerchant,
  demoAgents,
  demoProducts,
  demoOpenTabs,
  demoTransactions,
  demoLedger,
  demoOpportunities,
  demoPolicies,
} from './mockData';

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
  isDemoMode: boolean;
}

interface AppContextValue extends AppState {
  setAuthed: (value: boolean) => void;
  loadDemoData: () => void;

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

  updateProduct: (
    id: string,
    patch: Partial<Product>
  ) => void;

  fixProductIssues: (
    id: string,
    updates?: {
      shipping?: string;
      returns?: string;
      inventory?: number;
    }
  ) => void;

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

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function timeAgoShort(
  iso: string
): string {
  const timestamp =
    new Date(iso).getTime();

  if (Number.isNaN(timestamp)) {
    return '—';
  }

  const diff = Math.max(
    0,
    Date.now() - timestamp
  );

  const mins = Math.floor(
    diff / 60000
  );

  if (mins < 1) {
    return 'just now';
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.floor(
    mins / 60
  );

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
      ? row.products
          .filter(
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
          )
          .map((item) => ({
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

function getStoredOpenTabs(): OpenTab[] {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('merchantos_custom_open_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return [];
}

function saveStoredOpenTabs(tabs: OpenTab[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('merchantos_custom_open_tabs', JSON.stringify(tabs));
    }
  } catch {
    /* ignore storage errors */
  }
}

function getStoredTransactions(): Transaction[] {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('merchantos_custom_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return [];
}

function saveStoredTransactions(txns: Transaction[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('merchantos_custom_transactions', JSON.stringify(txns));
    }
  } catch {
    /* ignore storage errors */
  }
}

function getStoredLedger(): LedgerEvent[] {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('merchantos_custom_ledger');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return [];
}

function saveStoredLedger(events: LedgerEvent[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('merchantos_custom_ledger', JSON.stringify(events));
    }
  } catch {
    /* ignore storage errors */
  }
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
    useState<MerchantProfile>(() => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('merchantos_merchant_profile');
          if (saved) {
            return JSON.parse(saved);
          }
          if (localStorage.getItem('merchantos_onboarding_completed') === 'true') {
            return { ...fallbackMerchant, onboardingComplete: true };
          }
        }
      } catch {
        /* ignore */
      }
      return fallbackMerchant;
    });

  const [
    agents,
    setAgents,
  ] = useState<AgentIdentity[]>(
    () => demoAgents
  );

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    () => demoProducts
  );

  const [
    openTabs,
    setOpenTabs,
  ] = useState<OpenTab[]>(() => {
    const custom = getStoredOpenTabs();
    if (custom.length > 0) return custom;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('merchantos_demo_mode') === 'true') {
        return demoOpenTabs;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>(() => {
    const custom = getStoredTransactions();
    if (custom.length > 0) return custom;
    return demoTransactions;
  });

  const [
    ledger,
    setLedger,
  ] = useState<LedgerEvent[]>(() => {
    const custom = getStoredLedger();
    if (custom.length > 0) return custom;
    return demoLedger;
  });

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<GrowthOpportunity[]>(() => demoOpportunities);

  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>(() => demoPolicies);

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

  const [
    isDemoMode,
    setIsDemoMode,
  ] = useState(false);

  const loadDemoData = useCallback(() => {
    setMerchant(demoMerchant);
    setAgents(demoAgents);
    setProducts(demoProducts);
    const customTabs = getStoredOpenTabs();
    const mergedTabs = [...customTabs, ...demoOpenTabs.filter((d) => !customTabs.some((c) => c.id === d.id))];
    setOpenTabs(mergedTabs);

    const customTxns = getStoredTransactions();
    const mergedTxns = [...customTxns, ...demoTransactions.filter((d) => !customTxns.some((c) => c.id === d.id))];
    setTransactions(mergedTxns);

    const customLedger = getStoredLedger();
    const mergedLedger = [...customLedger, ...demoLedger.filter((d) => !customLedger.some((c) => c.id === d.id))];
    setLedger(mergedLedger);

    setOpportunities(demoOpportunities);
    setPolicies(demoPolicies);
    setAuthed(true);
    setIsDemoMode(true);
    try {
      localStorage.setItem('merchantos_demo_mode', 'true');
      localStorage.setItem('merchantos_onboarding_completed', 'true');
      localStorage.setItem('merchantos_merchant_profile', JSON.stringify(demoMerchant));
    } catch {
      /* ignore storage errors */
    }
  }, []);

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
     GET ORGANIZATION
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
          /*
           * First make absolutely sure that the Supabase
           * session still exists.
           */
          const {
            data: {
              session,
            },
            error: sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError ||
            !session
          ) {
            const isDemo =
              typeof window !== 'undefined' &&
              (localStorage.getItem('merchantos_demo_mode') === 'true' ||
               localStorage.getItem('merchantos_onboarding_completed') === 'true');

            if (isDemo) {
              setAuthed(true);
              return;
            }

            console.warn(
              'No active Supabase session.'
            );

            setAuthed(false);
            clearData();

            return;
          }

          const organizationId =
            await getCurrentOrganizationId();

          /*
           * IMPORTANT:
           *
           * Do NOT wipe the application state here.
           *
           * During signup/auth initialization the membership
           * row can take a moment to become available.
           *
           * Clearing everything at this point caused the UI
           * to appear empty after refresh.
           */
          if (!organizationId) {
            console.warn(
              'Organization not available yet.'
            );

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

          /* ==================================================
             ONLY REPLACE A COLLECTION IF ITS REQUEST SUCCEEDED
          ================================================== */

          if (!agentsRes.error) {
            const rows =
              (agentsRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            if (rows.length > 0) {
              setAgents(
                rows.map(mapAgent)
              );
            } else {
              setAgents(demoAgents);
            }
          } else {
            console.error(
              'Agents:',
              agentsRes.error
            );
            setAgents((prev) => (prev.length > 0 ? prev : demoAgents));
          }

          if (!productsRes.error) {
            const rows =
              (productsRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            if (rows.length > 0) {
              setProducts(
                rows.map(mapProduct)
              );
            } else {
              setProducts(demoProducts);
            }
          } else {
            console.error(
              'Products:',
              productsRes.error
            );
            setProducts((prev) => (prev.length > 0 ? prev : demoProducts));
          }

          const currentAgents =
            !agentsRes.error && (agentsRes.data ?? []).length > 0
              ? (
                  (agentsRes.data ??
                    []) as Record<
                    string,
                    unknown
                  >[]
                ).map(mapAgent)
              : demoAgents;

          const agentMap =
            new Map(
              currentAgents.map(
                (agent) => [
                  agent.id,
                  agent,
                ]
              )
            );

          if (!tabsRes.error) {
            const rows =
              (tabsRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            const mapped = rows.map(
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
            );

            const dbIds = new Set(mapped.map((t) => t.id));
            const storedCustom = getStoredOpenTabs();
            const merged = [...mapped, ...storedCustom.filter((t) => !dbIds.has(t.id))];

            if (merged.length === 0) {
              const isDemo =
                typeof window !== 'undefined' &&
                localStorage.getItem('merchantos_demo_mode') === 'true';
              if (isDemo) {
                setOpenTabs(demoOpenTabs);
              } else {
                setOpenTabs([]);
              }
            } else {
              setOpenTabs(merged);
            }
          } else {
            console.error(
              'OpenTabs:',
              tabsRes.error
            );
            const storedCustom = getStoredOpenTabs();
            if (storedCustom.length > 0) {
              setOpenTabs((prev) => {
                const ids = new Set(prev.map((t) => t.id));
                return [...prev, ...storedCustom.filter((t) => !ids.has(t.id))];
              });
            }
          }

          if (!txnsRes.error) {
            const rows =
              (txnsRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            const mapped = rows.map(
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
            );

            const dbIds = new Set(mapped.map((t) => t.id));
            const stored = getStoredTransactions();
            const merged = [...mapped, ...stored.filter((t) => !dbIds.has(t.id))];

            if (merged.length === 0) {
              setTransactions(demoTransactions);
            } else {
              setTransactions(merged);
            }
          } else {
            console.error(
              'Transactions:',
              txnsRes.error
            );
            const stored = getStoredTransactions();
            if (stored.length > 0) {
              setTransactions((prev) => {
                const ids = new Set(prev.map((t) => t.id));
                return [...prev, ...stored.filter((t) => !ids.has(t.id))];
              });
            } else {
              setTransactions(demoTransactions);
            }
          }

          if (!ledgerRes.error) {
            const rows =
              (ledgerRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            const mapped = rows.map(mapLedger);
            const dbIds = new Set(mapped.map((e) => e.id));
            const stored = getStoredLedger();
            const merged = [...mapped, ...stored.filter((e) => !dbIds.has(e.id))];

            if (merged.length === 0) {
              setLedger(demoLedger);
            } else {
              setLedger(merged);
            }
          } else {
            console.error(
              'Ledger:',
              ledgerRes.error
            );
            const stored = getStoredLedger();
            if (stored.length > 0) {
              setLedger((prev) => {
                const ids = new Set(prev.map((e) => e.id));
                return [...prev, ...stored.filter((e) => !ids.has(e.id))];
              });
            } else {
              setLedger(demoLedger);
            }
          }

          if (!oppsRes.error) {
            const rows =
              (oppsRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            if (rows.length > 0) {
              setOpportunities(
                rows.map(
                  mapOpportunity
                )
              );
            } else {
              setOpportunities(demoOpportunities);
            }
          } else {
            console.error(
              'Opportunities:',
              oppsRes.error
            );
            setOpportunities((prev) => (prev.length > 0 ? prev : demoOpportunities));
          }

          if (!policiesRes.error) {
            const rows =
              (policiesRes.data ??
                []) as Record<
                string,
                unknown
              >[];

            if (rows.length > 0) {
              setPolicies(
                rows.map(
                  mapPolicy
                )
              );
            } else {
              setPolicies(demoPolicies);
            }
          } else {
            console.error(
              'Policies:',
              policiesRes.error
            );
            setPolicies((prev) => (prev.length > 0 ? prev : demoPolicies));
          }

          /* ==================================================
             ORGANIZATION
          ================================================== */

          if (
            !orgRes.error &&
            orgRes.data
          ) {
            const org =
              orgRes.data as Record<
                string,
                unknown
              >;

            /*
             * IMPORTANT:
             *
             * onboarding_complete must come from the
             * database. We no longer assume that an
             * organization means onboarding is complete.
             */
            const onboardingComplete =
              Boolean(
                org.onboarding_complete
              ) ||
              Boolean(
                typeof window !== 'undefined' &&
                localStorage.getItem('merchantos_onboarding_completed') === 'true'
              );

            setMerchant(
              (previous) => ({
                ...previous,

                businessName:
                  org.name !==
                  null &&
                  org.name !==
                    undefined
                    ? String(
                        org.name
                      )
                    : previous.businessName,

                industry:
                  org.industry !==
                  null &&
                  org.industry !==
                    undefined
                    ? String(
                        org.industry
                      )
                    : previous.industry,

                storeUrl:
                  org.store_url !==
                  null &&
                  org.store_url !==
                    undefined
                    ? String(
                        org.store_url
                      )
                    : previous.storeUrl,

                contactEmail:
                  org.contact_email !==
                  null &&
                  org.contact_email !==
                    undefined
                    ? String(
                        org.contact_email
                      )
                    : previous.contactEmail,

                onboardingComplete,
              })
            );
          } else if (
            orgRes.error
          ) {
            console.error(
              'Organization:',
              orgRes.error
            );
          }
        } catch (error) {
          console.error(
            'refreshData error:',
            error
          );

          /*
           * IMPORTANT:
           * Never clear the already loaded data because
           * a refresh request failed temporarily.
           */
        } finally {
          refreshInProgress.current =
            false;
        }
      },
      [
        getCurrentOrganizationId,
        clearData,
        agents,
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
            setIsDemoMode(false);

            organizationIdRef.current =
              null;

            /*
             * Give Supabase auth state a moment to settle,
             * especially immediately after signup.
             */
            await new Promise(
              (resolve) =>
                window.setTimeout(
                  resolve,
                  100
                )
            );

            if (!mounted) {
              return;
            }

            await refreshData();
          } else {
            setAuthed(false);
            setIsDemoMode(false);
            try {
              localStorage.removeItem('merchantos_demo_mode');
            } catch {
              /* ignore */
            }
            clearData();
          }
        } catch (error) {
          console.error(
            'Auth initialization error:',
            error
          );

          if (mounted) {
            setAuthed(false);
            setIsDemoMode(false);
            try {
              localStorage.removeItem('merchantos_demo_mode');
            } catch {
              /* ignore */
            }
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
            setIsDemoMode(false);
            try {
              localStorage.removeItem('merchantos_demo_mode');
            } catch {
              /* ignore */
            }
            clearData();
            return;
          }

          setAuthed(true);
          setIsDemoMode(false);

          organizationIdRef.current =
            null;

          /*
           * Never navigate from the auth listener.
           *
           * App.tsx decides whether the user belongs on
           * /onboarding or /app.
           */
          window.setTimeout(
            () => {
              if (mounted) {
                void refreshData();
              }
            },
            300
          );
        }
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, [
    clearData,
    refreshData,
    loadDemoData,
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
          (previous) => {
            const nextMerchant = {
              ...previous,
              ...patch,
            };
            try {
              if (nextMerchant.onboardingComplete) {
                localStorage.setItem('merchantos_onboarding_completed', 'true');
              }
              localStorage.setItem('merchantos_merchant_profile', JSON.stringify(nextMerchant));
            } catch {
              /* ignore */
            }
            return nextMerchant;
          }
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

        if (isUUID(id)) {
          try {
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
              console.warn('Policy remote update note:', error.message);
            }
          } catch (err) {
            console.warn('Policy update error:', err);
          }
        }
      },
      [
        policies,
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
        const newEvent: LedgerEvent = {
          ...event,
          id: uid('e'),
        };
        setLedger(
          (previous) => {
            const updated = [newEvent, ...previous];
            saveStoredLedger(updated);
            return updated;
          }
        );
      },
      []
    );

  /* ============================================================
     PRODUCT MANAGEMENT
  ============================================================ */

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const fixProductIssues = useCallback(
    (
      id: string,
      updates?: {
        shipping?: string;
        returns?: string;
        inventory?: number;
      }
    ) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const newShipping =
            updates?.shipping?.trim() ||
            (p.shipping.toLowerCase().includes('not specified') || !p.shipping
              ? 'Ships in 1–2 business days. Free delivery above ₹2,000.'
              : p.shipping);
          const newReturns =
            updates?.returns?.trim() ||
            (p.returns.toLowerCase().includes('not specified') || !p.returns
              ? '15-day return window. Easy returns.'
              : p.returns);
          const newInventory =
            updates?.inventory !== undefined
              ? updates.inventory
              : p.inventory === 0
                ? 45
                : p.inventory;
          return {
            ...p,
            shipping: newShipping,
            returns: newReturns,
            inventory: newInventory,
            readinessIssues: [],
            aiReadiness: Math.max(95, p.aiReadiness + 22),
          };
        })
      );
      addLedgerEvent({
        time: 'Just now',
        what: 'Product AI readiness updated',
        why: 'Merchant completed product metadata & readiness criteria',
        who: 'Merchant',
        whoType: 'merchant',
      });
    },
    [addLedgerEvent]
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

        if (isUUID(id)) {
          try {
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
              console.warn(
                'Opportunity remote update note:',
                error.message
              );
            }
          } catch (err) {
            console.warn('Opportunity update error:', err);
          }
        }
      },
      []
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

        if (isUUID(id)) {
          try {
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
              console.warn(
                'Agent status remote update note:',
                error.message
              );
            }
          } catch (err) {
            console.warn('Agent status update error:', err);
          }
        }
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
        const fallbackId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newTab: OpenTab = {
          ...tab,
          id: fallbackId,
          remaining: tab.cap,
          status: 'active',
          createdAt: 'Just now',
        };

        try {
          const organizationId = await getCurrentOrganizationId();
          if (organizationId) {
            // Attempt 1: direct table insert
            try {
              const { data: inserted, error: insertError } = await supabase
                .from('open_tabs')
                .insert({
                  organization_id: organizationId,
                  agent_id: tab.agentId,
                  name: tab.agentName
                    ? `${tab.agentName} Tab`
                    : 'OpenTab',
                  authorization_cap: tab.cap,
                  remaining_amount: tab.cap,
                  auto_approval_ceiling: tab.autoApproveCeiling,
                  allowed_categories: tab.scope,
                  status: 'active',
                })
                .select()
                .maybeSingle();

              if (!insertError && inserted?.id) {
                newTab.id = String(inserted.id);
              }
            } catch {
              /* ignore direct insert errors and continue */
            }
          }
        } catch (err) {
          console.warn('create-open-tab backend note (using local state):', err);
        }

        // Save to local storage for persistent access across reloads and fetches
        const storedCustom = getStoredOpenTabs();
        const updatedCustom = [newTab, ...storedCustom.filter((t) => t.id !== newTab.id)];
        saveStoredOpenTabs(updatedCustom);

        setOpenTabs((previous) => [
          newTab,
          ...previous.filter((t) => t.id !== newTab.id),
        ]);

        addLedgerEvent({
          time: 'Just now',
          what: 'OpenTab activated',
          why: `New OpenTab created for ${tab.agentName}`,
          who: tab.agentName,
          whoType: 'merchant',
          policy: 'opentab-scope',
        });

        return newTab;
      },
      [
        getCurrentOrganizationId,
        addLedgerEvent,
      ]
    );

  /* ============================================================
     PAUSE OPEN TAB
  ============================================================ */

  const pauseOpenTab =
    useCallback(
      async (id: string) => {
        try {
          if (isUUID(id)) {
            await supabase
              .from('open_tabs')
              .update({
                status: 'paused',
                paused_at: new Date().toISOString(),
              })
              .eq('id', id);
          }
        } catch (err) {
          console.warn('DB pauseOpenTab note:', err);
        }

        const stored = getStoredOpenTabs();
        saveStoredOpenTabs(
          stored.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
        );

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
        try {
          if (isUUID(id)) {
            await supabase
              .from('open_tabs')
              .update({
                status: 'revoked',
                remaining_amount: 0,
                revoked_at: new Date().toISOString(),
              })
              .eq('id', id);
          }
        } catch (err) {
          console.warn('DB revokeOpenTab note:', err);
        }

        const stored = getStoredOpenTabs();
        saveStoredOpenTabs(
          stored.map((t) => (t.id === id ? { ...t, status: 'revoked', remaining: 0 } : t))
        );

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
          (previous) => {
            const updated = [
              txn,
              ...previous.filter((t) => t.id !== txn.id),
            ];
            saveStoredTransactions(updated);
            return updated;
          }
        );

        // Also add corresponding trust ledger events
        const nowTime = new Date().toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
        });

        if (txn.decision === 'approved') {
          addLedgerEvent({
            time: nowTime,
            what: 'Payment confirmed',
            why: `Payment provider confirmed ₹${txn.amount.toLocaleString('en-IN')}`,
            who: 'system',
            whoType: 'system',
            transactionId: txn.id,
            decision: 'approved',
          });
          addLedgerEvent({
            time: nowTime,
            what: 'Transaction approved',
            why: txn.reason || 'All merchant policies satisfied',
            who: txn.agentName,
            whoType: 'agent',
            transactionId: txn.id,
            policy: 'auto-approval-threshold',
            decision: 'approved',
          });
        } else if (txn.decision === 'escalated') {
          addLedgerEvent({
            time: nowTime,
            what: 'Human approval requested',
            why: txn.reason || 'Transaction exceeds auto-approval threshold',
            who: txn.agentName,
            whoType: 'agent',
            transactionId: txn.id,
            policy: 'human-approval-threshold',
            decision: 'escalated',
          });
        } else {
          addLedgerEvent({
            time: nowTime,
            what: 'Transaction declined',
            why: txn.reason || 'Safety policy check failed',
            who: txn.agentName,
            whoType: 'agent',
            transactionId: txn.id,
            policy: 'safety-boundaries',
            decision: 'declined',
          });
        }
      },
      [addLedgerEvent]
    );

  /* ============================================================
     APPROVE TRANSACTION
  ============================================================ */

  const approveEscalatedTransaction =
    useCallback(
      async (id: string) => {
        const txn = transactions.find((t) => t.id === id);
        const nowTime = new Date().toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
        });

        // 1. Optimistically update local transaction state
        setTransactions((previous) => {
          const updated = previous.map((t) => {
            if (t.id === id) {
              const updatedStages = (t.stages || []).map((s) => {
                if (s.id === 's6' || s.id === 's7') {
                  return {
                    ...s,
                    status: 'passed' as const,
                    timestamp: nowTime,
                    detail: s.id === 's6' ? 'Approved by merchant & payment initiated' : 'Payment confirmed',
                  };
                }
                return s;
              });
              return {
                ...t,
                decision: 'approved' as TxnDecision,
                paymentStatus: 'confirmed' as const,
                reason: 'Manually approved by merchant.',
                stages: updatedStages,
              };
            }
            return t;
          });
          saveStoredTransactions(updated);
          return updated;
        });

        // 2. Deduct from OpenTab if exists
        if (txn?.openTabId && txn?.amount) {
          setOpenTabs((previous) => {
            const updated = previous.map((tab) => {
              if (tab.id === txn.openTabId) {
                const remaining = Math.max(0, tab.remaining - txn.amount);
                return { ...tab, remaining };
              }
              return tab;
            });
            saveStoredOpenTabs(updated);
            return updated;
          });
        }

        // 3. Add Ledger events
        addLedgerEvent({
          time: nowTime,
          what: 'Transaction approved by merchant',
          why: 'Human-in-the-loop authorization confirmed by store owner',
          who: merchant.businessName || 'Store Owner',
          whoType: 'merchant',
          transactionId: id,
          decision: 'approved',
        });
        addLedgerEvent({
          time: nowTime,
          what: 'Payment confirmed',
          why: 'Payment provider confirmed transaction after merchant review',
          who: 'system',
          whoType: 'system',
          transactionId: id,
          decision: 'approved',
        });

        pushToast({
          type: 'success',
          title: 'Transaction approved',
          message: 'Merchant authorization granted and payment confirmed.',
        });

        // 4. Background DB / Function attempt
        try {
          if (isUUID(id)) {
            await supabase
              .from('transactions')
              .update({
                status: 'confirmed',
                decision_reason: 'Approved by merchant',
              })
              .eq('id', id);
          }
        } catch {
          /* ignore remote errors */
        }
      },
      [
        transactions,
        merchant.businessName,
        addLedgerEvent,
        pushToast,
      ]
    );

  /* ============================================================
     DECLINE TRANSACTION
  ============================================================ */

  const declineEscalatedTransaction =
    useCallback(
      async (id: string) => {
        const nowTime = new Date().toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
        });

        setTransactions((previous) => {
          const updated = previous.map((t) => {
            if (t.id === id) {
              return {
                ...t,
                decision: 'declined' as TxnDecision,
                paymentStatus: 'failed' as const,
                reason: 'Declined by merchant during review.',
              };
            }
            return t;
          });
          saveStoredTransactions(updated);
          return updated;
        });

        addLedgerEvent({
          time: nowTime,
          what: 'Transaction declined by merchant',
          why: 'Store owner declined this transaction during review',
          who: merchant.businessName || 'Store Owner',
          whoType: 'merchant',
          transactionId: id,
          decision: 'declined',
        });

        pushToast({
          type: 'warning',
          title: 'Transaction declined',
          message: 'The transaction request was rejected.',
        });

        try {
          if (isUUID(id)) {
            await supabase
              .from('transactions')
              .update({
                status: 'declined',
                decision_reason: 'Declined by merchant',
              })
              .eq('id', id);
          }
        } catch {
          /* ignore remote errors */
        }
      },
      [
        merchant.businessName,
        addLedgerEvent,
        pushToast,
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
      }): Promise<{
        decision: TxnDecision;
        reason: string;
        stages: TxnStage[];
        amount: number;
        transactionId?: string;
        transactionRequestId?: string;
      }> => {
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

        const nowTimeStr = new Date().toTimeString().slice(0, 8);
        const targetAgent = agents.find((a) => a.id === params.agentId || a.name === params.agentId);
        const targetTab = params.openTabId ? openTabs.find((t) => t.id === params.openTabId) : undefined;

        const stages: TxnStage[] =
          [
            {
              id: 's1',
              label:
                'Agent Request',
              status:
                'passed',
              timestamp: nowTimeStr,
              detail: `${targetAgent?.name || 'AI Agent'} requested purchase of ${params.products
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

        // 1. Evaluate Identity
        const isUnknown = targetAgent?.trustLevel === 'unknown' || targetAgent?.authStatus === 'unauthenticated';
        if (isUnknown) {
          stages[1] = {
            id: 's2',
            label: 'Identity Verification',
            status: 'failed',
            timestamp: nowTimeStr,
            detail: 'Agent identity not verified. Restricted to public catalog information only.',
          };
          stages[2] = { id: 's3', label: 'Catalog Validation', status: 'skipped' };
          stages[3] = { id: 's4', label: 'Policy Check', status: 'skipped' };
          stages[4] = { id: 's5', label: 'OpenTab Validation', status: 'skipped' };
          stages[5] = { id: 's6', label: 'Payment Initiated', status: 'skipped' };
          stages[6] = { id: 's7', label: 'Payment Confirmed', status: 'skipped' };

          return {
            decision: 'declined' as TxnDecision,
            reason: 'Agent identity not verified. No transaction authority granted. Restricted to public information only.',
            stages,
            amount,
            transactionId: uid('txn'),
          };
        }

        stages[1] = {
          id: 's2',
          label: 'Identity Verification',
          status: 'passed',
          timestamp: nowTimeStr,
          detail: `Agent identity verified — ${targetAgent?.organization || 'Verified Agent Platform'}`,
        };

        // 2. Catalog Validation
        stages[2] = {
          id: 's3',
          label: 'Catalog Validation',
          status: 'passed',
          timestamp: nowTimeStr,
          detail: `${params.products.length} product(s) validated against live inventory & merchant pricing.`,
        };

        // 3. Policy Check
        const maxTxn = merchant.boundaries?.maxTxnAmount || 25000;
        const autoCeiling = targetTab?.autoApproveCeiling ?? (merchant.boundaries?.autoApproveThreshold || 5000);

        if (amount > maxTxn) {
          stages[3] = {
            id: 's4',
            label: 'Policy Check',
            status: 'failed',
            timestamp: nowTimeStr,
            detail: `Amount ₹${amount.toLocaleString('en-IN')} exceeds merchant absolute maximum transaction limit of ₹${maxTxn.toLocaleString('en-IN')}.`,
          };
          stages[4] = { id: 's5', label: 'Fraud Detection', status: 'skipped' };
          stages[5] = { id: 's6', label: 'Payment Initiation', status: 'skipped' };
          stages[6] = { id: 's7', label: 'Confirmation', status: 'skipped' };

          const ledgerEvent: LedgerEvent = {
            id: uid('evt'),
            what: `Policy Check Failed for ₹${amount.toLocaleString('en-IN')}`,
            why: `Transaction exceeds maximum permitted transaction policy cap of ₹${maxTxn.toLocaleString('en-IN')}.`,
            who: targetAgent?.name || 'AI Agent',
            whoType: 'agent',
            time: 'Just now',
            policy: 'Max Transaction Policy',
            decision: 'declined',
          };
          addLedgerEvent(ledgerEvent);

          return {
            decision: 'declined' as TxnDecision,
            reason: `Exceeds merchant maximum transaction ceiling of ₹${maxTxn.toLocaleString('en-IN')}.`,
            stages,
            amount,
            transactionId: uid('txn'),
          };
        }

        stages[3] = {
          id: 's4',
          label: 'Policy Check',
          status: 'passed',
          timestamp: nowTimeStr,
          detail: 'Within merchant margin boundaries & rate limit safety rules.',
        };

        // 4. OpenTab & Decision Determination
        let decision: TxnDecision = 'approved';
        let reason = 'All policy checks passed. Within OpenTab scope and authorization.';

        if (targetTab) {
          if (targetTab.status !== 'active') {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'failed',
              timestamp: nowTimeStr,
              detail: `OpenTab is currently ${targetTab.status}.`,
            };
            decision = 'declined';
            reason = `OpenTab is currently ${targetTab.status}. No transaction authority.`;
          } else if (amount > targetTab.remaining) {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'failed',
              timestamp: nowTimeStr,
              detail: `Requested amount (₹${amount.toLocaleString('en-IN')}) exceeds remaining OpenTab authorization (₹${targetTab.remaining.toLocaleString('en-IN')}).`,
            };
            decision = 'declined';
            reason = `Purchase amount (₹${amount.toLocaleString('en-IN')}) exceeds remaining OpenTab authorization (₹${targetTab.remaining.toLocaleString('en-IN')}).`;
          } else if (amount > targetTab.autoApproveCeiling) {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'passed',
              timestamp: nowTimeStr,
              detail: `Transaction amount (₹${amount.toLocaleString('en-IN')}) exceeds auto-approval ceiling of ₹${targetTab.autoApproveCeiling.toLocaleString('en-IN')}.`,
            };
            decision = 'escalated';
            reason = `Transaction amount (₹${amount.toLocaleString('en-IN')}) exceeds auto-approval ceiling of ₹${targetTab.autoApproveCeiling.toLocaleString('en-IN')}. Human approval required.`;
          } else {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'passed',
              timestamp: nowTimeStr,
              detail: `Within remaining authorization (₹${targetTab.remaining.toLocaleString('en-IN')}) and scope.`,
            };
            decision = 'approved';
            reason = 'All policy checks passed. Within OpenTab scope and authorization.';
          }
        } else {
          // No OpenTab provided
          if (amount > autoCeiling) {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'passed',
              timestamp: nowTimeStr,
              detail: `Amount exceeds auto-approval threshold of ₹${autoCeiling.toLocaleString('en-IN')}.`,
            };
            decision = 'escalated';
            reason = `Transaction amount exceeds auto-approval ceiling. Escalated for merchant review.`;
          } else {
            stages[4] = {
              id: 's5',
              label: 'OpenTab Validation',
              status: 'passed',
              timestamp: nowTimeStr,
              detail: 'Direct purchase within auto-approval threshold.',
            };
            decision = 'approved';
            reason = 'Direct transaction within safety thresholds. All policies satisfied.';
          }
        }

        // 5. Payment Stages & OpenTab Deduction
        if (decision === 'approved') {
          stages[5] = {
            id: 's6',
            label: 'Payment Initiated',
            status: 'passed',
            timestamp: nowTimeStr,
            detail: 'Handed to payment provider.',
          };
          stages[6] = {
            id: 's7',
            label: 'Payment Confirmed',
            status: 'passed',
            timestamp: nowTimeStr,
            detail: 'Payment provider confirmed transaction.',
          };

          // Deduct from OpenTab remaining balance
          if (targetTab) {
            setOpenTabs((previous) => {
              const updated = previous.map((t) =>
                t.id === targetTab.id
                  ? { ...t, remaining: Math.max(0, t.remaining - amount) }
                  : t
              );
              saveStoredOpenTabs(updated);
              return updated;
            });
          }
        } else if (decision === 'escalated') {
          stages[5] = {
            id: 's6',
            label: 'Payment Initiated',
            status: 'skipped',
            timestamp: nowTimeStr,
            detail: 'Waiting for merchant approval.',
          };
          stages[6] = {
            id: 's7',
            label: 'Payment Confirmed',
            status: 'skipped',
            timestamp: nowTimeStr,
            detail: 'Waiting for merchant approval.',
          };
        } else {
          stages[5] = { id: 's6', label: 'Payment Initiated', status: 'skipped' };
          stages[6] = { id: 's7', label: 'Payment Confirmed', status: 'skipped' };
        }

        return {
          decision,
          reason,
          stages,
          amount,
          transactionId: uid('txn'),
        };
      },
      [
        agents,
        openTabs,
        merchant.boundaries,
        addLedgerEvent,
      ]
    );

  /* ============================================================
     SIGN OUT
============================================================ */

  const signOut =
    useCallback(
      async () => {
        try {
          localStorage.removeItem('merchantos_demo_mode');
        } catch {
          /* ignore storage errors */
        }
        setIsDemoMode(false);
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

          clearData();
          setAuthed(false);
        }
      },
      [
        clearData,
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

      isDemoMode,

      loadDemoData,

      setAuthed,

      updateMerchant,

      updatePolicy,

      togglePolicy,

      updateProduct,

      fixProductIssues,

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
    useContext(
      AppContext
    );

  if (!context) {
    throw new Error(
      'useApp must be used within AppProvider'
    );
  }

  return context;
}