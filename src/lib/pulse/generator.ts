// PulsePilot content generation engine.
// Works fully offline (deterministic templates + brand voice).
// API routes can upgrade it with a real LLM when ANTHROPIC_API_KEY is set.

import type { BusinessProfile, CarouselSlide, Channel, ContentFormat, ContentItem, ContentMetrics, ExtendedChannel, LiveSegment, NewsletterData, PollData, StoryFrame } from './types';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  if (arr.length === 0) throw new Error('pick() called with empty array');
  return arr[(seed + offset) % arr.length];
}

const HOOK_FRAMES = [
  'POV: you finally {win} without {pain}',
  'Stop doing {pain} — do this instead',
  '{n} {thing} every {audience} wishes they knew sooner',
  'I asked {n} {audience} what actually {win_verb} — here is what they said',
  'The {thing} mistake costing you {outcome}',
  'How we {win} for {audience} in {timeframe} (full breakdown)',
  'Unpopular opinion: {contrarian}',
  'If you are a {audience} in {year}, watch this',
  'Steal our exact {thing} playbook (we charge clients for this)',
  'Nobody talks about {hidden} — so let us fix that',
  '{audience}: read this before you {action}',
  'We tested {n} {thing}s so you do not have to',
];

const CTAS: Record<string, string[]> = {
  leads: ['DM us "{keyword}" and we will map it out for you', 'Comment "{keyword}" and we will send the breakdown', 'Tap the link in bio to get started'],
  bookings: ['DM us "BOOK" to grab your spot', 'Comment "BOOK" and we will confirm within 24 hours', 'Link in bio to book — takes a minute'],
  followers: ['Follow for daily {thing} that actually works', 'Save this for later — you will need it', 'Share this with someone who needs it'],
  sales: ['DM "BUY" and we will look after you today', 'Comment "INFO" for price and availability', 'Link in bio — takes a minute'],
};

const HASHTAG_BANK: Record<string, string[]> = {
  default: ['smallbusiness', 'marketingtips', 'contentmarketing', 'socialmediatips', 'growyourbusiness'],
};

function industryTags(industry: string): string[] {
  const base = [...HASHTAG_BANK.default];
  const extra = industry
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .map((w) => w.replace(/\s+/g, ''));
  return [...extra, ...base].slice(0, 8);
}

function emojiFor(level: 0 | 1 | 2, seed: number): string {
  if (level === 0) return '';
  const light = ['✨', '👇', '📌'];
  const heavy = ['✨', '🔥', '👇', '📌', '💡', '🚀'];
  const bank = level === 1 ? light : heavy;
  return ' ' + pick(bank, seed);
}

export function channelBestNote(channel: ExtendedChannel): string {
  switch (channel) {
    case 'instagram':
      return 'Promise in the first 6 words. Short paragraphs. Hashtags ride along at the end.';
    case 'tiktok':
      return 'Say the hook out loud in the first 2 seconds. Big on-screen text. Keep the caption short.';
    case 'facebook':
      return 'Warm and conversational. End with one genuine question to earn comments.';
    case 'linkedin':
      return 'Lead with the insight, no clickbait. Short paragraphs. One soft next step.';
    case 'x':
      return 'One idea per post. Hook first, 280 characters max. Thread it if it runs long.';
    case 'threads':
      return 'Conversational opener, 500 characters max. One question to earn replies.';
    case 'youtube':
      return 'Title carries the click; description carries the detail. Keywords in the first 2 lines.';
    case 'pinterest':
      return 'Searchable title + keyword-rich description. Vertical visual, text overlay under 5 words.';
    case 'mastodon':
      return 'Plain text, 500 characters max. Content warnings where apt, hashtags inline (2–3).';
    case 'bluesky':
      return 'Short and human, 300 characters max. One link max, no hashtag stuffing.';
    case 'pixelfed':
      return 'Photo-first like IG. Alt text always, hashtags at the end.';
    case 'google_business':
      return 'Short update post: what, where, when. One photo, one call button.';
    default:
      return 'One clear promise, one proof line, one next step.';
  }
}

// ---- R1 helpers ----

