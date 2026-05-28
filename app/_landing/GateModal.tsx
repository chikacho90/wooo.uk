"use client";

import type { GateState } from "./useGate";

export default function GateModal({ gate }: { gate: GateState }) {
  if (!gate.open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}
      onClick={gate.close}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <input
          ref={gate.inputRef}
          type="text"
          value={gate.value}
          onChange={(e) => gate.setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") gate.submit();
            if (e.key === "Escape") gate.close();
          }}
          placeholder=""
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className={`bg-transparent border-b border-white/15 px-2 py-2 text-base text-white/70 font-mono focus:outline-none focus:border-white/30 w-56 transition-transform ${
            gate.shake ? "animate-shake" : ""
          }`}
          style={{ caretColor: "rgba(255,255,255,0.4)" }}
        />
      </div>
    </div>
  );
}
