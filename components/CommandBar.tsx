"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DESTINATIONS } from "@/lib/auth";

type Props = { authed: boolean };

export default function CommandBar({ authed: initialAuthed }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [authed, setAuthed] = useState(initialAuthed);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(false);
  const [hi, setHi] = useState(0);
  const [kb, setKb] = useState(0); // 키보드가 가린 높이
  const inputRef = useRef<HTMLInputElement>(null);

  // 키보드가 가린 만큼만 커맨드바를 올림 → 키보드 바로 위에 딱 붙음 (페이지는 안 움직임)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      setKb(Math.max(0, Math.round(hidden)));
    };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    sync();
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  const dests = useMemo(() => DESTINATIONS.filter((d) => authed || !d.hidden), [authed]);
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q || q === "help") return dests;
    return dests.filter((d) => d.label.includes(q) || d.desc.toLowerCase().includes(q));
  }, [value, dests]);

  // ⚠️ 모바일: 반드시 탭 제스처 안에서 동기적으로 focus() 해야 키보드가 열림.
  // 그래서 input은 항상 DOM에 두고(접힘 상태에선 숨김) 여기서 바로 focus.
  const expand = useCallback(() => {
    setOpen(true);
    setMsg(null);
    inputRef.current?.focus();
  }, []);

  const collapse = useCallback(() => {
    setOpen(false);
    setValue("");
    setShowList(false);
    inputRef.current?.blur();
  }, []);

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

  useEffect(() => setHi(0), [value, showList]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg((c) => (c === m ? null : c)), 2600);
  };

  const go = useCallback(
    (slug: string) => {
      collapse();
      router.push("/" + slug);
    },
    [collapse, router],
  );

  async function submit() {
    const raw = value.trim();
    const cmd = raw.toLowerCase();
    if (busy) return;

    if (showList && filtered.length) {
      go(filtered[Math.min(hi, filtered.length - 1)].slug);
      return;
    }
    if (!cmd) return;

    if (cmd === "help") {
      setShowList(true);
      setValue("");
      return;
    }
    if (cmd === "home") return go("");
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

    const dest = dests.find((d) => d.label === cmd && d.slug);
    if (dest) return go(dest.slug);

    if (DESTINATIONS.some((d) => d.label === cmd && d.hidden) && !authed) {
      setValue("");
      return flash("그런 페이지 없어요");
    }

    setBusy(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: raw }),
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

  function onKeyDown(e: React.KeyboardEvent) {
    const hasList = showList || (value.trim() !== "" && filtered.length > 0);
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      if (showList) setShowList(false);
      else collapse();
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && hasList) {
      e.preventDefault();
      if (!showList) setShowList(true);
      setHi((h) => {
        const n = filtered.length;
        return (h + (e.key === "ArrowDown" ? 1 : -1) + n) % Math.max(n, 1);
      });
    }
  }

  const listVisible = open && showList && filtered.length > 0;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center"
      style={{
        // 키보드 위에 딱 붙이고, 키보드 없을 땐 하단 여백
        transform: kb ? `translateY(-${kb}px)` : undefined,
        paddingBottom: kb ? 8 : undefined,
      }}
    >
      {msg && <div className="mb-3 text-xs tracking-wide text-neutral-500">{msg}</div>}

      {listVisible && (
        <div className="pointer-events-auto mb-2 w-[min(92vw,30rem)] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          {filtered.map((d, i) => (
            <button
              key={d.slug || "home"}
              onMouseEnter={() => setHi(i)}
              onClick={() => go(d.slug)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                i === hi ? "bg-neutral-800/80 text-neutral-100" : "text-neutral-400"
              }`}
            >
              <span className="font-mono">{d.label}</span>
              <span className="text-xs text-neutral-600">{d.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* 접힘: 동그란 버튼 (탭하면 그 제스처 안에서 바로 focus → 키보드 즉시) */}
      {!open && (
        <button
          onClick={expand}
          aria-label="명령"
          className="pointer-events-auto mb-[max(1.5rem,env(safe-area-inset-bottom))] flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/70 text-neutral-500 backdrop-blur transition active:scale-90 hover:border-neutral-600 hover:text-neutral-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 17l6-6-6-6M12 19h8" />
          </svg>
        </button>
      )}

      {/* input은 항상 DOM에 유지 — 접힘 땐 숨김(포커스는 가능해야 키보드가 열림) */}
      <div
        className={
          open
            ? "pointer-events-auto mb-[max(0.5rem,env(safe-area-inset-bottom))] flex w-[min(92vw,30rem)] items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/85 px-4 py-2.5 backdrop-blur"
            : "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        }
      >
        {open && <span className="select-none text-neutral-600">›</span>}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (!value && !showList) setOpen(false);
          }}
          enterKeyHint="go"
          placeholder={authed ? "이동 · help 로 목록" : "명령 입력 · help"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          tabIndex={open ? 0 : -1}
          className="w-full bg-transparent text-[16px] text-neutral-100 outline-none placeholder:text-neutral-600"
        />
        {open && authed && <span className="select-none text-[10px] text-emerald-500/70">●</span>}
        {open && (
          <button
            type="button"
            aria-label="이동"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => submit()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition active:scale-90 disabled:opacity-40"
            disabled={busy}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
