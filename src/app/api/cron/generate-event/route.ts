import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';
import { callClaude } from '@/app/api/pulse/_lib';

// Vercel Cron: generate-event (weekly, Monday 09:00).
// Ported from supabase/functions/generate-event. Asks Claude for one satirical
// Silicon Valley headline and stores it in world_events.
// Protect with CRON_SECRET: Vercel sends Authorization: Bearer <CRON_SECRET>.

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron is not configured — set CRON_SECRET.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const text = await callClaude(
    'Reply with JSON only.',
    'Generate ONE Silicon Valley satirical news headline for next week. Return JSON {headline, effect, type: "trend"|"crisis"|"opportunity"|"market"}. Headline max 14 words.',
    200
  );
  if (!text) {
    return NextResponse.json({ error: 'Claude unavailable (ANTHROPIC_API_KEY?)' }, { status: 503 });
  }
  const parsed = (JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}') || {}) as {
    headline?: string;
    effect?: unknown;
    type?: string;
  };
  if (!parsed.headline) {
    return NextResponse.json({ error: 'Bad model output' }, { status: 502 });
  }
  const db = getDb();
  if (db) {
    await db`insert into world_events (headline, effect, type) values (${parsed.headline}, ${JSON.stringify(parsed.effect ?? null)}::jsonb, ${parsed.type ?? 'trend'})`;
  }
  return NextResponse.json(parsed);
}
