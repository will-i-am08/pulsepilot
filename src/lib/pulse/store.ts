'use client';

import { create } from 'zustand';
import type {
  AgentId,
  AgentRun,
  BusinessProfile,
  Campaign,
  CarouselSlide,
  Channel,
  ContentFormat,
  ContentItem,
  ContentMetrics,
  ContentState,
  LiveSegment,
  NewsletterData,
  OperatingMode,
  PollData,
  StoryFrame,
  TrendItem,
} from './types';
import { generateDraft, scoreFromMetrics, simulateMetrics, weeklyPlan } from './generator';
import { nextSlot } from './slots';

const LS_KEY = 'pulsepilot-v2';
const LS_LEGACY = 'pulsepilot-v1';

// Forward-only lifecycle. Pull-back is a deliberate action, not a transition.
const ALLOWED: Record<ContentState, ContentState[]> = {
  idea: ['draft', 'rejected'],
  draft: ['pending_approval', 'scheduled', 'rejected'],
  pending_approval: ['scheduled', 'draft', 'rejected'],
  scheduled: ['published', 'draft', 'rejected'],
  published: ['analysed'],
  analysed: [],
  rejected: ['draft'],
};

const CHANNELS: Channel[] = ['instagram', 'tiktok', 'facebook', 'linkedin'];
const FORMATS: ContentFormat[] = ['reel', 'carousel', 'static', 'story', 'text', 'poll', 'live', 'newsletter'];

function uid(prefix = 'id'): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  } catch { /* fall through */ }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const clampInt = (n: unknown, min: number, max: number, fallback: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.min(max, Math.max(min, v));
};

const cleanStr = (v: unknown, max = 200, fallback = ''): string => {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
};

function sanitizeBusiness(b: unknown): BusinessProfile | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Record<string, unknown>;
  const name = cleanStr(o.businessName, 80).trim();
  if (name.length < 2) return null;
  const channels = Array.isArray(o.channels) ? (o.channels as unknown[]).filter((c): c is Channel => typeof c === 'string' && (CHANNELS as string[]).includes(c)) : [];
  const pillars = Array.isArray(o.pillars) ? (o.pillars as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.slice(0, 40)) : [];
  const voice = (o.voice && typeof o.voice === 'object' ? o.voice : {}) as Record<string, unknown>;
  const goals = (o.goals && typeof o.goals === 'object' ? o.goals : {}) as Record<string, unknown>;
  return {
    id: cleanStr(o.id, 60, uid('biz')),
    businessName: name,
    industry: cleanStr(o.industry, 60, 'Local services'),
    location: cleanStr(o.location, 60, 'Brisbane QLD'),
    idealCustomer: cleanStr(o.idealCustomer, 120, 'local customers'),
    offer: cleanStr(o.offer, 140, 'New-customer offer'),
    voice: {
      tones: Array.isArray(voice.tones) && voice.tones.length > 0 ? (voice.tones as unknown[]).filter((t): t is string => typeof t === 'string').map((t) => t.slice(0, 60)) : ['direct, warm, no fluff'],
      emojiLevel: voice.emojiLevel === 0 || voice.emojiLevel === 1 || voice.emojiLevel === 2 ? voice.emojiLevel : 1,
      bannedWords: Array.isArray(voice.bannedWords) ? (voice.bannedWords as unknown[]).filter((w): w is string => typeof w === 'string').map((w) => w.slice(0, 30)) : [],
    },
    channels: channels.length > 0 ? channels : ['instagram'],
    mode: o.mode === 'autopilot' ? 'autopilot' : 'copilot',
    postsPerWeek: clampInt(o.postsPerWeek, 1, 14, 5),
    pillars: pillars.length > 0 ? pillars : ['Offers', 'Education', 'Proof'],
    goals: {
      primary: typeof goals.primary === 'string' ? goals.primary.slice(0, 20) : 'leads',
      targetMonthly: clampInt(goals.targetMonthly, 1, 1000000, 30),
    },
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : nowISO(),
  };
}

