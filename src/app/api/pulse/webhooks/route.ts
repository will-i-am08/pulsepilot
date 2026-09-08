import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

// Deferred: provider webhooks ship with OAuth. Mock publishing remains available.
export async function GET() {
  return NextResponse.json(
    { error: 'Incoming webhooks deferred until OAuth providers connect — mock publishing remains available' },
    { status: 501, headers: noStore }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Incoming webhooks deferred until OAuth providers connect — mock publishing remains available' },
    { status: 501, headers: noStore }
  );
}
