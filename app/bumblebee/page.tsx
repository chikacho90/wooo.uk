"use client";

import { useCallback, useRef, useState } from "react";
import ClipPlayer from "./components/ClipPlayer";
import CRTFrame from "./components/CRTFrame";
import PromptInput from "./components/PromptInput";
import TuningDial from "./components/TuningDial";
import type { BumblebeeReply, YouTubeResult } from "@/lib/bumblebee/types";

type State = "idle" | "scanning" | "playing" | "error";

export default function BumblebeePage() {
  const [state, setState] = useState<State>("idle");
  const [reply, setReply] = useState<BumblebeeReply | null>(null);
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [resultIndex, setResultIndex] = useState(0);
  const [channel, setChannel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const excludeRef = useRef<string[]>([]);
  const lastTextRef = useRef<string>("");

  const tune = useCallback(async (text: string, exclude: string[]) => {
    setState("scanning");
    setError(null);

    try {
      const respondRes = await fetch("/api/bumblebee/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          exclude: exclude.length ? exclude : undefined,
        }),
      });
      if (!respondRes.ok) {
        const data = await respondRes.json().catch(() => ({}));
        throw new Error(data?.error ?? `respond failed (${respondRes.status})`);
      }
      const { reply: nextReply } = (await respondRes.json()) as {
        reply: BumblebeeReply;
      };

      const ytRes = await fetch("/api/bumblebee/youtube-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextReply.searchQuery }),
      });
      if (!ytRes.ok) {
        const data = await ytRes.json().catch(() => ({}));
        throw new Error(data?.error ?? `youtube failed (${ytRes.status})`);
      }
      const { results: ytResults } = (await ytRes.json()) as {
        results: YouTubeResult[];
      };
      if (ytResults.length === 0) {
        throw new Error("no clips found — try a different prompt");
      }

      excludeRef.current = [...exclude, nextReply.source];
      setReply(nextReply);
      setResults(ytResults);
      setResultIndex(0);
      setChannel((c) => c + 1);
      setState("playing");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
      setState("error");
    }
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      lastTextRef.current = text;
      excludeRef.current = [];
      tune(text, []);
    },
    [tune],
  );

  const handleDial = useCallback(() => {
    if (state !== "playing" && state !== "error") return;
    // Same reply: cycle to next YouTube candidate
    if (resultIndex + 1 < results.length) {
      setResultIndex((i) => i + 1);
      setChannel((c) => c + 1);
      return;
    }
    // Exhausted: ask Claude for a different clip on the same prompt
    if (lastTextRef.current) {
      tune(lastTextRef.current, excludeRef.current);
    }
  }, [state, resultIndex, results.length, tune]);

  const currentVideoId = results[resultIndex]?.videoId ?? null;
  const isScanning = state === "scanning";

  return (
    <main className="min-h-screen bg-[#080605] font-mono text-white/85">
      <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-[#080605]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between px-4 py-4">
          <h1 className="text-base tracking-[0.25em] text-amber-200/80">
            BUMBLEBEE
          </h1>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
            cannot speak in his own words
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative">
          <CRTFrame scanning={isScanning}>
            {currentVideoId && state === "playing" ? (
              <ClipPlayer
                videoId={currentVideoId}
                onError={() => {
                  setError("clip cannot play — try the next channel");
                  setState("error");
                }}
              />
            ) : state === "idle" ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-200/40">
                  off air
                </span>
              </div>
            ) : null}
          </CRTFrame>

          {/* Chyron — quote + source overlay */}
          {(state === "playing" || state === "error") && reply && (
            <div className="pointer-events-none absolute inset-x-6 bottom-6 z-20">
              <div className="rounded-md border border-amber-200/15 bg-black/70 px-4 py-3 backdrop-blur">
                <div className="text-sm leading-snug text-amber-50/95">
                  &ldquo;{reply.quote}&rdquo;
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/55">
                  <span className="truncate">{reply.source}</span>
                  {reply.mood && (
                    <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-amber-200/70">
                      {reply.mood}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-end gap-8">
            <TuningDial
              scanning={isScanning}
              onClick={handleDial}
              disabled={state === "idle" || isScanning}
              label="tune"
            />
            <div className="pb-3 text-center">
              <div className="font-mono text-3xl tracking-[0.25em] text-amber-200/80">
                CH {String(channel).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/30">
                {state === "scanning" && "scanning…"}
                {state === "playing" && "on air"}
                {state === "idle" && "standby"}
                {state === "error" && "static"}
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl">
            <PromptInput onSubmit={handleSubmit} disabled={isScanning} />
          </div>

          {state === "error" && error && (
            <div className="text-xs text-red-300/80">{error}</div>
          )}

          {(state === "playing" || state === "error") && reply?.rationale && (
            <div className="max-w-md text-center text-xs italic text-white/45">
              {reply.rationale}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
