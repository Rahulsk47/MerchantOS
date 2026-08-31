import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  SupabaseClient,
  Session,
  AuthChangeEvent,
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
import { supabase, DEMO_ORG_ID } from './supabase';
import { uid } from './utils';

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
  setAuthed: (v: boolean) => void;
  updateMerchant: (m: Partial<MerchantProfile>) => void;
  updatePolicy: (id: string, patch: Partial<Policy>) => void;
  togglePolicy: (id: string) => void;
  setOpportunityStatus: (id: string, status: GrowthOpportunity['status']) => void;
  setAgentStatus: (id: string, status: AgentIdentity['status']) => void;
  createOpenTab: (tab: Omit<OpenTab, 'id' | 'createdAt' | 'remaining' | 'status'>) => Promise<OpenTab>;
  pauseOpenTab: (id: string) => Promise<void>;
  revokeOpenTab: (id: string) => Promise<void>;
  addTransaction: (txn: Transaction) => void;
  approveEscalatedTransaction: (id: string) => Promise<void>;
  declineEscalatedTransaction: (id: string) => Promise<void>;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  addLedgerEvent: (e: Omit<LedgerEvent, 'id'>) => void;
  evaluateTransaction: (params: {
    agentId: string;
    products: { name: string; price: number }[];
    openTabId?: string;
  }) => Promise<{ decision: TxnDecision; reason: string; stages: TxnStage[]; amount: number; transactionId?: string; transactionRequestId?: string }>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const fallbackMerchant: MerchantProfile = {
  businessName: 'Northwind Commerce',
  industry: 'Electronics & Accessories',
  storeUrl: 'northwind.example.com',
  contactEmail: 'owner@northwind.example.com',
  aiReadiness: 87,
  onboardingComplete: true,
  boundaries: {
    maxDiscount: 15,
    minMargin: 12,
    autoApproveThreshold: 5000,
    maxTxnAmount: 25000,
  },
};

const avatarColors = [
  'from-electric-500 to-accent-500',
  'from-success-500 to-accent-500',
  'from-warning-500 to-danger-500',
  'from-warning-500 to-electric-500',
];

function mapAgent(row: Record<string, unknown>, idx: number): AgentIdentity {
  const perms = (row.permissions as Record<string, unknown>) ?? {};
  const permissionLevel = perms.max_scope === 'full' ? 'full' : perms.max_scope === 'limited' ? 'limited' : 'public';
  const authStatus = row.trust_level === 'unknown' ? 'unauthenticated' : 'authenticated';
  return {
    id: String(row.id),
    name: String(row.agent_name ?? ''),
    organization: String(row.provider_name ?? ''),
    provider: String(row.agent_identifier ?? ''),
    trustLevel: row.trust_level as AgentIdentity['trustLevel'],
    authStatus: authStatus as AgentIdentity['authStatus'],
    permissionLevel: permissionLevel as AgentIdentity['permissionLevel'],
    status: row.status as AgentIdentity['status'],
    lastActivity: row.last_activity_at ? timeAgoShort(row.last_activity_at as string) : '—',
    avatarColor: avatarColors[idx % avatarColors.length],
    activity: [],
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    category: String(row.category ?? ''),
    price: Number(row.price ?? 0),
    inventory: Number(row.inventory_quantity ?? 0),
    image: String(row.image_url ?? 'package'),
    aiReadiness: row.ai_readiness_status === 'healthy' ? 90 : row.ai_readiness_status === 'needs_attention' ? 72 : 50,
    readinessIssues: [],
    description: String(row.description ?? ''),
    shipping: String(row.shipping_info ?? ''),
    returns: String(row.return_policy ?? ''),
  };
}

function mapOpenTab(row: Record<string, unknown>, agentName: string, trustLevel: string): OpenTab {
  return {
    id: String(row.id),
    agentId: String(row.agent_id ?? ''),
    agentName,
    trustLevel: trustLevel as OpenTab['trustLevel'],
    scope: (row.allowed_categories as string[]) ?? [],
    cap: Number(row.authorization_cap ?? 0),
    remaining: Number(row.remaining_amount ?? 0),
    autoApproveCeiling: Number(row.auto_approval_ceiling ?? 0),
    expiresAt: row.expires_at ? new Date(row.expires_at as string).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—',
    status: row.status as OpenTab['status'],
    createdAt: row.created_at ? new Date(row.created_at as string).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—',
  };
}

