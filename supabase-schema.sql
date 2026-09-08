-- STEALTH MODE - Supabase Schema (Headline Sim + Game Saves)
-- Run this in Supabase SQL Editor

-- Companies (player + competitors)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users,
  name text not null,
  is_player boolean default false,
  cash bigint not null default 280000,
  valuation bigint not null default 3200000,
  focus text,
  aggression int check (aggression between 0 and 100),
  created_at timestamp with time zone default now()
);

-- Agents
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

-- Products
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

-- Game ticks / saves
create table if not exists game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  game_date date not null,
  cash bigint,
  burn_rate int,
  runway numeric,
  valuation bigint,
  tick_count int,
  state jsonb, -- full snapshot for MVP (leaderboard separate)
  created_at timestamp with time zone default now()
);

-- Leaderboard (global valuations)
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  founder_name text not null,
  valuation bigint not null,
  days_to_unicorn int,
  created_at timestamp with time zone default now()
);

-- Events log
create table if not exists world_events (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  effect jsonb,
  type text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table companies enable row level security;
alter table agents enable row level security;
alter table products enable row level security;
alter table game_saves enable row level security;
alter table leaderboard enable row level security;

-- Policies (open for MVP, tighten later)
create policy "Allow all for anon" on companies for all using (true) with check (true);
create policy "Allow all for anon" on agents for all using (true) with check (true);
create policy "Allow all for anon" on products for all using (true) with check (true);
create policy "Allow all for anon" on game_saves for all using (true) with check (true);
create policy "Allow all for anon" on leaderboard for all using (true) with check (true);
create policy "Allow all for anon" on world_events for all using (true) with check (true);

-- pg_cron for weekly competitor tick (run Edge Function)
-- select cron.schedule('competitor-tick', '0 * * * *', $$ select net.http_post(...) $$);
