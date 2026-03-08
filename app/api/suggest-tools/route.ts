import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import type { RateLimitConfig } from "@/lib/rate-limit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUGGEST_TOOLS_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};

export async function POST(req: NextRequest) {
  // Auth check — prevent unauthenticated callers from burning Anthropic API credits
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — 10 suggestions per minute per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`suggest-tools:${ip}`, SUGGEST_TOOLS_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string" || description.length < 10) {
      return NextResponse.json({ error: "Description too short" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are an MCP (Model Context Protocol) tool design expert.
Given a description of an MCP server, you suggest the 3 most practical tools it should expose.
Each tool name must be snake_case. Field types must be one of: string, number, boolean, object, array.
Respond ONLY with valid JSON — no markdown, no explanation, no fences.`,
      messages: [
        {
          role: "user",
          content: `MCP Server Description:
"""
${description}
"""

Suggest exactly 3 tools. Return JSON in this format:
{
  "tools": [
    {
      "name": "snake_case_name",
      "description": "What this tool does and when an AI client should call it",
      "fields": [
        { "name": "param", "type": "string", "required": true, "description": "What this param does" }
      ]
    }
  ]
}

Include 1-4 fields per tool — only the essential parameters.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Attach unique IDs to each tool and field
    const uid = () => Math.random().toString(36).slice(2, 9);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools = (parsed.tools as any[]).map((t: any) => ({
      id: uid(),
      name: t.name ?? "unnamed_tool",
      description: t.description ?? "",
      fields: (t.fields ?? []).map((f: any) => ({
        id: uid(),
        name: f.name ?? "",
        type: f.type ?? "string",
        required: f.required ?? true,
        description: f.description ?? "",
      })),
    }));

    return NextResponse.json({ tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[suggest-tools]", message);
    return NextResponse.json(
      { error: "Failed to generate tool suggestions. Please try again." },
      { status: 500 }
    );
  }
}
