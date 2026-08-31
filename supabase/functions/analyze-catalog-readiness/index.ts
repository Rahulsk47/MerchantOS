import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  inventory_quantity: number | null;
  shipping_info: string | null;
  return_policy: string | null;
  ai_readiness_status: string | null;
}

interface CatalogIssue {
  product_id: string;
  product_name: string;
  issue_type: string;
  message: string;
  severity: "warning" | "critical";
}

interface RequestBody {
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

    // Get organization ID from URL or JSON request body
    const url = new URL(req.url);
    let organizationId = url.searchParams.get("organization_id");

    if (!organizationId && req.method !== "GET") {
      const body: RequestBody = await req.json().catch(
        () => ({} as RequestBody),
      );

      organizationId = body.organization_id ?? null;
    }

    if (!organizationId) {
      return jsonResponse(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Missing organization_id.",
          },
        },
        400,
      );
    }

    // Validate organization membership
    const { data: membership, error: membershipError } =
      await serviceClient
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
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

    // Get products
    const { data: productsData, error: productsError } =
      await serviceClient
        .from("products")
        .select("*")
        .eq("organization_id", organizationId);

    if (productsError) {
      throw productsError;
    }

    const products = (productsData ?? []) as Product[];

    // No products yet
    if (products.length === 0) {
      return jsonResponse(
        {
          success: true,
          data: {
            readiness_score: 0,
            issues: [],
            recommendations: [
              "Add products to your catalog to get started.",
            ],
            product_count: 0,
          },
          error: null,
        },
        200,
      );
    }

    const issues: CatalogIssue[] = [];
    const recommendations: string[] = [];

    // Analyze every product
    for (const product of products) {
      if (
        !product.description ||
        product.description.trim().length < 10
      ) {
        issues.push({
          product_id: product.id,
          product_name: product.name,
          issue_type: "missing_description",
          message: `Missing or insufficient description for "${product.name}".`,
          severity: "warning",
        });
      }

      if (!product.category) {
        issues.push({
          product_id: product.id,
          product_name: product.name,
          issue_type: "missing_category",
          message: `Missing category for "${product.name}".`,
          severity: "warning",
        });
      }

      if ((product.inventory_quantity ?? 0) <= 0) {
        issues.push({
          product_id: product.id,
          product_name: product.name,
          issue_type: "out_of_stock",
          message: `"${product.name}" is out of stock.`,
          severity: "critical",
        });
      }

      if (!product.shipping_info) {
        issues.push({
          product_id: product.id,
          product_name: product.name,
          issue_type: "missing_shipping",
          message: `AI systems may not be able to determine delivery information for "${product.name}".`,
          severity: "warning",
        });
      }

      if (!product.return_policy) {
        issues.push({
          product_id: product.id,
          product_name: product.name,
          issue_type: "missing_returns",
          message: `Return policy details are missing for "${product.name}".`,
          severity: "warning",
        });
      }
    }

    // Calculate readiness score
    const totalChecks = products.length * 5;
    const failedChecks = issues.length;

    const readinessScore = Math.round(
      Math.max(
        0,
        ((totalChecks - failedChecks) / totalChecks) * 100,
      ),
    );

    // Generate recommendations
    const missingShipping = issues.filter(
      (issue) => issue.issue_type === "missing_shipping",
    ).length;

    const missingReturns = issues.filter(
      (issue) => issue.issue_type === "missing_returns",
    ).length;

    const outOfStock = issues.filter(
      (issue) => issue.issue_type === "out_of_stock",
    ).length;

    const missingDescriptions = issues.filter(
      (issue) => issue.issue_type === "missing_description",
    ).length;

    const missingCategories = issues.filter(
      (issue) => issue.issue_type === "missing_category",
    ).length;

    if (missingShipping > 0) {
      recommendations.push(
        `Add shipping estimates to ${missingShipping} product(s) to improve AI-driven conversion.`,
      );
    }

    if (missingReturns > 0) {
      recommendations.push(
        `Add return policy details to ${missingReturns} product(s).`,
      );
    }

    if (outOfStock > 0) {
      recommendations.push(
        `Restock ${outOfStock} out-of-stock product(s) or add estimated restock dates.`,
      );
    }

    if (missingDescriptions > 0) {
      recommendations.push(
        `Improve descriptions for ${missingDescriptions} product(s) with missing or insufficient detail.`,
      );
    }

    if (missingCategories > 0) {
      recommendations.push(
        `Add categories to ${missingCategories} product(s) to improve catalog understanding.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Your catalog is in great shape for AI commerce. No critical issues found.",
      );
    }

    // Update product readiness status and catalog issues
    for (const product of products) {
      const productIssues = issues.filter(
        (issue) => issue.product_id === product.id,
      );

      let newStatus = "healthy";

      if (
        productIssues.some(
          (issue) => issue.severity === "critical",
        )
      ) {
        newStatus = "critical";
      } else if (productIssues.length > 0) {
        newStatus = "needs_attention";
      }

      if (product.ai_readiness_status !== newStatus) {
        const { error } = await serviceClient
          .from("products")
          .update({ ai_readiness_status: newStatus })
          .eq("id", product.id);

        if (error) throw error;
      }

      // Remove previous open issues
      const { error: deleteError } = await serviceClient
        .from("catalog_issues")
        .delete()
        .eq("product_id", product.id)
        .eq("status", "open");

      if (deleteError) throw deleteError;

      // Add current issues
      if (productIssues.length > 0) {
        const issuesToInsert = productIssues.map((issue) => ({
          organization_id: organizationId,
          product_id: product.id,
          issue_type: issue.issue_type,
          message: issue.message,
          severity: issue.severity,
          status: "open",
        }));

        const { error: insertError } = await serviceClient
          .from("catalog_issues")
          .insert(issuesToInsert);

        if (insertError) throw insertError;
      }
    }

    return jsonResponse(
      {
        success: true,
        data: {
          readiness_score: readinessScore,
          product_count: products.length,
          issues,
          recommendations,
          message:
            "This score is based on deterministic checks of your catalog data. It does not guarantee discoverability by any specific AI system.",
        },
        error: null,
      },
      200,
    );
  } catch (error) {
    console.error("Catalog readiness analysis failed:", error);

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