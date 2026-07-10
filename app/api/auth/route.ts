import { NextRequest, NextResponse } from "next/server";
import { signSession, authCookie } from "@/lib/auth";

export const runtime = "nodejs";

// 커맨드바에서 입력한 값을 받아 처리.
// - value 가 비번과 일치 → 로그인(쿠키 발급), {type:"login"}
// - action === "logout" → 쿠키 삭제, {type:"logout"}
// - 그 외 → {type:"unknown"} (비번 틀림/미인식 — 무엇이 틀렸는지 안 알려줌)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secret = process.env.SITE_SECRET || "";
  const password = process.env.HUB_PASSWORD || "";

  if (body.action === "logout") {
    const res = NextResponse.json({ type: "logout" });
    res.cookies.set(authCookie.name, "", { path: "/", maxAge: 0 });
    return res;
  }

  const value = typeof body.value === "string" ? body.value : "";
  if (password && value === password) {
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

  return NextResponse.json({ type: "unknown" });
}
