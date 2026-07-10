import { NextRequest, NextResponse } from "next/server";
import { verifySession, authCookie, HIDDEN_ROUTES } from "@/lib/auth";

// 히든 경로는 로그인 안 됐으면 존재 자체를 숨김(404)
export async function proxy(req: NextRequest) {
  const seg = req.nextUrl.pathname.split("/")[1];
  if (!HIDDEN_ROUTES.includes(seg)) return NextResponse.next();

  const secret = process.env.SITE_SECRET || "";
  const token = req.cookies.get(authCookie.name)?.value;
  const session = await verifySession(secret, token);
  if (session) return NextResponse.next();

  // 미로그인 → 없는 페이지처럼 404
  return NextResponse.rewrite(new URL("/__gone", req.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