/** Split long copy into thread parts of at most maxLen chars, preferring sentence/word boundaries. */
export function splitThread(text: string, maxLen = 280): string[] {
  const clean = (text ?? '').trim();
  if (!clean) return [];
  const limit = Math.max(20, Math.floor(maxLen));
  // Split into sentence-ish chunks first, then pack greedily and hard-split overflow words.
  const sentences = clean.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const words = sentences.length > 0 ? sentences : [clean];
  const parts: string[] = [];
  let cur = '';
  const pushCur = () => {
    if (cur.trim()) parts.push(cur.trim());
    cur = '';
  };
  for (const chunk of words) {
    const piece = chunk.length <= limit ? chunk : chunk.split(/\s+/).filter(Boolean).reduce<string[]>((acc, w) => {
      if (w.length > limit) {
        // Hard-split very long tokens.
        for (let i = 0; i < w.length; i += limit) acc.push(w.slice(i, i + limit));
      } else if (acc.length === 0) acc.push(w);
      else {
        const last = acc[acc.length - 1];
        if ((last + ' ' + w).length <= limit) acc[acc.length - 1] = last + ' ' + w;
        else acc.push(w);
      }
      return acc;
    }, []).join('\n');
    for (const sub of piece.split('\n')) {
      const candidate = cur ? cur + ' ' + sub : sub;
      if (candidate.length <= limit) {
        cur = candidate;
      } else {
        if (sub.length <= limit) {
          pushCur();
          cur = sub;
        } else {
          // sub itself overflows (hard-split tokens joined) — flush and slice.
          pushCur();
          for (let i = 0; i < sub.length; i += limit) parts.push(sub.slice(i, i + limit));
        }
      }
    }
  }
  pushCur();
  return parts;
}

const CAPTION_LIMITS: Record<ExtendedChannel, number> = {
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
  pixelfed: 2000,
  google_business: 1500,
};

/** Validate caption length for a channel. Never returns undefined; unknown channels fall back to 2200. */
export function validateCaptionLength(
  channel: ExtendedChannel,
  text: string
): { ok: boolean; overBy: number } {
  const limit = CAPTION_LIMITS[channel] ?? 2200;
  const len = (text ?? '').length;
  return len <= limit ? { ok: true, overBy: 0 } : { ok: false, overBy: len - limit };
}

/** Build an IG-style first comment from caption + hashtags, capped at 1500 chars. */
export function buildFirstComment(caption: string, hashtags: string[]): string {
  const tags = (hashtags ?? []).filter((h) => typeof h === 'string' && h.trim()).join(' ');
  const base = caption?.trim()
    ? tags ? `${caption.trim()}\n\n${tags}` : caption.trim()
    : tags;
  return base.slice(0, 1500);
}

export interface DraftInput {
  business: BusinessProfile;
  pillar: string;
  format: ContentFormat;
  channel: Channel;
  angle?: string;
  seedKey?: string;
}

