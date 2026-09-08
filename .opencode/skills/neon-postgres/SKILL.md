---
name: neon-postgres
description: Neon Postgres + Managed Better Auth patterns for this repo. Schema changes, branching, RLS, Drizzle queries, cron routes, Vercel deploy.
---

# Neon Postgres (this repo)

## Connection
- App: pooled `DATABASE_URL` via `@neondatabase/serverless` + Drizzle.
- Migrations: `DATABASE_URL_UNPOOLED`.
- Never commit real URLs. `.env.local` locally, Vercel env vars in prod.
- MCP: `https://mcp.neon.tech/mcp` (remote, OAuth). Use `?projectId=xxx&readonly=true` for daily reads; full access only for migrations. Local stdio package is deprecated — don't use it.

## Schema rules
- `CREATE EXTENSION IF NOT EXISTS pgcrypto;` for `gen_random_uuid()`.
- Identity lives in `neon_auth` schema (Managed Better Auth, text IDs). App `owner_id`/`user_id` columns are `text` referencing `neon_auth.user(id)` — never `auth.users`.
- RLS on all user tables. MVP pattern: owner-only via session user; `pulse_content/campaigns/runs` scoped through parent `pulse_businesses.owner_id`. `leaderboard` public-read/authenticated-insert. `world_events` server-insert only.
- Keep `local_id text unique` sync contract on pulse tables — local string IDs never go into uuid PKs.
- Keep `pulse_touch_updated_at()` trigger + the 7 `idx_*` indexes.

## Auth
- SDK `@neondatabase/auth`: `src/lib/auth/server.ts` (`createNeonAuth`), `src/app/api/auth/[...path]/route.ts` (`auth.handler()`), `proxy.ts` (Next 16 guard, not `middleware.ts`), `src/lib/auth/client.ts` (`createAuthClient()`).
- Server components using `auth.getSession()` must be `export const dynamic = 'force-dynamic'`.
- Start: email/password. Google OAuth next — swap Neon's shared test creds for own client ID before launch.

## Diagnostics
- `inspect_database` (MCP `querying` category) or `neon inspect db`: sizes, unused indexes, seq scans, stalled queries, bloat. Runs in read-only txn, works with `?readonly=true`.
- Branch per feature: temp branch → migrate → verify → promote. Preview branches get isolated auth automatically.

## Crons
- Vercel Cron in `vercel.json` → `src/app/api/cron/*/route.ts`. No `pg_cron` / Supabase Edge Functions.
