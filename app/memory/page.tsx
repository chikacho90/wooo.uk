import { HubShell, Section, Empty, TYPE_COLOR } from "@/components/hub";
import { getMemories, type Memory } from "@/lib/mem";

export const metadata = { title: "메모리 · woo.moi" };
export const dynamic = "force-dynamic";

const ORDER = ["Todo", "Decision", "Idea", "Preference", "Reference", "Context"];

export default async function MemoryPage() {
  const memories = await getMemories();
  const byType = new Map<string, Memory[]>();
  for (const m of memories) {
    const arr = byType.get(m.type) ?? [];
    arr.push(m);
    byType.set(m.type, arr);
  }
  const types = [...byType.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

  return (
    <HubShell title="메모리" desc={`장기 기억 ${memories.length}개`}>
      {memories.length === 0 && <Empty>기억이 없거나 백엔드에 연결되지 않았어요</Empty>}
      {types.map((type) => (
        <Section key={type} title={type} count={byType.get(type)!.length}>
          <ul className="space-y-2">
            {byType.get(type)!.map((m) => (
              <li key={m.id} className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLOR[m.type] ?? TYPE_COLOR.Context}`}>
                    {m.type}
                  </span>
                  {m.tag && <span className="text-[11px] text-neutral-600">#{m.tag}</span>}
                  {m.title && <span className="text-[11px] text-neutral-500">{m.title}</span>}
                </div>
                <p className="whitespace-pre-wrap text-sm text-neutral-400">{m.content}</p>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </HubShell>
  );
}