function sanitizeContent(c: unknown): ContentItem | null {
  if (!c || typeof c !== 'object') return null;
  const o = c as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.businessId !== 'string') return null;
  if (typeof o.hook !== 'string' || !Array.isArray(o.captions) || !Array.isArray(o.hooks) || !Array.isArray(o.hashtags)) return null;
  const channel: Channel = (CHANNELS as string[]).includes(o.channel as string) ? (o.channel as Channel) : 'instagram';
  const format: ContentFormat = (FORMATS as string[]).includes(o.format as string) ? (o.format as ContentFormat) : 'text';
  const states: ContentState[] = ['idea', 'draft', 'pending_approval', 'scheduled', 'published', 'analysed', 'rejected'];
  return {
    id: o.id,
    businessId: o.businessId,
    campaignId: typeof o.campaignId === 'string' ? o.campaignId : undefined,
    state: states.includes(o.state as ContentState) ? (o.state as ContentState) : 'draft',
    pillar: cleanStr(o.pillar, 40, 'Offers'),
    format,
    channel,
    hook: (o.hook as string).slice(0, 500),
    hooks: (o.hooks as unknown[]).filter((h): h is string => typeof h === 'string').map((h) => h.slice(0, 500)).slice(0, 8),
    captions: (o.captions as unknown[]).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 1500)).slice(0, 5),
    selectedCaption: clampInt(o.selectedCaption, 0, 4, 0),
    hashtags: (o.hashtags as unknown[]).filter((h): h is string => typeof h === 'string').map((h) => h.slice(0, 40)).slice(0, 12),
    script: typeof o.script === 'string' ? o.script.slice(0, 2000) : undefined,
    slides: Array.isArray(o.slides) ? (o.slides as CarouselSlide[]).slice(0, 20) : undefined,
    frames: Array.isArray(o.frames) ? (o.frames as StoryFrame[]).slice(0, 10) : undefined,
    poll: o.poll && typeof o.poll === 'object' ? (o.poll as PollData) : undefined,
    livePlan: Array.isArray(o.livePlan) ? (o.livePlan as LiveSegment[]).slice(0, 12) : undefined,
    newsletter: o.newsletter && typeof o.newsletter === 'object' ? (o.newsletter as NewsletterData) : undefined,
    collabWith: typeof o.collabWith === 'string' ? o.collabWith.slice(0, 120) : undefined,
    isTrialReel: o.isTrialReel === true,
    link: typeof o.link === 'string' ? o.link.slice(0, 300) : undefined,
    visualPrompt: typeof o.visualPrompt === 'string' ? o.visualPrompt.slice(0, 1000) : undefined,
    altText: typeof o.altText === 'string' ? o.altText.slice(0, 200) : undefined,
    scheduledFor: typeof o.scheduledFor === 'string' && !Number.isNaN(new Date(o.scheduledFor).getTime()) ? o.scheduledFor : undefined,
    publishedAt: typeof o.publishedAt === 'string' ? o.publishedAt : undefined,
    publishedUrl: typeof o.publishedUrl === 'string' ? o.publishedUrl.slice(0, 300) : undefined,
    metrics: o.metrics && typeof o.metrics === 'object' ? (o.metrics as ContentMetrics) : undefined,
    score: typeof o.score === 'number' ? Math.min(100, Math.max(0, Math.round(o.score))) : undefined,
    insight: typeof o.insight === 'string' ? o.insight.slice(0, 500) : undefined,
    confidence: typeof o.confidence === 'number' && Number.isFinite(o.confidence) ? o.confidence : 0.8,
    agentNote: cleanStr(o.agentNote, 300),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : nowISO(),
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : nowISO(),
  };
}

function sanitizeRun(r: unknown): AgentRun | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  const agents: AgentId[] = ['strategist', 'trend_scout', 'copywriter', 'visual_director', 'scheduler', 'analyst'];
  if (typeof o.id !== 'string' || !agents.includes(o.agent as AgentId) || typeof o.summary !== 'string') return null;
  return {
    id: o.id,
    agent: o.agent as AgentId,
    businessId: typeof o.businessId === 'string' ? o.businessId : undefined,
    summary: o.summary.slice(0, 500),
    detail: cleanStr(o.detail, 800),
    contentIds: Array.isArray(o.contentIds) ? (o.contentIds as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 30) : [],
    status: o.status === 'failed' || o.status === 'needs_review' ? o.status : 'success',
    mode: o.mode === 'autopilot' ? 'autopilot' : 'copilot',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : nowISO(),
  };
}

