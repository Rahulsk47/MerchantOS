import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApproveTransactionBody {
  transaction_id?: string;
  organization_id?: string;
}

interface OpenTabData {
  remaining_amount: number | string | null;
  status: string;
  expires_at: string | null;
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

    // Client using the requesting user's JWT
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

    // Service role client for secure server-side operations
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
      () => ({} as ApproveTransactionBody),
    );

    const { transaction_id, organization_id } =
      body as ApproveTransactionBody;

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

    // Validate organization membership and admin permission
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

    if (
      !membership ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "FORBIDDEN",
            message:
              "Only organization admins can approve transactions.",
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

    // Transaction must still be waiting for approval
    if (txn.status !== "escalated") {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_STATE",
            message:
              "Transaction is not in escalated state.",
          },
        },
        400,
      );
    }

    // Revalidate and consume OpenTab balance
    if (txn.open_tab_id) {
      const {
        data: tabData,
        error: tabError,
      } = await serviceClient
        .from("open_tabs")
        .select("remaining_amount, status, expires_at")
        .eq("id", txn.open_tab_id)
        .maybeSingle();

      if (tabError) {
        throw tabError;
      }

      const tab = tabData as OpenTabData | null;

      // OpenTab must exist and be valid
      if (!tab) {
        return jsonResponse(
          {
            success: false,
            data: null,
            error: {
              code: "OPENTAB_INVALID",
              message:
                "OpenTab could not be found for this transaction.",
            },
          },
          400,
        );
      }

      const isExpired =
        !tab.expires_at ||
        new Date(tab.expires_at).getTime() <= Date.now();

      const hasInsufficientFunds =
        Number(tab.remaining_amount ?? 0) < Number(txn.amount);

      if (
        tab.status !== "active" ||
        isExpired ||
        hasInsufficientFunds
      ) {
        return jsonResponse(
          {
            success: false,
            data: null,
            error: {
              code: "OPENTAB_INVALID",
              message:
                "OpenTab is no longer valid for this transaction.",
            },
          },
          400,
        );
      }

      // Consume balance using database RPC
      const { error: consumeError } =
        await serviceClient.rpc("consume_open_tab", {
          p_tab_id: txn.open_tab_id,
          p_amount: Number(txn.amount),
        });

      if (consumeError) {
        throw consumeError;
      }
    }

    const confirmedAt = new Date().toISOString();

    // Approve transaction
    const { error: updateTransactionError } =
      await serviceClient
        .from("transactions")
        .update({
          status: "approved",
          confirmed_at: confirmedAt,
        })
        .eq("id", transaction_id);

    if (updateTransactionError) {
      throw updateTransactionError;
    }

    // Update the original transaction request if one exists
    if (txn.transaction_request_id) {
      const { error: updateRequestError } =
        await serviceClient
          .from("transaction_requests")
          .update({
            status: "approved",
            decision_reason:
              "Human approval granted. All policies satisfied.",
          })
          .eq("id", txn.transaction_request_id);

      if (updateRequestError) {
        throw updateRequestError;
      }
    }

    // Log approval to Trust Ledger
    const { error: ledgerError } =
      await serviceClient
        .from("trust_ledger_events")
        .insert({
          organization_id,
          event_type: "TRANSACTION_APPROVED",
          actor_type: "user",
          actor_id: user.id,
          transaction_id,
          transaction_request_id:
            txn.transaction_request_id ?? null,
          open_tab_id: txn.open_tab_id ?? null,
          event_data: {
            decision: "approved",
            amount: txn.amount,
            approved_by: user.id,
          },
          reason:
            "Human approval granted by merchant admin.",
        });

    if (ledgerError) {
      throw ledgerError;
    }

    return jsonResponse(
      {
        success: true,
        data: {
          transaction_id,
          status: "approved",
        },
        error: null,
      },
      200,
    );
  } catch (error) {
    console.error("Transaction approval failed:", error);

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