import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';
import { clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `tmp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

// GET /api/pulse/media — list media refs ([] when no DB).
export async function GET(req: Request) {
  try {
    if (!rateLimit(`media:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) return NextResponse.json([], { headers: noStore });
    try {
      // Local-first: media lives in the browser in R1; media_assets is the future server home.
      const rows = (await db`select id, business_id, name, kind, url, created_at from media_assets order by created_at desc limit 50`) as unknown[];
      return NextResponse.json(rows, { headers: noStore });
    } catch {
      return NextResponse.json([], { headers: noStore });
    }
  } catch {
    return NextResponse.json([], { headers: noStore });
  }
}

// POST /api/pulse/media { url?, label?, mediaIds? } — mediaIds capped at 4.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`media:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const b = body as Record<string, unknown>;
    const mediaIds = Array.isArray(b.mediaIds) ? (b.mediaIds as unknown[]).filter((m): m is string => typeof m === 'string') : [];
    if (mediaIds.length > 4) {
      return NextResponse.json({ error: 'Attach up to 4 media items per post.' }, { status: 400, headers: noStore });
    }
    const url = str(b.url, 2000) ?? undefined;
    const label = str(b.label, 120) ?? undefined;
    if (!url && mediaIds.length === 0) {
      return NextResponse.json({ error: 'A media url or at least one media id is required.' }, { status: 400, headers: noStore });
    }
    const item = { uid: uid(), url, label, mediaIds: mediaIds.slice(0, 4), createdAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        // media_assets(business_id, name, kind, url) — see neon-schema.sql. Stateless echo keeps UI working offline-first.
        await db`insert into media_assets (name, kind, url) values (${label ?? 'upload'}, 'image', ${url ?? null})`;
      } catch {
        /* stateless echo keeps the UI working offline-first */
      }
    }
    return NextResponse.json(item, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Media save failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