export function generateDraft(input: DraftInput, index = 0): Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'> {
  const { business, pillar, format, channel, angle } = input;
  const seed = hash(`${business.businessName}|${pillar}|${format}|${channel}|${angle ?? ''}|${index}`);
  const audience = business.idealCustomer || 'busy owners';
  const win = `a steady flow of ${business.goals.primary}`;
  const pain = pick(['posting randomly', 'guessing captions', 'burning weekends on content', 'inconsistent posting'], seed);
  const thing = pick(['content', 'posting', 'lead-gen', 'booking', 'sales'], seed, 1);
  const timeframe = pick(['7 days', '14 days', '30 days'], seed, 2);
  const keyword = business.businessName.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'GROW';

  const hookTemplate = pick(HOOK_FRAMES, seed);
  const hook = hookTemplate
    .replace('{win}', win)
    .replace('{win_verb}', 'converts')
    .replace('{pain}', pain)
    .replace('{n}', String(3 + (seed % 5)))
    .replace('{thing}', thing)
    .replace('{audience}', audience)
    .replace('{outcome}', business.goals.primary)
    .replace('{timeframe}', timeframe)
    .replace('{contrarian}', `consistency beats going viral for ${audience}`)
    .replace('{year}', '2026')
    .replace('{hidden}', `the follow-up after someone ${business.goals.primary === 'bookings' ? 'enquires' : 'follows'}`)
    .replace('{action}', business.goals.primary === 'bookings' ? 'book' : 'post again')
    .replaceAll('{keyword}', keyword);

  const hooks = [hook];
  for (let i = 1; i < 5; i++) {
    const t = pick(HOOK_FRAMES, seed, i * 7);
    hooks.push(
      t
        .replace('{win}', win)
        .replace('{win_verb}', 'works')
        .replace('{pain}', pain)
        .replace('{n}', String(3 + ((seed + i) % 5)))
        .replace('{thing}', pillar.toLowerCase())
        .replace('{audience}', audience)
        .replace('{outcome}', business.goals.primary)
        .replace('{timeframe}', timeframe)
        .replace('{contrarian}', `your feed is your storefront, not your diary`)
        .replace('{year}', '2026')
        .replace('{hidden}', `what happens in the 24h after you post`)
        .replace('{action}', 'spend another hour on Canva')
        .replaceAll('{keyword}', keyword)
    );
  }

  const tone = business.voice.tones[0] ?? 'direct, warm, no fluff';
  const emoji = emojiFor(business.voice.emojiLevel, seed);
  const ctaBank = CTAS[business.goals.primary] ?? CTAS.leads;
  const cta = pick(ctaBank, seed, 3).replaceAll('{keyword}', keyword).replaceAll('{thing}', pillar.toLowerCase());

  const angleLine = angle ? `\n\nAngle: ${angle}.` : '';
  const captions = [0, 1, 2].map((v) => {
    const opener = v === 0 ? hooks[0] : v === 1 ? hooks[1] : `Quick truth for ${audience}:`;
    const body =
      v === 0
        ? `${pillar} is not about posting more. It is about posting what makes someone ${business.goals.primary === 'followers' ? 'follow' : 'enquire'}.\n\nHere is the exact lens we use for ${business.businessName} clients:\n1. One clear promise\n2. Proof in 2 lines\n3. One next step${angleLine}`
        : v === 1
          ? `Most ${industryLabel(business.industry)} posts fail for one boring reason: no promise in line one.\n\nFix it with this:\n→ Say who it is for (${audience})\n→ Say the outcome (${business.goals.primary})\n→ Say the next step\n\nWe run this for ${business.businessName} every week. It compounds.${angleLine}`
          : `You do not need to go viral. You need a repeatable week.\n\nThis week at ${business.businessName}: one ${format}, one promise, one next step. That is the whole system.\n\n${cta}${emoji}`;
    const tail = v === 2 ? '' : `\n\n${cta}${emoji}\n\n— ${business.businessName} (${tone})`;
    return `${opener}${emoji}\n\n${body}${tail}`.slice(0, 1200);
  });

  const tags = industryTags(business.industry).map((t) => `#${t}`);
  const script =
    format === 'reel' || format === 'story'
      ? `0–2s HOOK (on-screen + spoken): "${hooks[0]}"\n2–8s PROBLEM: "${pain} is why most ${audience} stall."\n8–25s PAYOFF: 3 steps for ${pillar.toLowerCase()} → promise, proof, next step.\n25–30s NEXT STEP: "${cta}"\nCutaway: ${business.industry} workplace, captions on screen, trending audio low.`
      : undefined;

  const visualPrompt = `${format} for ${business.businessName} (${business.industry}): ${pillar} theme, bold hook text "${hooks[0].slice(0, 60)}", clean layout, high contrast, skip the stock-photo look. ${formatVisualNote(format)} ${channelBestNote(channel)}`;

  // ---- Format-deep structures (slide/frame/poll/live/newsletter) ----
  const slides =
    format === 'carousel'
      ? buildSlides(business.businessName, pillar, hooks[0], cta)
      : undefined;
  const frames =
    format === 'story'
      ? buildFrames(hooks[0], pain, cta)
      : undefined;
  const poll =
    format === 'poll'
      ? buildPoll(business, pillar, hooks[0], seed)
      : undefined;
  const livePlan =
    format === 'live'
      ? buildLivePlan(business.businessName, pillar)
      : undefined;
  const newsletter =
    format === 'newsletter'
      ? buildNewsletter(business, pillar, hooks[0], cta, seed)
      : undefined;

  const confidence = 0.72 + ((seed % 20) / 100);

  return {
    businessId: business.id,
    state: business.mode === 'autopilot' ? 'scheduled' : 'draft',
    pillar,
    format,
    channel,
    hook: hooks[0],
    hooks,
    captions,
    selectedCaption: 0,
    hashtags: tags,
    script,
    slides,
    frames,
    poll,
    livePlan,
    newsletter,
    visualPrompt,
    altText: `${pillar} ${format} — ${business.businessName}`,
    confidence,
    agentNote: `Filed by Pen · written for ${channel}, kept in your voice.`,
    scheduledFor: undefined,
  };
}

