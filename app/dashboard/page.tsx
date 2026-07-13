import { HubShell, WidgetCard } from "@/components/hub";
import { getMemories, getTodos, getSecrets } from "@/lib/mem";

export const metadata = { title: "대시보드 · woo.moi" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [memories, todos, secrets] = await Promise.all([getMemories(), getTodos(), getSecrets()]);
  const activeTodos = todos.filter((t) => t.status === "active" || t.status === "pending");

  return (
    <HubShell title="대시보드" desc="한눈에 보는 내 공간">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <WidgetCard href="/ai" label="ai" hint="기억·시크릿·스킬·봇" stat={`${memories.length}`} accent="text-sky-400" />
        <WidgetCard href="/ai#todos" label="todos" hint="해야 할 일" stat={`${activeTodos.length}`} accent="text-emerald-400" />
        <WidgetCard href="/ai#secrets" label="secrets" hint="키·토큰 (이름만)" stat={`${secrets.length}`} accent="text-amber-400" />
        <WidgetCard href="/memory" label="memory" hint="기억 전체" stat={`${memories.length}`} />
        <WidgetCard href="/server" label="server" hint="인프라 상태 · 곧" />
        <WidgetCard href="/projects" label="projects" hint="GitHub·Vercel · 곧" />
        <WidgetCard href="/ideas" label="ideas" hint="아이디어 · 곧" />
        <WidgetCard href="/bots" label="bots" hint="텔레그램·디스코드 · 곧" />
      </div>

      {activeTodos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">오늘 할 일</h2>
          <ul className="space-y-2">
            {activeTodos.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                <span className="text-sm text-neutral-300">{t.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </HubShell>
  );
}
