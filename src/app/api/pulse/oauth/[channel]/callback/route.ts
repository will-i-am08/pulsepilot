import { NextResponse } from 'next/server';
import { SUPPORTED_CHANNELS } from '../../../_lib';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

// GET /api/pulse/oauth/:channel/callback — stub until provider credentials are added.
export async function GET(_req: Request, ctx: { params: Promise<{ channel: string }> }) {
  const { channel } = await ctx.params;
  const ch = channel?.toLowerCase() ?? 'unknown';
  if (!(SUPPORTED_CHANNELS as readonly string[]).includes(ch)) {
    return NextResponse.json(
      { error: 'Unknown channel.', channels: [...SUPPORTED_CHANNELS] },
      { status: 400, headers: noStore }
    );
  }
  return NextResponse.json(
    {
      error: 'Provider not connected yet — mock adapter in use. Add APP credentials to enable.',
      channel: ch,
      channels: [...SUPPORTED_CHANNELS],
    },
    { status: 501, headers: noStore }
  );
}