function industryLabel(industry: string): string {
  return industry || 'local business';
}

function formatVisualNote(format: ContentFormat): string {
  switch (format) {
    case 'carousel':
      return '6–8 swipeable slides, one idea per slide, slide 1 is the hook, final slide is the next step. 1080×1350 for IG/LinkedIn, 1080×1920 for TikTok photo mode.';
    case 'story':
      return '4 vertical frames (1080×1920), big text, one interactive sticker per frame (poll / Q&A / countdown / link).';
    case 'poll':
      return 'Bold single question card, high contrast, results-teaser follow-up post planned.';
    case 'live':
      return 'Live thumbnail: face + 5-word title + branded border. Promo cut-downs (3× 15s teasers) included.';
    case 'newsletter':
      return 'Cover 1920×1080, editorial style, headline + issue number, readable at thumbnail size.';
    default:
      return '';
  }
}

function buildSlides(bizName: string, pillar: string, hook: string, cta: string): CarouselSlide[] {
  const steps = [
    `Name who it is for — and the outcome they get from ${pillar.toLowerCase()}.`,
    `Show the proof: one number, one screenshot, one before/after.`,
    `Give step 1 of 3 — the part most people skip.`,
    `Give steps 2–3 — keep each to one line.`,
    `Name the #1 mistake that kills results (and the 10-second fix).`,
  ];
  const slides: CarouselSlide[] = [
    { headline: hook.slice(0, 90), body: `Swipe → the full ${pillar.toLowerCase()} breakdown from ${bizName}.`, visual: 'Hook slide: giant text, brand colour background, arrow hint.' },
  ];
  steps.forEach((body, i) => {
    slides.push({
      headline: `Step ${i + 1}: ${body.split('—')[0].slice(0, 70)}`,
      body,
      visual: `Slide ${i + 2}: one visual metaphor, minimal text, numbered badge.`,
    });
  });
  slides.push({
    headline: 'Your turn',
    body: `${cta}. Save this for later — you will need it.`,
    visual: 'Final slide: next-step graphic, profile handle, save/share prompt.',
  });
  return slides;
}

function buildFrames(hook: string, pain: string, cta: string): StoryFrame[] {
  return [
    { text: hook.slice(0, 80), sticker: 'No sticker — the hook holds for 3 seconds', cta: 'Tap through' },
    { text: `The problem: ${pain}. Sound familiar?`, sticker: 'Poll sticker: “That is me” / “Not me”', cta: 'Vote above' },
    { text: 'The fix in 3 steps: promise, proof, next step.', sticker: 'Question sticker: “Ask us anything”', cta: 'Reply or ask below' },
    { text: cta, sticker: 'Link sticker to your booking or offer page', cta: 'Tap the link' },
  ];
}

function buildPoll(business: BusinessProfile, pillar: string, hook: string, seed: number): PollData {
  const qBank = [
    `What is your #1 struggle with ${pillar.toLowerCase()} right now?`,
    `Would you rather: perfect posts monthly or good posts weekly?`,
    `What should we break down next for ${business.idealCustomer}?`,
  ];
  const oBank: string[][] = [
    ['Getting started', 'Staying consistent', 'Turning views into enquiries'],
    ['Monthly, polished', 'Weekly, real', 'Daily, raw'],
    [`More ${pillar}`, 'Pricing/offers', 'Behind the scenes'],
  ];
  const i = seed % qBank.length;
  return {
    question: qBank[i].slice(0, 140),
    options: oBank[i].map((o) => o.slice(0, 30)),
    duration: 'A week on LinkedIn and Facebook · 24 hours as a Story sticker',
    followUp: `Post the results in 7 days: lead with the winning option (“You voted — here is the fix”), then the call to action. The winning angle becomes next week's ${pillar} reel. Spark: “${hook.slice(0, 60)}…”`,
  };
}

