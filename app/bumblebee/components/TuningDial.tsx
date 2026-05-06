"use client";

import { useState } from "react";

interface TuningDialProps {
  scanning?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

// TUNE ME: dial size, palette (currently brushed-metal grey), rotation step on click.
export default function TuningDial({
  scanning = false,
  onClick,
  disabled = false,
  label,
}: TuningDialProps) {
  const [angle, setAngle] = useState(0);

  function handleClick() {
    if (disabled || scanning) return;
    setAngle((a) => a + 60);
    onClick?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label ?? "tune"}
      className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <div
        className={`relative h-20 w-20 rounded-full border-4 border-black/40 bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-700 shadow-[inset_0_0_14px_rgba(0,0,0,0.55),0_4px_14px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out group-hover:scale-[1.04] ${
          scanning ? "animate-spin [animation-duration:1.6s] [animation-timing-function:linear]" : ""
        }`}
        style={scanning ? undefined : { transform: `rotate(${angle}deg)` }}
      >
        <div className="absolute left-1/2 top-1.5 h-2.5 w-1 -translate-x-1/2 rounded-full bg-zinc-900 shadow-[0_0_4px_rgba(0,0,0,0.6)]" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/70" />
      </div>
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35 group-hover:text-white/65">
          {label}
        </span>
      )}
    </button>
  );
}