function mapTransaction(row: Record<string, unknown>, agentName: string, trustLevel: string): Transaction {
  const status = String(row.status ?? 'pending');
  const decision: TxnDecision = status === 'approved' || status === 'confirmed' ? 'approved' : status === 'declined' ? 'declined' : 'escalated';
  const paymentStatus: Transaction['paymentStatus'] =
    status === 'confirmed' ? 'confirmed' :
    status === 'payment_pending' ? 'initiated' :
    status === 'declined' ? 'failed' :
    status === 'escalated' ? 'awaiting_approval' : 'pending';

  return {
    id: String(row.id),
    agentId: String(row.agent_id ?? ''),
    agentName,
    trustLevel: trustLevel as Transaction['trustLevel'],
    products: (row.products as { name: string; price: number }[]) ?? [],
    amount: Number(row.amount ?? 0),
    openTabId: row.open_tab_id ? String(row.open_tab_id) : undefined,
    decision,
    reason: String(row.decision_reason ?? ''),
    paymentStatus,
    stages: [],
    timestamp: row.created_at ? String(row.created_at) : new Date().toISOString(),
  };
}

function mapLedger(row: Record<string, unknown>): LedgerEvent {
  const eventType = String(row.event_type ?? '');
  return {
    id: String(row.id),
    time: row.created_at ? new Date(row.created_at as string).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—',
    what: eventTypeToLabel(eventType),
    why: String(row.reason ?? ''),
    who: String(row.actor_id ?? ''),
    whoType: row.actor_type as LedgerEvent['whoType'],
    transactionId: row.transaction_id ? String(row.transaction_id) : undefined,
    decision: eventType.includes('APPROVED') ? 'approved' : eventType.includes('DECLINED') ? 'declined' : undefined,
  };
}

function mapOpportunity(row: Record<string, unknown>): GrowthOpportunity {
  return {
    id: String(row.id),
    type: String(row.opportunity_type) as GrowthOpportunity['type'],
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    impact: Number(row.estimated_revenue_impact ?? 0),
    confidence: String(row.confidence_level) as GrowthOpportunity['confidence'],
    risk: String(row.risk_level) as GrowthOpportunity['risk'],
    products: ((row.supporting_data as Record<string, unknown>)?.products as string[]) ?? [],
    status: String(row.status) as GrowthOpportunity['status'],
  };
}

function mapPolicy(row: Record<string, unknown>): Policy {
  const rules = row.rules as Record<string, unknown>;
  let value = '';
  if (rules.max_discount_percent) value = `${rules.max_discount_percent}%`;
  else if (rules.min_margin_percent) value = `${rules.min_margin_percent}%`;
  else if (rules.max_txn_amount) value = `₹${Number(rules.max_txn_amount).toLocaleString('en-IN')}`;
  else if (rules.allowed_categories) value = (rules.allowed_categories as string[]).join(', ');
  else if (rules.max_requests_per_min) value = `${rules.max_requests_per_min} / min`;
  else if (rules.allowed_trust_levels) value = (rules.allowed_trust_levels as string[]).join(' + ');
  else if (rules.auto_approve_ceiling) value = `₹${Number(rules.auto_approve_ceiling).toLocaleString('en-IN')}`;
  else if (rules.human_approval_threshold) value = `₹${Number(rules.human_approval_threshold).toLocaleString('en-IN')}`;

  return {
    id: String(row.id),
    category: String(row.policy_type) as Policy['category'],
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    value,
    enabled: Boolean(row.enabled),
  };
}

