import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SimulatePaymentBody {
  transaction_id?: string;
  organization_id?: string;
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

    // Client authenticated with the requesting user's JWT
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

    // Service role client for server-side operations
    const serviceClient = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    // Authenticate user
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
      () => ({} as SimulatePaymentBody),
    );

    const { transaction_id, organization_id } =
      body as SimulatePaymentBody;

    if (!transaction_id || !organization_id) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message:
              "Missing transaction_id or organization_id.",
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

    // Get transaction
    const {
      data: txn,
      error: transactionError,
    } = await serviceClient
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (transactionError) {
      throw transactionError;
    }

    if (!txn) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Transaction not found.",
          },
        },
        404,
      );
    }

    // Only approved transactions can proceed to payment
    if (txn.status !== "approved") {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_STATE",
            message:
              "Transaction must be in approved state to simulate payment.",
          },
        },
        400,
      );
    }

    // Create a unique simulated payment reference
    const paymentReference =
      `sim-pay-${crypto.randomUUID()}`;

    const paymentProvider = "simulated_provider";

    // Move transaction to payment pending
    const { error: pendingError } =
      await serviceClient
        .from("transactions")
        .update({
          status: "payment_pending",
          payment_reference: paymentReference,
          payment_provider: paymentProvider,
        })
        .eq("id", transaction_id)
        .eq("status", "approved");

    if (pendingError) {
      throw pendingError;
    }

    // Log payment initiation
    const { error: initiatedLogError } =
      await serviceClient
        .from("trust_ledger_events")
        .insert({
          organization_id,
          event_type: "PAYMENT_SIMULATED",
          actor_type: "system",
          actor_id: "system",
          transaction_id,
          open_tab_id: txn.open_tab_id ?? null,
          event_data: {
            payment_reference: paymentReference,
            provider: paymentProvider,
            simulated: true,
          },
          reason:
            "Payment simulation initiated. No real payment is processed.",
        });

    if (initiatedLogError) {
      console.error(
        "Failed to log simulated payment initiation:",
        initiatedLogError,
      );
    }

    // Simulate a payment provider processing delay.
    // No real payment or financial transaction is performed.
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 500),
    );

    const confirmedAt = new Date().toISOString();

    // Confirm the simulated payment
    const { error: confirmError } =
      await serviceClient
        .from("transactions")
        .update({
          status: "confirmed",
          confirmed_at: confirmedAt,
        })
        .eq("id", transaction_id)
        .eq("status", "payment_pending");

    if (confirmError) {
      throw confirmError;
    }

    // Log payment confirmation
    const { error: confirmedLogError } =
      await serviceClient
        .from("trust_ledger_events")
        .insert({
          organization_id,
          event_type: "PAYMENT_CONFIRMED",
          actor_type: "system",
          actor_id: "system",
          transaction_id,
          open_tab_id: txn.open_tab_id ?? null,
          event_data: {
            payment_reference: paymentReference,
            amount: txn.amount,
            simulated: true,
          },
          reason:
            "Payment confirmed (simulated). No real money was moved.",
        });

    if (confirmedLogError) {
      console.error(
        "Failed to log simulated payment confirmation:",
        confirmedLogError,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          transaction_id,
          status: "confirmed",
          payment_reference: paymentReference,
          payment_provider: paymentProvider,
          simulated: true,
          message:
            "Payment has been simulated. No real payment was processed.",
        },
        error: null,
      },
      200,
    );
  } catch (error) {
    console.error("Payment simulation failed:", error);

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