"use client";

import { useEffect, useRef } from "react";

type Grain = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  settled: boolean;
};

const SPAWN_RATE = 14; // per frame
const MAX_GRAINS = 4500;
const GRAVITY = 0.18;
const FRICTION = 0.99;

export default function Sand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;

    // mask canvas with letter shapes
    const mask = document.createElement("canvas");
    const maskCtx = mask.getContext("2d", { willReadFrequently: true })!;
    let maskData: Uint8ClampedArray = new Uint8ClampedArray(0);

    let occupancy: Uint8Array = new Uint8Array(0);
    const grains: Grain[] = [];

    const setSize = () => {
      dpr = Math.min(window.devicePixelRatio, 1.5);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      mask.width = W;
      mask.height = H;
      maskCtx.fillStyle = "#000";
      maskCtx.fillRect(0, 0, W, H);
      maskCtx.fillStyle = "#fff";
      const fontSize = Math.min(W * 0.18, H * 0.32, 240);
      maskCtx.font = `bold ${fontSize}px "Menlo", "Consolas", monospace`;
      maskCtx.textAlign = "center";
      maskCtx.textBaseline = "middle";
      maskCtx.fillText("wooo.uk", W / 2, H / 2);

      const img = maskCtx.getImageData(0, 0, W, H);
      maskData = img.data;

      occupancy = new Uint8Array(W * H);
      grains.length = 0;
    };
    setSize();

    const pointer = { x: -9999, y: -9999, active: false, down: false };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    const onResize = () => setSize();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    const isInLetter = (x: number, y: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return false;
      const idx = (Math.floor(y) * W + Math.floor(x)) * 4;
      return maskData[idx] > 128;
    };
    const isOccupied = (x: number, y: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return true;
      return occupancy[Math.floor(y) * W + Math.floor(x)] === 1;
    };
    const occupy = (x: number, y: number, v: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      occupancy[Math.floor(y) * W + Math.floor(x)] = v;
    };

    let raf = 0;

    const tick = () => {
      // spawn from top
      for (let s = 0; s < SPAWN_RATE && grains.length < MAX_GRAINS; s++) {
        grains.push({
          x: Math.random() * W,
          y: -4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 0.4,
          hue: 35 + Math.random() * 25,
          settled: false,
        });
      }

      // fade background
      ctx.fillStyle = "rgba(6,6,15,0.18)";
      ctx.fillRect(0, 0, W, H);

      // mouse disturb settled grains
      if (pointer.active) {
        for (const g of grains) {
          if (!g.settled) continue;
          const dx = g.x - pointer.x;
          const dy = g.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 60 * 60) {
            occupy(g.x, g.y, 0);
            const d = Math.sqrt(d2) + 0.01;
            const f = (1 - d / 60) * 4;
            g.vx = (dx / d) * f;
            g.vy = (dy / d) * f - 0.5;
            g.settled = false;
          }
        }
      }

      for (const g of grains) {
        if (g.settled) continue;
        g.vy += GRAVITY;
        g.vx *= FRICTION;

        const newX = g.x + g.vx;
        let newY = g.y + g.vy;

        // step y in 1px increments, stop when hitting occupied pixel
        let stepY = g.y;
        while (stepY < newY) {
          const tryY = Math.min(stepY + 1, newY);
          if (isOccupied(newX, tryY)) break;
          stepY = tryY;
        }

        // settle check — if next pixel is filled OR floor
        const belowY = stepY + 1;
        const inLetter = isInLetter(newX, stepY);

        if (inLetter && (isOccupied(newX, belowY) || belowY >= H)) {
          // try to slide diagonally inside the letter
          const tryDx = g.vx >= 0 ? 1 : -1;
          if (
            isInLetter(newX + tryDx, belowY) &&
            !isOccupied(newX + tryDx, belowY)
          ) {
            g.x = newX + tryDx;
            g.y = belowY;
            g.vx *= 0.5;
            g.vy = 0;
          } else if (
            isInLetter(newX - tryDx, belowY) &&
            !isOccupied(newX - tryDx, belowY)
          ) {
            g.x = newX - tryDx;
            g.y = belowY;
            g.vx *= 0.5;
            g.vy = 0;
          } else {
            g.x = newX;
            g.y = stepY;
            occupy(g.x, g.y, 1);
            g.settled = true;
          }
        } else {
          g.x = newX;
          g.y = stepY;
        }

        // recycle when off-screen
        if (g.y > H + 6) {
          g.x = Math.random() * W;
          g.y = -4;
          g.vx = (Math.random() - 0.5) * 0.5;
          g.vy = Math.random() * 0.4;
          g.settled = false;
        }
      }

      // draw grains
      for (const g of grains) {
        ctx.fillStyle = g.settled
          ? `hsl(${g.hue},78%,68%)`
          : `hsl(${g.hue},60%,55%)`;
        ctx.fillRect(g.x | 0, g.y | 0, 1.6, 1.6);
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[#06060f]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
          sand — sweep the piles
        </div>
      </div>
    </div>
  );
}
