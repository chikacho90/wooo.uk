import { HubShell, Section, Empty, TYPE_COLOR } from "@/components/hub";
import { getMemories, getTodos, getSecrets } from "@/lib/mem";

export const metadata = { title: "AI · woo.moi" };
export const dynamic = "force-dynamic";

export default async function AiPage() {
  const [memories, todos, secrets] = await Promise.all([getMemories(), getTodos(), getSecrets()]);
  const activeTodos = todos.filter((t) => t.status === "active" || t.status === "pending");

  return (
    <HubShell title="AI" desc="기억 · 시크릿 · 할일 · 스킬 · 봇 — AI의 뇌">
      <Section title="할 일" count={activeTodos.length}>
        <div id="todos" />
        {activeTodos.length ? (
          <ul className="space-y-2">
            {activeTodos.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                <div className="min-w-0">
                  <p className="text-sm text-neutral-300">{t.content}</p>
                  {(t.tag || t.due_date) && (
                    <p className="mt-1 text-[11px] text-neutral-600">
                      {t.tag && <span className="mr-2">#{t.tag}</span>}
                      {t.due_date && <span>~{t.due_date.slice(0, 10)}</span>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>할 일 없음</Empty>
        )}
      </Section>

      <Section title="기억" count={memories.length}>
        <ul className="space-y-2">
          {memories.slice(0, 8).map((m) => (
            <li key={m.id} className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLOR[m.type] ?? TYPE_COLOR.Context}`}>
                  {m.type}
                </span>
                {m.tag && <span className="text-[11px] text-neutral-600">#{m.tag}</span>}
              </div>
              <p className="line-clamp-2 text-sm text-neutral-400">{m.content}</p>
            </li>
          ))}
        </ul>
        <a href="/memory" className="mt-3 inline-block text-xs text-sky-400 hover:text-sky-300">
          전체 기억 보기 →
        </a>
      </Section>

      <Section title="시크릿" count={secrets.length}>
        <div id="secrets" />
        <p className="mb-3 text-[11px] text-neutral-600">이름·설명만 표시 (값은 보안상 숨김)</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {secrets.map((s) => (
            <div key={s.key} className="rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-neutral-300">{s.key}</span>
                <span className={`shrink-0 text-[9px] ${s.visibility === "private" ? "text-rose-400/70" : "text-emerald-400/70"}`}>
                  {s.visibility}
                </span>
              </div>
              {s.comment && <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-600">{s.comment}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="스킬 · 자동화 · 봇">
        <Empty>여기에 Claude Code 스킬, 크론 자동화, 텔레그램·디스코드 봇 상태를 모을 예정</Empty>
      </Section>
    </HubShell>
  );
}
