import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

// Deferred: public API ships on customer demand. Mock publishing remains available.
export async function GET() {
  return NextResponse.json(
    { error: 'Public API / MCP deferred until customer demand — mock publishing remains available' },
    { status: 501, headers: noStore }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Public API / MCP deferred until customer demand — mock publishing remains available' },
    { status: 501, headers: noStore }
  );
}
