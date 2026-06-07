"use client";

import { useEffect, useState } from "react";
import { useGate } from "../_landing/useGate";
import GateModal from "../_landing/GateModal";
import VariantSwitcher from "../_landing/VariantSwitcher";
import Shader from "../_landing/Shader";
import Typography from "../_landing/Typography";
import Particles from "../_landing/Particles";
import WorkCards from "../_landing/WorkCards";
import Terminal from "../_landing/Terminal";
import Combo from "../_landing/Combo";
import { VARIANT_STORAGE_KEY, type Variant } from "../_landing/variants";

const DEFAULT_VARIANT: Variant = "combo";
const TERMINAL_VARIANTS = new Set<Variant>(["terminal", "combo"]);

export default function TestPage() {
  const gate = useGate();
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(VARIANT_STORAGE_KEY) as Variant | null;
    if (saved) setVariant(saved);
    setMounted(true);
  }, []);

  const changeVariant = (v: Variant) => {
    setVariant(v);
    localStorage.setItem(VARIANT_STORAGE_KEY, v);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#06060f]">
      {mounted && (
        <>
          {variant === "combo" && <Combo gate={gate} />}
          {variant === "shader" && <Shader />}
          {variant === "typography" && <Typography />}
          {variant === "particles" && <Particles />}
          {variant === "cards" && <WorkCards />}
          {variant === "terminal" && <Terminal gate={gate} />}
        </>
      )}

      {!TERMINAL_VARIANTS.has(variant) && <GateModal gate={gate} />}

      <VariantSwitcher value={variant} onChange={changeVariant} />
    </main>
  );
}
