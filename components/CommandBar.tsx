"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const HIDDEN = ["dashboard", "memory", "ai", "server", "bots", "ideas", "projects"];

type Props = { authed: boolean };

export default function CommandBar({ authed: initialAuthed }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [authed, setAuthed] = useState(initialAuthed);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const expand = useCallback(() => {
    setOpen(true);
    setMsg(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const collapse = useCallback(() => {
    setOpen(false);
    setValue("");
  }, []);

  // PC: 홈에서 그냥 타이핑/엔터 시 활성화
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Enter" || (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        expand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, expand]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2600);
  };

  async function run() {
    const cmd = value.trim().toLowerCase();
    if (!cmd || busy) return;

    if (cmd === "home") {
      collapse();
      router.push("/");
      return;
    }
    if (cmd === "logout") {
      setBusy(true);
      await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setBusy(false);
      setAuthed(false);
      setValue("");
      flash("로그아웃됨");
      return;
    }
    if (HIDDEN.includes(cmd)) {
      if (authed) {
        collapse();
        router.push("/" + cmd);
      } else {
        setValue("");
        flash("그런 페이지 없어요");
      }
      return;
    }

    // 그 외 입력 → 비번인지 서버에 확인
    setBusy(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: value.trim() }),
    })
      .then((x) => x.json())
      .catch(() => ({ type: "unknown" }));
    setBusy(false);
    setValue("");
    if (r.type === "login") {
      setAuthed(true);
      flash("· 접속됨 ·");
    } else {
      flash("그런 페이지 없어요");
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {msg && (
        <div className="pointer-events-none mb-3 text-xs tracking-wide text-neutral-500 transition-opacity">
          {msg}
        </div>
      )}

      {!open ? (
        <button
          onClick={expand}
          aria-label="명령"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/70 text-neutral-500 backdrop-blur transition hover:border-neutral-600 hover:text-neutral-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 17l6-6-6-6M12 19h8" />
          </svg>
        </button>
      ) : (
        <div className="pointer-events-auto flex w-[min(92vw,30rem)] items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/85 px-4 py-3 backdrop-blur">
          <span className="select-none text-neutral-600">›</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
              if (e.key === "Escape") collapse();
            }}
            onBlur={() => !value && collapse()}
            placeholder={authed ? "이동할 곳… (dashboard, memory, server, logout)" : "명령 입력…"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full bg-transparent text-[15px] text-neutral-100 outline-none placeholder:text-neutral-600"
          />
          {authed && <span className="select-none text-[10px] tracking-widest text-emerald-500/70">●</span>}
        </div>
      )}
    </div>
  );
}
