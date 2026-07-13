import Link from "next/link";
import { HubShell, Empty } from "@/components/hub";
import { getProjects, getVercelProjectNames, getWuniverseProjects, displayName } from "@/lib/projects";
import { getFeedbackCounts } from "@/lib/feedback";

export const metadata = { title: "프로젝트 · woo.moi" };
export const dynamic = "force-dynamic";

function ago(iso: string | null): string {
  if (!iso) return "—";
  const d = Date.now() - new Date(iso).getTime();
  const day = Math.floor(d / 86400000);
  if (day === 0) return "오늘";
  if (day === 1) return "어제";
  if (day < 30) return `${day}일 전`;
  return `${Math.floor(day / 30)}달 전`;
}

const CAT_STYLE: Record<string, string> = {
  work: "bg-rose-500/10 text-rose-400",
  personal: "bg-violet-500/10 text-violet-400",
  test: "bg-neutral-500/10 text-neutral-400",
};

export default async function Projects() {
  const [repos, wuniverse, vercel, fbCounts] = await Promise.all([
    getProjects(),
    getWuniverseProjects(),
    getVercelProjectNames(),
    getFeedbackCounts(),
  ]);

  // GitHub + wuniverse 를 하나의 목록으로 — 이름이 겹치면 GitHub 카드에 wuniverse 배지만 얹는다
  const wuNames = new Set(wuniverse.map((w) => w.name));
  const wuOnly = wuniverse.filter((w) => !repos.some((r) => r.name === w.name));
  const items = [
    ...repos.map((r) => ({ kind: "github" as const, r, at: new Date(r.pushed_at).getTime() })),
    ...wuOnly.map((w) => ({ kind: "wuniverse" as const, w, at: w.last_activity ? new Date(w.last_activity).getTime() : 0 })),
  ].sort((a, b) => b.at - a.at);

  return (
    <HubShell title="프로젝트" desc={`진행중 ${items.length}개 · 최근 활동순`}>
      {items.length === 0 ? (
        <Empty>프로젝트를 불러오지 못했어요 (GitHub 연결 확인)</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((it) => {
            if (it.kind === "wuniverse") {
              const w = it.w;
              const fb = fbCounts[w.name] ?? 0;
              return (
                <Link
                  key={`wu-${w.name}`}
                  href={`/projects/${encodeURIComponent(w.name)}`}
                  className="group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-sm font-semibold text-neutral-200">{w.name}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] ${CAT_STYLE[w.category] ?? CAT_STYLE.test}`}>
                      {w.category}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-xs text-neutral-500">{w.description || "—"}</p>
                  <div className="mt-4 flex items-center gap-3 text-[11px] text-neutral-600">
                    <span>{ago(w.last_activity)}</span>
                    <span>wuniverse</span>
                    {fb > 0 && <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-400">피드백 {fb}</span>}
                  </div>
                </Link>
              );
            }
            const r = it.r;
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
                    {wuNames.has(r.name) && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-400">wuniverse</span>}
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
