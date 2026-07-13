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
  // 첨부: data URL(이미지 외 일반 파일 포함) 최대 4개, 개당 2MB·전체 4MB (Vercel 요청 한도 이내)
  const rawImages = Array.isArray(body.images) ? body.images.slice(0, 4) : [];
  const images: string[] = [];
  let totalLen = 0;
  for (const img of rawImages) {
    if (typeof img !== "string" || !img.startsWith("data:") || img.length > 2_000_000) continue;
    totalLen += img.length;
    if (totalLen > 4_000_000) break;
    images.push(img);
  }
  if (!project || (!text && images.length === 0)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const fb = await addFeedback(project, text, images);
  if (!fb) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true, feedback: fb });
}
