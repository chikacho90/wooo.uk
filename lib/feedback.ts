// 프로젝트 피드백 저장 (Neon Postgres). 자동반영 크론이 status=new 를 소비.
import "server-only";
import { sql } from "@vercel/postgres";

export type Feedback = {
  id: number;
  project: string;
  body: string;
  images: string[]; // data URL 목록
  status: "new" | "queued" | "in_progress" | "done" | "skipped";
  result: string | null;
  created_at: string;
  updated_at: string;
};

let ensured = false;
async function ensure() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS project_feedback (
      id serial PRIMARY KEY,
      project text NOT NULL,
      body text NOT NULL,
      status text NOT NULL DEFAULT 'new',
      result text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_project ON project_feedback(project)`;
  await sql`ALTER TABLE project_feedback ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb`;
  ensured = true;
}

export async function addFeedback(project: string, body: string, images: string[] = []): Promise<Feedback | null> {
  try {
    await ensure();
    const { rows } = await sql<Feedback>`
      INSERT INTO project_feedback (project, body, images)
      VALUES (${project}, ${body}, ${JSON.stringify(images)}::jsonb)
      RETURNING *`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getFeedback(project: string): Promise<Feedback[]> {
  try {
    await ensure();
    const { rows } = await sql<Feedback>`
      SELECT * FROM project_feedback WHERE project = ${project} ORDER BY created_at DESC LIMIT 50`;
    return rows;
  } catch {
    return [];
  }
}

export async function getFeedbackCounts(): Promise<Record<string, number>> {
  try {
    await ensure();
    const { rows } = await sql<{ project: string; n: number }>`
      SELECT project, COUNT(*)::int AS n FROM project_feedback
      WHERE status IN ('new','queued','in_progress') GROUP BY project`;
    return Object.fromEntries(rows.map((r) => [r.project, r.n]));
  } catch {
    return {};
  }
}
