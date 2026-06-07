"use client";

import { useEffect, useState } from "react";
import { SWITCHER_COLLAPSED_KEY, type Variant } from "./variants";

type Item = { id: Variant; label: string; sub: string };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "fresh",
    items: [
      { id: "mercury", label: "Mercury", sub: "raymarched fluid" },
      { id: "ascii", label: "ASCII", sub: "live char field" },
      { id: "spotlight", label: "Spotlight", sub: "cursor reveal" },
      { id: "tunnel", label: "Tunnel", sub: "voxel flight" },
      { id: "sand", label: "Sand", sub: "letter physics" },
    ],
  },
  {
    title: "v1",
    items: [
      { id: "combo", label: "Combo", sub: "shader + terminal" },
      { id: "shader", label: "Shader", sub: "noise gradient" },
      { id: "typography", label: "Typo", sub: "RGB split" },
      { id: "particles", label: "Particles", sub: "swarm" },
      { id: "cards", label: "Cards", sub: "selected work" },
      { id: "terminal", label: "Terminal", sub: "boot prompt" },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

export default function VariantSwitcher({
  value,
  onChange,
}: {
  value: Variant;
  onChange: (v: Variant) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SWITCHER_COLLAPSED_KEY);
    // default to collapsed; only expand if the user explicitly opened it
    setCollapsed(saved !== "0");
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SWITCHER_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  if (!mounted) return null;

  const current = ALL_ITEMS.find((i) => i.id === value);

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        className="pointer-events-auto fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 backdrop-blur-md transition-colors hover:bg-black/75 sm:right-4 sm:top-4"
        title="Show variant switcher"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-200/90" />
        <span className="text-white/90">{current?.label ?? value}</span>
        <span className="text-white/45">▾</span>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[60] flex max-h-[calc(100vh-24px)] w-[220px] flex-col gap-1 overflow-y-auto rounded-xl border border-white/10 bg-black/55 p-1.5 font-mono text-[11px] text-white/70 backdrop-blur-md hide-scrollbar sm:right-4 sm:top-4">
      <button
        onClick={toggle}
        className="flex items-center justify-between rounded-lg px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/85"
      >
        <span>variants</span>
        <span>▴</span>
      </button>
      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          <div className="px-2 pt-1.5 pb-0.5 text-[9px] uppercase tracking-[0.3em] text-amber-200/55">
            {section.title}
          </div>
          {section.items.map((it) => {
            const active = it.id === value;
            return (
              <button
                key={it.id}
                onClick={() => onChange(it.id)}
                className={`group flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  active
                    ? "bg-white/[0.13] text-white"
                    : "text-white/65 hover:bg-white/[0.06]"
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
      ))}
    </div>
  );
}
