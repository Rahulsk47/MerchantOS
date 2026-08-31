import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyAgentBody {
  organization_id?: string;
  agent_id?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only POST requests are allowed
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

    // Service role client for secure server-side database operations
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

    // Parse request body safely
    const body = await req.json().catch(
      () => ({} as VerifyAgentBody),
    );

    const { organization_id, agent_id } =
      body as VerifyAgentBody;

    if (!organization_id || !agent_id) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message:
              "Missing organization_id or agent_id.",
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

    // Get the agent and verify that it belongs to this organization
    const {
      data: agent,
      error: agentError,
    } = await serviceClient
      .from("agents")
      .select("*")
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
            message: "Agent not found.",
          },
        },
        404,
      );
    }

    /*
     * MVP SIMULATION ONLY
     *
     * This does not perform real cryptographic identity verification.
     * The verification result is based on the agent's stored trust
     * level and current status.
     */
    const verified = agent.trust_level !== "unknown";

    const canTransact =
      verified &&
      agent.status === "active";

    const canDiscover =
      agent.status !== "revoked";

    // Log verification event to the Trust Ledger
    const { error: ledgerError } =
      await serviceClient
        .from("trust_ledger_events")
        .insert({
          organization_id,
          event_type: "AGENT_VERIFIED",
          actor_type: "system",
          actor_id: agent_id,
          event_data: {
            trust_level: agent.trust_level,
            status: agent.status,
            verified,
            can_transact: canTransact,
            can_discover: canDiscover,
            simulated: true,
          },
          reason:
            `Agent verification (simulated). ` +
            `Trust level: ${agent.trust_level}, ` +
            `Status: ${agent.status}.`,
        });

    if (ledgerError) {
      console.error(
        "Failed to log agent verification:",
        ledgerError,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          agent_id: agent.id,
          agent_name: agent.agent_name,
          provider_name: agent.provider_name,
          trust_level: agent.trust_level,
          status: agent.status,
          verified,
          can_transact: canTransact,
          can_discover: canDiscover,
          simulated: true,
          message:
            "Agent identity verification is simulated for this MVP. " +
            "No cryptographic verification is performed.",
        },
        error: null,
      },
      200,
    );
  } catch (error) {
    console.error("Agent verification failed:", error);

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