"use client";

import { useEffect, useRef } from "react";

interface YTPlayer {
  loadVideoById: (opts: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }) => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    container: HTMLElement,
    opts: {
      videoId?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onError?: (e: { data: number }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeAPI(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

interface ClipPlayerProps {
  videoId: string | null;
  start?: number;
  end?: number;
  onReady?: () => void;
  onError?: (code: number) => void;
  onEnded?: () => void;
}

export default function ClipPlayer({
  videoId,
  start,
  end,
  onReady,
  onError,
  onEnded,
}: ClipPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onEndedRef = useRef(onEnded);

  // Keep callbacks fresh without re-creating the player on every render.
  onReadyRef.current = onReady;
  onErrorRef.current = onError;
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    let cancelled = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: start,
          endSeconds: end,
        });
        return;
      }

      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      containerRef.current!.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          ...(start != null ? { start } : {}),
          ...(end != null ? { end } : {}),
        },
        events: {
          onReady: () => onReadyRef.current?.(),
          onError: (e) => onErrorRef.current?.(e.data),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.();
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [videoId, start, end]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
