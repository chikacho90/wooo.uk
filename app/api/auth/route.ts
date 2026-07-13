import { NextRequest, NextResponse } from "next/server";
import { signSession, authCookie } from "@/lib/auth";
import { hitRateLimit, clearRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// 상수시간 문자열 비교 (타이밍 공격 완화)
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secret = process.env.SITE_SECRET || "";
  const password = process.env.HUB_PASSWORD || "";

  if (body.action === "logout") {
    const res = NextResponse.json({ type: "logout" });
    res.cookies.set(authCookie.name, "", { path: "/", maxAge: 0 });
    return res;
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (await hitRateLimit(ip)) {
    return NextResponse.json({ type: "unknown" }, { status: 429 });
  }

  const value = typeof body.value === "string" ? body.value : "";
  if (password && timingSafeEqual(value, password)) {
    await clearRateLimit(ip);
    const token = await signSession(secret);
    const res = NextResponse.json({ type: "login" });
    res.cookies.set(authCookie.name, token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: authCookie.maxAge,
    });
    return res;
  }

  // 실패 시 소폭 지연 (무차별 대입 속도 저하)
  await new Promise((r) => setTimeout(r, 400));
  return NextResponse.json({ type: "unknown" });
}
