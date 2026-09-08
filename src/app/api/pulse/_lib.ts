// Shared upstream helper for PulsePilot API routes: timeouts, model config,
// validation, and a tiny in-memory rate limiter (per-IP, per-route).

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514';
const TIMEOUT_MS = 12000;

export async function callClaude(system: string, user: string, maxTokens: number): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[pulse] claude upstream ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data?.content?.[0]?.text;
    return typeof text === 'string' && text.length > 0 ? text : null;
  } catch (e) {
    console.error('[pulse] claude call failed', e instanceof Error ? e.message : 'unknown');
    return null;
  }
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Allow `limit` requests per `windowMs` per key. Returns false when limited. */
export function rateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  if (b.count > limit) return false;
  return true;
}

export function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length === 0) return null;
  return t.slice(0, max);
}

// Supported publishing channels — single source of truth, mirrors neon-schema CHECK.
export const SUPPORTED_CHANNELS = [
  'instagram',
  'tiktok',
  'facebook',
  'linkedin',
  'x',
  'threads',
  'youtube',
  'pinterest',
  'mastodon',
  'bluesky',
  'pixelfed',
  'google_business',
] as const;

export type PublishChannel = (typeof SUPPORTED_CHANNELS)[number] | string;

/** Per-channel caption limits. Unknown channels fall back to 2000. */
export const channelLimits: Record<string, number> = {
  instagram: 2200,
  tiktok: 2200,
  facebook: 63206,
  linkedin: 3000,
  x: 280,
  threads: 500,
  youtube: 5000,
  pinterest: 800,
  mastodon: 500,
  bluesky: 300,
  pixelfed: 2200,
  google_business: 1500,
};

export function channelLimit(channel: string): number {
  return channelLimits[channel.toLowerCase()] ?? 2000;
}

export type CaptionCheck = { channel: string; ok: boolean; overBy: number; limit: number; length: number };

/** Validate a caption against a channel limit. Never throws. */
export function validateCaption(caption: string, channel: string): CaptionCheck {
  const ch = channel.toLowerCase();
  const limit = channelLimit(ch);
  const length = caption.length;
  return { channel: ch, ok: length <= limit, overBy: Math.max(0, length - limit), limit, length };
}
