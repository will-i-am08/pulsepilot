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

// GET /api/pulse/templates — list saved caption templates ([] when no DB).
export async function GET(req: Request) {
  try {
    if (!rateLimit(`templates:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) return NextResponse.json([], { headers: noStore });
    try {
      const rows = (await db`select id, name, caption, hashtags, created_at from pulse_templates order by created_at desc limit 50`) as unknown[];
      return NextResponse.json(rows, { headers: noStore });
    } catch {
      return NextResponse.json([], { headers: noStore });
    }
  } catch {
    return NextResponse.json([], { headers: noStore });
  }
}

// POST /api/pulse/templates { name, caption?, hashtags?, firstComment? }
export async function POST(req: Request) {
  try {
    if (!rateLimit(`templates:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const b = body as Record<string, unknown>;
    const name = str(b.name, 80);
    if (!name) return NextResponse.json({ error: 'A template name is required (up to 80 characters).' }, { status: 400, headers: noStore });
    const caption = typeof b.caption === 'string' ? b.caption.slice(0, 2200) : '';
    const hashtags = Array.isArray(b.hashtags)
      ? (b.hashtags as unknown[]).filter((h): h is string => typeof h === 'string').slice(0, 30)
      : [];
    const firstComment = typeof b.firstComment === 'string' ? b.firstComment.slice(0, 1500) : undefined;
    if (typeof b.firstComment === 'string' && b.firstComment.length > 1500) {
      return NextResponse.json({ error: 'First comment must be 1500 characters or fewer.' }, { status: 400, headers: noStore });
    }
    const item = { uid: uid(), name, caption, hashtags, ...(firstComment ? { firstComment } : {}), createdAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        await db`insert into pulse_templates (name, caption, hashtags) values (${name}, ${caption}, ${JSON.stringify(hashtags)}::jsonb)`;
      } catch {
        /* table may not exist — stateless echo still lets the UI work offline-first */
      }
    }
    return NextResponse.json(item, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Template save failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
