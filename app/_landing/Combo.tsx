"use client";

import Shader from "./Shader";
import Terminal from "./Terminal";
import type { GateState } from "./useGate";

export default function Combo({ gate }: { gate: GateState }) {
  return (
    <div className="absolute inset-0">
      {/* shader background (no centered text — terminal owns the foreground) */}
      <ShaderBackground />

      {/* terminal panel — sits on top, slight glass */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-10">
        <div
          className="relative h-[min(80vh,640px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{
            background: "rgba(8,6,16,0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <Terminal gate={gate} transparent />
        </div>
      </div>
    </div>
  );
}

function ShaderBackground() {
  return (
    <div className="absolute inset-0">
      <Shader />
    </div>
  );
}
