'use client';

import { useMemo, useState } from 'react';
import { AGENTS } from '@/lib/pulse/agents';
import { usePulse } from '@/lib/pulse/store';
import { useR1 } from '@/lib/pulse/extras';
import type { AgentId } from '@/lib/pulse/types';

const MONOGRAM: Record<AgentId, { initials: string; beat: string; name: string }> = {
  strategist: { initials: 'NV', beat: 'The plan', name: 'Nova, Strategist' },
  trend_scout: { initials: 'SC', beat: 'The radar', name: 'Scout, Trends' },
  copywriter: { initials: 'PN', beat: 'The words', name: 'Pen, Copywriter' },
  visual_director: { initials: 'FR', beat: 'The look', name: 'Frame, Visuals' },
  scheduler: { initials: 'CK', beat: 'The queue', name: 'Clock, Scheduler' },
  analyst: { initials: 'LN', beat: 'The verdict', name: 'Lens, Analyst' },
};

const TRIGGER_LABEL: Record<string, string> = {
  'New business onboarded': 'New business',
  'Monday 06:00 plan': 'Monday plan',
  'Analyst flags -20% dip': 'Slow week',
  'Every 6h poll': 'Trend watch',
  'High-relevance trend (>0.9)': 'Hot trend',
  'New idea created': 'New brief',
  'Strategist plan published': 'Week filed',
  'Copy draft complete': 'Draft ready',
  'Approval passed': 'Signed off',
  'Friday batch run': 'Friday queue',
  'Autopilot auto-approve': 'Autopilot',
  'T+24h after publish': 'Day-after check',
  'Friday rollup': 'Friday review',
};

const triggerLabel = (t: string): string => TRIGGER_LABEL[t] ?? t;

export function Monogram({ agent, size = 'md' }: { agent: AgentId; size?: 'sm' | 'md' }) {
  const m = MONOGRAM[agent];
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-md border border-ink bg-ink font-mono font-bold text-paper ${size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs'}`}
    >
      {m.initials}
    </span>
  );
}

interface Reply {
  id: string;
  q: string;
  a: string;
  at: string;
  failed?: boolean;
}

