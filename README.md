# woo.moi

Creative developer portfolio — Next.js + React + Tailwind CSS + Three.js

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `/` — public landing page (shader art)
- `/bumblebee` — public corner that answers via movie lines, song lyrics, famous phrases (Claude + YouTube)
- `/woorld` — travel planner with AI suggestions (hidden, requires unlock)

Hidden sections are revealed by unlocking the secret gate on the main page.

## Bumblebee setup

`/bumblebee` needs two server-side API keys. Add them to `.env.local` for local dev and to Vercel → Project → Settings → Environment Variables for production:

| Variable | What |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku 4.5 — get a key at <https://console.anthropic.com> → API Keys |
| `YOUTUBE_API_KEY` | YouTube Data API v3 — Google Cloud Console → enable "YouTube Data API v3" → Credentials → Create API key |

Without these, the page still renders but both API routes return 500 with a `hint` field.
