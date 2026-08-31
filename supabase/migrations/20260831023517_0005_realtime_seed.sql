/*
# Enable Realtime & Seed Demo Data

## Summary
1. Enables Supabase Realtime on transaction_requests, transactions, open_tabs, and trust_ledger_events so the frontend can subscribe to live updates.
2. Seeds a demo organization, agents, products, policies, an OpenTab, and sample transactions/ledger events.

## Demo Data
- Organization: Northwind Commerce (Electronics & Accessories)
- Agents: AI Shopping Assistant (verified), Buyer Agent (known), Research Agent (unknown), Procurement Agent (known/paused)
- Products: 8 realistic electronics/accessories items with varied AI readiness
- Policies: 8 default policies across financial, agent, and approval categories
- OpenTab: AI Shopping Assistant with ₹15,000 cap, ₹5,000 auto-approve, Electronics+Accessories scope
- Transactions: 4 sample transactions (approved, escalated, declined)
- Ledger: 11 sample audit events

## Security
- Realtime respects RLS — only org members see events for their org.
- Seed data uses a fixed demo organization UUID referenced by all child records.

## Notes
1. Realtime is enabled via ALTER TABLE ... REPLICA IDENTITY FULL and publication.
2. Seed data is idempotent — uses ON CONFLICT DO NOTHING and checks for existing data.
3. Demo data is clearly fictional and for demonstration purposes only.
*/

-- ===== ENABLE REALTIME =====
ALTER TABLE transaction_requests REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE open_tabs REPLICA IDENTITY FULL;
ALTER TABLE trust_ledger_events REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transaction_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transaction_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'open_tabs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE open_tabs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'trust_ledger_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trust_ledger_events;
  END IF;
END $$;

-- ===== SEED DEMO DATA =====
-- Demo organization (fixed UUID for easy reference)
DO $$
DECLARE
  demo_org_id uuid := 'a0000000-0000-0000-0000-000000000001';
  agent1_id uuid := 'a0000000-0000-0000-0000-000000000010';
  agent2_id uuid := 'a0000000-0000-0000-0000-000000000011';
  agent3_id uuid := 'a0000000-0000-0000-0000-000000000012';
  agent4_id uuid := 'a0000000-0000-0000-0000-000000000013';
  tab1_id uuid := 'a0000000-0000-0000-0000-000000000020';
  tab2_id uuid := 'a0000000-0000-0000-0000-000000000021';
  tab3_id uuid := 'a0000000-0000-0000-0000-000000000022';
  txn_req1 uuid := 'a0000000-0000-0000-0000-000000000030';
  txn_req2 uuid := 'a0000000-0000-0000-0000-000000000031';
  txn_req3 uuid := 'a0000000-0000-0000-0000-000000000032';
  txn_req4 uuid := 'a0000000-0000-0000-0000-000000000033';
  txn1_id uuid := 'a0000000-0000-0000-0000-000000000040';
  txn2_id uuid := 'a0000000-0000-0000-0000-000000000041';
  txn3_id uuid := 'a0000000-0000-0000-0000-000000000042';
  txn4_id uuid := 'a0000000-0000-0000-0000-000000000043';
