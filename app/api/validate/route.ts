/**
 * POST /api/validate
 *
 * Accepts generated code files and returns a full SecurityReport.
 * Also supports re-validation: accepts a server ID and re-runs the checks,
 * updating the stored security_score + security_report in Supabase.
 *
 * Request body (JSON):
 * {
 *   // Option A — provide raw code files:
 *   indexTs:     string;   // src/index.ts contents
 *   packageJson: string;   // package.json contents
 *   tsconfig?:   string;   // tsconfig.json contents (optional)
 *   envExample?: string;   // .env.example contents (optional)
 *
 *   // Option B — re-validate a saved server by ID:
 *   serverId:    string;   // loads files from DB, runs checks, saves result
 * }
 *
 * Response (200):
 * { report: SecurityReport }
 *
 * Response (422):
 * { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { runSecurityValidation } from "@/lib/security/validator";
import type { CodeFiles } from "@/lib/security/types";

// ─── Max sizes to prevent abuse ───────────────────────────────────────────────

const MAX_CODE_SIZE = 512 * 1024; // 512 KB per file

function isStringWithinLimit(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Option B: Re-validate a saved server ────────────────────────────────────
  if (typeof body.serverId === "string" && body.serverId.trim()) {
    const serverId = body.serverId.trim();

    // Use adminClient to bypass RLS — ownership is enforced manually via
    // .eq("user_id", session.user.id), same pattern as GET /api/servers/[id]
    const adminClient = createAdminClient();
    const { data: server, error: fetchErr } = await adminClient
      .from("mcp_servers")
      .select(
        "id, user_id, generated_code, package_json, tsconfig, env_example"
      )
      .eq("id", serverId)
      .eq("user_id", session.user.id)
      .single();

    if (fetchErr || !server) {
      return NextResponse.json(
        { error: "Server not found or access denied" },
        { status: 404 }
      );
    }

    const files: CodeFiles = {
      indexTs: (server.generated_code as string) ?? "",
      packageJson: (server.package_json as string) ?? "{}",
      tsconfig: (server.tsconfig as string | null) ?? undefined,
      envExample: (server.env_example as string | null) ?? undefined,
    };

    const report = runSecurityValidation(files);

    // Persist updated score + report (no updated_at — column may not exist)
    await adminClient
      .from("mcp_servers")
      .update({
        security_score: report.score,
        security_report: report,
      })
      .eq("id", serverId);

    return NextResponse.json({ report }, { status: 200 });
  }

  // ── Option A: Validate raw code files ───────────────────────────────────────

  const { indexTs, packageJson, tsconfig, envExample } = body;

  // Validate required fields
  if (!isStringWithinLimit(indexTs, MAX_CODE_SIZE)) {
    return NextResponse.json(
      {
        error:
          typeof indexTs !== "string"
            ? "indexTs must be a string"
            : "indexTs exceeds maximum allowed size",
      },
      { status: 422 }
    );
  }

  if (!isStringWithinLimit(packageJson, MAX_CODE_SIZE)) {
    return NextResponse.json(
      {
        error:
          typeof packageJson !== "string"
            ? "packageJson must be a string"
            : "packageJson exceeds maximum allowed size",
      },
      { status: 422 }
    );
  }

  // Optional fields — if provided, must be strings within limit
  if (tsconfig !== undefined && !isStringWithinLimit(tsconfig, MAX_CODE_SIZE)) {
    return NextResponse.json(
      { error: "tsconfig must be a string within size limit" },
      { status: 422 }
    );
  }

  if (
    envExample !== undefined &&
    !isStringWithinLimit(envExample, MAX_CODE_SIZE)
  ) {
    return NextResponse.json(
      { error: "envExample must be a string within size limit" },
      { status: 422 }
    );
  }

  const files: CodeFiles = {
    indexTs,
    packageJson,
    tsconfig: typeof tsconfig === "string" ? tsconfig : undefined,
    envExample: typeof envExample === "string" ? envExample : undefined,
  };

  const report = runSecurityValidation(files);

  return NextResponse.json({ report }, { status: 200 });
}

// GET — not supported
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Use POST /api/validate with code files in the request body." },
    { status: 405 }
  );
}
