export type TrustLevel = 'verified' | 'known' | 'unknown';

export type AgentStatus = 'active' | 'paused' | 'revoked';

export interface AgentIdentity {
  id: string;
  name: string;
  organization: string;
  provider: string;
  trustLevel: TrustLevel;
  authStatus: 'authenticated' | 'unauthenticated';
  permissionLevel: 'full' | 'limited' | 'public';
  status: AgentStatus;
  lastActivity: string;
  avatarColor: string;
  activity: AgentActivityEvent[];
}

export interface AgentActivityEvent {
  time: string;
  action: string;
  detail: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  image: string;
  aiReadiness: number;
  readinessIssues: string[];
  description: string;
  shipping: string;
  returns: string;
}

export type OpenTabStatus = 'active' | 'paused' | 'expired' | 'revoked' | 'exhausted';

export interface OpenTab {
  id: string;
  agentId: string;
  agentName: string;
  trustLevel: TrustLevel;
  scope: string[];
  cap: number;
  remaining: number;
  autoApproveCeiling: number;
  expiresAt: string;
  status: OpenTabStatus;
  createdAt: string;
}

export type TxnDecision = 'approved' | 'declined' | 'escalated';
export type TxnPaymentStatus = 'pending' | 'initiated' | 'confirmed' | 'failed' | 'awaiting_approval';

export interface TxnStage {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  timestamp?: string;
  detail?: string;
}

export interface Transaction {
  id: string;
  agentId: string;
  agentName: string;
  trustLevel: TrustLevel;
  products: { name: string; price: number }[];
  amount: number;
  openTabId?: string;
  decision: TxnDecision;
  reason: string;
  paymentStatus: TxnPaymentStatus;
  stages: TxnStage[];
  timestamp: string;
}

export interface LedgerEvent {
  id: string;
  time: string;
  what: string;
  why: string;
  who: string;
  whoType: 'agent' | 'merchant' | 'system';
  policy?: string;
  transactionId?: string;
  decision?: TxnDecision;
}

export interface GrowthOpportunity {
  id: string;
  type: 'bundle' | 'catalog' | 'conversion' | 'pricing';
  title: string;
  description: string;
  impact: number;
  confidence: 'high' | 'medium' | 'low';
  risk: 'low' | 'medium' | 'high';
  products: string[];
  status: 'new' | 'approved' | 'dismissed' | 'simulated';
}

export interface Policy {
  id: string;
  category: 'financial' | 'agent' | 'approval';
  name: string;
  description: string;
  value: string;
  enabled: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface MerchantProfile {
  businessName: string;
  industry: string;
  storeUrl: string;
  contactEmail: string;
  aiReadiness: number;
  onboardingComplete: boolean;
  boundaries: {
    maxDiscount: number;
    minMargin: number;
    autoApproveThreshold: number;
    maxTxnAmount: number;
  };
}
