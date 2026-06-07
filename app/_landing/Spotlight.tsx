"use client";

import { useEffect, useRef, useState } from "react";

const NOISE_CHARS = "01░▒▓█▄▀▌▐■◆◇★☆※⌘∴∵∷⊕⊗∞≈≠≡∂∫∇";

function GlyphField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cells: { ch: string; until: number }[] = [];
    const cellW = 14;
    const cellH = 20;
    let cols = 0;
    let rows = 0;

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(canvas.clientWidth / cellW);
      rows = Math.ceil(canvas.clientHeight / cellH);
      cells = new Array(cols * rows).fill(null).map(() => ({
        ch: NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)],
        until: performance.now() + Math.random() * 3000,
      }));
    };
    init();

    const onResize = () => init();
    window.addEventListener("resize", onResize);

    const draw = () => {
      const now = performance.now();
      ctx.fillStyle = "#06060f";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.font = `${cellH - 4}px "Menlo", "Consolas", monospace`;
      ctx.textBaseline = "top";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const cell = cells[i];
          if (now > cell.until) {
            cell.ch = NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
            cell.until = now + 800 + Math.random() * 3200;
          }
          const wave = Math.sin((x + y) * 0.18 + now * 0.001) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(${100 + wave * 30}, ${110 + wave * 50}, ${
            150 + wave * 80
          }, ${0.18 + wave * 0.12})`;
          ctx.fillText(cell.ch, x * cellW, y * cellH);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

export default function Spotlight() {
  const [pos, setPos] = useState<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY, active: true });
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      setPos({ x: t.clientX, y: t.clientY, active: true });
    };
    const onLeave = () => setPos((p) => ({ ...p, active: false }));
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const radius = pos.active ? 160 : 110;
  const mask = `radial-gradient(circle ${radius}px at ${pos.x}px ${pos.y}px, transparent 0%, transparent 55%, black 100%)`;

  return (
    <div className="absolute inset-0 cursor-none overflow-hidden bg-[#06060f]">
      {/* real content underneath */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-mono text-5xl font-light tracking-tight text-white sm:text-7xl">
          wooo<span className="text-amber-200/90">.uk</span>
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.4em] text-white/55">
          Woo Kyung Min · creative developer
        </p>
        <div className="mt-8 flex gap-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/70">
          <a href="https://github.com/chikacho90" className="hover:text-white">
            github
          </a>
          <a href="mailto:chikacho90@gmail.com" className="hover:text-white">
            mail
          </a>
        </div>
      </div>

      {/* glyph noise overlay with hole at cursor */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <GlyphField />
      </div>

      {/* cursor ring */}
      <div
        className="pointer-events-none absolute z-20 rounded-full border border-amber-200/30 transition-all duration-150 ease-out"
        style={{
          left: pos.x - radius,
          top: pos.y - radius,
          width: radius * 2,
          height: radius * 2,
          opacity: pos.active ? 1 : 0,
          boxShadow: "0 0 60px rgba(255,200,150,0.08), inset 0 0 30px rgba(0,0,0,0.4)",
        }}
      />

      <div className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        move cursor — light the path
      </div>
    </div>
  );
}
