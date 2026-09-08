// Neon (Postgres) client — server-side only. Never import from client components.
// Deploy: Vercel env var DATABASE_URL (pooled) via @neondatabase/serverless.
// Migrations / neon-schema.sql: run with DATABASE_URL_UNPOOLED.
// Local dev: copy .env.local.example → .env.local and fill DATABASE_URL.

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) client = neon(url);
  return client;
}

export const isNeonConfigured = (): boolean => Boolean(process.env.DATABASE_URL);
