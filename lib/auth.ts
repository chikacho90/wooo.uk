// Edge/Node 공용 세션 서명·검증 (Web Crypto HMAC-SHA256)
// 쿠키 값 형식: base64url(payloadJSON).base64url(hmac)

const COOKIE = "hub_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

type Payload = { u: string; exp: number };

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function enc(s: string): Uint8Array<ArrayBuffer> {
  const u = new TextEncoder().encode(s);
  const out = new Uint8Array(u.length);
  out.set(u);
  return out;
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(secret: string, user = "woo"): Promise<string> {
  const payload: Payload = { u: user, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const data = b64url(enc(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifySession(secret: string, token: string | undefined): Promise<Payload | null> {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      b64urlToBytes(sig),
      enc(data),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(data))) as Payload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const authCookie = { name: COOKIE, maxAge: MAX_AGE };

// 페이지 레지스트리 (커맨드바·help 팔레트 공용)
export type Dest = { slug: string; label: string; desc: string; hidden: boolean };
export const DESTINATIONS: Dest[] = [
  { slug: "", label: "home", desc: "홈", hidden: false },
  { slug: "dashboard", label: "dashboard", desc: "전체 위젯 한눈에", hidden: true },
  { slug: "ai", label: "ai", desc: "메모리·시크릿·스킬·자동화·봇", hidden: true },
  { slug: "memory", label: "memory", desc: "기억", hidden: true },
  { slug: "server", label: "server", desc: "서버·인프라 상태", hidden: true },
  { slug: "projects", label: "projects", desc: "GitHub·Vercel 진행", hidden: true },
  { slug: "ideas", label: "ideas", desc: "아이디어·레퍼런스", hidden: true },
  { slug: "bots", label: "bots", desc: "텔레그램·디스코드 봇", hidden: true },
];

// 인증이 필요한(히든) 최상위 경로
export const HIDDEN_ROUTES = DESTINATIONS.filter((d) => d.hidden).map((d) => d.slug);
