// Postgres(Neon) 기반 레이트리밋 — Vercel 서버리스는 인스턴스가 분산돼
// 메모리 카운터가 안 통하므로 공유 스토어(DB)로 카운트한다.
import "server-only";
import { sql } from "@vercel/postgres";

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_attempts (
      ip text PRIMARY KEY,
      count int NOT NULL,
      reset_at bigint NOT NULL
    )`;
  ensured = true;
}

// true = 차단됨
export async function hitRateLimit(ip: string, max = 10, windowMs = 5 * 60_000): Promise<boolean> {
  try {
    await ensureTable();
    const now = Date.now();
    const reset = now + windowMs;
    // 윈도우 만료면 리셋, 아니면 +1. 반환된 count로 판정.
    const { rows } = await sql`
      INSERT INTO auth_attempts (ip, count, reset_at)
      VALUES (${ip}, 1, ${reset})
      ON CONFLICT (ip) DO UPDATE SET
        count = CASE WHEN auth_attempts.reset_at < ${now} THEN 1 ELSE auth_attempts.count + 1 END,
        reset_at = CASE WHEN auth_attempts.reset_at < ${now} THEN ${reset} ELSE auth_attempts.reset_at END
      RETURNING count`;
    return (rows[0]?.count ?? 1) > max;
  } catch {
    // DB 장애 시 로그인 자체를 막지 않음(가용성 우선). 상수시간 비교+지연이 최소 방어.
    return false;
  }
}

export async function clearRateLimit(ip: string): Promise<void> {
  try {
    await ensureTable();
    await sql`DELETE FROM auth_attempts WHERE ip = ${ip}`;
  } catch {
    /* 무시 */
  }
}
