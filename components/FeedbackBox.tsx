"use client";

import { useEffect, useRef, useState } from "react";
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

const MAX_FILES = 4;
const MAX_FILE_SIZE = 2_000_000; // data URL 기준, 서버 한도와 동일

type Attachment = { name: string; type: string; data: string };

// data URL에서 표시용 정보 추출 (name= 파라미터는 비이미지 첨부의 파일명)
function parseAttachment(src: string): { isImage: boolean; name: string } {
  const m = src.match(/^data:[^;,]*;name=([^;,]*)/);
  return { isImage: src.startsWith("data:image/"), name: m ? decodeURIComponent(m[1]) : "" };
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// 임의 파일을 data URL로 (파일명을 name= 파라미터로 보존)
function fileToDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : null;
      if (!raw || raw.length > MAX_FILE_SIZE) return resolve(null);
      resolve(raw.replace(/^data:([^;,]*)/, (_, mime) => `data:${mime};name=${encodeURIComponent(file.name)}`));
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

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
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // 한 줄에서 시작해 내용만큼만 늘어나는 입력창 (최대 높이 제한)
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  async function addFiles(picked: File[]) {
    const room = MAX_FILES - files.length;
    const list = picked.slice(0, room);
    if (list.length === 0) return;
    const converted = await Promise.all(
      list.map(async (f): Promise<Attachment | null> => {
        const data = f.type.startsWith("image/") ? await compressImage(f) : await fileToDataUrl(f);
        return data ? { name: f.name, type: f.type, data } : null;
      })
    );
    setFiles((prev) => [...prev, ...converted.filter((x): x is Attachment => !!x)].slice(0, MAX_FILES));
  }

  async function submit() {
    const body = text.trim();
    if ((!body && files.length === 0) || busy) return;
    setBusy(true);
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, body, images: files.map((f) => f.data) }),
    })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setItems([r.feedback, ...items]);
      setText("");
      setFiles([]);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-end rounded-xl border border-neutral-800 bg-neutral-900/50 focus-within:border-neutral-600">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy || files.length >= MAX_FILES}
              title="파일 첨부"
              aria-label="파일 첨부"
              className="shrink-0 p-2.5 text-neutral-500 transition hover:text-neutral-200 active:scale-95 disabled:opacity-40"
            >
              <PaperclipIcon className="h-4 w-4" />
            </button>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              onPaste={(e) => {
                const pasted = Array.from(e.clipboardData.items)
                  .filter((it) => it.kind === "file")
                  .map((it) => it.getAsFile())
                  .filter((f): f is File => !!f);
                if (pasted.length > 0) {
                  e.preventDefault();
                  addFiles(pasted);
                }
              }}
              rows={1}
              placeholder="피드백·개선요청 남기기 (Enter 전송 · Shift+Enter 줄바꿈)"
              className="max-h-40 w-full resize-none bg-transparent py-2 pr-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
            />
          </div>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {f.type.startsWith("image/") ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={f.data} alt={f.name} className="h-16 w-16 rounded-lg border border-neutral-800 object-cover" />
                  ) : (
                    <span className="flex h-16 max-w-40 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 text-xs text-neutral-400">
                      <FileIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                  )}
                  <button
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
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
        <button
          onClick={submit}
          disabled={busy || (!text.trim() && files.length === 0)}
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
                  {f.images!.map((src, i) => {
                    const att = parseAttachment(src);
                    return att.isImage ? (
                      <a key={i} href={src} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`첨부 ${i + 1}`} className="h-20 rounded-lg border border-neutral-800 object-cover" />
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={src}
                        download={att.name || `첨부 ${i + 1}`}
                        className="flex max-w-48 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400 transition hover:text-neutral-200"
                      >
                        <FileIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{att.name || `첨부 ${i + 1}`}</span>
                      </a>
                    );
                  })}
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
