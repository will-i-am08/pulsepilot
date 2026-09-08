import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';

// Vercel Cron: competitor-tick (hourly).
// Ported from supabase/functions/competitor-tick. Bumps competitor valuations
// with the same aggression-weighted logic as the game store.
// Protect with CRON_SECRET: Vercel sends Authorization: Bearer <CRON_SECRET>.

export const dynamic = 'force-dynamic';

type Company = { id: string; valuation: number; aggression: number | null };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron is not configured — set CRON_SECRET.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 });
  }
  const companies = (await db`select id, valuation, aggression from companies where is_player = false`) as Company[];
  let updated = 0;
  for (const c of companies) {
    const trendMult = (c.aggression ?? 50) > 70 ? 1.015 : (c.aggression ?? 50) < 30 ? 0.99 : 1;
    const newVal = Math.floor(c.valuation * (trendMult + (Math.random() - 0.5) * 0.02));
    await db`update companies set valuation = ${newVal} where id = ${c.id}`;
    updated++;
  }
  return NextResponse.json({ ok: true, updated });
}
