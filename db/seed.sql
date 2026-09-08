-- Minimal seed for Neon dev branch. Run after neon-schema.sql:
-- psql $DATABASE_URL_UNPOOLED -f db/seed.sql

insert into world_events (headline, effect, type) values
  ('Viral TikTok drives 300% signup spike for Social apps', '{"growth": "+40%"}', 'trend')
on conflict do nothing;
