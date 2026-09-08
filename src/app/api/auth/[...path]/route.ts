import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/server';

// Proxied to Managed Better Auth. Returns 503 until NEON_AUTH_* env is set,
// so `next build` (which collects route config) never crashes on unconfigured env.

export const dynamic = 'force-dynamic';

async function delegate(req: Request, ctx: unknown, method: 'GET' | 'POST') {
  const auth = getAuth();
  if (!auth) {
    return NextResponse.json(
      { error: 'Auth is not connected yet — enable Neon Auth and set NEON_AUTH_BASE_URL + NEON_AUTH_COOKIE_SECRET.' },
      { status: 503 }
    );
  }
  const { GET, POST } = auth.handler();
  return (method === 'GET' ? GET : POST)(req, ctx as never);
}

export function GET(req: Request, ctx: unknown) {
  return delegate(req, ctx, 'GET');
}

export function POST(req: Request, ctx: unknown) {
  return delegate(req, ctx, 'POST');
}
