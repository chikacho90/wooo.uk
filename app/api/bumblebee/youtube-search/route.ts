import { NextRequest, NextResponse } from "next/server";
import type { YouTubeResult } from "@/lib/bumblebee/types";

interface YouTubeApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
}

interface YouTubeApiResponse {
  items?: YouTubeApiItem[];
  error?: { message: string };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "API key not configured",
        hint: "Set YOUTUBE_API_KEY in .env.local or Vercel env vars",
      },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { query } = body as { query?: string };
  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    safeSearch: "moderate",
    maxResults: "5",
    q: query.trim(),
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    );
    const data: YouTubeApiResponse = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("YouTube API error:", res.status, data?.error?.message);
      return NextResponse.json(
        { error: data?.error?.message ?? `YouTube API error ${res.status}` },
        { status: 502 },
      );
    }

    const results: YouTubeResult[] = (data.items ?? []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
    }));

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("YouTube search catch:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
