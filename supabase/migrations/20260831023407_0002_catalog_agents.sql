/*
# Catalog & Agent Identity Schema

## Summary
Creates the product catalog and AI agent identity tables. All resources are organization-scoped with RLS enforced via the is_org_member helper.

## New Tables
1. `products` — Merchant catalog items with pricing, inventory, shipping, return info, and AI readiness status.
2. `catalog_issues` — Issues detected during catalog readiness analysis (missing descriptions, shipping, returns, etc.).
3. `agents` — AI agent identities with trust levels, status, permissions, and metadata.

## Security
- All tables have organization_id FK and RLS scoped to org members.
- products: members can read; admins can write.
- catalog_issues: members can read; admins can write.
- agents: members can read; admins can write.

## Notes
1. Agent verification is simulated for this MVP — no cryptographic claims.
2. ai_readiness_status on products is a text field (e.g. 'healthy', 'needs_attention', 'critical').
3. updated_at triggers added to products and agents.
*/

-- ===== PRODUCTS =====
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text,
  category text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  inventory_quantity integer NOT NULL DEFAULT 0,
  image_url text,
  shipping_info text,
  return_policy text,
  ai_readiness_status text NOT NULL DEFAULT 'needs_attention' CHECK (ai_readiness_status IN ('healthy', 'needs_attention', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_member" ON products;
CREATE POLICY "products_select_member" ON products FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin" ON products FOR DELETE
  TO authenticated USING (public.is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== CATALOG ISSUES =====
CREATE TABLE IF NOT EXISTS catalog_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_catalog_issues_org ON catalog_issues(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_issues_product ON catalog_issues(product_id);

ALTER TABLE catalog_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issues_select_member" ON catalog_issues;
CREATE POLICY "issues_select_member" ON catalog_issues FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "issues_insert_admin" ON catalog_issues;
CREATE POLICY "issues_insert_admin" ON catalog_issues FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "issues_update_admin" ON catalog_issues;
CREATE POLICY "issues_update_admin" ON catalog_issues FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "issues_delete_admin" ON catalog_issues;
CREATE POLICY "issues_delete_admin" ON catalog_issues FOR DELETE
  TO authenticated USING (public.is_org_admin(organization_id));

-- ===== AGENTS =====
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  provider_name text,
  agent_identifier text,
  trust_level text NOT NULL DEFAULT 'unknown' CHECK (trust_level IN ('verified', 'known', 'unknown')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'paused', 'revoked')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_select_member" ON agents;
CREATE POLICY "agents_select_member" ON agents FOR SELECT
  TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "agents_insert_admin" ON agents;
CREATE POLICY "agents_insert_admin" ON agents FOR INSERT
  TO authenticated WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "agents_update_admin" ON agents;
CREATE POLICY "agents_update_admin" ON agents FOR UPDATE
  TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "agents_delete_admin" ON agents;
CREATE POLICY "agents_delete_admin" ON agents FOR DELETE
  TO authenticated USING (public.is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_agents_updated ON agents;
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
