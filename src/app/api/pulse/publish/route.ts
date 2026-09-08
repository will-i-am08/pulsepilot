import { NextResponse } from 'next/server';
import { SUPPORTED_CHANNELS, channelLimit, clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

interface Check {
  channel: string;
  ok: boolean;
  overBy: number;
  limit: number;
  length: number;
}

// POST /api/pulse/publish — { caption, channel?, channels?, dryRun? }
// dryRun:true returns per-platform pass/fail without publishing (mock adapters).
export async function POST(req: Request) {
  try {
    if (!rateLimit(`pub:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400 });
    const caption = str((body as Record<string, unknown>).caption, 70000) ?? '';
    const single = str((body as Record<string, unknown>).channel, 40);
    const many = (body as Record<string, unknown>).channels;
    const channels: string[] = Array.isArray(many)
      ? (many as unknown[]).filter((c): c is string => typeof c === 'string').map((c) => c.slice(0, 40)).slice(0, 12)
      : single
        ? [single]
        : ['instagram'];
    if (channels.length === 0) return NextResponse.json({ error: 'Pick at least one channel.' }, { status: 400 });
    const allowed = SUPPORTED_CHANNELS as readonly string[];
    const unknown = channels.map((c) => c.toLowerCase()).filter((c) => !allowed.includes(c));
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: `Unknown channel: ${unknown.join(', ')}.`, channels: [...SUPPORTED_CHANNELS] },
        { status: 400 }
      );
    }
    const dryRun = (body as Record<string, unknown>).dryRun === true;

    const results: Check[] = channels.map((raw) => {
      const ch = raw.toLowerCase();
      const limit = channelLimit(ch);
      const length = caption.length;
      return { channel: ch, ok: length <= limit, overBy: Math.max(0, length - limit), limit, length };
    });

    if (dryRun) {
      return NextResponse.json({ dryRun: true, results }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // Live publishing is still mock — every adapter needs connecting first.
    return NextResponse.json(
      { ok: false, mock: true, error: 'Mock — connect later. Run with dryRun:true to validate copy.', results },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Publish check failed — try again in a moment.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
