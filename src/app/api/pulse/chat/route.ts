import { NextResponse } from 'next/server';
import { AGENTS } from '@/lib/pulse/agents';
import { slotLabel } from '@/lib/pulse/slots';
import { callClaude, clientKey, isRecord, rateLimit, str } from '../_lib';

export const dynamic = 'force-dynamic';

// Local fallback replies — warm, specific, no false affordances.
function localReply(agentId: string, message: string, businessName?: string): string {
  const who = businessName ?? 'this business';
  const m = message.toLowerCase();
  if (agentId === 'strategist') {
    return `For ${who}, I would run three posts this week: one proof post (a number, a screenshot), one teaching post (the mistake your buyers keep making), one offer post with a single next step. File the proof first — it earns the attention the offer post spends. Tap “Plan the week” and I will lay it out.`;
  }
  if (agentId === 'copywriter') {
    const topic = m.includes('book') ? 'bookings' : m.includes('sale') ? 'sales' : 'enquiries';
    return `Give me the rough idea and I will shape it: promise in line one, proof in line two, one call to action at the end. What is this one about — ${topic}? One sentence is enough.`;
  }
  if (agentId === 'trend_scout') {
    return `Freshest pattern on my wire: process reels and comment-to-DM posts are still earning replies. Both date fast. Open the Trends tab, pick one, and I will bend it to your pillar without copying anyone.`;
  }
  if (agentId === 'visual_director') {
    return `House rules that never miss: hook text in the top third, one idea per frame, overlay under eight words or reach falls off. Tell me the format — reel, carousel or still — and I will write the exact shot list.`;
  }
  if (agentId === 'scheduler') {
    return `I queue to these slots — ${slotLabel()}. Missed slots roll to the next window on Autopilot, and anything queued can be pulled back to drafts. Want the queue full? Run an autopilot tick from the header.`;
  }
  return `Read it like this: reach without saves means the hook worked and the middle did not. Saves without follows means useful but forgettable — promise part two. Publish a post, score it with Lens, and paste the numbers back here.`;
}

// POST /api/pulse/chat — talk to any agent. Claude when keyed, local brain otherwise.
export async function POST(req: Request) {
  try {
    if (!rateLimit(`chat:${clientKey(req)}`, 30)) {
      return NextResponse.json({ error: 'Too many requests — give it a minute.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Tell us which agent and what to ask.' }, { status: 400 });
    const agentId = str(body.agentId, 30);
    const message = str(body.message, 2000);
    const businessName = str(body.businessName, 80) ?? undefined;
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent || !message) {
      return NextResponse.json({ error: 'Tell us which agent and what to ask.' }, { status: 400 });
    }

    const text = await callClaude(
      `You are ${agent.name}, ${agent.role} at PulsePilot, an AI marketing crew for small businesses${businessName ? ` (client: ${businessName})` : ''}. Mission: ${agent.mission}. Write in plain Australian English, warm and direct, max 120 words, no slang, no unexplained jargon, no sycophantic openers. End with one concrete next step the user can take inside the app.`,
      message,
      600
    );
    if (text) return NextResponse.json({ engine: 'claude', reply: text }, { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ engine: 'local', reply: localReply(agent.id, message, businessName) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'The crew line dropped — try again in a moment.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
