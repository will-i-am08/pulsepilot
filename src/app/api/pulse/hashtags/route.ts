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

// GET /api/pulse/hashtags — list hashtag sets ([] when no DB).
export async function GET(req: Request) {
  try {
    if (!rateLimit(`hashtags:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) return NextResponse.json([], { headers: noStore });
    try {
      const rows = (await db`select id, tags, created_at from pulse_hashtags order by created_at desc limit 50`) as unknown[];
      return NextResponse.json(rows, { headers: noStore });
    } catch {
      return NextResponse.json([], { headers: noStore });
    }
  } catch {
    return NextResponse.json([], { headers: noStore });
  }
}

// POST /api/pulse/hashtags { tags, label?, firstComment? } — tags capped at 30.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`hashtags:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const b = body as Record<string, unknown>;
    if (!Array.isArray(b.tags)) return NextResponse.json({ error: 'A tags array is required.' }, { status: 400, headers: noStore });
    const tags = (b.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim().slice(0, 100));
    if (tags.length === 0) return NextResponse.json({ error: 'Add at least one hashtag.' }, { status: 400, headers: noStore });
    if (tags.length > 30) return NextResponse.json({ error: 'Keep it to 30 hashtags or fewer.' }, { status: 400, headers: noStore });
    if (typeof b.firstComment === 'string' && b.firstComment.length > 1500) {
      return NextResponse.json({ error: 'First comment must be 1500 characters or fewer.' }, { status: 400, headers: noStore });
    }
    const label = str(b.label, 80) ?? undefined;
    const firstComment = typeof b.firstComment === 'string' && b.firstComment.trim() ? b.firstComment.slice(0, 1500) : undefined;
    const item = { uid: uid(), tags, ...(label ? { label } : {}), ...(firstComment ? { firstComment } : {}), createdAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        await db`insert into pulse_hashtags (tags) values (${JSON.stringify(tags)}::jsonb)`;
      } catch {
        /* stateless echo keeps the UI working offline-first */
      }
    }
    return NextResponse.json(item, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Hashtag save failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