BEGIN
  -- Organization
  INSERT INTO organizations (id, name, industry, store_url) VALUES
    (demo_org_id, 'Northwind Commerce', 'Electronics & Accessories', 'northwind.example.com')
  ON CONFLICT (id) DO NOTHING;

  -- Agents
  INSERT INTO agents (id, organization_id, agent_name, provider_name, agent_identifier, trust_level, status, permissions, metadata, last_activity_at) VALUES
    (agent1_id, demo_org_id, 'AI Shopping Assistant', 'Aurora AI', 'aurora-agent-001', 'verified', 'active',
     '{"can_transact": true, "can_discover": true, "max_scope": "full"}'::jsonb,
     '{"simulated": true}'::jsonb, now() - interval '2 minutes'),
    (agent2_id, demo_org_id, 'Buyer Agent', 'Helix Commerce', 'helix-buyer-002', 'known', 'active',
     '{"can_transact": true, "can_discover": true, "max_scope": "limited"}'::jsonb,
     '{"simulated": true}'::jsonb, now() - interval '18 minutes'),
    (agent3_id, demo_org_id, 'Research Agent', 'Independent', 'open-research-003', 'unknown', 'active',
     '{"can_transact": false, "can_discover": true, "max_scope": "public"}'::jsonb,
     '{"simulated": true}'::jsonb, now() - interval '1 hour'),
    (agent4_id, demo_org_id, 'Procurement Agent', 'Meridian Labs', 'meridian-proc-004', 'known', 'paused',
     '{"can_transact": true, "can_discover": true, "max_scope": "limited"}'::jsonb,
     '{"simulated": true, "suspicious_activity": "rate_limit_triggered"}'::jsonb, now() - interval '3 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Products
  INSERT INTO products (organization_id, name, description, sku, category, price, currency, inventory_quantity, shipping_info, return_policy, ai_readiness_status) VALUES
    (demo_org_id, 'AeroBook Pro', '14-inch ultralight laptop with 22-hour battery, M3 processor, 16GB RAM.', 'ABP-001', 'Electronics', 112000, 'INR', 24, 'Ships in 1-2 business days. Free shipping over ₹5,000.', '15-day return window. No questions asked.', 'healthy'),
    (demo_org_id, 'AeroBook Air', '13-inch ultraportable, 18-hour battery, M2 processor, 8GB RAM.', 'ABA-002', 'Electronics', 78000, 'INR', 41, 'Ships in 1-2 business days.', '15-day return window.', 'healthy'),
    (demo_org_id, 'Wireless Mouse Pro', 'Ergonomic wireless mouse with adaptive scroll and 6-month battery.', 'WMP-003', 'Accessories', 3200, 'INR', 156, 'Same-day dispatch for orders before 2 PM.', '15-day return window.', 'healthy'),
    (demo_org_id, 'Laptop Sleeve', 'Felt laptop sleeve, fits 13-14 inch laptops.', 'LS-004', 'Accessories', 1800, 'INR', 88, NULL, '15-day return window.', 'needs_attention'),
    (demo_org_id, 'Desk Lamp', 'LED desk lamp with wireless charging base and 3 color temperatures.', 'DL-005', 'Accessories', 2400, 'INR', 63, 'Same-day dispatch for orders before 2 PM.', '15-day return window.', 'healthy'),
    (demo_org_id, 'USB-C Hub', '8-in-1 USB-C hub with HDMI, SD, and 100W passthrough charging.', 'UCH-006', 'Accessories', 4500, 'INR', 0, 'Ships in 1-2 business days.', '15-day return window.', 'critical'),
    (demo_org_id, 'Noise-Cancelling Headphones', 'Over-ear ANC headphones, 40-hour battery, adaptive transparency.', 'NCH-007', 'Electronics', 18900, 'INR', 32, 'Ships in 1-2 business days.', '15-day return window.', 'healthy'),
    (demo_org_id, 'Mechanical Keyboard', '75% mechanical keyboard, hot-swappable switches, PBT keycaps.', 'MK-008', 'Accessories', 6900, 'INR', 27, 'Ships in 2-3 business days.', NULL, 'needs_attention')
  ON CONFLICT DO NOTHING;

  -- Catalog issues for products with needs_attention/critical status
  INSERT INTO catalog_issues (organization_id, product_id, issue_type, message, severity, status) VALUES
    (demo_org_id, (SELECT id FROM products WHERE organization_id = demo_org_id AND name = 'Laptop Sleeve' LIMIT 1),
     'missing_shipping', 'AI systems may not be able to determine delivery time for this product.', 'warning', 'open'),
    (demo_org_id, (SELECT id FROM products WHERE organization_id = demo_org_id AND name = 'USB-C Hub' LIMIT 1),
     'out_of_stock', 'Out of stock — AI cannot determine availability.', 'critical', 'open'),
    (demo_org_id, (SELECT id FROM products WHERE organization_id = demo_org_id AND name = 'USB-C Hub' LIMIT 1),
     'no_restock_date', 'No estimated restock date provided.', 'warning', 'open'),
    (demo_org_id, (SELECT id FROM products WHERE organization_id = demo_org_id AND name = 'Mechanical Keyboard' LIMIT 1),
     'missing_returns', 'Return policy details are missing for this product.', 'warning', 'open')
  ON CONFLICT DO NOTHING;

  -- Policies
  INSERT INTO policies (organization_id, name, description, policy_type, enabled, priority, rules) VALUES
    (demo_org_id, 'Maximum Discount', 'No transaction may apply a discount greater than this percentage.', 'financial', true, 10, '{"max_discount_percent": 15}'::jsonb),
    (demo_org_id, 'Minimum Margin', 'No product may be sold below this margin percentage.', 'financial', true, 20, '{"min_margin_percent": 12}'::jsonb),
    (demo_org_id, 'Maximum Transaction Amount', 'No single transaction may exceed this amount.', 'financial', true, 30, '{"max_txn_amount": 25000}'::jsonb),
    (demo_org_id, 'Allowed Categories', 'AI agents may only transact within these categories.', 'agent', true, 40, '{"allowed_categories": ["Electronics", "Accessories"]}'::jsonb),
    (demo_org_id, 'Maximum Requests per Minute', 'Rate limit applied to each agent.', 'agent', true, 50, '{"max_requests_per_min": 10}'::jsonb),
    (demo_org_id, 'Trusted Agents Only', 'Only verified and known agents may initiate transactions.', 'agent', true, 60, '{"allowed_trust_levels": ["verified", "known"]}'::jsonb),
    (demo_org_id, 'Auto-Approval Ceiling', 'Transactions under this amount are auto-approved if all other checks pass.', 'approval', true, 70, '{"auto_approve_ceiling": 5000}'::jsonb),
    (demo_org_id, 'Human Approval Threshold', 'Transactions above this amount require human approval.', 'approval', true, 80, '{"human_approval_threshold": 25000}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- OpenTabs
  INSERT INTO open_tabs (id, organization_id, agent_id, name, status, authorization_cap, consumed_amount, remaining_amount, currency, auto_approval_ceiling, allowed_categories, expires_at, additional_policies) VALUES
    (tab1_id, demo_org_id, agent1_id, 'AI Shopping Assistant Tab', 'active', 15000, 6500, 8500, 'INR', 5000,
     '["Electronics", "Accessories"]'::jsonb, now() + interval '4 hours', '["rate-limit", "duplicate-prevention"]'::jsonb),
    (tab2_id, demo_org_id, agent2_id, 'Buyer Agent Tab', 'active', 8000, 2400, 5600, 'INR', 3000,
     '["Accessories"]'::jsonb, now() + interval '6 hours', '["rate-limit"]'::jsonb),
    (tab3_id, demo_org_id, agent4_id, 'Procurement Agent Tab', 'paused', 20000, 20000, 0, 'INR', 0,
     '["Electronics"]'::jsonb, now() - interval '1 day', '["rate-limit", "duplicate-prevention"]'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Transaction Requests
  INSERT INTO transaction_requests (id, organization_id, agent_id, open_tab_id, idempotency_key, status, requested_amount, currency, products, decision_reason) VALUES
    (txn_req1, demo_org_id, agent1_id, tab1_id, 'idem-001', 'approved', 115200, 'INR',
     '[{"name":"AeroBook Pro","price":112000},{"name":"Wireless Mouse Pro","price":3200}]'::jsonb,
     'All policy checks passed. Within OpenTab scope and authorization.'),
    (txn_req2, demo_org_id, agent2_id, tab2_id, 'idem-002', 'approved', 2400, 'INR',
     '[{"name":"Desk Lamp","price":2400}]'::jsonb,
     'Within auto-approval ceiling. All policies satisfied.'),
    (txn_req3, demo_org_id, agent4_id, tab3_id, 'idem-003', 'escalated', 23400, 'INR',
     '[{"name":"Noise-Cancelling Headphones","price":18900},{"name":"USB-C Hub","price":4500}]'::jsonb,
     'Transaction exceeds auto-approval ceiling. Human approval required.'),
    (txn_req4, demo_org_id, agent3_id, NULL, 'idem-004', 'declined', 18900, 'INR',
     '[{"name":"Noise-Cancelling Headphones","price":18900}]'::jsonb,
     'Agent identity not verified. No transaction authority granted. Restricted to public information only.')
  ON CONFLICT (id) DO NOTHING;

  -- Transactions
  INSERT INTO transactions (id, organization_id, transaction_request_id, agent_id, open_tab_id, amount, currency, status, payment_reference, payment_provider, confirmed_at) VALUES
    (txn1_id, demo_org_id, txn_req1, agent1_id, tab1_id, 115200, 'INR', 'confirmed', 'sim-pay-001', 'simulated_provider', now() - interval '30 minutes'),
    (txn2_id, demo_org_id, txn_req2, agent2_id, tab2_id, 2400, 'INR', 'confirmed', 'sim-pay-002', 'simulated_provider', now() - interval '45 minutes'),
    (txn3_id, demo_org_id, txn_req3, agent4_id, tab3_id, 23400, 'INR', 'escalated', NULL, NULL, NULL),
    (txn4_id, demo_org_id, txn_req4, agent3_id, NULL, 18900, 'INR', 'declined', NULL, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Trust Ledger Events
  INSERT INTO trust_ledger_events (organization_id, event_type, actor_type, actor_id, transaction_id, transaction_request_id, open_tab_id, event_data, reason) VALUES
    (demo_org_id, 'PAYMENT_CONFIRMED', 'system', 'system', txn1_id, txn_req1, tab1_id, '{"amount": 115200}'::jsonb, 'Payment provider confirmed transaction'),
    (demo_org_id, 'TRANSACTION_APPROVED', 'agent', agent1_id::text, txn1_id, txn_req1, tab1_id, '{"decision": "approved"}'::jsonb, 'All policy checks passed'),
    (demo_org_id, 'POLICY_EVALUATED', 'system', 'system', txn1_id, txn_req1, tab1_id, '{"policies_checked": 8, "all_passed": true}'::jsonb, 'Within discount and margin boundaries'),
    (demo_org_id, 'OPEN_TAB_VALIDATED', 'system', 'system', txn1_id, txn_req1, tab1_id, '{"remaining": 8500}'::jsonb, 'Amount within remaining OpenTab authorization'),
    (demo_org_id, 'TRANSACTION_REQUESTED', 'agent', agent1_id::text, txn1_id, txn_req1, tab1_id, '{"amount": 115200, "products": ["AeroBook Pro", "Wireless Mouse Pro"]}'::jsonb, 'Verified agent initiated purchase'),
    (demo_org_id, 'AGENT_DISCOVERED_CATALOG', 'agent', agent1_id::text, NULL, NULL, NULL, '{"category": "Electronics"}'::jsonb, 'Agent browsed Electronics category'),
    (demo_org_id, 'TRANSACTION_APPROVED', 'agent', agent2_id::text, txn2_id, txn_req2, tab2_id, '{"decision": "approved"}'::jsonb, 'Within auto-approval ceiling'),
    (demo_org_id, 'TRANSACTION_DECLINED', 'agent', agent3_id::text, txn4_id, txn_req4, NULL, '{"decision": "declined", "reason": "identity_not_verified"}'::jsonb, 'Identity not verified — public info only'),
    (demo_org_id, 'OPEN_TAB_PAUSED', 'user', 'merchant', NULL, NULL, tab3_id, '{"reason": "rate_limit_exceeded"}'::jsonb, 'Unusual request volume detected'),
    (demo_org_id, 'HUMAN_APPROVAL_REQUESTED', 'system', 'system', txn3_id, txn_req3, tab3_id, '{"amount": 23400}'::jsonb, 'Transaction exceeds auto-approval ceiling'),
    (demo_org_id, 'OPEN_TAB_CREATED', 'user', 'merchant', NULL, NULL, tab1_id, '{"cap": 15000, "scope": ["Electronics", "Accessories"]}'::jsonb, 'New OpenTab for AI Shopping Assistant')
  ON CONFLICT DO NOTHING;

  -- Revenue Opportunities
  INSERT INTO revenue_opportunities (organization_id, title, opportunity_type, description, estimated_revenue_impact, confidence_level, risk_level, supporting_data, status) VALUES
    (demo_org_id, 'Laptop Sleeve + Wireless Mouse Bundle', 'bundle', 'Customers who purchase the AeroBook Pro frequently purchase these accessories. Bundling them increases average order value.', 18400, 'high', 'low', '{"products": ["AeroBook Pro", "Laptop Sleeve", "Wireless Mouse Pro"]}'::jsonb, 'new'),
    (demo_org_id, 'Fix delivery time on Laptop Sleeve', 'catalog', 'AI systems cannot determine delivery time for this product. Adding shipping estimates could improve AI-driven conversion.', 6200, 'medium', 'low', '{"products": ["Laptop Sleeve"], "issue": "missing_shipping"}'::jsonb, 'new'),
    (demo_org_id, 'Adjust Mechanical Keyboard price for margin', 'pricing', 'Current price is 8% below the optimal margin boundary. A small increase stays within your min-margin policy.', 4100, 'medium', 'medium', '{"products": ["Mechanical Keyboard"], "adjustment": "+8%"}'::jsonb, 'new'),
    (demo_org_id, 'Restock USB-C Hub', 'conversion', 'High-demand product is out of stock with no restock date. Restocking recovers an estimated 22 lost AI-driven inquiries.', 9800, 'high', 'low', '{"products": ["USB-C Hub"], "issue": "out_of_stock"}'::jsonb, 'new')
  ON CONFLICT DO NOTHING;
END $$;
