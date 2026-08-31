import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckResult {
  label: string;
  passed: boolean;
  detail: string;
}

interface PolicyResult {
  decision: "approved" | "declined" | "escalated";
  reason: string;
  checks: CheckResult[];
  policiesEvaluated: number;
  timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, 401);
    }

    const body = await req.json();
    const { organization_id, agent_id, products, idempotency_key, open_tab_id } = body;

    if (!organization_id || !agent_id || !products || !Array.isArray(products) || !idempotency_key) {
      return jsonResponse({ success: false, data: null, error: { code: "INVALID_REQUEST", message: "Missing required fields." } }, 400);
    }

    // Validate org membership
    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return jsonResponse({ success: false, data: null, error: { code: "FORBIDDEN", message: "You do not have access to this organization." } }, 403);
    }

    const checks: CheckResult[] = [];
    let policiesEvaluated = 0;

    // Step 1: Validate agent
    const { data: agent } = await serviceClient
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!agent) {
      checks.push({ label: "Agent Validation", passed: false, detail: "Agent not found in this organization." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Agent not found.", checks }, error: null }, 200);
    }

    // Step 2: Check agent status and trust
    if (agent.status === "revoked") {
      checks.push({ label: "Agent Status", passed: false, detail: "Agent has been revoked." });
      await logEvent(serviceClient, organization_id, "TRANSACTION_DECLINED", "agent", agent_id, null, null, null, { reason: "agent_revoked" });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Agent has been revoked and cannot create transaction requests.", checks }, error: null }, 200);
    }
    if (agent.status === "paused") {
      checks.push({ label: "Agent Status", passed: false, detail: "Agent is currently paused." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Agent is paused.", checks }, error: null }, 200);
    }
    if (agent.trust_level === "unknown") {
      checks.push({ label: "Identity Verification", passed: false, detail: "Agent identity not verified — unknown trust level." });
      await logEvent(serviceClient, organization_id, "TRANSACTION_DECLINED", "agent", agent_id, null, null, null, { reason: "identity_not_verified" });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Agent identity not verified. Restricted to public information only.", checks }, error: null }, 200);
    }
    checks.push({ label: "Identity Verification", passed: true, detail: `Agent identity verified — ${agent.provider_name}` });
    policiesEvaluated++;

    // Step 3: Idempotency check
    const { data: existingReq } = await serviceClient
      .from("transaction_requests")
      .select("id, status")
      .eq("organization_id", organization_id)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    if (existingReq) {
      checks.push({ label: "Idempotency Check", passed: false, detail: "Duplicate request detected." });
      return jsonResponse({ success: false, data: { decision: ["approved", "declined", "escalated"].includes(existingReq.status)
          ? existingReq.status
          : "declined", reason: "Duplicate request — already processed.", checks }, error: null }, 200);
    }
    checks.push({ label: "Idempotency Check", passed: true, detail: "Unique request." });

    // Step 4: Validate products and inventory
    const requestedAmount = products.reduce((sum: number, p: { name: string; price: number }) => sum + p.price, 0);
    let allProductsValid = true;
    let outOfStock = false;
    for (const p of products) {
      const { data: product } = await serviceClient
        .from("products")
        .select("name, inventory_quantity, category")
        .eq("organization_id", organization_id)
        .eq("name", p.name)
        .maybeSingle();

      if (!product) {
        allProductsValid = false;
        break;
      }
      if ((product.inventory_quantity ?? 0) <= 0) {
        outOfStock = true;
      }
    }

    if (!allProductsValid) {
      checks.push({ label: "Catalog Validation", passed: false, detail: "One or more products not found in catalog." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Requested product not found in catalog.", checks }, error: null }, 200);
    }
    if (outOfStock) {
      checks.push({ label: "Catalog Validation", passed: false, detail: "Requested product is out of stock." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "Requested product is out of stock.", checks }, error: null }, 200);
    }
    checks.push({ label: "Catalog Validation", passed: true, detail: "All products available in catalog." });

    // Step 5: Validate OpenTab
    if (!open_tab_id) {
      checks.push({ label: "OpenTab Validation", passed: false, detail: "No OpenTab provided." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "No active OpenTab authorization for this agent.", checks }, error: null }, 200);
    }

    const { data: tab } = await serviceClient
      .from("open_tabs")
      .select("*")
      .eq("id", open_tab_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!tab || tab.status !== "active") {
      checks.push({ label: "OpenTab Validation", passed: false, detail: `OpenTab status: ${tab?.status ?? "not found"}` });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "OpenTab is not active.", checks }, error: null }, 200);
    }

    if (!tab.expires_at || new Date(tab.expires_at).getTime() <= Date.now()) {
      checks.push({ label: "OpenTab Validation", passed: false, detail: "OpenTab has expired." });
      return jsonResponse({ success: false, data: { decision: "declined", reason: "OpenTab has expired.", checks }, error: null }, 200);
    }

    // Check scope
    const allowedCategories = Array.isArray(tab.allowed_categories) ? tab.allowed_categories as string[] : [];
    for (const p of products) {
      const { data: product } = await serviceClient
        .from("products")
        .select("category")
        .eq("organization_id", organization_id)
        .eq("name", p.name)
        .maybeSingle();
      if (product && !allowedCategories.includes(product.category)) {
        checks.push({ label: "OpenTab Validation", passed: false, detail: `Product "${p.name}" is outside OpenTab scope.` });
        return jsonResponse({ success: false, data: { decision: "declined", reason: "Requested product is outside the allowed OpenTab scope.", checks }, error: null }, 200);
      }
    }

    // Check remaining authorization
    if (requestedAmount > Number(tab.remaining_amount)) {
      const overBy = requestedAmount - Number(tab.remaining_amount);
      checks.push({ label: "OpenTab Validation", passed: false, detail: `Amount exceeds remaining authorization by ₹${overBy.toLocaleString("en-IN")}.` });
      return jsonResponse({ success: false, data: { decision: "declined", reason: `The requested amount exceeds the remaining OpenTab authorization by ₹${overBy.toLocaleString("en-IN")}.`, checks }, error: null }, 200);
    }
    checks.push({ label: "OpenTab Validation", passed: true, detail: "Within OpenTab scope and remaining authorization." });
    policiesEvaluated++;

    // Step 6: Evaluate deterministic merchant policies
    const { data: policyRows } = await serviceClient
      .from("policies")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (policyRows) {
      for (const policy of policyRows) {
        policiesEvaluated++;
        const rules = policy.rules as Record<string, unknown>;

        if (policy.policy_type === "financial") {
          if (rules.max_txn_amount && requestedAmount > Number(rules.max_txn_amount)) {
            checks.push({ label: `Policy: ${policy.name}`, passed: false, detail: `Amount exceeds maximum transaction limit of ₹${Number(rules.max_txn_amount).toLocaleString("en-IN")}.` });
            return jsonResponse({ success: false, data: { decision: "declined", reason: `Amount exceeds maximum transaction limit of ₹${Number(rules.max_txn_amount).toLocaleString("en-IN")}.`, checks, policiesEvaluated }, error: null }, 200);
          }
        }
      }
    }
    checks.push({ label: "Merchant Policies", passed: true, detail: "Within all merchant financial policies." });

    // Step 7: Auto-approval ceiling check
    const autoApproveCeiling = Number(tab.auto_approval_ceiling);
    const { data: approvalPolicy } = await serviceClient
      .from("policies")
      .select("rules")
      .eq("organization_id", organization_id)
      .eq("policy_type", "approval")
      .eq("enabled", true)
      .maybeSingle();

    const humanApprovalThreshold = approvalPolicy?.rules ? Number((approvalPolicy.rules as Record<string, unknown>).human_approval_threshold) : 25000;

    if (requestedAmount > autoApproveCeiling || requestedAmount > humanApprovalThreshold) {
      // Escalated
      checks.push({ label: "Approval Decision", passed: true, detail: "Valid but exceeds auto-approval ceiling — escalated for human approval." });

      const { data: txnReq } = await serviceClient
        .from("transaction_requests")
        .insert({
          organization_id,
          agent_id,
          open_tab_id,
          idempotency_key,
          status: "escalated",
          requested_amount: requestedAmount,
          currency: "INR",
          products: JSON.parse(JSON.stringify(products)),
          decision_reason: "Transaction exceeds auto-approval ceiling. Human approval required.",
        })
        .select()
        .maybeSingle();

      const { data: txn } = await serviceClient
        .from("transactions")
        .insert({
          organization_id,
          transaction_request_id: txnReq?.id,
          agent_id,
          open_tab_id,
          amount: requestedAmount,
          currency: "INR",
          status: "escalated",
        })
        .select()
        .maybeSingle();

      await logEvent(serviceClient, organization_id, "HUMAN_APPROVAL_REQUESTED", "system", "system", txn?.id, txnReq?.id, open_tab_id, { amount: requestedAmount }, "Transaction exceeds auto-approval ceiling. Human approval required.");
      await logEvent(serviceClient, organization_id, "TRANSACTION_REQUESTED", "agent", agent_id, txn?.id, txnReq?.id, open_tab_id, { amount: requestedAmount }, "Agent requested purchase.");

      const result: PolicyResult = {
        decision: "escalated",
        reason: "Transaction exceeds auto-approval ceiling. Human approval required.",
        checks,
        policiesEvaluated,
        timestamp: new Date().toISOString(),
      };
      return jsonResponse({ success: true, data: { ...result, transaction_id: txn?.id, transaction_request_id: txnReq?.id }, error: null }, 200);
    }

    // Approved — atomically consume from OpenTab
    checks.push({ label: "Approval Decision", passed: true, detail: "All checks passed — approved." });

    const { error: tabError } = await serviceClient.rpc("consume_open_tab", {
      p_tab_id: open_tab_id,
      p_amount: requestedAmount,
    });

    if (tabError) {
      return jsonResponse({ success: false, data: null, error: { code: "OPENTAB_ERROR", message: "Failed to update OpenTab authorization." } }, 500);
    }

    const { data: txnReq } = await serviceClient
      .from("transaction_requests")
      .insert({
        organization_id,
        agent_id,
        open_tab_id,
        idempotency_key,
        status: "approved",
        requested_amount: requestedAmount,
        currency: "INR",
        products: JSON.parse(JSON.stringify(products)),
        decision_reason: "All policy checks passed. Within OpenTab scope and authorization.",
      })
      .select()
      .maybeSingle();

    const { data: txn } = await serviceClient
      .from("transactions")
      .insert({
        organization_id,
        transaction_request_id: txnReq?.id,
        agent_id,
        open_tab_id,
        amount: requestedAmount,
        currency: "INR",
        status: "approved",
      })
      .select()
      .maybeSingle();

    await logEvent(serviceClient, organization_id, "TRANSACTION_APPROVED", "agent", agent_id, txn?.id, txnReq?.id, open_tab_id, { decision: "approved", amount: requestedAmount }, "All policy checks passed.");
    await logEvent(serviceClient, organization_id, "TRANSACTION_REQUESTED", "agent", agent_id, txn?.id, txnReq?.id, open_tab_id, { amount: requestedAmount, products: products.map((p: { name: string }) => p.name) }, "Agent requested purchase.");

    const result: PolicyResult = {
      decision: "approved",
      reason: "All policy checks passed. Within OpenTab scope and authorization.",
      checks,
      policiesEvaluated,
      timestamp: new Date().toISOString(),
    };
    return jsonResponse({ success: true, data: { ...result, transaction_id: txn?.id, transaction_request_id: txnReq?.id }, error: null }, 200);

  } catch (err) {
    console.error("Transaction evaluation failed:", err);
    return jsonResponse({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, 500);
  }
});

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logEvent(
  client: ReturnType<typeof createClient>,
  orgId: string,
  eventType: string,
  actorType: string,
  actorId: string | null,
  txnId: string | null,
  txnReqId: string | null,
  tabId: string | null,
  data: Record<string, unknown>,
  reason?: string
) {
  await client.from("trust_ledger_events").insert({
    organization_id: orgId,
    event_type: eventType,
    actor_type: actorType,
    actor_id: actorId,
    transaction_id: txnId,
    transaction_request_id: txnReqId,
    open_tab_id: tabId,
    event_data: data,
    reason: reason ?? "",
  });
}
