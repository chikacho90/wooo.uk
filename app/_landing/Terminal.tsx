"use client";

import { useEffect, useRef, useState } from "react";
import type { GateState } from "./useGate";

const BOOT_LINES = [
  "[ ok ] booting wooo.uk system v1.0",
  "[ ok ] loading three.js shader pipeline",
  "[ ok ] mounting /portfolio",
  "[ ok ] handshake with claude",
  "> whoami",
  "Woo Kyung Min — creative developer, seoul",
  "> ls /interests",
  "shaders/  ai/  geospatial/  travel/  bots/",
  "",
];

export default function Terminal({
  gate,
  transparent = false,
}: {
  gate: GateState;
  transparent?: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // typewriter boot
  useEffect(() => {
    let i = 0;
    setLines([]);
    const interval = setInterval(() => {
      i++;
      setLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 220);
    return () => clearInterval(interval);
  }, []);

  // focus input when boot finishes
  useEffect(() => {
    if (done) setTimeout(() => inputRef.current?.focus(), 50);
  }, [done]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  const submitCommand = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    const prefixed = `> ${cmd}`;

    if (cmd === "help" || cmd === "?") {
      setLines((l) => [
        ...l,
        prefixed,
        "available commands:",
        "  help          show this list",
        "  whoami        identity",
        "  contact       reach out",
        "  clear         clear screen",
        "  <secret>      unlock private sections",
        "",
      ]);
    } else if (cmd === "whoami") {
      setLines((l) => [...l, prefixed, "Woo Kyung Min — creative developer", ""]);
    } else if (cmd === "contact") {
      setLines((l) => [
        ...l,
        prefixed,
        "email   chikacho90@gmail.com",
        "github  github.com/chikacho90",
        "",
      ]);
    } else if (cmd === "clear") {
      setLines([]);
    } else if (gate.authed && cmd.startsWith("/")) {
      setLines((l) => [...l, prefixed, `routing to ${cmd} ...`]);
    } else {
      // try as password
      gate.setValue(cmd);
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cmd }),
        credentials: "same-origin",
      });
      if (r.ok) {
        if (gate.authed) {
          await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
          setLines((l) => [...l, prefixed, "session locked.", ""]);
        } else {
          setLines((l) => [...l, prefixed, "access granted.", ""]);
        }
        location.reload();
      } else {
        setLines((l) => [...l, prefixed, `wooo: command not found: ${cmd}`, ""]);
      }
    }
    setInput("");
  };

  const bg = transparent ? "transparent" : "#06060f";

  return (
    <div
      className="absolute inset-0 flex flex-col px-4 py-6 sm:px-10 sm:py-10"
      style={{ background: bg }}
    >
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/70 animate-pulse" />
        wooo.uk — terminal
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed text-emerald-200/85 hide-scrollbar"
      >
        {lines.map((line, i) => (
          <div key={i} className={line.startsWith(">") ? "text-amber-200/90" : ""}>
            {line || " "}
          </div>
        ))}

        {done && (
          <div className="mt-2 flex items-center">
            <span className="text-amber-200/90">{"> "}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCommand();
              }}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="type 'help'"
              className="ml-1 flex-1 bg-transparent font-mono text-[13px] text-emerald-200/95 placeholder-white/20 outline-none"
              style={{ caretColor: "rgba(255,255,255,0.7)" }}
            />
          </div>
        )}
      </div>

      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        {gate.authed ? "[ authed ]" : "[ guest ]"} — try: help · whoami · contact
      </div>
    </div>
  );
}
