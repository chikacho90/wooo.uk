"use client";

type Work = {
  title: string;
  tag: string;
  year: string;
  description: string;
  swatch: string;
};

const WORKS: Work[] = [
  {
    title: "Bumblebee",
    tag: "AI / video",
    year: "2025",
    description:
      "A bot that can only speak in movie lines, song lyrics, and quotes — Claude picks the line, YouTube finds the clip.",
    swatch: "linear-gradient(135deg, #1a0f00 0%, #d97706 100%)",
  },
  {
    title: "Smokemap",
    tag: "Geo / data",
    year: "2025",
    description:
      "A city map for smokers and non-smokers to coexist — community-curated spots with non-smoking buffer overlays.",
    swatch: "linear-gradient(135deg, #0a1f2c 0%, #0ea5e9 100%)",
  },
  {
    title: "Woorld",
    tag: "Travel / UX",
    year: "2025",
    description:
      "A drag-and-drop travel planner with AI-suggested cards, undo/redo, and a card-pool to slot-grid metaphor.",
    swatch: "linear-gradient(135deg, #1a0a2e 0%, #a78bfa 100%)",
  },
  {
    title: "Aibot",
    tag: "Devtools",
    year: "2025",
    description:
      "A dashboard for managing memory files across Discord and Telegram bots running on personal Tailscale hosts.",
    swatch: "linear-gradient(135deg, #001a1a 0%, #14b8a6 100%)",
  },
];

export default function WorkCards() {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#06060f]">
      {/* ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(800px circle at 80% -10%, rgba(120,70,200,0.15), transparent 60%), radial-gradient(900px circle at -10% 110%, rgba(40,140,180,0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        <header className="mb-16 flex items-baseline justify-between">
          <div>
            <h1 className="font-mono text-3xl tracking-tight text-white/95">wooo.uk</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-white/40">
              Woo Kyung Min — selected work
            </p>
          </div>
          <div className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 sm:block">
            2025 — present
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {WORKS.map((w) => (
            <article
              key={w.title}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div
                className="absolute inset-x-0 top-0 h-24 opacity-60 transition-opacity group-hover:opacity-90"
                style={{ background: w.swatch }}
              />
              <div className="relative pt-20">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-mono text-lg text-white/95">{w.title}</h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {w.year}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
                  {w.tag}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {w.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-8 font-mono text-[11px] text-white/40">
          <span>©2025 Woo Kyung Min</span>
          <div className="flex gap-5">
            <a href="https://github.com/chikacho90" className="hover:text-white/70">
              github
            </a>
            <a href="mailto:chikacho90@gmail.com" className="hover:text-white/70">
              email
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
