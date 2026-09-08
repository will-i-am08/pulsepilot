'use client';

import { useMemo, useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { weekReport } from '@/lib/pulse/export';

export default function AnalyticsView() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const runWeeklyPlan = usePulse((s) => s.runWeeklyPlan);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;
  const [planning, setPlanning] = useState(false);
  const [reportNote, setReportNote] = useState('');

  const items = useMemo(
    () => contents.filter((c) => c.businessId === biz?.id && c.metrics && typeof c.score === 'number'),
    [contents, biz?.id]
  );

  if (!biz) return null;

  const totals = items.reduce(
    (a, c) => {
      const m = c.metrics;
      if (!m) return a;
      return {
        reach: a.reach + m.reach,
        likes: a.likes + m.likes,
        saves: a.saves + m.saves,
        comments: a.comments + m.comments,
        shares: a.shares + m.shares,
        follows: a.follows + m.follows,
      };
    },
    { reach: 0, likes: 0, saves: 0, comments: 0, shares: 0, follows: 0 }
  );

  const ranked = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const byPillar: Record<string, { n: number; avg: number }> = {};
  items.forEach((c) => {
    const p = byPillar[c.pillar] ?? { n: 0, avg: 0 };
    byPillar[c.pillar] = { n: p.n + 1, avg: p.avg + (c.score ?? 0) };
  });
  const pillarRows = Object.entries(byPillar)
    .map(([k, v]) => ({ pillar: k, n: v.n, avg: Math.round(v.avg / Math.max(1, v.n)) }))
    .sort((a, b) => b.avg - a.avg);

  const top = ranked[0];
  const steer =
    !top || top.score == null
      ? 'File three posts and Lens will have something to read. No data, no opinions — that is the house rule.'
      : top.score >= 62
        ? `Run more “${top.pillar}” as ${top.format} on ${top.channel}. Re-file a variant of “${top.hook.slice(0, 60)}…” within 7 days.`
        : 'Nothing has cleared our 62-point bar yet — 62 means the hook earned its keep. Drop the weakest angle, keep the pillars, try new opening lines this week.';

  const plan = () => {
    setPlanning(true);
    runWeeklyPlan(biz.id);
    setTimeout(() => setPlanning(false), 1200);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(weekReport(biz, items));
      setReportNote('Report copied — paste it into any email or doc.');
    } catch {
      setReportNote('Copy failed — read the numbers aloud instead.');
    }
    setTimeout(() => setReportNote(''), 4000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="pp-card p-4 lg:col-span-2">
        <p className="kicker">Lens reads the numbers</p>
        <h2 className="font-display text-lg font-bold">What worked</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-faint">Nothing scored yet — publish a post, then send it to Lens from the desk.</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-6">
              {[
                ['Reach', totals.reach],
                ['Likes', totals.likes],
                ['Saves', totals.saves],
                ['Comments', totals.comments],
                ['Shares', totals.shares],
                ['Follows', totals.follows],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-cream p-2.5 text-center">
                  <p className="font-display text-xl font-black">{(v as number).toLocaleString()}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-faint">{k}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={copyReport} className="btn-ghost min-h-[44px] px-4 py-2 text-sm">Copy week report</button>
              {reportNote && <span className="self-center font-mono text-xs text-moss" role="status">{reportNote}</span>}
            </div>
            <h3 className="kicker mt-5">The leaderboard</h3>
            <div className="mt-2 space-y-0 border-t border-line">
              {ranked.slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex gap-3 border-b border-line py-2.5">
                  <p className="font-display text-2xl font-black text-emberdeep">{c.score}</p>
                  <div>
                    <p className="text-sm font-medium leading-snug"><span className="font-mono text-[11px] text-faint">#{i + 1}</span> — {c.hook}</p>
                    <p className="mt-0.5 text-xs text-inksoft">{c.insight}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase text-faint">{c.pillar} · {c.format} · {c.channel} · reach {(c.metrics?.reach ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="space-y-4">
        <div className="pp-card-raised p-4">
          <p className="kicker">Next week&apos;s orders</p>
          <p className="mt-1.5 font-display text-lg font-bold leading-snug">{steer}</p>
          <button onClick={plan} disabled={planning} className="btn-ember mt-3 min-h-[44px] px-4 py-2 text-sm disabled:opacity-50">
            {planning ? 'Filing…' : 'Plan next week from this'}
          </button>
        </div>
        <div className="pp-card p-4">
          <h3 className="kicker">Pillars, ranked</h3>
          <div className="mt-2 space-y-1.5">
            {pillarRows.length === 0 && <p className="font-mono text-xs text-faint">No posts filed yet.</p>}
            {pillarRows.map((r, i) => (
              <div key={r.pillar} className="flex items-baseline justify-between border-b border-line pb-1.5 last:border-0">
                <span className="text-sm"><span className="font-mono text-[11px] text-faint">{i + 1}.</span> {r.pillar} <span className="font-mono text-[11px] text-faint">×{r.n}</span></span>
                <span className="font-display text-lg font-black">{r.avg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
