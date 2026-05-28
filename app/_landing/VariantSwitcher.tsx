"use client";

import type { Variant } from "./variants";

const ITEMS: { id: Variant; label: string; sub: string }[] = [
  { id: "combo", label: "Combo", sub: "shader + terminal" },
  { id: "shader", label: "Shader", sub: "noise gradient" },
  { id: "typography", label: "Typo", sub: "RGB split" },
  { id: "particles", label: "Particles", sub: "swarm" },
  { id: "cards", label: "Cards", sub: "selected work" },
  { id: "terminal", label: "Terminal", sub: "boot prompt" },
];

export default function VariantSwitcher({
  value,
  onChange,
}: {
  value: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[60] flex flex-col gap-1 rounded-xl border border-white/10 bg-black/45 p-1.5 font-mono text-[11px] text-white/70 backdrop-blur-md sm:right-4 sm:top-4">
      <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase tracking-[0.3em] text-white/40">
        variants
      </div>
      {ITEMS.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`group flex min-w-[140px] items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              active
                ? "bg-white/[0.12] text-white"
                : "hover:bg-white/[0.06] text-white/65"
            }`}
          >
            <span className="font-semibold tracking-wide">{it.label}</span>
            <span
              className={`text-[9px] uppercase tracking-[0.2em] ${
                active ? "text-amber-200/80" : "text-white/35 group-hover:text-white/55"
              }`}
            >
              {it.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
