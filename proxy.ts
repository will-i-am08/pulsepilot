import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';

// Next 16: proxy.ts replaces middleware.ts. When Neon Auth is configured,
// unauthenticated users hitting protected routes are redirected to sign-in.
// When unconfigured (local dev / build), requests pass straight through.

export default function proxy(req: NextRequest) {
  const auth = getAuth();
  if (!auth) return NextResponse.next();
  return auth.middleware({ loginUrl: '/auth/sign-in' })(req);
}

export const config = {
  matcher: ['/account/:path*'],
};
