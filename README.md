# PulsePilot — AI Marketing Crew (Copilot + Autopilot)

> Six AI agents plan, write, design, schedule and analyse your socials across Instagram, TikTok, Facebook and LinkedIn. By **Pulse Social Media**.

**Run it:** `npm run dev` → http://localhost:3000

## What this is
A micro-SaaS content autopilot for SMBs. Copilot-first (agents draft, you approve in minutes), with full Autopilot for owners who want marketing done for them. Switch modes anytime, per business.

- 🧭 **Nova (Strategist)** — weekly plan across your pillars
- 📡 **Scout (Trends)** — fresh angles before they expire, one-click to draft
- ✍️ **Pen (Copywriter)** — 5 hooks, 3 captions, hashtags, video scripts in your voice
- 🎨 **Frame (Visual Director)** — format, overlay text, shot lists, image prompts
- 🗓️ **Clock (Scheduler)** — best-time queue, calendar, one-tap publish
- 📊 **Lens (Analyst)** — 0–100 scores, plain-English steers for next week

## Key flows
1. Onboard a business (60s, or load the Harbour Café sample week) → crew files the weekly plan instantly
2. Create tab → two-tap sign-off in Copilot (approve, then queue) or auto-queue in Autopilot; banned words always hold for review. Optional exact date per post. Search the desk.
3. Calendar → week or month view, best-time slots, two-tap publish, pull anything back, export the queue as .ics
4. Results → totals, leaderboard, pillar ranks, copy-out week report
5. Agents → per-business activity wire + direct line to any agent (`/api/pulse/chat`, rate-limited)
6. Trends → per-brand angle inbox; filing one opens it in Create
7. Setup → brand, voice, banned words, emoji, pace, mode; Neon cloud backup/restore; JSON download; CSV export from Create; due-date reminders

## Engine
- Offline-first deterministic generator (`src/lib/pulse/generator.ts`); `/api/pulse/generate` tries Claude when `ANTHROPIC_API_KEY` is set and falls back locally. Contract: `{ engine, drafts[] }`.
- State in Zustand + localStorage schema v2 with validation and migration (`src/lib/pulse/store.ts`); Autopilot ticks every 45s + on demand, publishes only due posts.
- Best-time slots centralised in `src/lib/pulse/slots.ts`; sign-off sheets and reports in `src/lib/pulse/export.ts`.

## Neon (Postgres) + Vercel
Run `neon-schema.sql` once in the Neon SQL Editor (or `psql $DATABASE_URL_UNPOOLED -f neon-schema.sql`).
Copy `.env.local.example` → `.env.local` and set `DATABASE_URL`. Then:

- **Local backup:** Setup tab → Cloud backup → Back up now (needs `DATABASE_URL`).
- **Restore:** same panel on any device with the same workspace id.
- **Deploy:** push to GitHub → Import in Vercel → add `DATABASE_URL` (+ optional `ANTHROPIC_API_KEY`, `CRON_SECRET`) in Project Settings → Deploy. `vercel.json` wires the game crons (hourly tick, daily event).
- **Auth (Neon Managed Auth):** enable Auth on your Neon branch, set `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` (see `.env.local.example`). Sign-in/up at `/auth/sign-in` and `/auth/sign-up`; API at `/api/auth/*`. Until env is set, auth routes return 503 and `proxy.ts` passes through.

## Pricing (AUD, GST incl.)
Pulse $19/mo ($190/yr) · Pilot $29/mo ($290/yr, hero) · Studio $49/mo ($490/yr) — 14-day free trial, no card. Terms at `/terms`, privacy at `/privacy`.

## Legacy
The earlier STEALTH MODE game prototype lives on in `src/components/GameDashboard*`, `src/lib/gameStore.ts` and `GDD.md` — untouched, unlinked from the homepage.
