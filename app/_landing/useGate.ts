"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GateState = {
  authed: boolean;
  open: boolean;
  value: string;
  shake: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setValue: (v: string) => void;
  setOpen: (v: boolean) => void;
  submit: () => Promise<void>;
  close: () => void;
};

export function useGate(): GateState {
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/session", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d?.authed)))
      .catch(() => {});
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setValue("");
    setShake(false);
  }, []);

  const submit = useCallback(async () => {
    if (!value.trim()) return;

    if (authed) {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
        credentials: "same-origin",
      });
      if (r.ok) {
        await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
        setAuthed(false);
        close();
      } else {
        setShake(true);
        setValue("");
        setTimeout(() => setShake(false), 500);
      }
      return;
    }

    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: value }),
      credentials: "same-origin",
    });
    if (r.ok) {
      setAuthed(true);
      close();
    } else {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    }
  }, [value, authed, close]);

  // Enter opens, triple-tap on mobile opens
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (open) return;
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  useEffect(() => {
    let taps: number[] = [];
    function onTouch() {
      if (open) return;
      const now = Date.now();
      taps = [...taps.filter((t) => now - t < 600), now];
      if (taps.length >= 3) {
        taps = [];
        setOpen(true);
      }
    }
    document.addEventListener("touchend", onTouch, { passive: true });
    return () => document.removeEventListener("touchend", onTouch);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  return { authed, open, value, shake, inputRef, setValue, setOpen, submit, close };
}
