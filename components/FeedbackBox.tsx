"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FB = {
  id: number;
  body: string;
  status: string;
  result: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  new: { t: "대기", c: "text-neutral-400 bg-neutral-500/10" },
  queued: { t: "예약됨", c: "text-sky-400 bg-sky-500/10" },
  in_progress: { t: "처리중", c: "text-amber-400 bg-amber-500/10" },
  done: { t: "반영됨", c: "text-emerald-400 bg-emerald-500/10" },
  skipped: { t: "보류", c: "text-neutral-500 bg-neutral-500/10" },
};

export default function FeedbackBox({ project, initial }: { project: string; initial: FB[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FB[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, body }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setItems([r.feedback, ...items]);
      setText("");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={2}
          placeholder="피드백·개선요청 남기기 (⌘+Enter 전송) — 쌓이면 자동 반영돼요"
          className="min-h-[3rem] w-full resize-y rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition active:scale-95 disabled:opacity-40"
        >
          남기기
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="text-xs text-neutral-600">아직 피드백이 없어요</li>}
        {items.map((f) => {
          const s = STATUS_LABEL[f.status] ?? STATUS_LABEL.new;
          return (
            <li key={f.id} className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${s.c}`}>{s.t}</span>
                <span className="text-[11px] text-neutral-600">{new Date(f.created_at).toLocaleString("ko-KR")}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-300">{f.body}</p>
              {f.result && (
                <p className="mt-2 border-l-2 border-emerald-500/40 pl-3 text-xs text-neutral-500">
                  ↳ {f.result}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
