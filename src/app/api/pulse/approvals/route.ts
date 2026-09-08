import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';
import { clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };
const DECISIONS = ['approved', 'rejected', 'changes_requested'];

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `tmp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

// GET /api/pulse/approvals — list approval decisions ([] when no DB).
export async function GET(req: Request) {
  try {
    if (!rateLimit(`approvals:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) return NextResponse.json([], { headers: noStore });
    try {
      const rows = (await db`select id, content_id, decision, note, created_at from pulse_approvals order by created_at desc limit 50`) as unknown[];
      return NextResponse.json(rows, { headers: noStore });
    } catch {
      return NextResponse.json([], { headers: noStore });
    }
  } catch {
    return NextResponse.json([], { headers: noStore });
  }
}

// POST /api/pulse/approvals { contentId, decision, note? }
export async function POST(req: Request) {
  try {
    if (!rateLimit(`approvals:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const b = body as Record<string, unknown>;
    const contentId = str(b.contentId, 120);
    const decision = typeof b.decision === 'string' ? b.decision.toLowerCase() : null;
    if (!contentId) return NextResponse.json({ error: 'A content id is required.' }, { status: 400, headers: noStore });
    if (!decision || !DECISIONS.includes(decision)) {
      return NextResponse.json({ error: 'Decision must be approved, rejected or changes_requested.' }, { status: 400, headers: noStore });
    }
    const note = typeof b.note === 'string' ? b.note.slice(0, 1000) : undefined;
    const item = { uid: uid(), contentId, decision, ...(note ? { note } : {}), createdAt: new Date().toISOString() };
    const db = getDb();
    if (db) {
      try {
        await db`insert into pulse_approvals (content_id, decision, note) values (${contentId}, ${decision}, ${note ?? null})`;
      } catch {
        /* stateless echo keeps the UI working offline-first */
      }
    }
    return NextResponse.json(item, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Approval save failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
