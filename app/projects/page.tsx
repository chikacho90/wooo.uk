import Link from "next/link";
import { HubShell, Empty } from "@/components/hub";
import { getProjects, getVercelProjectNames, displayName } from "@/lib/projects";
import { getFeedbackCounts } from "@/lib/feedback";

export const metadata = { title: "프로젝트 · woo.moi" };
export const dynamic = "force-dynamic";

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const day = Math.floor(d / 86400000);
  if (day === 0) return "오늘";
  if (day === 1) return "어제";
  if (day < 30) return `${day}일 전`;
  return `${Math.floor(day / 30)}달 전`;
}

export default async function Projects() {
  const [repos, vercel, fbCounts] = await Promise.all([
    getProjects(),
    getVercelProjectNames(),
    getFeedbackCounts(),
  ]);

  return (
    <HubShell title="프로젝트" desc={`진행중 ${repos.length}개 · 최근 활동순`}>
      {repos.length === 0 ? (
        <Empty>프로젝트를 불러오지 못했어요 (GitHub 연결 확인)</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {repos.map((r) => {
            const deployed = vercel.has(r.name);
            const fb = fbCounts[r.name] ?? 0;
            return (
              <Link
                key={r.name}
                href={`/projects/${r.name}`}
                className="group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm font-semibold text-neutral-200">{displayName(r.name)}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {deployed && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-400">deploy</span>}
                    {r.private && <span className="text-[10px] text-neutral-600">🔒</span>}
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-1 text-xs text-neutral-500">{r.description || "—"}</p>
                <div className="mt-4 flex items-center gap-3 text-[11px] text-neutral-600">
                  <span>{ago(r.pushed_at)}</span>
                  {r.open_issues_count > 0 && <span>이슈 {r.open_issues_count}</span>}
                  {r.language && <span>{r.language}</span>}
                  {fb > 0 && <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-400">피드백 {fb}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </HubShell>
  );
}
