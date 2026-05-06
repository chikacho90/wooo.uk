import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MODEL, SYSTEM_PROMPT } from "@/lib/bumblebee/prompt";
import type { BumblebeeReply } from "@/lib/bumblebee/types";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "API key not configured",
        hint: "Set ANTHROPIC_API_KEY in .env.local or Vercel env vars",
      },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { text, exclude } = body as { text?: string; exclude?: string[] };
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const userMessage =
    exclude && exclude.length > 0
      ? `${text.trim()}\n\n(이전 클립 제외: ${exclude.join(", ")})`
      : text.trim();

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "no text in response" },
        { status: 502 },
      );
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "Bumblebee respond: failed to extract JSON from:",
        raw.slice(0, 300),
      );
      return NextResponse.json(
        { error: "failed to parse response" },
        { status: 502 },
      );
    }

    let reply: BumblebeeReply;
    try {
      reply = JSON.parse(jsonMatch[0]) as BumblebeeReply;
    } catch (e) {
      console.error("Bumblebee respond: JSON parse error:", e);
      return NextResponse.json(
        { error: "invalid JSON in response" },
        { status: 502 },
      );
    }

    if (!reply.quote || !reply.source || !reply.searchQuery) {
      return NextResponse.json(
        { error: "incomplete response", reply },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", err.status, err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Bumblebee respond catch:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
