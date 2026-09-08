import { NextResponse } from 'next/server';
import { getDb } from '@/lib/neon';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

type DueRow = { id: string; business_id: string | null; channel: string | null };

// GET /api/cron/pulse-tick — flip due scheduled posts; client tick stays authoritative offline.
export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Cron is not configured — set CRON_SECRET.' }, { status: 503, headers: noStore });
    }
    if (req.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401, headers: noStore });
    }
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { ok: true, mode: 'noop', message: 'No DB — client tick remains authoritative' },
        { headers: noStore }
      );
    }
    let due: DueRow[] = [];
    try {
      due = (await db`select id, business_id, channel from pulse_content
        where state = 'scheduled' and scheduled_for <= now() limit 20`) as DueRow[];
    } catch {
      return NextResponse.json(
        { ok: true, mode: 'noop', message: 'No DB — client tick remains authoritative' },
        { headers: noStore }
      );
    }
    let processed = 0;
    for (const row of due) {
      try {
        await db`update pulse_content set state = 'published', published_at = now() where id = ${row.id} and state = 'scheduled'`;
        await db`insert into pulse_runs (business_id, agent, summary, detail, content_ids, status, mode)
          values (${row.business_id}, 'scheduler', 'pulse-tick pickup', ${'picked up by pulse-tick for ' + (row.channel ?? 'instagram')}, ARRAY[${row.id}]::uuid[], 'success', 'autopilot')`;
        processed++;
      } catch {
        /* keep going — one dud row should not block the rest */
      }
    }
    return NextResponse.json({ ok: true, mode: 'db', processed, total: due.length }, { headers: noStore });
  } catch {
    return NextResponse.json({ ok: false, message: 'Tick stumbled — client tick remains authoritative.' }, { headers: noStore });
  }
}
