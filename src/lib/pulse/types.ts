// PulsePilot — multi-agent marketing & content management micro-SaaS
// Core domain types. Copilot-first, Autopilot-capable.

export type Channel = 'instagram' | 'tiktok' | 'facebook' | 'linkedin';
export type OperatingMode = 'copilot' | 'autopilot';
export type ContentState =
  | 'idea'
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'published'
  | 'analysed'
  | 'rejected';
export type ContentFormat =
  | 'reel'
  | 'carousel'
  | 'static'
  | 'story'
  | 'text'
  | 'poll'
  | 'live'
  | 'newsletter';

export interface CarouselSlide {
  headline: string;
  body: string;
  visual: string;
}

export interface StoryFrame {
  text: string;
  sticker?: string;
  cta?: string;
}

export interface PollData {
  question: string;
  options: string[];
  duration: string;
  followUp: string;
}

export interface LiveSegment {
  time: string;
  title: string;
  detail: string;
}

export interface NewsletterData {
  subject: string;
  preview: string;
  sections: { heading: string; body: string }[];
  cta: string;
}
export type AgentId =
  | 'strategist'
  | 'trend_scout'
  | 'copywriter'
  | 'visual_director'
  | 'scheduler'
  | 'analyst';

export interface BrandVoice {
  tones: string[];
  emojiLevel: 0 | 1 | 2;
  bannedWords: string[];
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  industry: string;
  location: string;
  idealCustomer: string;
  offer: string;
  voice: BrandVoice;
  channels: Channel[];
  mode: OperatingMode;
  postsPerWeek: number;
  pillars: string[];
  goals: { primary: string; targetMonthly: number };
  createdAt: string;
}

export interface ContentItem {
  id: string;
  businessId: string;
  campaignId?: string;
  state: ContentState;
  pillar: string;
  format: ContentFormat;
  channel: Channel;
  hook: string;
  hooks: string[];
  captions: string[];
  selectedCaption: number;
  hashtags: string[];
  script?: string;
  slides?: CarouselSlide[];
  frames?: StoryFrame[];
  poll?: PollData;
  livePlan?: LiveSegment[];
  newsletter?: NewsletterData;
  collabWith?: string;
  isTrialReel?: boolean;
  link?: string;
  visualPrompt?: string;
  altText?: string;
  scheduledFor?: string;
  publishedAt?: string;
  publishedUrl?: string;
  metrics?: ContentMetrics;
  score?: number;
  insight?: string;
  confidence: number;
  agentNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentMetrics {
  reach: number;
  likes: number;
  saves: number;
  comments: number;
  shares: number;
  follows: number;
  clicks: number;
}

export interface AgentRun {
  id: string;
  agent: AgentId;
  businessId?: string;
  summary: string;
  detail: string;
  contentIds: string[];
  status: 'success' | 'needs_review' | 'failed';
  mode: OperatingMode;
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  objective: string;
  status: 'active' | 'paused' | 'completed';
  weeklyPlan: { pillar: string; count: number; cta: string }[];
  createdAt: string;
}

export interface TrendItem {
  id: string;
  title: string;
  platform: string;
  relevance: number;
  expiresIn: string;
  suggestedHook: string;
  status: 'new' | 'used' | 'expired';
}
