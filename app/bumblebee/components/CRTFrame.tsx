"use client";

import type { ReactNode } from "react";

interface CRTFrameProps {
  children: ReactNode;
  scanning?: boolean;
}

// TUNE ME: bezel color, corner radius, vignette strength — all knobs for visual feel.
export default function CRTFrame({ children, scanning = false }: CRTFrameProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[28px] bg-black ring-1 ring-white/5 shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_0_0_8px_#0a0a0a]">
      <div className="absolute inset-2 overflow-hidden rounded-[20px] bg-black">
        <div className="absolute inset-0">{children}</div>

        {/* Scanlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Curvature vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Static noise during scanning */}
        {scanning && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-90"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.85'/></svg>\")",
              backgroundSize: "240px 240px",
              animation: "crt-jitter 0.12s steps(3) infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}
