"use client";

import { useGate } from "./_landing/useGate";
import GateModal from "./_landing/GateModal";

const BG_LOCKED = "#06060f";
const BG_UNLOCKED = "#0f0618";

export default function Home() {
  const gate = useGate();

  return (
    <main
      className="fixed inset-0 overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: gate.authed ? BG_UNLOCKED : BG_LOCKED }}
    >
      <GateModal gate={gate} />
    </main>
  );
}
