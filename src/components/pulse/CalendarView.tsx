'use client';

import { useMemo, useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { download, queueICS } from '@/lib/pulse/export';
import { slotLabel } from '@/lib/pulse/slots';
import type { ContentItem } from '@/lib/pulse/types';

export default function CalendarView() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const publish = usePulse((s) => s.publish);
  const pullBack = usePulse((s) => s.pullBack);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;
  const [offset, setOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const days = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + offset * 7);
    const dow = (base.getDay() + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [offset]);

  const monthCells = useMemo(() => {
    const base = new Date();
    const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first blanks
    const monthName = first.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    return { cells, monthName };
  }, [monthOffset]);

  const items = useMemo(
    () => contents.filter((c) => c.businessId === biz?.id && (c.state === 'scheduled' || c.state === 'published' || c.state === 'analysed')),
    [contents, biz?.id]
  );

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const itemDay = (c: ContentItem): string | null => {
    const iso = c.scheduledFor ?? c.publishedAt;
    if (!iso) return null;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;
    return dayKey(t);
  };

  if (!biz) return null;

  const forDay = (d: Date) => items.filter((c) => itemDay(c) === dayKey(d));
  const upcoming = items
    .filter((c) => c.scheduledFor)
    .sort((a, b) => (a.scheduledFor as string).localeCompare(b.scheduledFor as string));

  const doPublish = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((v) => (v === id ? null : v)), 4000);
      return;
    }
    setConfirmId(null);
    publish(id);
  };

  const card = (c: ContentItem) => (
    <div key={c.id} className="rounded-sm border border-line bg-cream p-2">
      <p className="text-[11px] font-medium leading-tight">{c.hook.slice(0, 60)}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase text-faint">
        {c.channel} · {c.state}
        {c.scheduledFor ? ` · ${new Date(c.scheduledFor).toLocaleString('en-AU', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}
      </p>
      <div className="mt-1.5 flex gap-1.5">
        {c.state === 'scheduled' && (
          <button onClick={() => doPublish(c.id)} className="min-h-[44px] rounded-sm bg-moss px-2.5 py-1 font-mono text-[11px] font-bold text-white" aria-label={`Publish ${c.hook}`}>
            {confirmId === c.id ? 'Tap again — live' : 'Publish'}
          </button>
        )}
        {c.state === 'scheduled' && (
          <button onClick={() => pullBack(c.id)} className="min-h-[44px] rounded-sm border border-line px-2.5 py-1 font-mono text-[11px] text-inksoft hover:border-ink" aria-label={`Pull ${c.hook} back to drafts`}>Pull</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="pp-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <div>
          <p className="kicker">{view === 'week' ? 'The week ahead' : monthCells.monthName}</p>
          <h2 className="font-display text-lg font-bold">
            {view === 'week' ? `Seven days, ${items.length} posts in motion` : `${items.length} posts on the books`}
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="flex gap-1" role="group" aria-label="Calendar view">
            <button onClick={() => setView('week')} aria-pressed={view === 'week'} className={`min-h-[44px] rounded border px-3 py-1.5 font-mono text-xs font-bold ${view === 'week' ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft'}`}>Week</button>
            <button onClick={() => setView('month')} aria-pressed={view === 'month'} className={`min-h-[44px] rounded border px-3 py-1.5 font-mono text-xs font-bold ${view === 'month' ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft'}`}>Month</button>
          </span>
          {view === 'week' ? (
            <span className="flex gap-1.5" role="group" aria-label="Change week">
              <button onClick={() => setOffset((o) => o - 1)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">← Prev</button>
              <button onClick={() => setOffset(0)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">This week</button>
              <button onClick={() => setOffset((o) => o + 1)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">Next →</button>
            </span>
          ) : (
            <span className="flex gap-1.5" role="group" aria-label="Change month">
              <button onClick={() => setMonthOffset((o) => o - 1)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">← Prev</button>
              <button onClick={() => setMonthOffset(0)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">This month</button>
              <button onClick={() => setMonthOffset((o) => o + 1)} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs">Next →</button>
            </span>
          )}
          <button onClick={() => download(`${biz.businessName.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}-queue.ics`, queueICS(biz.businessName, items), 'text/calendar')} className="btn-ghost min-h-[44px] px-3 py-1.5 font-mono text-xs" title="Import the queue into Google or Apple Calendar">.ics</button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="mt-3">
          <div className="grid grid-cols-7 gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-faint">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="py-1 text-center">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells.cells.map((d, i) => {
              if (!d) return <span key={`blank-${i}`} className="min-h-12 rounded-sm sm:min-h-16" />;
              const list = forDay(d);
              const isToday = new Date().toDateString() === d.toDateString();
              return (
                <div key={d.toISOString()} className={`min-h-12 rounded-sm border p-1 sm:min-h-16 ${isToday ? 'border-ink bg-blush' : 'border-line bg-paper'}`}>
                  <p className={`font-mono text-[11px] font-bold ${isToday ? 'text-emberdeep' : ''}`}>{d.getDate()}</p>
                  <div className="mt-0.5 space-y-0.5">
                    {list.slice(0, 3).map((c) => (
                      <p key={c.id} className="truncate rounded-sm bg-cream px-1 font-mono text-[10px]" title={`${c.hook} · ${c.channel}`}>
                        {c.channel.slice(0, 2).toUpperCase()} · {c.hook.slice(0, 18)}
                      </p>
                    ))}
                    {list.length > 3 && <p className="font-mono text-[10px] text-faint">+{list.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <>
      {/* Phone agenda */}
      <div className="mt-3 space-y-1.5 sm:hidden">
        {upcoming.length === 0 && <p className="py-3 text-center font-mono text-xs text-faint">Nothing queued — file a post and it lands here.</p>}
        {upcoming.slice(0, 20).map((c) => (
          <div key={c.id}>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-emberdeep">
              {new Date(c.scheduledFor as string).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            {card(c)}
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="mt-3 hidden grid-cols-7 gap-2 sm:grid">
        {days.map((d) => {
          const list = forDay(d);
          const isToday = new Date().toDateString() === d.toDateString();
          return (
            <div key={d.toISOString()} className={`rounded-md border p-2 ${isToday ? 'border-ink bg-blush' : 'border-line bg-paper'}`}>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider">{d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}{isToday ? ' · today' : ''}</p>
              <div className="mt-1.5 space-y-1.5">{list.map(card)}</div>
              {list.length === 0 && <p className="font-mono text-[11px] text-faint">Nothing queued</p>}
            </div>
          );
        })}
      </div>
      </>
      )}
      <p className="mt-3 border-t border-line pt-2 font-mono text-[11px] leading-relaxed text-faint">House slots — {slotLabel()}. Missed slots roll to the next window on Autopilot. Pulled posts return to drafts, history intact.</p>
    </div>
  );
}
