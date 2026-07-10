import { NextRequest, NextResponse } from "next/server";
import { verifySession, authCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.SITE_SECRET || "";
  const token = req.cookies.get(authCookie.name)?.value;
  const session = await verifySession(secret, token);
  return NextResponse.json({ authed: !!session });
}
