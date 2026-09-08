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

// GET /api/pulse/activity — recent activity ([] when no DB).
export async function GET(req: Request) {
  try {
    if (!rateLimit(`activity:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) return NextResponse.json([], { headers: noStore });
    try {
      const rows = (await db`select id, kind, message, created_at from pulse_activity order by created_at desc limit 50`) as unknown[];
      return NextResponse.json(rows, { headers: noStore });
    } catch {
      return NextResponse.json([], { headers: noStore });
    }
  } catch {
    return NextResponse.json([], { headers: noStore });
  }
}

// POST /api/pulse/activity { kind, message } — validates and echoes with uid + createdAt.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`activity:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const b = body as Record<string, unknown>;
    const kind = str(b.kind, 40)?.toLowerCase();
    const message = str(b.message, 500);
    if (!kind) return NextResponse.json({ error: 'An activity kind is required.' }, { status: 400, headers: noStore });
    if (!message) return NextResponse.json({ error: 'An activity message is required.' }, { status: 400, headers: noStore });
    const item = { uid: uid(), kind, message, createdAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        await db`insert into pulse_activity (kind, message) values (${kind}, ${message})`;
      } catch {
        /* stateless echo keeps the UI working offline-first */
      }
    }
    return NextResponse.json(item, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Activity log failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
