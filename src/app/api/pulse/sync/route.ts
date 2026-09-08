import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';
import { clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };
const MAX_BYTES = 4_000_000;

function validWorkspaceId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
}

function validPayload(v: unknown): v is Record<string, unknown> {
  if (!isRecord(v)) return false;
  return Array.isArray(v.businesses) && Array.isArray(v.contents) && Array.isArray(v.runs);
}

// GET /api/pulse/sync?workspaceId=… — fetch the cloud backup.
export async function GET(req: Request) {
  try {
    if (!rateLimit(`sync:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Cloud backup is not connected yet — add DATABASE_URL on Vercel, then run neon-schema.sql.' }, { status: 503, headers: noStore });
    }
    const id = new URL(req.url).searchParams.get('workspaceId');
    if (!validWorkspaceId(id)) return NextResponse.json({ error: 'A valid workspace id is required.' }, { status: 400, headers: noStore });
    const rows = (await db`select payload, updated_at from pulse_snapshots where workspace_id = ${id}`) as { payload: unknown; updated_at: string }[];
    if (rows.length === 0) return NextResponse.json({ error: 'No cloud backup for this workspace yet.' }, { status: 404, headers: noStore });
    return NextResponse.json({ payload: rows[0].payload, updatedAt: rows[0].updated_at }, { headers: noStore });
  } catch (e) {
    console.error('[pulse/sync GET]', e instanceof Error ? e.message : String(e).slice(0, 300));
    return NextResponse.json({ error: 'Backup fetch failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}

// POST /api/pulse/sync { workspaceId, label?, payload } — save the cloud backup.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`sync:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: noStore });
    }
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Cloud backup is not connected yet — add DATABASE_URL on Vercel, then run neon-schema.sql.' }, { status: 503, headers: noStore });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400, headers: noStore });
    const { workspaceId, label, payload } = body as Record<string, unknown>;
    if (!validWorkspaceId(workspaceId)) return NextResponse.json({ error: 'A valid workspace id is required.' }, { status: 400, headers: noStore });
    if (!validPayload(payload)) return NextResponse.json({ error: 'That backup payload does not look like a PulsePilot workspace.' }, { status: 400, headers: noStore });
    const raw = JSON.stringify(payload);
    if (raw.length > MAX_BYTES) return NextResponse.json({ error: 'Backup is too large (over ~4MB). Bin old posts and try again.' }, { status: 413, headers: noStore });
    const labelStr = str(label, 80) ?? '';
    await db`insert into pulse_snapshots (workspace_id, label, payload)
      values (${workspaceId}, ${labelStr}, ${raw}::jsonb)
      on conflict (workspace_id) do update set label = excluded.label, payload = excluded.payload`;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (e) {
    console.error('[pulse/sync POST]', e instanceof Error ? e.message : String(e).slice(0, 300));
    return NextResponse.json({ error: 'Backup save failed — try again in a moment.' }, { status: 500, headers: noStore });
  }
}
