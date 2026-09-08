import { NextResponse } from 'next/server';

// RETIRED — STEALTH MODE game prototype route. Returns 410 so nothing can
// spend ANTHROPIC_API_KEY here. PulsePilot uses /api/pulse/* instead.
export const dynamic = 'force-dynamic';

const gone = () =>
  NextResponse.json(
    { error: 'Retired prototype route. PulsePilot uses /api/pulse/*.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );

export async function POST() {
  return gone();
}

export async function GET() {
  return gone();
}