export default function Fleet() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const runs = usePulse((s) => s.runs);
  const activity = useR1((s) => s.activity);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;

  const [chatAgent, setChatAgent] = useState<AgentId>('strategist');
  const [msg, setMsg] = useState('');
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [busy, setBusy] = useState(false);

  const bizRuns = useMemo(() => runs.filter((r) => !r.businessId || r.businessId === biz?.id).slice().reverse().slice(0, 30), [runs, biz?.id]);
  const timeline = useMemo(() => {
    const runRows = runs
      .filter((r) => !r.businessId || r.businessId === biz?.id)
      .map((r) => ({ id: r.id, kind: r.agent.replace('_', ' '), summary: r.summary, createdAt: r.createdAt, agent: r.agent as AgentId | null, status: r.status }));
    const actRows = activity
      .filter((a) => !a.businessId || a.businessId === biz?.id)
      .map((a) => ({ id: a.id, kind: a.kind, summary: a.summary, createdAt: a.createdAt, agent: null as AgentId | null, status: '' }));
    return [...runRows, ...actRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  }, [runs, activity, biz?.id]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    contents.forEach((x) => {
      if (x.businessId === biz?.id) c[x.state] = (c[x.state] ?? 0) + 1;
    });
    return c;
  }, [contents, biz?.id]);
  const runsByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    runs.forEach((r) => {
      if (!r.businessId || r.businessId === biz?.id) m[r.agent] = (m[r.agent] ?? 0) + 1;
    });
    return m;
  }, [runs, biz?.id]);

  const ask = async () => {
    const q = msg.trim().slice(0, 2000);
    if (!q || busy) return;
    setBusy(true);
    setMsg('');
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch('/api/pulse/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentId: chatAgent, message: q, businessName: biz?.businessName }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      if (!data.reply) throw new Error('empty');
      setReplies((prev) => ({ ...prev, [chatAgent]: [...(prev[chatAgent] ?? []), { id, q, a: data.reply as string, at: new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) }].slice(-8) }));
    } catch {
      setReplies((prev) => ({ ...prev, [chatAgent]: [...(prev[chatAgent] ?? []), { id, q, a: '', at: '', failed: true }].slice(-8) }));
    }
    setBusy(false);
  };

  const retry = (r: Reply) => {
    setReplies((prev) => ({ ...prev, [chatAgent]: (prev[chatAgent] ?? []).filter((x) => x.id !== r.id) }));
    setMsg(r.q);
  };

  if (!biz) return null;
  const active = AGENTS.find((a) => a.id === chatAgent) ?? AGENTS[0];
  const statusLine = biz.mode === 'autopilot' ? 'runs alone' : 'drafts for you';

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AGENTS.map((a, i) => {
            const sel = chatAgent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setChatAgent(a.id)}
                aria-pressed={sel}
                aria-label={`Talk to ${MONOGRAM[a.id].name}`}
                className={`min-h-[44px] p-4 text-left ${sel ? 'pp-card-raised' : 'pp-card hover:border-ink'}`}
              >
                <div className="flex items-center gap-3">
                  <Monogram agent={a.id} />
                  <div>
                    <p className="font-display text-base font-bold leading-tight">{a.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-faint">{String(i + 1).padStart(2, '0')} · {a.role}</p>
                  </div>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-moss">
                    {statusLine}
                  </span>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-inksoft">{a.mission}</p>
                <p className="mt-2 border-t border-line pt-1.5 font-mono text-[11px] text-faint">{runsByAgent[a.id] ?? 0} jobs for {biz.businessName} · first task: {triggerLabel(a.triggers[0]).toLowerCase()}</p>
              </button>
            );
          })}
        </div>

        <div className="pp-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
            <h2 className="font-display text-lg font-bold">The wire — {biz.businessName}</h2>
            <div className="flex gap-1.5 font-mono text-[10px] text-inksoft">
              {Object.entries(counts).map(([k, v]) => (
                <span key={k} className="rounded-sm border border-line px-1.5 py-0.5">{k.replace('_', ' ')} {v}</span>
              ))}
            </div>
          </div>
          <div className="nice-scroll mt-2 max-h-none space-y-0 overflow-visible sm:max-h-96 sm:overflow-y-auto">
            {timeline.length === 0 && <p className="py-3 text-sm text-faint">Quiet so far — file the weekly plan and the wire comes alive.</p>}
            {timeline.map((r) => (
              <div key={r.id} className="flex gap-2.5 border-b border-line py-2.5 last:border-0">
                {r.agent ? <Monogram agent={r.agent} size="sm" /> : (
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-cream font-mono text-[10px] font-bold text-inksoft">•</span>
                )}
                <div>
                  <p className="text-[13px]"><span className="font-mono text-[11px] font-bold uppercase tracking-wider">{r.kind}</span> <span className="text-inksoft">— {r.summary}</span></p>
                  <p className="mt-0.5 font-mono text-[10px] text-faint">{new Date(r.createdAt).toLocaleString('en-AU')}{r.status ? ` · ${r.status}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pp-card-raised h-fit p-4">
        <p className="kicker">Direct line</p>
        <div className="mt-2 flex items-center gap-2.5">
          <Monogram agent={chatAgent} />
          <div>
            <p className="font-display text-base font-bold leading-tight">{active.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-faint">{active.role}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Choose who to ask">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setChatAgent(a.id)}
              aria-pressed={chatAgent === a.id}
              aria-label={`Talk to ${MONOGRAM[a.id].name}`}
              className={`min-h-[44px] rounded border px-2.5 py-1 font-mono text-[11px] font-bold ${chatAgent === a.id ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft hover:border-ink'}`}
            >
              {MONOGRAM[a.id].initials}
            </button>
          ))}
        </div>
        <div className="nice-scroll mt-3 max-h-none space-y-2 overflow-visible sm:max-h-80 sm:overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation">
          {(replies[chatAgent] ?? []).length === 0 && (
            <p className="text-[13px] text-faint">Ask {active.name.split(' — ')[0]} anything — strategy, hooks, best times, what to file next.</p>
          )}
          {(replies[chatAgent] ?? []).map((t) => (
            <div key={t.id} className="space-y-1.5">
              <p className="rounded-md border border-line bg-paper p-2.5 text-[13px]">You — {t.q}</p>
              {t.failed ? (
                <div className="rounded-md border border-ember bg-blush p-2.5">
                  <p className="text-[13px]">That one did not send — the line dropped.</p>
                  <button onClick={() => retry(t)} className="btn-ghost mt-1.5 min-h-[44px] px-3 py-1 text-xs">Try again</button>
                </div>
              ) : (
                <p className="rounded-md border border-ink bg-blush p-2.5 text-[13px] leading-relaxed">{t.a} <span className="font-mono text-[10px] text-faint">{t.at}</span></p>
              )}
            </div>
          ))}
          {busy && <p className="font-mono text-xs text-faint" role="status">Writing back…</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <label htmlFor="crew-chat" className="sr-only">Ask {MONOGRAM[chatAgent].name}</label>
          <input
            id="crew-chat"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            maxLength={2000}
            disabled={busy}
            placeholder={`Ask ${MONOGRAM[chatAgent].initials}… (Enter sends)`}
            className="field disabled:opacity-60"
          />
          <button onClick={ask} disabled={busy || !msg.trim()} className="btn-ink min-h-[44px] shrink-0 px-4 py-2 text-sm disabled:opacity-40">Send</button>
        </div>
        {(replies[chatAgent] ?? []).length > 0 && (
          <button onClick={() => setReplies((prev) => ({ ...prev, [chatAgent]: [] }))} className="mt-2 font-mono text-[11px] uppercase tracking-wider text-faint hover:text-ink">Clear this thread</button>
        )}
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="kicker">Chain of command</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-inksoft">Nova plans → Pen writes → Frame directs → Clock queues → Lens scores. Copilot: you sign each step, twice. Autopilot: they run the loop.</p>
        </div>
      </div>
    </div>
  );
}
