-- PulsePilot — Neon (Postgres) schema, v1
-- Run once in the Neon SQL Editor (or psql $DATABASE_URL_UNPOOLED -f neon-schema.sql).
-- Deploy target: Vercel (Next.js) + Neon (Postgres).
--
-- Conventions (repo standard):
--  * Identity lives in neon_auth (Managed Better Auth, text IDs) once auth
--    ships. App owner_id columns are text — never auth.users.
--  * RLS on all user tables, owner-only. Pre-auth, the project-owner
--    connection used by /api/pulse/sync bypasses RLS; the policies below
--    take over the moment app users arrive via session (app.user_id).
--  * local_id text unique on pulse tables — browser string IDs map here,
--    never into uuid PKs.
--
-- Two sync modes:
--  1. Snapshot sync (live today): the whole workspace serialises into
--     pulse_snapshots.payload. /api/pulse/sync reads/writes it.
--  2. Domain tables (graduation path): businesses/campaigns/content/runs.

create extension if not exists pgcrypto;
--
-- Identity: owner_id / user_id are TEXT, referencing neon_auth."user"(id)
-- once Managed Better Auth is enabled. Nullable until auth ships.

-- ---------- snapshot sync (used by the app today) ----------
create table if not exists pulse_snapshots (
  workspace_id text primary key,
  label text not null default '',
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function pulse_snapshots_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pulse_snapshots_touch on pulse_snapshots;
create trigger trg_pulse_snapshots_touch
  before update on pulse_snapshots
  for each row execute function pulse_snapshots_touch();

-- ---------- domain tables (graduation path) ----------
create table if not exists pulse_businesses (
  id uuid primary key default gen_random_uuid(),
  local_id text unique,
  owner_id text,
  business_name text not null,
  industry text not null default '',
  location text not null default '',
  ideal_customer text not null default '',
  offer text not null default '',
  voice jsonb not null default '{"tones":["direct, warm, no fluff"],"emojiLevel":1,"bannedWords":[]}',
  channels text[] not null default '{instagram}',
  mode text not null default 'copilot' check (mode in ('copilot','autopilot')),
  posts_per_week int not null default 5 check (posts_per_week between 1 and 14),
  pillars text[] not null default '{Offers,Education,Proof}',
  goals jsonb not null default '{"primary":"leads","targetMonthly":30}',
  created_at timestamptz not null default now()
);

create table if not exists pulse_campaigns (
  id uuid primary key default gen_random_uuid(),
  local_id text unique,
  business_id uuid references pulse_businesses(id) on delete cascade,
  name text not null,
  objective text not null default 'leads',
  status text not null default 'active' check (status in ('active','paused','completed')),
  weekly_plan jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists pulse_content (
  id uuid primary key default gen_random_uuid(),
  local_id text unique,
  business_id uuid references pulse_businesses(id) on delete cascade,
  campaign_id uuid references pulse_campaigns(id) on delete set null,
  state text not null default 'draft'
    check (state in ('idea','draft','pending_approval','scheduled','published','analysed','rejected')),
  pillar text not null default '',
  format text not null default 'reel'
    check (format in ('reel','carousel','static','story','text','poll','live','newsletter')),
  channel text not null default 'instagram'
    check (channel in ('instagram','tiktok','facebook','linkedin')),
  hook text not null default '',
  hooks text[] not null default '{}',
  captions text[] not null default '{}',
  selected_caption int not null default 0,
  hashtags text[] not null default '{}',
  script text,
  slides jsonb,
  frames jsonb,
  poll jsonb,
  live_plan jsonb,
  newsletter jsonb,
  collab_with text,
  is_trial_reel boolean not null default false,
  post_link text,
  visual_prompt text,
  alt_text text,
  scheduled_for timestamptz,
  published_at timestamptz,
  published_url text,
  metrics jsonb,
  score int check (score is null or (score between 0 and 100)),
  insight text,
  confidence numeric not null default 0.8,
  agent_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pulse_runs (
  id uuid primary key default gen_random_uuid(),
  local_id text unique,
  business_id uuid references pulse_businesses(id) on delete cascade,
  agent text not null check (agent in ('strategist','trend_scout','copywriter','visual_director','scheduler','analyst')),
  summary text not null,
  detail text not null default '',
  content_ids uuid[] not null default '{}',
  status text not null default 'success' check (status in ('success','needs_review','failed')),
  mode text not null default 'copilot' check (mode in ('copilot','autopilot')),
  created_at timestamptz not null default now()
);

create table if not exists pulse_trends (
  id uuid primary key default gen_random_uuid(),
  local_id text unique,
  owner_id text,
  title text not null,
  platform text not null default '',
  relevance numeric not null default 0.8,
  expires_in text not null default '',
  suggested_hook text not null default '',
  status text not null default 'new' check (status in ('new','used','expired')),
  created_at timestamptz not null default now()
);

create or replace function pulse_content_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pulse_content_touch on pulse_content;
create trigger trg_pulse_content_touch
  before update on pulse_content
  for each row execute function pulse_content_touch();

create index if not exists idx_pbiz_owner on pulse_businesses (owner_id);
create index if not exists idx_pcamp_biz on pulse_campaigns (business_id);
create index if not exists idx_pcont_biz_state on pulse_content (business_id, state);
create index if not exists idx_pcont_campaign on pulse_content (campaign_id);
create index if not exists idx_pcont_biz_sched on pulse_content (business_id, scheduled_for);
create index if not exists idx_pruns_biz on pulse_runs (business_id, created_at desc);
create index if not exists idx_ptrends_owner_status on pulse_trends (owner_id, status);
create index if not exists idx_pcont_local on pulse_content (local_id);
create index if not exists idx_pbiz_local on pulse_businesses (local_id);

-- RLS: owner-only via session user (repo standard). Pre-auth, the
-- project-owner connection used by /api/pulse/sync bypasses RLS; these
-- policies take over once app users arrive (set app.user_id per session).
alter table pulse_snapshots enable row level security;
alter table pulse_businesses enable row level security;
alter table pulse_campaigns enable row level security;
alter table pulse_content enable row level security;
alter table pulse_runs enable row level security;
alter table pulse_trends enable row level security;

drop policy if exists "owner rows" on pulse_snapshots;
drop policy if exists "owner rows" on pulse_businesses;
drop policy if exists "owner rows" on pulse_campaigns;
drop policy if exists "owner rows" on pulse_content;
drop policy if exists "owner rows" on pulse_runs;
drop policy if exists "owner rows" on pulse_trends;

-- Snapshots are keyed by opaque workspace_id bearer (see sync route).
create policy "owner rows" on pulse_snapshots for all using (true) with check (true);
create policy "owner rows" on pulse_businesses for all
  using (owner_id is null or owner_id = current_setting('app.user_id', true))
  with check (owner_id is null or owner_id = current_setting('app.user_id', true));
create policy "owner rows" on pulse_campaigns for all
  using (exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))))
  with check (exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))));