const DEFAULT_TRENDS: TrendItem[] = [
  { id: 't1', title: 'Process reels — film the work, not the result', platform: 'IG + TikTok', relevance: 0.92, expiresIn: '6 days', suggestedHook: 'The 10 minutes of work behind every post we file', status: 'new' },
  { id: 't2', title: 'Carousel teardowns beat tips posts', platform: 'IG + LinkedIn', relevance: 0.87, expiresIn: '12 days', suggestedHook: 'We read 30 feeds. One mistake is killing reach', status: 'new' },
  { id: 't3', title: 'Founder talking-heads are back', platform: 'TikTok', relevance: 0.81, expiresIn: '9 days', suggestedHook: 'The unpopular opinion about consistency I stand by', status: 'new' },
  { id: 't4', title: 'Comment-to-DM lead posts', platform: 'IG + FB', relevance: 0.9, expiresIn: '20 days', suggestedHook: 'Comment GROW and I will send the exact playbook', status: 'new' },
];

const TREND_BANK: Omit<TrendItem, 'id' | 'status'>[] = [
  { title: 'Before/after carousels for local proof', platform: 'IG + FB', relevance: 0.84, expiresIn: '10 days', suggestedHook: 'Same street, same budget, different result' },
  { title: 'Reply-to-comment videos', platform: 'TikTok', relevance: 0.88, expiresIn: '7 days', suggestedHook: 'Someone asked this in the comments — fair question' },
  { title: 'Myth-busting text posts', platform: 'LinkedIn', relevance: 0.79, expiresIn: '14 days', suggestedHook: 'The advice everyone repeats that quietly fails' },
  { title: 'Price-transparency posts', platform: 'IG + FB', relevance: 0.83, expiresIn: '11 days', suggestedHook: 'What it actually costs — no “DM for price”' },
  { title: 'Day-in-the-life Stories', platform: 'IG + TikTok', relevance: 0.77, expiresIn: '5 days', suggestedHook: 'Tuesday at the shop, unfiltered' },
  { title: 'Checklist carousels that get saved', platform: 'LinkedIn + IG', relevance: 0.86, expiresIn: '13 days', suggestedHook: 'The 6-point checklist we run before anything goes out' },
];

interface Persisted {
  version: number;
  businesses: BusinessProfile[];
  activeBusinessId: string | null;
  contents: ContentItem[];
  runs: AgentRun[];
  campaigns: Campaign[];
  trends: TrendItem[];
  usedTrends: Record<string, string[]>;
}

function readKey(key: string): unknown {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toPersisted(v: unknown): Persisted {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const businesses = Array.isArray(o.businesses) ? (o.businesses as unknown[]).map(sanitizeBusiness).filter((b): b is BusinessProfile => b !== null) : [];
  const contents = Array.isArray(o.contents) ? (o.contents as unknown[]).map(sanitizeContent).filter((c): c is ContentItem => c !== null) : [];
  const runs = Array.isArray(o.runs) ? (o.runs as unknown[]).map(sanitizeRun).filter((r): r is AgentRun => r !== null) : [];
  const campaigns = Array.isArray(o.campaigns)
    ? (o.campaigns as unknown[]).filter((c): c is Campaign => !!c && typeof c === 'object' && typeof (c as Campaign).id === 'string' && typeof (c as Campaign).businessId === 'string')
    : [];
  const trends = Array.isArray(o.trends) && o.trends.length > 0
    ? (o.trends as unknown[]).filter((t): t is TrendItem => !!t && typeof t === 'object' && typeof (t as TrendItem).id === 'string')
    : DEFAULT_TRENDS;
  const usedTrends = o.usedTrends && typeof o.usedTrends === 'object' ? (o.usedTrends as Record<string, string[]>) : {};
  let activeBusinessId = typeof o.activeBusinessId === 'string' ? o.activeBusinessId : null;
  if (activeBusinessId && !businesses.some((b) => b.id === activeBusinessId)) activeBusinessId = businesses[0]?.id ?? null;
  return { version: 2, businesses, activeBusinessId, contents: contents.slice(-300), runs: runs.slice(-120), campaigns: campaigns.slice(-30), trends, usedTrends };
}

function load(): Persisted {
  const empty: Persisted = { version: 2, businesses: [], activeBusinessId: null, contents: [], runs: [], campaigns: [], trends: DEFAULT_TRENDS, usedTrends: {} };
  const v2 = readKey(LS_KEY);
  if (v2) return { ...empty, ...toPersisted(v2) };
  const v1 = readKey(LS_LEGACY);
  if (v1) return { ...empty, ...toPersisted(v1) };
  return empty;
}

// Debounced persist — writes at most once per 150ms burst, flushes on hide.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let latest: Persisted | null = null;
function schedulePersist(p: Persisted) {
  if (typeof window === 'undefined') return;
  latest = p;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      if (latest) window.localStorage.setItem(LS_KEY, JSON.stringify(latest));
    } catch { /* quota or blocked — the app keeps running in memory */ }
  }, 150);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
    try {
      if (latest) window.localStorage.setItem(LS_KEY, JSON.stringify(latest));
    } catch { /* ignore */ }
  });
}

