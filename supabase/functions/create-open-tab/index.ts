import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateOpenTabBody {
  organization_id?: string;
  agent_id?: string;
  name?: string;
  authorization_cap?: number;
  auto_approval_ceiling?: number;
  allowed_categories?: string[];
  expires_at?: string;
  additional_policies?: unknown[];
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Only POST requests are allowed.",
          },
        },
        405,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "Supabase environment variables are not configured.",
          },
        },
        500,
      );
    }

    // Client authenticated as the requesting user
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    );

    // Server-side client with service role permissions
    const serviceClient = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    // Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        },
        401,
      );
    }

    // Parse the request body safely
    const body = await req.json().catch(
      () => ({} as CreateOpenTabBody),
    );

    const {
      organization_id,
      agent_id,
      name,
      authorization_cap,
      auto_approval_ceiling,
      allowed_categories,
      expires_at,
      additional_policies,
    } = body as CreateOpenTabBody;

    // Validate required fields
    if (
      !organization_id ||
      !agent_id ||
      authorization_cap === undefined ||
      !allowed_categories
    ) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Missing required fields.",
          },
        },
        400,
      );
    }

    if (
      !Number.isFinite(Number(authorization_cap)) ||
      Number(authorization_cap) <= 0
    ) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message:
              "authorization_cap must be a positive number.",
          },
        },
        400,
      );
    }

    if (
      !Array.isArray(allowed_categories) ||
      allowed_categories.length === 0
    ) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message:
              "allowed_categories must contain at least one category.",
          },
        },
        400,
      );
    }

    // Validate organization membership
    const {
      data: membership,
      error: membershipError,
    } = await serviceClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "FORBIDDEN",
            message:
              "You do not have access to this organization.",
          },
        },
        403,
      );
    }

    // Validate agent
    const {
      data: agent,
      error: agentError,
    } = await serviceClient
      .from("agents")
      .select("id, agent_name, trust_level, status")
      .eq("id", agent_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (agentError) {
      throw agentError;
    }

    if (!agent) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "AGENT_NOT_FOUND",
            message:
              "Agent not found in this organization.",
          },
        },
        404,
      );
    }

    if (agent.trust_level === "unknown") {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "AGENT_NOT_TRUSTED",
            message:
              "Unknown agents cannot receive OpenTab authorization.",
          },
        },
        403,
      );
    }

    if (agent.status !== "active") {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "AGENT_INACTIVE",
            message:
              "Only active agents can receive OpenTab authorization.",
          },
        },
        400,
      );
    }

    // Validate expiration date if supplied
    let expiryDate: string;

    if (expires_at) {
      const parsedDate = new Date(expires_at);

      if (Number.isNaN(parsedDate.getTime())) {
        return jsonResponse(
          {
            success: false,
            data: null,
            error: {
              code: "INVALID_REQUEST",
              message: "expires_at is not a valid date.",
            },
          },
          400,
        );
      }

      if (parsedDate.getTime() <= Date.now()) {
        return jsonResponse(
          {
            success: false,
            data: null,
            error: {
              code: "INVALID_REQUEST",
              message:
                "expires_at must be a future date.",
            },
          },
          400,
        );
      }

      expiryDate = parsedDate.toISOString();
    } else {
      // Default: six hours from now
      expiryDate = new Date(
        Date.now() + 6 * 60 * 60 * 1000,
      ).toISOString();
    }

    const cap = Number(authorization_cap);
    const autoApproveCeiling =
      auto_approval_ceiling !== undefined
        ? Number(auto_approval_ceiling)
        : 5000;

    // Create the OpenTab
    const {
      data: tab,
      error: insertError,
    } = await serviceClient
      .from("open_tabs")
      .insert({
        organization_id,
        agent_id,
        name: name?.trim() || `${agent.agent_name} Tab`,
        status: "active",
        authorization_cap: cap,
        consumed_amount: 0,
        remaining_amount: cap,
        currency: "INR",
        auto_approval_ceiling: autoApproveCeiling,
        allowed_categories,
        expires_at: expiryDate,
        additional_policies: additional_policies ?? [],
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create OpenTab:", insertError);

      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INSERT_FAILED",
            message: "Failed to create OpenTab.",
          },
        },
        500,
      );
    }

    // Log the action in the Trust Ledger
    const { error: ledgerError } =
      await serviceClient
        .from("trust_ledger_events")
        .insert({
          organization_id,
          event_type: "OPEN_TAB_CREATED",
          actor_type: "user",
          actor_id: user.id,
          open_tab_id: tab.id,
          event_data: {
            cap,
            scope: allowed_categories,
            auto_approve: autoApproveCeiling,
          },
          reason: `New OpenTab created for ${agent.agent_name}`,
        });

    if (ledgerError) {
      console.error(
        "Failed to create Trust Ledger event:",
        ledgerError,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          open_tab: tab,
        },
        error: null,
      },
      200,
    );
  } catch (error) {
    console.error("OpenTab creation failed:", error);

    return jsonResponse(
      {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      500,
    );
  }
});

function jsonResponse(
  body: unknown,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}