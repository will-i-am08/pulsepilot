'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { download, postTXT, queueCSV, signoffSheet } from '@/lib/pulse/export';
import type { Channel, ContentFormat, ContentItem, ContentState } from '@/lib/pulse/types';

const COLS: { id: ContentState; label: string }[] = [
  { id: 'idea', label: 'Ideas' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending_approval', label: 'Awaiting sign-off' },
  { id: 'scheduled', label: 'Queued' },
  { id: 'published', label: 'Published' },
  { id: 'analysed', label: 'Scored' },
];

const FORMATS: { v: ContentFormat; hint: string }[] = [
  { v: 'reel', hint: 'Short video · IG/TikTok/FB' },
  { v: 'carousel', hint: 'Slide-by-slide · IG/LinkedIn/TikTok' },
  { v: 'static', hint: 'Single image post' },
  { v: 'story', hint: 'Frames + stickers · 24h' },
  { v: 'text', hint: 'Text-only · LinkedIn/FB' },
  { v: 'poll', hint: 'Question + options' },
  { v: 'live', hint: 'Run-of-show + promo' },
  { v: 'newsletter', hint: 'Subject + sections' },
];

const COL_CAP = 30;

export default function ContentBoard() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const focusContentId = usePulse((s) => s.focusContentId);
  const requestFocus = usePulse((s) => s.requestFocus);
  const runWeeklyPlan = usePulse((s) => s.runWeeklyPlan);
  const generateOne = usePulse((s) => s.generateOne);
  const ingestDraft = usePulse((s) => s.ingestDraft);
  const autopilotTick = usePulse((s) => s.autopilotTick);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pillar, setPillar] = useState('');
  const [format, setFormat] = useState<ContentFormat>('reel');
  const [channel, setChannel] = useState<Channel>('instagram');
  const [angle, setAngle] = useState('');
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [planning, setPlanning] = useState(false);
  const [sheetNote, setSheetNote] = useState('');
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => contents.filter((c) => c.businessId === biz?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [contents, biz?.id]
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [c.hook, c.pillar, c.channel, c.format, c.state, ...(c.captions ?? [])].join(' ').toLowerCase().includes(q)
    );
  }, [items, query]);
  const selected = items.find((c) => c.id === selectedId) ?? null;
  const rejected = items.filter((c) => c.state === 'rejected');

  useEffect(() => {
    if (focusContentId && items.some((c) => c.id === focusContentId)) {
      setSelectedId(focusContentId);
      requestFocus(null);
    }
  }, [focusContentId, items, requestFocus]);

  useEffect(() => {
    if (biz && !biz.channels.includes(channel)) setChannel(biz.channels[0] ?? 'instagram');
  }, [biz, channel]);

  if (!biz) return null;

  const fileViaApi = async (): Promise<boolean> => {
    const p = pillar || biz.pillars[0] || 'Offers';
    setComposerBusy(true);
    setComposerError('');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch('/api/pulse/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          business: biz,
          pillar: p,
          format,
          channel,
          angle: angle || undefined,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { drafts?: Record<string, unknown>[] };
        const d = data.drafts?.[0];
        if (d && typeof d.hook === 'string' && Array.isArray(d.captions)) {
          const id = ingestDraft(biz.id, {
            businessId: biz.id,
            state: 'draft',
            pillar: p,
            format,
            channel,
            hook: String(d.hook),
            hooks: Array.isArray(d.hooks) ? (d.hooks as string[]) : [String(d.hook)],
            captions: d.captions as string[],
            selectedCaption: 0,
            hashtags: Array.isArray(d.hashtags) ? (d.hashtags as string[]) : [],
            script: typeof d.script === 'string' ? d.script : undefined,
            confidence: 0.85,
            agentNote: 'Filed by Pen · written for this channel, kept in your voice.',
          });
          if (id) {
            setComposerOpen(false);
            setAngle('');
            setSelectedId(id);
            return true;
          }
        }
      }
    } catch { /* fall through to local engine */ }
    finally {
      setComposerBusy(false);
    }
    return false;
  };

  const create = async () => {
    const ok = await fileViaApi();
    if (ok) return;
    const p = pillar || biz.pillars[0] || 'Offers';
    const id = generateOne(biz.id, p, format, channel, angle || undefined);
    if (!id) {
      setComposerError('That one did not file — check the outlet is still on your books, then try again.');
      return;
    }
    setComposerOpen(false);
    setAngle('');
    setSelectedId(id);
  };

  const plan = () => {
    setPlanning(true);
    runWeeklyPlan(biz.id);
    setTimeout(() => setPlanning(false), 1200);
  };

  const copySheet = async () => {
    try {
      await navigator.clipboard.writeText(signoffSheet(biz, items));
      setSheetNote('Sign-off sheet copied — paste it straight into an email.');
    } catch {
      setSheetNote('Copy failed — select the drafts manually for now.');
    }
    setTimeout(() => setSheetNote(''), 4000);
  };

  return (
    <div>
      <p className="kicker">
        {biz.mode === 'copilot'
          ? 'Copilot — every post needs your sign-off. Two taps: approve, then queue.'
          : 'Autopilot — the crew files and queues alone. Anything risky waits for you.'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={plan} disabled={planning} className="btn-ember min-h-[44px] px-4 py-2 text-sm disabled:opacity-50">
          {planning ? 'Filing…' : `Plan the week (${biz.postsPerWeek})`}
        </button>
        <button onClick={() => setComposerOpen((v) => !v)} className="btn-ghost min-h-[44px] px-4 py-2 text-sm">+ New post</button>
        {biz.mode === 'autopilot' && (
          <button onClick={() => autopilotTick(biz.id)} className="btn-ghost min-h-[44px] px-4 py-2 text-sm" title="Files top-ups and publishes anything due">Run autopilot tick</button>
        )}
        <button onClick={copySheet} className="btn-ghost min-h-[44px] px-4 py-2 text-sm">Copy client sign-off sheet</button>
        <button onClick={() => download(`${biz.businessName.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}-queue.csv`, queueCSV(items), 'text/csv')} className="btn-ghost min-h-[44px] px-4 py-2 text-sm" title="Open in Sheets or Excel, or hand to a VA">Export queue (.csv)</button>
        <label className="ml-auto flex min-h-[44px] items-center gap-2">
          <span className="sr-only">Search posts</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
            placeholder="Search the desk…"
            aria-label="Search posts"
            className="field w-44 py-1.5 text-sm"
          />
        </label>
        <span className="kicker">{query ? `${visible.length} of ${items.length}` : `${items.length} posts`} · {biz.mode} mode</span>
      </div>
      {sheetNote && <p className="mt-2 font-mono text-xs text-moss" role="status">{sheetNote}</p>}

      {composerOpen && (
        <div className="pp-card-raised mt-3 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
          <label className="block">
            <span className="kicker">Pillar</span>
            <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="field mt-1.5" aria-label="Content pillar">
              <option value="">Suggested ({biz.pillars[0]})</option>
              {biz.pillars.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="kicker">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as ContentFormat)} className="field mt-1.5 capitalize" aria-label="Content format">
              {FORMATS.map((f) => <option key={f.v} value={f.v} title={f.hint}>{f.v} — {f.hint}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="kicker">Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="field mt-1.5 capitalize" aria-label="Channel">
              {biz.channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="kicker">Angle (optional)</span>
            <input value={angle} onChange={(e) => setAngle(e.target.value)} maxLength={120} placeholder="e.g. autumn trial push" className="field mt-1.5" aria-label="Angle" />
          </label>
          <div className="sm:col-span-4">
            <button onClick={create} disabled={composerBusy} className="btn-ember min-h-[44px] px-5 py-2 text-sm disabled:opacity-50">
              {composerBusy ? 'Pen is writing…' : 'File it with Pen'}
            </button>
            {composerError && <p className="mt-1.5 font-mono text-xs text-emberdeep" role="alert">{composerError}</p>}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
          {COLS.map((col) => {
            const list = visible.filter((c) => c.state === col.id);
            return (
              <div key={col.id} className="pp-card p-3">
                <div className="flex items-baseline justify-between border-b border-line pb-1.5">
                  <p className="kicker">{col.label}</p>
                  <p className="font-mono text-xs font-bold">{list.length}</p>
                </div>
                <div className="nice-scroll mt-2 max-h-none space-y-1.5 overflow-visible sm:max-h-72 sm:overflow-y-auto">
                  {list.slice(0, COL_CAP).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={selectedId === c.id}
                      aria-label={`${c.hook}. ${c.pillar}, ${c.format}, ${c.channel}${c.score ? `, scored ${c.score} of 100` : ''}`}
                      className={`min-h-[44px] w-full rounded-md border px-2.5 py-2 text-left ${selectedId === c.id ? 'border-ink bg-blush' : 'border-line bg-cream hover:border-ink'}`}
                    >
                      <p className="text-[13px] font-medium leading-snug">{c.hook}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-inksoft">{c.pillar} · {c.format} · {c.channel}{c.score ? ` · ${c.score}/100` : ''}</p>
                    </button>
                  ))}
                  {list.length > COL_CAP && <p className="py-1 text-center font-mono text-[11px] text-faint">+{list.length - COL_CAP} more below — newest shown first</p>}
                  {list.length === 0 && <p className="py-2 text-center font-mono text-[11px] text-faint">— nothing filed —</p>}
                </div>
              </div>
            );
          })}
          {rejected.length > 0 && (
            <div className="rounded-md border border-dashed border-faint p-3 sm:col-span-2 xl:col-span-3">
              <p className="kicker">Binned ({rejected.length}) — restore or destroy for good</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rejected.slice(0, 12).map((c) => (
                  <RejectedChip key={c.id} item={c} onOpen={() => setSelectedId(c.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pp-card-raised h-fit p-4">
          {!selected ? (
            <div>
              <p className="kicker">The desk</p>
              <h2 className="mt-2 font-display text-xl font-bold">Choose a post to review it.</h2>
              <p className="mt-1 text-sm text-inksoft">Read the copy, check the slides and script — then sign off, queue or publish.</p>
            </div>
          ) : (
            <DetailCard key={selected.id} item={selected} mode={biz.mode} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function RejectedChip({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
  const transition = usePulse((s) => s.transition);
  const destroyContent = usePulse((s) => s.destroyContent);
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex items-center gap-1 rounded-full border border-line bg-paper py-1 pl-3 pr-1.5 text-xs">
      <button onClick={onOpen} className="max-w-44 truncate text-left hover:underline">{item.hook}</button>
      <button onClick={() => transition(item.id, 'draft')} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] hover:border-ink" aria-label={`Restore ${item.hook}`}>Restore</button>
      {confirming ? (
        <button onClick={() => destroyContent(item.id)} className="rounded-full bg-ember px-2 py-0.5 font-mono text-[10px] font-bold text-white" aria-label={`Destroy ${item.hook} forever`}>Sure?</button>
      ) : (
        <button onClick={() => setConfirming(true)} className="rounded-full px-2 py-0.5 font-mono text-[10px] text-faint hover:text-ember" aria-label={`Destroy ${item.hook}`}>×</button>
      )}
    </span>
  );
}

function DeliveryOptions({ item }: { item: ContentItem }) {
  const patchContent = usePulse((s) => s.patchContent);
  const [collab, setCollab] = useState(item.collabWith ?? '');
  const [link, setLink] = useState(item.link ?? '');
  return (
    <div className="mt-3 rounded-md border border-dashed border-faint bg-cream p-3">
      <p className="kicker">Delivery options</p>
      {item.format === 'reel' && item.channel === 'instagram' && (
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!item.isTrialReel}
            onChange={(e) => patchContent(item.id, { isTrialReel: e.target.checked })}
            className="mt-0.5 h-5 w-5 accent-[#c2481b]"
          />
          <span><strong>Trial reel.</strong> Shows to non-followers first. Needs a public account with 1,000+ followers — results land in about a day.</span>
        </label>
      )}
      <label className="mt-2 block">
        <span className="kicker">Invite collaborators</span>
        <input
          value={collab}
          onChange={(e) => setCollab(e.target.value)}
          onBlur={() => patchContent(item.id, { collabWith: collab.trim() })}
          maxLength={120}
          placeholder="@name, @name"
          aria-label="Invite collaborators by handle"
          className="field mt-1 text-sm"
        />
      </label>
      <label className="mt-2 block">
        <span className="kicker">Link (bio, booking page, UTM)</span>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => patchContent(item.id, { link: link.trim() })}
          maxLength={300}
          placeholder="https://…"
          aria-label="Link for this post"
          className="field mt-1 text-sm"
        />
      </label>
      {(item.isTrialReel || item.collabWith) && (
        <p className="mt-1.5 font-mono text-[11px] text-faint">
          {item.isTrialReel ? 'Trial on. ' : ''}
          {item.collabWith ? `Collaborators: ${item.collabWith} — invite when posting; Instagram cannot add people later.` : ''}
        </p>
      )}
    </div>
  );
}

function DetailCard({ item, mode, onClose }: { item: ContentItem; mode: 'copilot' | 'autopilot'; onClose: () => void }) {
  const transition = usePulse((s) => s.transition);
  const selectCaption = usePulse((s) => s.selectCaption);
  const schedule = usePulse((s) => s.schedule);
  const publish = usePulse((s) => s.publish);
  const analyse = usePulse((s) => s.analyse);
  const cap = item.captions[item.selectedCaption] ?? item.captions[0] ?? '';
  const [copied, setCopied] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [when, setWhen] = useState('');

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(`${cap}\n\n${item.hashtags.join(' ')}${item.link ? `\n${item.link}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const slotIso = (() => {
    if (!when) return undefined;
    const t = new Date(when).getTime();
    return Number.isNaN(t) ? undefined : new Date(t).toISOString();
  })();

  const approve = () => {
    if (mode === 'autopilot') {
      schedule(item.id, slotIso);
      return;
    }
    if (item.state === 'draft' || item.state === 'idea') transition(item.id, 'pending_approval');
    else if (item.state === 'pending_approval') schedule(item.id, slotIso);
  };

  const doPublish = () => {
    if (!confirmPublish) {
      setConfirmPublish(true);
      setTimeout(() => setConfirmPublish(false), 4000);
      return;
    }
    publish(item.id);
    setConfirmPublish(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-sm border border-ink px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider">{item.state.replace('_', ' ')} · {item.channel} · {item.format}</span>
        <span className="flex gap-2">
          {!['published', 'analysed'].includes(item.state) ? (
            <button onClick={() => transition(item.id, 'rejected')} className="min-h-[44px] px-2 font-mono text-[11px] uppercase tracking-wider text-faint hover:text-ember" aria-label={`Bin ${item.hook} — recoverable`}>Bin</button>
          ) : (
            <span className="self-center font-mono text-[11px] text-faint" title="Published posts stay on the record">On the record</span>
          )}
          <button onClick={onClose} className="min-h-[44px] px-2 font-mono text-[11px] uppercase tracking-wider text-faint hover:text-ink" aria-label="Close post">Close</button>
        </span>
      </div>
      <h3 className="mt-2 font-display text-xl font-bold leading-tight">{item.hook}</h3>
      <p className="mt-1 font-mono text-[11px] text-faint">{item.agentNote}</p>

      <h4 className="kicker mt-4">Copy — pick the version to run</h4>
      <div className="mt-1.5 space-y-1.5" role="group" aria-label="Caption versions">
        {item.captions.map((text, i) => (
          <button
            key={`${item.id}-v${i}`}
            onClick={() => selectCaption(item.id, i)}
            aria-pressed={item.selectedCaption === i}
            aria-label={`Use caption version ${i + 1}, ${text.length} characters`}
            className={`w-full rounded-md border px-2.5 py-2 text-left ${item.selectedCaption === i ? 'border-ink bg-blush' : 'border-line bg-paper hover:border-ink'}`}
          >
            <span className="font-mono text-[11px] font-bold text-emberdeep">V{i + 1} · {text.length} chars{item.selectedCaption === i ? ' · running' : ''}</span>
            <span className="mt-0.5 block truncate text-xs text-inksoft">{text.split('\n')[0]}</span>
          </button>
        ))}
      </div>
      <div className="nice-scroll mt-2 max-h-56 overflow-y-auto rounded-md border border-line bg-paper p-3 text-[13px] leading-relaxed">
        <p className="whitespace-pre-wrap">{cap}</p>
      </div>
      <p className="mt-2 text-xs font-medium text-emberdeep">{item.hashtags.join(' ')}</p>
      {item.link && <p className="mt-1 font-mono text-[11px] text-faint">Link: {item.link}</p>}

      {item.slides && (
        <>
          <h4 className="kicker mt-4">Carousel — {item.slides.length} slides</h4>
          <div className="mt-1.5 space-y-1.5">
            {item.slides.map((sl, i) => (
              <div key={`${item.id}-slide-${i}`} className="rounded-md border border-line bg-paper p-2.5">
                <p className="text-[13px] font-bold"><span className="font-mono text-[11px] text-emberdeep">{String(i + 1).padStart(2, '0')}</span> · {sl.headline}</p>
                <p className="mt-0.5 text-xs text-inksoft">{sl.body}</p>
                <p className="mt-0.5 font-mono text-[11px] italic text-faint">{sl.visual}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {item.frames && (
        <>
          <h4 className="kicker mt-4">Story — {item.frames.length} frames</h4>
          <div className="mt-1.5 space-y-1.5">
            {item.frames.map((fr, i) => (
              <div key={`${item.id}-frame-${i}`} className="rounded-md border border-line bg-paper p-2.5">
                <p className="text-[13px]"><span className="font-mono text-[11px] text-emberdeep">F{i + 1}</span> · {fr.text}</p>
                {fr.sticker && <p className="mt-0.5 font-mono text-[11px] text-inksoft">Sticker — {fr.sticker}</p>}
                {fr.cta && <p className="font-mono text-[11px] text-faint">{fr.cta}</p>}
              </div>
            ))}
          </div>
        </>
      )}
      {item.poll && (
        <div className="mt-4 rounded-md border border-ink bg-paper p-3">
          <p className="kicker">The poll</p>
          <p className="mt-1 font-display text-base font-bold">{item.poll.question}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.poll.options.map((o) => <span key={`${item.id}-${o}`} className="rounded-full border border-line px-2.5 py-1 text-xs">{o}</span>)}
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-faint">Runs {item.poll.duration}</p>
          <p className="mt-1 border-t border-line pt-1.5 text-xs text-moss">{item.poll.followUp}</p>
        </div>
      )}
      {item.livePlan && (
        <>
          <h4 className="kicker mt-4">Show plan</h4>
          <div className="mt-1.5 space-y-1.5">
            {item.livePlan.map((seg, i) => (
              <div key={`${item.id}-seg-${i}`} className="rounded-md border border-line bg-paper p-2.5">
                <p className="text-[13px] font-bold"><span className="font-mono text-[11px] text-emberdeep">{seg.time}</span> · {seg.title}</p>
                <p className="mt-0.5 text-xs text-inksoft">{seg.detail}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {item.newsletter && (
        <div className="mt-4 rounded-md border border-line bg-paper p-3">
          <p className="kicker">Newsletter issue</p>
          <p className="mt-1 font-display text-base font-bold">{item.newsletter.subject}</p>
          <p className="mt-0.5 text-xs italic text-faint">{item.newsletter.preview}</p>
          {item.newsletter.sections.map((sec, i) => (
            <div key={`${item.id}-sec-${i}`} className="mt-2 border-t border-line pt-2">
              <p className="text-[13px] font-bold">{sec.heading}</p>
              <p className="text-xs text-inksoft">{sec.body}</p>
            </div>
          ))}
          <p className="mt-2 text-xs font-bold text-emberdeep">{item.newsletter.cta}</p>
        </div>
      )}
      {item.script && (
        <>
          <h4 className="kicker mt-4">Script</h4>
          <p className="nice-scroll mt-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-3 font-mono text-xs leading-relaxed">{item.script}</p>
        </>
      )}
      {item.visualPrompt && (
        <>
          <h4 className="kicker mt-4">Visual notes</h4>
          <p className="mt-1.5 rounded-md border border-dashed border-faint p-3 text-xs italic leading-relaxed text-inksoft">{item.visualPrompt}</p>
        </>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <p className="kicker">Spare hooks</p>
        <ul className="mt-1.5 space-y-1">
          {item.hooks.slice(1).map((h, i) => <li key={`${item.id}-hook-${i}`} className="text-xs text-inksoft">— {h}</li>)}
        </ul>
      </div>

      {item.metrics && (
        <div className="mt-3 rounded-md border border-moss bg-mossbg p-3">
          <p className="font-display text-lg font-black text-moss">{item.score}<span className="font-sans text-xs font-normal">/100</span></p>
          <p className="text-xs font-medium">{item.insight}</p>
          <p className="mt-1 font-mono text-[11px] text-inksoft">Reach {item.metrics.reach} · Likes {item.metrics.likes} · Saves {item.metrics.saves} · Comments {item.metrics.comments} · Shares {item.metrics.shares}</p>
        </div>
      )}

      <DeliveryOptions item={item} />

      {['draft', 'idea', 'pending_approval'].includes(item.state) && (
        <label className="mt-3 block rounded-md border border-line bg-paper p-3">
          <span className="kicker">Queue for a specific date (optional)</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="field mt-1.5 text-sm"
            aria-label="Queue for a specific date and time"
          />
          <span className="mt-1 block font-mono text-[11px] text-faint">Empty = next best-time slot. Past dates roll forward.</span>
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
        {(item.state === 'draft' || item.state === 'idea') && mode === 'copilot' && (
          <button onClick={approve} className="btn-ink min-h-[44px] px-4 py-2 text-sm">Approve — needs one more tap</button>
        )}
        {item.state === 'pending_approval' && mode === 'copilot' && (
          <button onClick={approve} className="btn-ember min-h-[44px] px-4 py-2 text-sm">Sign off & queue</button>
        )}
        {(item.state === 'draft' || item.state === 'idea' || item.state === 'pending_approval') && mode === 'autopilot' && (
          <button onClick={approve} className="btn-ember min-h-[44px] px-4 py-2 text-sm">Queue now</button>
        )}
        {item.state === 'scheduled' && (
          <button onClick={doPublish} className="btn-ink min-h-[44px] px-4 py-2 text-sm">
            {confirmPublish ? 'Tap again — this goes live' : 'Publish now'}
          </button>
        )}
        {(item.state === 'published' || item.state === 'analysed') && (
          <button onClick={() => analyse(item.id)} className="btn-ghost min-h-[44px] px-4 py-2 text-sm">Score with Lens</button>
        )}
        <button onClick={copyAll} className="btn-ghost min-h-[44px] px-4 py-2 text-sm" aria-live="polite">{copied ? 'Copied — paste away' : 'Copy caption'}</button>
        <button onClick={() => download(`${item.hook.slice(0, 40).replace(/[^A-Za-z0-9]+/g, '-').toLowerCase() || 'post'}.txt`, postTXT(item))} className="btn-ghost min-h-[44px] px-4 py-2 text-sm" title="Full post as a text file — archive it or brief a designer">Download (.txt)</button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-faint">
        {item.state === 'scheduled' && item.scheduledFor
          ? `Queued for ${new Date(item.scheduledFor).toLocaleString('en-AU')} — pull it back anytime from the calendar.`
          : item.state === 'draft' || item.state === 'idea'
            ? 'Not queued. Signing off files it into best-time slots.'
            : item.state === 'pending_approval'
              ? 'Approved once. One more tap queues it.'
              : ''}
      </p>
      {(item.isTrialReel || item.collabWith || item.link) && ['draft', 'idea', 'pending_approval', 'scheduled'].includes(item.state) && (
        <p className="mt-1 rounded-md border border-dashed border-faint p-2 font-mono text-[11px] leading-relaxed text-inksoft">
          Posting checklist — {[
            item.isTrialReel ? 'trial reel: post as trial first, graduate on results' : '',
            item.collabWith ? `invite ${item.collabWith} as collaborators at posting` : '',
            item.link ? 'link lives in the caption — move it to bio/sticker on Stories' : '',
          ].filter(Boolean).join(' · ')}
        </p>
      )}
      {item.publishedUrl && <p className="mt-1 font-mono text-[11px] text-faint">Live — {item.publishedUrl}</p>}
    </div>
  );
}