function eventTypeToLabel(eventType: string): string {
  const labels: Record<string, string> = {
    PAYMENT_CONFIRMED: 'Payment confirmed',
    TRANSACTION_APPROVED: 'Transaction approved',
    TRANSACTION_DECLINED: 'Transaction declined',
    POLICY_EVALUATED: 'Merchant policy satisfied',
    OPEN_TAB_VALIDATED: 'Spending limit validated',
    OPEN_TAB_CREATED: 'OpenTab activated',
    OPEN_TAB_PAUSED: 'Agent paused by merchant',
    OPEN_TAB_REVOKED: 'OpenTab revoked',
    TRANSACTION_REQUESTED: 'Agent requested purchase',
    AGENT_DISCOVERED_CATALOG: 'Verified AI agent discovered catalog',
    HUMAN_APPROVAL_REQUESTED: 'Human approval requested',
    AGENT_VERIFIED: 'Agent verified',
    PAYMENT_SIMULATED: 'Payment simulated',
    IDENTITY_VALIDATED: 'Identity validated',
  };
  return labels[eventType] ?? eventType;
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<MerchantProfile>(fallbackMerchant);
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const realtimeChannels = useRef<ReturnType<SupabaseClient['channel']>[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [
        agentsRes, productsRes, tabsRes, txnsRes, ledgerRes, oppsRes, policiesRes, orgRes
      ] = await Promise.all([
        supabase.from('agents').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at'),
        supabase.from('products').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at'),
        supabase.from('open_tabs').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at', { ascending: false }),
        supabase.from('trust_ledger_events').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at', { ascending: false }).limit(50),
        supabase.from('revenue_opportunities').select('*').eq('organization_id', DEMO_ORG_ID).order('created_at'),
        supabase.from('policies').select('*').eq('organization_id', DEMO_ORG_ID).order('priority'),
        supabase.from('organizations').select('*').eq('id', DEMO_ORG_ID).maybeSingle(),
      ]);

      const agentRows = (agentsRes.data as Record<string, unknown>[]) ?? [];
      const mappedAgents = agentRows.map((r, i) => mapAgent(r, i));
      setAgents(mappedAgents);

      const productRows = (productsRes.data as Record<string, unknown>[]) ?? [];
      setProducts(productRows.map(mapProduct));

      const tabRows = (tabsRes.data as Record<string, unknown>[]) ?? [];
      const agentMap = new Map(mappedAgents.map((a) => [a.id, a]));
      setOpenTabs(tabRows.map((r) => {
        const a = agentMap.get(String(r.agent_id));
        return mapOpenTab(r, a?.name ?? 'Unknown', a?.trustLevel ?? 'unknown');
      }));

      const txnRows = (txnsRes.data as Record<string, unknown>[]) ?? [];
      setTransactions(txnRows.map((r) => {
        const a = agentMap.get(String(r.agent_id));
        return mapTransaction(r, a?.name ?? 'Unknown', a?.trustLevel ?? 'unknown');
      }));

      const ledgerRows = (ledgerRes.data as Record<string, unknown>[]) ?? [];
      setLedger(ledgerRows.map(mapLedger));

      const oppRows = (oppsRes.data as Record<string, unknown>[]) ?? [];
      setOpportunities(oppRows.map(mapOpportunity));

      const policyRows = (policiesRes.data as Record<string, unknown>[]) ?? [];
      setPolicies(policyRows.map(mapPolicy));

      if (orgRes.data) {
        const org = orgRes.data as Record<string, unknown>;
        setMerchant((prev) => ({
          ...prev,
          businessName: String(org.name ?? prev.businessName),
          industry: String(org.industry ?? prev.industry),
          storeUrl: String(org.store_url ?? prev.storeUrl),
        }));
      }
    } catch {
      // silently fail — demo data already loaded
    }
  }, []);

  // Auth state
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(
      ({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;

        if (data.session) {
          setAuthed(true);
          refreshData().finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }
    );

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          setAuthed(true);
          refreshData();
        } else {
          setAuthed(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!authed) return;

    const channel = supabase
      .channel('merchantos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'open_tabs' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trust_ledger_events' }, () => refreshData())
      .subscribe();

    realtimeChannels.current.push(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authed, refreshData]);

  const updateMerchant = useCallback((m: Partial<MerchantProfile>) => {
    setMerchant((prev) => ({ ...prev, ...m }));
  }, []);

  const updatePolicy = useCallback((id: string, patch: Partial<Policy>) => {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const togglePolicy = useCallback(async (id: string) => {
    const policy = policies.find((p) => p.id === id);
    if (!policy) return;
    const newEnabled = !policy.enabled;
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: newEnabled } : p)));
    await supabase.from('policies').update({ enabled: newEnabled }).eq('id', id);
  }, [policies]);

  const setOpportunityStatus = useCallback(async (id: string, status: GrowthOpportunity['status']) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await supabase.from('revenue_opportunities').update({ status }).eq('id', id);
  }, []);

  const setAgentStatus = useCallback(async (id: string, status: AgentIdentity['status']) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await supabase.from('agents').update({ status }).eq('id', id);
  }, []);

  const addLedgerEvent = useCallback((e: Omit<LedgerEvent, 'id'>) => {
    setLedger((prev) => [{ ...e, id: uid('e') }, ...prev]);
  }, []);

  const createOpenTab = useCallback(async (tab: Omit<OpenTab, 'id' | 'createdAt' | 'remaining' | 'status'>): Promise<OpenTab> => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-open-tab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        organization_id: DEMO_ORG_ID,
        agent_id: tab.agentId,
        name: tab.agentName ? `${tab.agentName} Tab` : 'OpenTab',
        authorization_cap: tab.cap,
        auto_approval_ceiling: tab.autoApproveCeiling,
        allowed_categories: tab.scope,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error?.message ?? 'Failed to create OpenTab');

    const newTab: OpenTab = {
      ...tab,
      id: result.data.open_tab.id,
      remaining: tab.cap,
      status: 'active',
      createdAt: 'Just now',
    };
    setOpenTabs((prev) => [newTab, ...prev]);
    addLedgerEvent({
      time: 'Just now',
      what: 'OpenTab activated',
      why: `New OpenTab created for ${tab.agentName} — ${tab.scope.join(', ')}`,
      who: tab.agentName,
      whoType: 'merchant',
      policy: 'opentab-scope',
    });
    return newTab;
  }, [addLedgerEvent]);

  const pauseOpenTab = useCallback(async (id: string) => {
    setOpenTabs((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t)));
    await supabase.from('open_tabs').update({ status: 'paused' }).eq('id', id);
    pushToast({ type: 'info', title: 'OpenTab paused', message: 'The agent can no longer request transactions.' });
  }, [pushToast]);

  const revokeOpenTab = useCallback(async (id: string) => {
    setOpenTabs((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'revoked', remaining: 0 } : t)));
    await supabase.from('open_tabs').update({ status: 'revoked', remaining_amount: 0, revoked_at: new Date().toISOString() }).eq('id', id);
    pushToast({ type: 'warning', title: 'OpenTab revoked', message: 'All transaction authority has been removed.' });
  }, [pushToast]);

  const addTransaction = useCallback((txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev]);
  }, []);

  const approveEscalatedTransaction = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ transaction_id: id, organization_id: DEMO_ORG_ID }),
    });
    const result = await response.json();
    if (!result.success) {
      pushToast({ type: 'error', title: 'Approval failed', message: result.error?.message ?? 'Failed to approve transaction.' });
      return;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, decision: 'approved', paymentStatus: 'confirmed', reason: 'Human approval granted. All policies satisfied.' }
          : t
      )
    );
    addLedgerEvent({
      time: 'Just now',
      what: 'Escalated transaction approved',
      why: 'Merchant approved the escalated transaction',
      who: 'Merchant',
      whoType: 'merchant',
      policy: 'human-approval',
      transactionId: id,
      decision: 'approved',
    });
    pushToast({ type: 'success', title: 'Transaction approved', message: 'Payment has been confirmed.' });
    refreshData();
  }, [addLedgerEvent, pushToast, refreshData]);

  const declineEscalatedTransaction = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/decline-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ transaction_id: id, organization_id: DEMO_ORG_ID }),
    });
    const result = await response.json();
    if (!result.success) {
      pushToast({ type: 'error', title: 'Decline failed', message: result.error?.message ?? 'Failed to decline transaction.' });
      return;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, decision: 'declined', paymentStatus: 'failed', reason: 'Human approval denied.' }
          : t
      )
    );
    addLedgerEvent({
      time: 'Just now',
      what: 'Escalated transaction declined',
      why: 'Merchant declined the escalated transaction',
      who: 'Merchant',
      whoType: 'merchant',
      policy: 'human-approval',
      transactionId: id,
      decision: 'declined',
    });
    pushToast({ type: 'warning', title: 'Transaction declined', message: 'The request has been denied.' });
    refreshData();
  }, [addLedgerEvent, pushToast, refreshData]);

  const evaluateTransaction = useCallback(async (params: {
    agentId: string;
    products: { name: string; price: number }[];
    openTabId?: string;
  }): Promise<{ decision: TxnDecision; reason: string; stages: TxnStage[]; amount: number; transactionId?: string; transactionRequestId?: string }> => {
    const amount = params.products.reduce((sum, p) => sum + p.price, 0);
    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const stages: TxnStage[] = [
      { id: 's1', label: 'Agent Request', status: 'pending', detail: `Agent requested purchase of ${params.products.map((p) => p.name).join(', ')}` },
      { id: 's2', label: 'Identity Verification', status: 'pending' },
      { id: 's3', label: 'Catalog Validation', status: 'pending' },
      { id: 's4', label: 'Policy Check', status: 'pending' },
      { id: 's5', label: 'OpenTab Validation', status: 'pending' },
      { id: 's6', label: 'Payment Initiated', status: 'pending' },
      { id: 's7', label: 'Payment Confirmed', status: 'pending' },
    ];

    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        organization_id: DEMO_ORG_ID,
        agent_id: params.agentId,
        products: params.products,
        idempotency_key: idempotencyKey,
        open_tab_id: params.openTabId,
      }),
    });

    const result = await response.json();

    stages[0].status = 'passed';
    stages[0].detail = `Agent requested purchase of ${params.products.map((p) => p.name).join(', ')}`;

    if (!result.success && result.data?.decision === 'declined') {
      const reason = result.data.reason ?? 'Transaction declined.';
      const checks = result.data.checks ?? [];
      for (const check of checks) {
        const stageIdx = stages.findIndex((s) => s.label.toLowerCase().includes(check.label.toLowerCase().split(' ')[0]));
        if (stageIdx >= 0) {
          stages[stageIdx].status = check.passed ? 'passed' : 'failed';
          stages[stageIdx].detail = check.detail;
        }
      }
      for (let i = 1; i < stages.length; i++) {
        if (stages[i].status === 'pending') stages[i].status = 'skipped';
      }
      return { decision: 'declined', reason, stages, amount };
    }

    if (!result.success) {
      return { decision: 'declined', reason: result.error?.message ?? 'Evaluation failed.', stages, amount };
    }

    const data = result.data;
    const decision = data.decision as TxnDecision;
    const checks = data.checks ?? [];

    for (const check of checks) {
      const stageIdx = stages.findIndex((s) =>
        s.label.toLowerCase().includes(check.label.toLowerCase().split(' ')[0]) ||
        check.label.toLowerCase().includes(s.label.toLowerCase().split(' ')[0])
      );
      if (stageIdx >= 0) {
        stages[stageIdx].status = check.passed ? 'passed' : 'failed';
        stages[stageIdx].detail = check.detail;
      }
    }

    if (decision === 'approved') {
      stages[5].status = 'passed';
      stages[5].detail = 'Handed to payment provider';
      stages[6].status = 'passed';
      stages[6].detail = 'Payment provider confirmed';
    } else if (decision === 'escalated') {
      stages[5].status = 'skipped';
      stages[6].status = 'skipped';
    }

    refreshData();
    return {
      decision,
      reason: data.reason ?? '',
      stages,
      amount,
      transactionId: data.transaction_id,
      transactionRequestId: data.transaction_request_id,
    };
  }, [refreshData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  }, []);

  const value: AppContextValue = {
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
