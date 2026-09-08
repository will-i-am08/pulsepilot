import type { AgentId } from './types';

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  mission: string;
  triggers: string[];
  outputs: string[];
  emoji: string;
  color: string;
}

export const AGENTS: AgentDef[] = [
  {
    id: 'strategist',
    name: 'Nova — Strategist',
    role: 'Head of Strategy',
    mission: 'Turns your offer + audience into a weekly content plan across pillars. Decides what to post, where, and why.',
    triggers: ['New business onboarded', 'Monday 06:00 plan', 'Analyst flags -20% dip'],
    outputs: ['Weekly plan', 'Content pillars', 'CTA per post'],
    emoji: '🧭',
    color: '#7c3aed',
  },
  {
    id: 'trend_scout',
    name: 'Scout — Trend Radar',
    role: 'Trend researcher',
    mission: 'Watches formats, audio, and competitor angles. Injects fresh hooks before they date.',
    triggers: ['Every 6h poll', 'High-relevance trend (>0.9)'],
    outputs: ['Trend brief', 'Hook injection', 'Expiry warnings'],
    emoji: '📡',
    color: '#0ea5e9',
  },
  {
    id: 'copywriter',
    name: 'Pen — Copywriter',
    role: 'Conversion copy',
    mission: 'Writes hooks, captions, hashtags and video scripts in your brand voice. Five hooks and three captions, every time.',
    triggers: ['New idea created', 'Strategist plan published'],
    outputs: ['5 hooks', '3 captions', 'Hashtags + script'],
    emoji: '✍️',
    color: '#f59e0b',
  },
  {
    id: 'visual_director',
    name: 'Frame — Visual Director',
    role: 'Creative direction',
    mission: 'Directs every visual: format, overlay text, shot list and image prompts. No stock-photo look.',
    triggers: ['Copy draft complete'],
    outputs: ['Visual prompt', 'Overlay text', 'Alt text'],
    emoji: '🎨',
    color: '#ec4899',
  },
  {
    id: 'scheduler',
    name: 'Clock — Scheduler',
    role: 'Publisher & queue',
    mission: 'Queues approved posts at best times, manages the calendar, publishes (or hands off to native schedulers).',
    triggers: ['Approval passed', 'Friday batch run', 'Autopilot auto-approve'],
    outputs: ['Scheduled slots', 'Publish log', 'Missed-slot recovery'],
    emoji: '🗓️',
    color: '#10b981',
  },
  {
    id: 'analyst',
    name: 'Lens — Analyst',
    role: 'Performance brain',
    mission: 'Scores every published post, tells you what to double down on and what to kill. Feeds next week.',
    triggers: ['T+24h after publish', 'Friday rollup'],
    outputs: ['Score 0–100', 'Plain-English insight', 'Next-week steer'],
    emoji: '📊',
    color: '#6366f1',
  },
];
