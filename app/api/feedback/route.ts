import { NextRequest, NextResponse } from "next/server";
import { verifySession, authCookie } from "@/lib/auth";
import { addFeedback } from "@/lib/feedback";

export const runtime = "nodejs";

// 인증 필수 (proxy는 /api 제외라 여기서 직접 검증)
async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(authCookie.name)?.value;
  return !!(await verifySession(process.env.SITE_SECRET || "", token));
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const project = typeof body.project === "string" ? body.project.slice(0, 100) : "";
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 2000) : "";
  if (!project || !text) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const fb = await addFeedback(project, text);
  if (!fb) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true, feedback: fb });
}
