"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FB = {
  id: number;
  body: string;
  images?: string[];
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

const MAX_IMAGES = 4;

// 긴 변 1600px로 줄이고 webp(미지원 브라우저는 jpeg)로 압축한 data URL 반환
async function compressImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let out = canvas.toDataURL("image/webp", 0.85);
    if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", 0.85);
    return out.length <= 2_000_000 ? out : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function FeedbackBox({ project, initial }: { project: string; initial: FB[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FB[]>(initial);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: File[]) {
    const room = MAX_IMAGES - images.length;
    const picked = files.filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (picked.length === 0) return;
    const compressed = await Promise.all(picked.map(compressImage));
    setImages((prev) => [...prev, ...compressed.filter((x): x is string => !!x)].slice(0, MAX_IMAGES));
  }

  async function submit() {
    const body = text.trim();
    if ((!body && images.length === 0) || busy) return;
    setBusy(true);
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, body, images }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setItems([r.feedback, ...items]);
      setText("");
      setImages([]);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="w-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.items)
                .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
                .map((it) => it.getAsFile())
                .filter((f): f is File => !!f);
              if (files.length > 0) {
                e.preventDefault();
                addFiles(files);
              }
            }}
            rows={2}
            placeholder="피드백·개선요청 남기기 (Enter 전송 · Shift+Enter 줄바꿈 · 이미지 붙여넣기 가능)"
            className="min-h-[3rem] w-full resize-y rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`첨부 ${i + 1}`} className="h-16 w-16 rounded-lg border border-neutral-800 object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-[10px] text-neutral-200 hover:bg-neutral-600"
                    aria-label="첨부 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy || images.length >= MAX_IMAGES}
          title="이미지 첨부"
          className="shrink-0 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-400 transition hover:text-neutral-200 active:scale-95 disabled:opacity-40"
        >
          🖼
        </button>
        <button
          onClick={submit}
          disabled={busy || (!text.trim() && images.length === 0)}
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
              {f.body && <p className="whitespace-pre-wrap text-sm text-neutral-300">{f.body}</p>}
              {(f.images?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.images!.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`첨부 ${i + 1}`} className="h-20 rounded-lg border border-neutral-800 object-cover" />
                    </a>
                  ))}
                </div>
              )}
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
