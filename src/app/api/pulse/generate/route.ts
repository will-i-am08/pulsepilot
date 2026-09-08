import { NextResponse } from 'next/server';
import { generateDraft } from '@/lib/pulse/generator';
import type { BusinessProfile, Channel, ContentFormat } from '@/lib/pulse/types';
import { callClaude, clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

const CHANNELS = ['instagram', 'tiktok', 'facebook', 'linkedin'];
const FORMATS = ['reel', 'carousel', 'static', 'story', 'text', 'poll', 'live', 'newsletter'];

function validBusiness(v: unknown): v is BusinessProfile {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.businessName === 'string' &&
    typeof v.industry === 'string' &&
    typeof v.idealCustomer === 'string' &&
    typeof v.offer === 'string' &&
    isRecord(v.voice) &&
    Array.isArray(v.voice.tones) &&
    Array.isArray(v.channels) &&
    typeof v.goals === 'object' &&
    typeof v.postsPerWeek === 'number' &&
    Array.isArray(v.pillars)
  );
}

// POST /api/pulse/generate — always returns { engine, drafts[] }.
// Claude upgrades quality when ANTHROPIC_API_KEY is set; local engine otherwise.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`gen:${clientKey(req)}`, 15)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Send a request body.' }, { status: 400 });
    const { business, pillar, format, channel, angle } = body as Record<string, unknown>;
    const pillarStr = str(pillar, 40);
    if (!validBusiness(business) || !pillarStr || typeof format !== 'string' || !FORMATS.includes(format) || typeof channel !== 'string' || !CHANNELS.includes(channel)) {
      return NextResponse.json({ error: 'business, pillar, format and channel are required.' }, { status: 400 });
    }
    const angleStr = str(angle, 120) ?? undefined;
    const f = format as ContentFormat;
    const c = channel as Channel;

    const local = generateDraft({ business, pillar: pillarStr, format: f, channel: c, angle: angleStr }, Math.floor(Math.random() * 100000));

    const text = await callClaude(
      `You are Pen, a conversion copywriter for ${business.businessName} (${business.industry}). Audience: ${business.idealCustomer}. Voice: ${business.voice.tones.join(', ')}. Goal: ${business.goals.primary}. Write native ${c} copy in plain words — never say "CTA", explain everything. Return JSON {hooks: string[5], captions: string[3], hashtags: string[], script?: string}.`,
      `Pillar: ${pillarStr}. Format: ${f}. Angle: ${angleStr ?? 'pick the strongest'}. Offer: ${business.offer}. Return JSON only.`,
      1200
    );
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as Record<string, unknown>;
          const hooks = Array.isArray(parsed.hooks) ? (parsed.hooks as unknown[]).filter((h): h is string => typeof h === 'string').slice(0, 5) : null;
          const captions = Array.isArray(parsed.captions) ? (parsed.captions as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 3) : null;
          const hashtags = Array.isArray(parsed.hashtags) ? (parsed.hashtags as unknown[]).filter((h): h is string => typeof h === 'string').slice(0, 10) : null;
          if (hooks && hooks.length > 0 && captions && captions.length > 0 && hashtags) {
            const script = typeof parsed.script === 'string' ? parsed.script.slice(0, 2000) : local.script;
            return NextResponse.json(
              { engine: 'claude', drafts: [{ ...local, hooks, hook: hooks[0], captions, selectedCaption: 0, hashtags, script }] },
              { headers: { 'Cache-Control': 'no-store' } }
            );
          }
        } catch { /* malformed LLM JSON — fall through to local */ }
      }
    }
    return NextResponse.json({ engine: 'local', drafts: [{ ...local, hook: local.hooks[0] }] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Generation failed — try again in a moment.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