function snapshot(s: PulseState): Persisted {
  return {
    version: 2,
    businesses: s.businesses,
    activeBusinessId: s.activeBusinessId,
    contents: s.contents.slice(-300),
    runs: s.runs.slice(-120),
    campaigns: s.campaigns.slice(-30),
    trends: s.trends,
    usedTrends: s.usedTrends,
  };
}

function pushRun(runs: AgentRun[], r: Omit<AgentRun, 'id' | 'createdAt'>): AgentRun[] {
  return [...runs, { ...r, id: uid('run'), createdAt: nowISO() }].slice(-120);
}

/** Brand-safety guardrail: banned words hold a post for human review. */
function hitsBanned(business: BusinessProfile, text: string): string | null {
  const lower = text.toLowerCase();
  return business.voice.bannedWords.find((w) => w.trim().length > 1 && lower.includes(w.toLowerCase())) ?? null;
}

interface PulseState {
  businesses: BusinessProfile[];
  activeBusinessId: string | null;
  contents: ContentItem[];
  runs: AgentRun[];
  campaigns: Campaign[];
  trends: TrendItem[];
  usedTrends: Record<string, string[]>;
  autopilotBusy: boolean;
  focusContentId: string | null;
  lastPlanAt: Record<string, number>;

  createBusiness: (b: Omit<BusinessProfile, 'id' | 'createdAt'>) => string | null;
  updateBusiness: (id: string, patch: Partial<BusinessProfile>) => void;
  setMode: (id: string, mode: OperatingMode) => void;
  setActive: (id: string) => boolean;
  deleteBusiness: (id: string) => void;

  runWeeklyPlan: (businessId: string) => boolean;
  generateOne: (businessId: string, pillar: string, format: ContentFormat, channel: Channel, angle?: string) => string | null;
  ingestDraft: (businessId: string, draft: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>, campaignId?: string) => string | null;
  transition: (contentId: string, to: ContentState) => boolean;
  pullBack: (contentId: string) => boolean;
  patchContent: (contentId: string, patch: Partial<ContentItem>) => void;
  selectCaption: (contentId: string, idx: number) => void;
  schedule: (contentId: string, iso?: string) => boolean;
  publish: (contentId: string) => boolean;
  analyse: (contentId: string) => void;
  destroyContent: (contentId: string) => void;

  autopilotTick: (businessId: string) => void;
  logRun: (r: Omit<AgentRun, 'id' | 'createdAt'>) => void;
  useTrend: (trendId: string) => string | null;
  refreshTrends: () => boolean;
  loadSample: () => string | null;
  requestFocus: (contentId: string | null) => void;
  restoreSnapshot: (p: unknown) => boolean;
  resetDemo: () => void;
}