function buildLivePlan(bizName: string, pillar: string): LiveSegment[] {
  return [
    { time: '7 days out', title: 'Announcement post', detail: `Name the topic (${pillar}), any guest, and one reason to show up live. Pin it.` },
    { time: 'Day before', title: 'Reminder + Story', detail: 'Countdown sticker, question box collecting queries, a 15-second teaser clip.' },
    { time: 'Minutes 0–5', title: 'Opening', detail: `Say who this is for and what they leave with, inside 30 seconds. “Send this to someone who needs ${pillar.toLowerCase()}.”` },
    { time: 'Minutes 5–20', title: 'Teach block', detail: 'Three points at most, one demo or teardown. Pin a comment with the offer link.' },
    { time: 'Minutes 20–30', title: 'Questions + close', detail: `Answer what came in, restate the next step for ${bizName}, then cut three 15–30 second clips for Reels and TikTok.` },
  ];
}

function buildNewsletter(business: BusinessProfile, pillar: string, hook: string, cta: string, seed: number): NewsletterData {
  const n = 3 + (seed % 3);
  return {
    subject: `${hook.slice(0, 55)} (Issue #${n})`.slice(0, 60),
    preview: `The ${pillar.toLowerCase()} playbook we run for ${business.businessName} clients — in 3 minutes.`.slice(0, 160),
    sections: [
      { heading: 'The one idea', body: `Most ${business.idealCustomer} stall on ${pillar.toLowerCase()} for one boring reason: no clear promise. Fix the promise, everything downstream converts better.` },
      { heading: 'The proof', body: `What we see across ${business.businessName} posts: hook-first beats polished-first. Saves and shares — not likes — predict enquiries.` },
      { heading: 'Do this this week', body: `One post: one promise, one proof line, one next step. Then ${cta.charAt(0).toLowerCase() + cta.slice(1)}.` },
    ],
    cta: `${cta} — and subscribe so next week's breakdown lands in your inbox.`,
  };
}

export function weeklyPlan(business: BusinessProfile): { pillar: string; format: ContentFormat; channel: Channel }[] {
  const formats: ContentFormat[] = ['reel', 'carousel', 'poll', 'story', 'carousel', 'reel', 'text'];
  const plan: { pillar: string; format: ContentFormat; channel: Channel }[] = [];
  const pillars = business.pillars.length > 0 ? business.pillars : ['Offers', 'Proof', 'Education', 'Personality'];
  for (let i = 0; i < business.postsPerWeek; i++) {
    plan.push({
      pillar: pillars[i % pillars.length],
      format: formats[i % formats.length],
      channel: business.channels[i % business.channels.length] ?? 'instagram',
    });
  }
  return plan;
}

export function simulateMetrics(seedKey: string, channel: Channel): ContentMetrics {
  const s = hash(seedKey);
  const mult = channel === 'tiktok' ? 2.4 : channel === 'instagram' ? 1.6 : channel === 'facebook' ? 1.1 : 0.7;
  const reach = Math.floor((400 + (s % 2600)) * mult);
  return {
    reach,
    likes: Math.floor(reach * (0.04 + ((s >> 3) % 10) / 400)),
    saves: Math.floor(reach * (0.008 + ((s >> 5) % 8) / 800)),
    comments: Math.floor(reach * (0.004 + ((s >> 7) % 6) / 900)),
    shares: Math.floor(reach * (0.006 + ((s >> 9) % 7) / 900)),
    follows: Math.floor(reach * 0.006),
    clicks: Math.floor(reach * 0.012),
  };
}

export function scoreFromMetrics(m: ContentMetrics): { score: number; insight: string } {
  const er = (m.likes + m.saves * 3 + m.comments * 4 + m.shares * 3) / Math.max(1, m.reach);
  const score = Math.max(28, Math.min(98, Math.round(er * 620)));
  const insight =
    score >= 80
      ? 'Top 10% performer. Double down: repost a variant and put A$10–20 behind it. Same hook shape next week.'
      : score >= 62
        ? 'Solid. The hook worked; the ending was soft. Sharpen the first line and test the same pillar again.'
        : score >= 45
          ? 'Average. Hook or format mismatch. Swap the format (still image becomes a carousel) and run it again.'
          : 'Weak hook or wrong channel. Drop this angle, keep the pillar, try a new hook shape.';
  return { score, insight };
}
