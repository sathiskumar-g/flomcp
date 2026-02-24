import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string" || description.length < 10) {
      return NextResponse.json({ error: "Description too short" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
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
    console.error("[suggest-tools]", err);
    return NextResponse.json(
      { error: "Failed to generate tool suggestions" },
      { status: 500 }
    );
  }
}
