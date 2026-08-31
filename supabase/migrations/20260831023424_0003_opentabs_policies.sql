/*
# OpenTabs & Policies Schema

## Summary
Creates the OpenTab authorization system and the deterministic policy engine tables.

## New Tables
1. `open_tabs` — Scoped, capped, temporary, revocable transaction authorization for AI agents. Does NOT hold money — it's an authorization layer before payment.
2. `policies` — Deterministic merchant policies (financial, agent, approval categories). AI recommendations can never override these.

## Security
- Both tables are organization-scoped with RLS.
- open_tabs: members can read; admins can write. remaining_amount has a CHECK constraint >= 0.
- policies: members can read; only admins can insert/update/delete.

## Notes
1. remaining_amount has a CHECK constraint preventing negative values.
2. expires_at is a timestamptz — expired tabs cannot approve transactions (checked server-side).
3. policies.rules is JSONB for flexible rule definitions (e.g. {"max_discount": 15, "max_txn_amount": 25000}).
4. updated_at triggers added.
*/

-- ===== OPEN_TABS =====
CREATE TABLE IF NOT EXISTS open_tabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked', 'expired')),
  authorization_cap numeric(12,2) NOT NULL DEFAULT 0,
  consumed_amount numeric(12,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  auto_approval_ceiling numeric(12,2) NOT NULL DEFAULT 0,
  allowed_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  additional_policies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT remaining_non_negative CHECK (remaining_amount >= 0),
  CONSTRAINT consumed_non_negative CHECK (consumed_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_open_tabs_org ON open_tabs(organization_id);
CREATE INDEX IF NOT EXISTS idx_open_tabs_agent ON open_tabs(agent_id);
CREATE INDEX IF NOT EXISTS idx_open_tabs_status ON open_tabs(status);

ALTER TABLE open_tabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tabs_select_member" ON open_tabs;
CREATE POLICY "tabs_select_member" ON open_tabs FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "tabs_insert_admin" ON open_tabs;
CREATE POLICY "tabs_insert_admin" ON open_tabs FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "tabs_update_admin" ON open_tabs;
CREATE POLICY "tabs_update_admin" ON open_tabs FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "tabs_delete_admin" ON open_tabs;
CREATE POLICY "tabs_delete_admin" ON open_tabs FOR DELETE
  TO authenticated USING (public.is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_open_tabs_updated ON open_tabs;
CREATE TRIGGER trg_open_tabs_updated BEFORE UPDATE ON open_tabs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== POLICIES =====
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  policy_type text NOT NULL CHECK (policy_type IN ('financial', 'agent', 'approval')),
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policies_select_member" ON policies;
CREATE POLICY "policies_select_member" ON policies FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "policies_insert_admin" ON policies;
CREATE POLICY "policies_insert_admin" ON policies FOR INSERT
  TO authenticated WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "policies_update_admin" ON policies;
CREATE POLICY "policies_update_admin" ON policies FOR UPDATE
  TO authenticated USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "policies_delete_admin" ON policies;
CREATE POLICY "policies_delete_admin" ON policies FOR DELETE
  TO authenticated USING (public.is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_policies_updated ON policies;
CREATE TRIGGER trg_policies_updated BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
