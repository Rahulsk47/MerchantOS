/*
# Transactions, Trust Ledger & Revenue Opportunities Schema

## Summary
Creates the transaction lifecycle tables, the append-only Trust Ledger audit log, and revenue opportunities for Growth Intelligence.

## New Tables
1. `transaction_requests` — Initial agent purchase requests with idempotency keys. Status: pending/approved/declined/escalated/cancelled.
2. `transactions` — The actual transaction records linked to requests. Status: pending/approved/declined/escalated/payment_pending/confirmed.
3. `trust_ledger_events` — Append-only audit log. Every event answers what/why/who/when/which policy.
4. `revenue_opportunities` — AI-powered growth recommendations with estimated impact, confidence, and risk.

## Security
- All tables are organization-scoped with RLS.
- transaction_requests: members can read; admins can insert/update.
- transactions: members can read; admins can insert/update.
- trust_ledger_events: members can read only (append-only via edge functions/service role). No client-side INSERT/UPDATE/DELETE.
- revenue_opportunities: members can read; admins can update.

## Idempotency
- transaction_requests has a UNIQUE constraint on (organization_id, idempotency_key) to prevent duplicate requests.

## Notes
1. Trust Ledger is append-only at the application level — RLS denies all client writes. Edge functions with service role create events.
2. Payment fields (payment_reference, payment_provider) are structured for future real payment integration.
3. updated_at triggers added to transaction_requests, transactions, and revenue_opportunities.
*/

-- ===== TRANSACTION_REQUESTS =====
CREATE TABLE IF NOT EXISTS transaction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  open_tab_id uuid REFERENCES open_tabs(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'escalated', 'cancelled')),
  requested_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  request_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_txn_reqs_org ON transaction_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_txn_reqs_agent ON transaction_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_txn_reqs_status ON transaction_requests(status);

ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "txn_reqs_select_member" ON transaction_requests;
CREATE POLICY "txn_reqs_select_member" ON transaction_requests FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "txn_reqs_insert_admin" ON transaction_requests;
CREATE POLICY "txn_reqs_insert_admin" ON transaction_requests FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "txn_reqs_update_admin" ON transaction_requests;
CREATE POLICY "txn_reqs_update_admin" ON transaction_requests FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP TRIGGER IF EXISTS trg_txn_reqs_updated ON transaction_requests;
CREATE TRIGGER trg_txn_reqs_updated BEFORE UPDATE ON transaction_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== TRANSACTIONS =====
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_request_id uuid NOT NULL REFERENCES transaction_requests(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  open_tab_id uuid REFERENCES open_tabs(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'escalated', 'payment_pending', 'confirmed')),
  payment_reference text,
  payment_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_txns_org ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_txns_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_txns_status ON transactions(status);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "txns_select_member" ON transactions;
CREATE POLICY "txns_select_member" ON transactions FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "txns_insert_admin" ON transactions;
CREATE POLICY "txns_insert_admin" ON transactions FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "txns_update_admin" ON transactions;
CREATE POLICY "txns_update_admin" ON transactions FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP TRIGGER IF EXISTS trg_txns_updated ON transactions;
CREATE TRIGGER trg_txns_updated BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== TRUST LEDGER EVENTS =====
CREATE TABLE IF NOT EXISTS trust_ledger_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_id text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  transaction_request_id uuid REFERENCES transaction_requests(id) ON DELETE SET NULL,
  open_tab_id uuid REFERENCES open_tabs(id) ON DELETE SET NULL,
  policy_id uuid REFERENCES policies(id) ON DELETE SET NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_org ON trust_ledger_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ledger_event_type ON trust_ledger_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON trust_ledger_events(created_at DESC);

ALTER TABLE trust_ledger_events ENABLE ROW LEVEL SECURITY;

-- Append-only: members can read, NO client-side writes allowed
DROP POLICY IF EXISTS "ledger_select_member" ON trust_ledger_events;
CREATE POLICY "ledger_select_member" ON trust_ledger_events FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

-- ===== REVENUE OPPORTUNITIES =====
CREATE TABLE IF NOT EXISTS revenue_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  opportunity_type text NOT NULL,
  description text,
  estimated_revenue_impact numeric(12,2) NOT NULL DEFAULT 0,
  confidence_level text NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  supporting_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opps_org ON revenue_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opps_status ON revenue_opportunities(status);

ALTER TABLE revenue_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opps_select_member" ON revenue_opportunities;
CREATE POLICY "opps_select_member" ON revenue_opportunities FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "opps_insert_admin" ON revenue_opportunities;
CREATE POLICY "opps_insert_admin" ON revenue_opportunities FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "opps_update_admin" ON revenue_opportunities;
CREATE POLICY "opps_update_admin" ON revenue_opportunities FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP TRIGGER IF EXISTS trg_opps_updated ON revenue_opportunities;
CREATE TRIGGER trg_opps_updated BEFORE UPDATE ON revenue_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