create policy "owner rows" on pulse_content for all
  using (exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))))
  with check (exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))));
create policy "owner rows" on pulse_runs for all
  using (business_id is null or exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))))
  with check (business_id is null or exists (select 1 from pulse_businesses b where b.id = business_id and (b.owner_id is null or b.owner_id = current_setting('app.user_id', true))));
create policy "owner rows" on pulse_trends for all
  using (owner_id is null or owner_id = current_setting('app.user_id', true))
  with check (owner_id is null or owner_id = current_setting('app.user_id', true)));

-- ---------- game tables (STEALTH MODE legacy, ported from supabase-schema.sql) ----------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id text,
  name text not null,
  is_player boolean default false,
  cash bigint not null default 280000,
  valuation bigint not null default 3200000,
  focus text,
  aggression int check (aggression between 0 and 100),
  created_at timestamptz default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  role text not null,
  tier int check (tier in (1,2)),
  skills jsonb not null,
  traits text[],
  morale int check (morale between 0 and 100),
  loyalty int check (loyalty between 0 and 100),
  salary int not null,
  current_task uuid,
  is_principal boolean default false
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  category text not null,
  stage text check (stage in ('idea','building','beta','launched','scaling')),
  progress int check (progress between 0 and 100),
  quality int check (quality between 0 and 100),
  bugs int default 0,
  tech_debt int default 0,
  assigned_agents uuid[],
  users int default 0,
  mrr int default 0,
  rating numeric(2,1)
);

create table if not exists game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  game_date date not null,
  cash bigint,
  burn_rate int,
  runway numeric,
  valuation bigint,
  tick_count int,
  state jsonb,
  created_at timestamptz default now()
);

create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  founder_name text not null,
  valuation bigint not null,
  days_to_unicorn int,
  created_at timestamptz default now()
);

create table if not exists world_events (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  effect jsonb,
  type text,
  created_at timestamptz default now()
);
