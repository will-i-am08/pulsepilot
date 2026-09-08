import { createNeonAuth } from '@neondatabase/auth/next/server';

let instance: ReturnType<typeof createNeonAuth> | null = null;

/** Neon Auth server instance, or null when env is not configured (local dev). */
export function getAuth(): ReturnType<typeof createNeonAuth> | null {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) return null;
  if (!instance) {
    instance = createNeonAuth({ baseUrl, cookies: { secret } });
  }
  return instance;
}

/** Back-compat eager instance for server actions that run behind auth pages. */
export const auth = new Proxy({} as NonNullable<ReturnType<typeof getAuth>>, {
  get(_t, prop) {
    const a = getAuth();
    if (!a) throw new Error('Neon Auth is not configured — set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.');
    const v = (a as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === 'function' ? (v as (...args: unknown[]) => unknown).bind(a) : v;
  },
});
