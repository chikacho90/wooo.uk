export type Variant =
  // fresh batch
  | "mercury"
  | "ascii"
  | "spotlight"
  | "tunnel"
  | "sand"
  // v1
  | "combo"
  | "shader"
  | "typography"
  | "particles"
  | "cards"
  | "terminal";

export const VARIANT_STORAGE_KEY = "wooo-landing-variant";
export const SWITCHER_COLLAPSED_KEY = "wooo-switcher-collapsed";