export const usePulse = create<PulseState>((set, get) => {
  const saved = typeof window !== 'undefined' ? load() : { version: 2, businesses: [], activeBusinessId: null, contents: [], runs: [], campaigns: [], trends: DEFAULT_TRENDS, usedTrends: {} } as Persisted;

  const commit = (partial: Partial<PulseState>) => {
    set(partial);
    schedulePersist(snapshot(get()));
  };

  return {
    businesses: saved.businesses,
    activeBusinessId: saved.activeBusinessId,
    contents: saved.contents,
    runs: saved.runs,
    campaigns: saved.campaigns,
    trends: saved.trends,
    usedTrends: saved.usedTrends,
    autopilotBusy: false,
    focusContentId: null,
    lastPlanAt: {},

    createBusiness: (b) => {
      const clean: Omit<BusinessProfile, 'id' | 'createdAt'> = {
        businessName: b.businessName.trim().slice(0, 80),
        industry: b.industry.trim().slice(0, 60) || 'Local services',
        location: b.location.trim().slice(0, 60) || 'Brisbane QLD',
        idealCustomer: b.idealCustomer.trim().slice(0, 120) || 'local customers',
        offer: b.offer.trim().slice(0, 140) || 'New-customer offer',
        voice: b.voice,
        channels: b.channels.length > 0 ? b.channels : ['instagram'],
        mode: b.mode,
        postsPerWeek: clampInt(b.postsPerWeek, 1, 14, 5),
        pillars: b.pillars.length > 0 ? b.pillars.map((p) => p.slice(0, 40)) : ['Offers', 'Education', 'Proof'],
        goals: b.goals,
      };
      if (clean.businessName.length < 2) return null;
      const id = uid('biz');
      const business: BusinessProfile = { ...clean, id, createdAt: nowISO() };
      commit({ businesses: [...get().businesses, business], activeBusinessId: id });
      get().logRun({
        agent: 'strategist',
        businessId: id,
        summary: `Nova mapped ${business.postsPerWeek} posts a week across ${business.pillars.length} pillars for ${business.businessName}`,
        detail: `Mode: ${business.mode}. Channels: ${business.channels.join(', ')}. Keeping score by: ${business.goals.primary}.`,
        contentIds: [],
        status: 'success',
        mode: business.mode,
      });
      return id;
    },

    updateBusiness: (id, patch) => {
      const safe: Partial<BusinessProfile> = {};
      if (patch.businessName !== undefined) {
        const v = patch.businessName.trim().slice(0, 80);
        if (v.length < 2) return;
        safe.businessName = v;
      }
      if (patch.industry !== undefined) safe.industry = patch.industry.slice(0, 60);
      if (patch.location !== undefined) safe.location = patch.location.slice(0, 60);
      if (patch.idealCustomer !== undefined) safe.idealCustomer = patch.idealCustomer.slice(0, 120);
      if (patch.offer !== undefined) safe.offer = patch.offer.slice(0, 140);
      if (patch.channels !== undefined && patch.channels.length > 0) safe.channels = patch.channels;
      if (patch.pillars !== undefined && patch.pillars.length > 0) safe.pillars = patch.pillars.map((p) => p.slice(0, 40));
      if (patch.postsPerWeek !== undefined) safe.postsPerWeek = clampInt(patch.postsPerWeek, 1, 14, 5);
      if (patch.voice !== undefined) safe.voice = patch.voice;
      if (patch.goals !== undefined) safe.goals = patch.goals;
      if (patch.mode !== undefined) safe.mode = patch.mode;
      commit({ businesses: get().businesses.map((b) => (b.id === id ? { ...b, ...safe } : b)) });
    },

    setMode: (id, mode) => {
      const biz = get().businesses.find((b) => b.id === id);
      if (!biz) return;
      get().updateBusiness(id, { mode });
      get().logRun({
        agent: 'strategist',
        businessId: id,
        summary: mode === 'autopilot' ? 'Autopilot on — the crew drafts, queues and publishes; flagged posts still come to you' : 'Copilot on — the crew drafts, nothing moves until you sign it off',
        detail: mode === 'autopilot' ? 'Guardrails: your voice, your banned words, your time slots. Anything risky waits for review.' : 'Two taps per post: approve, then queue.',
        contentIds: [],
        status: 'success',
        mode,
      });
    },

    setActive: (id) => {
      if (!get().businesses.some((b) => b.id === id)) return false;
      commit({ activeBusinessId: id });
      return true;
    },

    deleteBusiness: (id) => {
      const s = get();
      const businesses = s.businesses.filter((b) => b.id !== id);
      commit({
        businesses,
        contents: s.contents.filter((c) => c.businessId !== id),
        campaigns: s.campaigns.filter((c) => c.businessId !== id),
        runs: s.runs.filter((r) => r.businessId !== id),
        activeBusinessId: s.activeBusinessId === id ? (businesses[0]?.id ?? null) : s.activeBusinessId,
      });
    },

    runWeeklyPlan: (businessId) => {
      const s = get();
      const business = s.businesses.find((b) => b.id === businessId);
      if (!business) return false;
      const now = Date.now();
      if (now - (s.lastPlanAt[businessId] ?? 0) < 10000) return false; // double-click guard
      set({ lastPlanAt: { ...s.lastPlanAt, [businessId]: now } });
      const plan = weeklyPlan(business);
      const campaign: Campaign = {
        id: uid('camp'),
        businessId,
        name: `Week of ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`,
        objective: business.goals.primary,
        status: 'active',
        weeklyPlan: business.pillars.map((p) => ({ pillar: p, count: Math.max(1, Math.ceil(business.postsPerWeek / business.pillars.length)), cta: `Ask about ${p}` })),
        createdAt: nowISO(),
      };
      const items: ContentItem[] = plan.map((p, i) => {
        const draft = generateDraft({ business, pillar: p.pillar, format: p.format, channel: p.channel }, i);
        const flagged = hitsBanned(business, `${draft.hook} ${draft.captions.join(' ')}`);
        const auto = business.mode === 'autopilot' && !flagged;
        return {
          ...draft,
          id: uid('post'),
          campaignId: campaign.id,
          state: auto ? 'scheduled' : flagged ? 'pending_approval' : 'draft',
          agentNote: flagged ? `Held for review — mentions your banned word “${flagged}”.` : draft.agentNote,
          scheduledFor: auto ? nextSlot(1 + (i % 7), p.channel) : undefined,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
      });
      const st = get();
      commit({
        campaigns: [...st.campaigns, campaign].slice(-30),
        contents: [...st.contents, ...items].slice(-300),
        runs: pushRun(st.runs, {
          agent: 'strategist',
          businessId,
          summary: `Week filed: ${items.length} posts across ${business.channels.join(', ')}`,
          detail: items.map((c) => `${c.pillar} · ${c.format} · ${c.channel}`).join('  |  '),
          contentIds: items.map((c) => c.id),
          status: 'success',
          mode: business.mode,
        }),
      });
      get().logRun({
        agent: 'copywriter',
        businessId,
        summary: `Pen wrote ${items.length} posts — five hooks and three captions each, in your voice`,
        detail: items[0] ? `Opener: “${items[0].hook}”` : '',
        contentIds: items.map((c) => c.id),
        status: business.mode === 'autopilot' ? 'success' : 'needs_review',
        mode: business.mode,
      });
      get().logRun({
        agent: 'visual_director',
        businessId,
        summary: `Frame set the look for ${items.length} posts — layout, overlay limits, shot notes`,
        detail: items[0]?.visualPrompt ?? '',
        contentIds: items.map((c) => c.id),
        status: 'success',
        mode: business.mode,
      });
      if (business.mode === 'autopilot') {
        get().logRun({
          agent: 'scheduler',
          businessId,
          summary: `Clock queued ${items.length} posts into best-time slots`,
          detail: 'Anything due is published from the queue. Missed slots roll forward.',
          contentIds: items.map((c) => c.id),
          status: 'success',
          mode: business.mode,
        });
      }
      return true;
    },

    generateOne: (businessId, pillar, format, channel, angle) => {
      const business = get().businesses.find((b) => b.id === businessId);
      if (!business) return null;
      if (!business.channels.includes(channel)) return null;
      const draft = generateDraft({ business, pillar: pillar.slice(0, 40), format, channel, angle: angle?.slice(0, 120) }, get().contents.length);
      return get().ingestDraft(businessId, draft);
    },

    ingestDraft: (businessId, draft, campaignId) => {
      const business = get().businesses.find((b) => b.id === businessId);
      if (!business) return null;
      const flagged = hitsBanned(business, `${draft.hook} ${draft.captions.join(' ')}`);
      const auto = business.mode === 'autopilot' && !flagged;
      const id = uid('post');
      const item: ContentItem = {
        ...draft,
        id,
        businessId,
        campaignId,
        state: auto ? 'scheduled' : flagged ? 'pending_approval' : 'draft',
        agentNote: flagged ? `Held for review — mentions your banned word “${flagged}”.` : draft.agentNote,
        scheduledFor: auto ? nextSlot(1, draft.channel) : undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      const st = get();
      commit({ contents: [...st.contents, item].slice(-300) });
      get().logRun({
        agent: 'copywriter',
        businessId,
        summary: `Pen filed “${item.hook.slice(0, 60)}…” for ${item.channel}`,
        detail: item.agentNote,
        contentIds: [id],
        status: auto ? 'success' : 'needs_review',
        mode: business.mode,
      });
      return id;
    },

    transition: (contentId, to) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item) return false;
      if (!ALLOWED[item.state].includes(to)) return false;
      if (to === 'scheduled' && !item.scheduledFor) return false; // schedule() assigns the slot
      commit({ contents: get().contents.map((c) => (c.id === contentId ? { ...c, state: to, updatedAt: nowISO() } : c)) });
      return true;
    },

    pullBack: (contentId) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item || item.state !== 'scheduled') return false;
      commit({
        contents: get().contents.map((c) =>
          c.id === contentId ? { ...c, state: 'draft' as ContentState, scheduledFor: undefined, updatedAt: nowISO() } : c
        ),
      });
      return true;
    },

    patchContent: (contentId, patch) => {
      const { id, businessId, createdAt, ...safe } = patch as Record<string, unknown>;
      void id; void businessId; void createdAt;
      commit({
        contents: get().contents.map((c) =>
          c.id === contentId ? { ...c, ...(safe as Partial<ContentItem>), updatedAt: nowISO() } : c
        ),
      });
    },

    selectCaption: (contentId, idx) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item) return;
      const clamped = Math.min(Math.max(0, idx), Math.max(0, item.captions.length - 1));
      commit({
        contents: get().contents.map((c) => (c.id === contentId ? { ...c, selectedCaption: clamped, updatedAt: nowISO() } : c)),
      });
    },

    schedule: (contentId, iso) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item) return false;
      if (!['draft', 'pending_approval', 'idea'].includes(item.state)) return false;
      let slot = iso && !Number.isNaN(new Date(iso).getTime()) ? iso : nextSlot(1, item.channel);
      if (new Date(slot).getTime() < Date.now() - 60000) slot = nextSlot(1, item.channel); // past dates roll forward
      commit({
        contents: get().contents.map((c) =>
          c.id === contentId ? { ...c, state: 'scheduled' as ContentState, scheduledFor: slot, updatedAt: nowISO() } : c
        ),
      });
      const biz = get().businesses.find((b) => b.id === item.businessId);
      get().logRun({
        agent: 'scheduler',
        businessId: item.businessId,
        summary: `Clock queued one post for ${item.channel} — ${new Date(slot).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`,
        detail: `“${item.hook}”`,
        contentIds: [contentId],
        status: 'success',
        mode: biz?.mode ?? 'copilot',
      });
      return true;
    },

    publish: (contentId) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item || item.state !== 'scheduled') return false;
      const code = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      const url = `https://${item.channel}.com/p/${code}`;
      commit({
        contents: get().contents.map((c) =>
          c.id === contentId ? { ...c, state: 'published' as ContentState, publishedAt: nowISO(), publishedUrl: url, updatedAt: nowISO() } : c
        ),
      });
      return true;
    },

    analyse: (contentId) => {
      const item = get().contents.find((c) => c.id === contentId);
      if (!item || (item.state !== 'published' && item.state !== 'analysed')) return;
      const metrics = simulateMetrics(contentId + (item.hook || ''), item.channel);
      const { score, insight } = scoreFromMetrics(metrics);
      const st = get();
      commit({
        contents: st.contents.map((c) =>
          c.id === contentId ? { ...c, state: 'analysed' as ContentState, metrics, score, insight, updatedAt: nowISO() } : c
        ),
        runs: pushRun(st.runs, {
          agent: 'analyst',
          businessId: item.businessId,
          summary: `Lens scored one post ${score}/100 — ${score >= 62 ? 'worth repeating' : 'worth replacing'}`,
          detail: insight,
          contentIds: [contentId],
          status: 'success',
          mode: st.businesses.find((b) => b.id === item.businessId)?.mode ?? 'copilot',
        }),
      });
    },

    destroyContent: (contentId) => {
      commit({ contents: get().contents.filter((c) => c.id !== contentId) });
    },

    autopilotTick: (businessId) => {
      const s = get();
      if (s.autopilotBusy) return;
      const business = s.businesses.find((b) => b.id === businessId);
      if (!business || business.mode !== 'autopilot') return;
      set({ autopilotBusy: true });
      try {
        const items = get().contents.filter((c) => c.businessId === businessId);
        const now = Date.now();
        const due = items.filter(
          (c) => c.state === 'scheduled' && c.scheduledFor && !Number.isNaN(new Date(c.scheduledFor).getTime()) && new Date(c.scheduledFor).getTime() <= now
        );
        const published = due.slice(0, 3);
        published.forEach((d) => get().publish(d.id));
        const queued = get().contents.filter(
          (c) => c.businessId === businessId && (c.state === 'scheduled' || c.state === 'draft' || c.state === 'pending_approval')
        ).length;
        let topped = 0;
        if (queued < business.postsPerWeek) {
          const plan = weeklyPlan(business);
          const need = Math.min(business.postsPerWeek - queued, 3);
          for (let i = 0; i < need; i++) {
            const p = plan[(items.length + i) % plan.length];
            if (get().generateOne(businessId, p.pillar, p.format, p.channel)) topped++;
          }
        }
        get().logRun({
          agent: 'scheduler',
          businessId,
          summary: `Autopilot tick: ${published.length} published, ${topped} filed to hold ${business.postsPerWeek} a week`,
          detail: 'Nova, Pen, Frame, Clock and Lens all reported in.',
          contentIds: published.map((d) => d.id),
          status: 'success',
          mode: 'autopilot',
        });
      } finally {
        set({ autopilotBusy: false });
      }
    },

    logRun: (r) => {
      const st = get();
      commit({ runs: pushRun(st.runs, r) });
    },

    useTrend: (trendId) => {
      const s = get();
      const trend = s.trends.find((t) => t.id === trendId);
      const bizId = s.activeBusinessId;
      if (!trend || !bizId) return null;
      const biz = s.businesses.find((b) => b.id === bizId);
      if (!biz) return null;
      const used = s.usedTrends[bizId] ?? [];
      if (used.includes(trendId)) return null;
      const wantsTikTok = trend.platform.includes('TikTok');
      const wantsLinkedIn = trend.platform.includes('LinkedIn');
      const channel: Channel =
        ((wantsTikTok && biz.channels.includes('tiktok') && 'tiktok') ||
        (wantsLinkedIn && biz.channels.includes('linkedin') && 'linkedin') ||
        biz.channels[0] ||
        'instagram') as Channel;
      const format: ContentFormat = channel === 'linkedin' ? 'carousel' : channel === 'tiktok' ? 'reel' : 'reel';
      const id = get().generateOne(bizId, biz.pillars[0] ?? 'Education', format, channel, trend.suggestedHook);
      if (!id) return null;
      commit({
        usedTrends: { ...get().usedTrends, [bizId]: [...used, trendId] },
        runs: pushRun(get().runs, {
          agent: 'trend_scout',
          businessId: bizId,
          summary: `Scout turned “${trend.title}” into one ${format} for ${channel}`,
          detail: trend.suggestedHook,
          contentIds: [id],
          status: 'success',
          mode: biz.mode,
        }),
      });
      return id;
    },

    refreshTrends: () => {
      const s = get();
      const seen = new Set(s.trends.map((t) => t.title));
      const fresh = TREND_BANK.filter((t) => !seen.has(t.title)).slice(0, 2);
      if (fresh.length === 0) return false;
      commit({
        trends: [...s.trends, ...fresh.map((t) => ({ ...t, id: uid('trend'), status: 'new' as const }))].slice(-14),
      });
      return true;
    },

    loadSample: () => {
      const s = get();
      if (s.businesses.some((b) => b.businessName === 'Harbour Café')) {
        const existing = s.businesses.find((b) => b.businessName === 'Harbour Café')!;
        get().setActive(existing.id);
        return existing.id;
      }
      const id = get().createBusiness({
        businessName: 'Harbour Café',
        industry: 'Café',
        location: 'Brisbane QLD',
        idealCustomer: 'locals who work nearby',
        offer: 'Bottomless filter before 9am, weekdays',
        voice: { tones: ['direct, warm, no fluff'], emojiLevel: 1, bannedWords: ['revolutionary', 'game-changer', 'synergy'] },
        channels: ['instagram', 'tiktok', 'facebook'],
        mode: 'copilot',
        postsPerWeek: 5,
        pillars: ['Offers', 'Proof & Results', 'Education'],
        goals: { primary: 'bookings', targetMonthly: 40 },
      });
      if (!id) return null;
      get().runWeeklyPlan(id);
      return id;
    },

    requestFocus: (contentId) => set({ focusContentId: contentId }),

    restoreSnapshot: (p) => {
      try {
        if (!p || typeof p !== 'object') return false;
        const claimed = (p as Record<string, unknown>).businesses;
        const clean = toPersisted(p);
        // Refuse restores that would wipe a real workspace into nothing.
        if (clean.businesses.length === 0 && Array.isArray(claimed) && claimed.length > 0) return false;
        commit({
          businesses: clean.businesses,
          activeBusinessId: clean.activeBusinessId,
          contents: clean.contents,
          runs: clean.runs,
          campaigns: clean.campaigns,
          trends: clean.trends,
          usedTrends: clean.usedTrends,
        });
        return true;
      } catch {
        return false;
      }
    },

    resetDemo: () => {
      try {
        window.localStorage.removeItem(LS_KEY);
        window.localStorage.removeItem(LS_LEGACY);
      } catch { /* noop */ }
      set({ businesses: [], activeBusinessId: null, contents: [], runs: [], campaigns: [], trends: DEFAULT_TRENDS, usedTrends: {}, focusContentId: null, lastPlanAt: {} });
    },
  };
});

export const activeBusiness = (s: { businesses: BusinessProfile[]; activeBusinessId: string | null }) =>
  s.businesses.find((b) => b.id === s.activeBusinessId) ?? null;
