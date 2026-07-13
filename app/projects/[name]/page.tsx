import Link from "next/link";
import { notFound } from "next/navigation";
import { HubShell, Section, Empty } from "@/components/hub";
import { getRepo, getCommits, getIssues, getWeeklyActivity, getDeployments, getVercelProjectNames, displayName } from "@/lib/projects";
import { getFeedback } from "@/lib/feedback";
import FeedbackBox from "@/components/FeedbackBox";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return { title: `${name} · woo.moi` };
}

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3600000);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  return day === 1 ? "어제" : `${day}일 전`;
}

// 8주 활동 막대그래프 (인라인) — flex 직계 자식 + 고정높이로 % 확실히 잡음
function ActivityBars({ weeks }: { weeks: number[] }) {
  const max = Math.max(1, ...weeks);
  return (
    <div className="flex h-12 items-end gap-1.5">
      {weeks.map((w, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${w > 0 ? "bg-sky-500/70" : "bg-neutral-800"}`}
          style={{ height: `${w > 0 ? Math.max(12, (w / max) * 100) : 6}%` }}
          title={`${w} 커밋`}
        />
      ))}
    </div>
  );
}

export default async function ProjectDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const repo = await getRepo(name);
  if (!repo) notFound();

  const [commits, issues, weeks, vercel, feedback] = await Promise.all([
    getCommits(name, 10),
    getIssues(name),
    getWeeklyActivity(name),
    getVercelProjectNames(),
    getFeedback(name),
  ]);
  const deploys = vercel.has(name) ? await getDeployments(name, 6) : [];
  const totalCommits8w = weeks.reduce((a, b) => a + b, 0);

  return (
    <HubShell title={displayName(name)} desc={repo.description || undefined}>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        <span>최근 업데이트 {ago(repo.pushed_at)}</span>
        <span>·</span>
        <span>열린 이슈 {issues.length}</span>
        {repo.language && (<><span>·</span><span>{repo.language}</span></>)}
        <a href={repo.html_url} target="_blank" rel="noopener" className="ml-auto text-sky-400 hover:text-sky-300">
          GitHub ↗
        </a>
      </div>

      <Section title={`활동 · 최근 8주 ${totalCommits8w} 커밋`}>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <ActivityBars weeks={weeks} />
          <div className="mt-2 flex justify-between text-[10px] text-neutral-600">
            <span>8주 전</span>
            <span>이번 주</span>
          </div>
        </div>
      </Section>

      {deploys.length > 0 && (
        <Section title="배포" count={deploys.length}>
          <ul className="space-y-1.5">
            {deploys.map((d) => (
              <li key={d.uid} className="flex items-center gap-3 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 py-2 text-xs">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${d.state === "READY" ? "bg-emerald-500" : d.state === "ERROR" ? "bg-rose-500" : "bg-amber-500"}`} />
                <span className="truncate text-neutral-400">{d.commitMsg || d.url}</span>
                <span className="ml-auto shrink-0 text-neutral-600">{d.state}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="최근 커밋" count={commits.length}>
        {commits.length ? (
          <ul className="space-y-1.5">
            {commits.map((c) => (
              <li key={c.sha} className="flex items-start gap-3 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 py-2">
                <span className="mt-0.5 font-mono text-[10px] text-neutral-600">{c.sha.slice(0, 7)}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-400">{c.commit.message.split("\n")[0]}</span>
                <span className="shrink-0 text-[10px] text-neutral-600">{ago(c.commit.author.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>커밋 없음</Empty>
        )}
      </Section>

      {issues.length > 0 && (
        <Section title="이슈" count={issues.length}>
          <ul className="space-y-1.5">
            {issues.map((i) => (
              <li key={i.number} className="flex items-center gap-3 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 py-2 text-xs">
                <span className="font-mono text-neutral-600">#{i.number}</span>
                <a href={i.html_url} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate text-neutral-400 hover:text-neutral-200">
                  {i.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="피드백" count={feedback.length}>
        <FeedbackBox project={name} initial={feedback} />
      </Section>

      <div className="mt-8">
        <Link href="/projects" className="text-xs text-neutral-600 hover:text-neutral-400">← 프로젝트 목록</Link>
      </div>
    </HubShell>
  );
}
