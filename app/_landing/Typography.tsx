"use client";

import { useEffect, useState } from "react";

export default function Typography() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMouse({ x: e.clientX / w, y: e.clientY / h, active: true });
    };
    const onLeave = () => setMouse((m) => ({ ...m, active: false }));
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const dx = (mouse.x - 0.5) * 30;
  const dy = (mouse.y - 0.5) * 30;
  const intensity = mouse.active ? 1 : 0.2;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06060f]">
      {/* radial wash following cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: intensity * 0.7,
          background: `radial-gradient(600px circle at ${mouse.x * 100}% ${
            mouse.y * 100
          }%, rgba(180,80,200,0.25), transparent 60%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="relative">
          {/* cyan layer */}
          <div
            className="absolute inset-0 font-mono font-black tracking-tight"
            style={{
              fontSize: "clamp(48px, 12vw, 160px)",
              color: "#22d3ee",
              mixBlendMode: "screen",
              transform: `translate(${-dx * intensity}px, ${-dy * intensity}px)`,
              transition: "transform 0.08s linear",
            }}
          >
            wooo.uk
          </div>
          {/* magenta layer */}
          <div
            className="absolute inset-0 font-mono font-black tracking-tight"
            style={{
              fontSize: "clamp(48px, 12vw, 160px)",
              color: "#ec4899",
              mixBlendMode: "screen",
              transform: `translate(${dx * intensity}px, ${dy * intensity}px)`,
              transition: "transform 0.08s linear",
            }}
          >
            wooo.uk
          </div>
          {/* base layer */}
          <div
            className="relative font-mono font-black tracking-tight text-white"
            style={{ fontSize: "clamp(48px, 12vw, 160px)" }}
          >
            wooo.uk
          </div>
        </div>

        <div className="font-mono text-[11px] uppercase tracking-[0.5em] text-white/40">
          Woo Kyung Min — creative developer
        </div>
      </div>

      {/* corner sigils */}
      <div className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        type.001
      </div>
      <div className="pointer-events-none absolute bottom-6 right-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        move cursor
      </div>
    </div>
  );
}
