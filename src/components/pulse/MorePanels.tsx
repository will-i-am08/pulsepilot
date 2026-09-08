'use client';

import { useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { useR1 } from '@/lib/pulse/extras';
import { ALL_CHANNELS_12, channelName } from '@/lib/pulse/r1';
import { backupFilename } from '@/lib/pulse/export';
import type { Channel } from '@/lib/pulse/types';

const CHANNELS: Channel[] = ['instagram', 'tiktok', 'facebook', 'linkedin'];

export function TrendsPanel() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const trends = usePulse((s) => s.trends);
  const usedTrends = usePulse((s) => s.usedTrends);
  const useTrend = usePulse((s) => s.useTrend);
  const refreshTrends = usePulse((s) => s.refreshTrends);
  const requestFocus = usePulse((s) => s.requestFocus);
  const [dryNote, setDryNote] = useState(false);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;
  if (!biz) return null;
  const used = usedTrends[biz.id] ?? [];
  const fresh = trends.filter((t) => !used.includes(t.id));

  const file = (id: string) => {
    const created = useTrend(id);
    if (created) requestFocus(created);
  };

  return (
    <div className="pp-card p-4">
      <p className="kicker">Scout&apos;s wire</p>
      <h2 className="font-display text-lg font-bold">Angles worth borrowing this week</h2>
      <p className="mt-1 text-[13px] text-faint">Fresh formats, bent to your voice. Use them before they date — one tap files each as a draft.</p>
      {fresh.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-faint p-4 text-center">
          <p className="text-sm font-medium">Wire is quiet — every angle is filed.</p>
          <button onClick={() => setDryNote(!refreshTrends())} className="btn-ink mt-2 min-h-[44px] px-4 py-2 text-sm">Ask Scout for fresh angles</button>
          {dryNote && <p className="mt-2 font-mono text-[11px] text-faint" role="status">Scout is out of fresh angles — check back next week, or file from a spare hook instead.</p>}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {trends.map((t) => {
            const done = used.includes(t.id);
            return (
              <div key={t.id} className="rounded-md border border-line bg-paper p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-faint">{t.platform} · good for {t.expiresIn}</p>
                  <p className="font-mono text-[11px] font-bold text-emberdeep" title="How well this fits your business">fit {Math.round(t.relevance * 100)}%</p>
                </div>
                <p className="mt-1.5 text-sm font-bold leading-snug">{t.title}</p>
                <p className="mt-1 border-l-2 border-ember pl-2 font-display text-sm italic text-inksoft">“{t.suggestedHook}”</p>
                {done ? (
                  <span className="mt-2.5 inline-block rounded border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-faint">Filed for {biz.businessName}</span>
                ) : (
                  <button onClick={() => file(t.id)} className="btn-ink mt-2.5 min-h-[44px] px-3 py-1.5 text-xs">
                    File it as a post — lands in Create
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const WS_KEY = 'pulsepilot-workspace';
const REMIND_KEY = 'pulsepilot-reminders';

export function reminderEnabled(): boolean {
  try {
    return window.localStorage.getItem(REMIND_KEY) === '1' && 'Notification' in window;
  } catch {
    return false;
  }
}

function ReminderToggle() {
  const [on, setOn] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(REMIND_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [note, setNote] = useState('');

  const toggle = async () => {
    if (on) {
      try { window.localStorage.setItem(REMIND_KEY, '0'); } catch { /* ignore */ }
      setOn(false);
      setNote('');
      return;
    }
    if (!('Notification' in window)) {
      setNote('This browser does not do notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      try { window.localStorage.setItem(REMIND_KEY, '1'); } catch { /* ignore */ }
      setOn(true);
      setNote('On — we will nudge you when queued posts fall due.');
    } else {
      setNote('Permission blocked — allow notifications for this site first.');
    }
  };

  return (
    <div className="mt-2 rounded-md border border-line bg-paper p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">Due reminders</p>
          <p className="font-mono text-[11px] text-faint">A nudge when queued posts fall due within the hour.</p>
        </div>
        <button onClick={toggle} aria-pressed={on} className={`min-h-[44px] rounded-full border px-4 py-1.5 text-xs font-bold ${on ? 'border-moss bg-mossbg text-moss' : 'border-line text-inksoft'}`}>
          {on ? 'On' : 'Off'}
        </button>
      </div>
      {note && <p className="mt-1.5 font-mono text-[11px] text-faint" role="status">{note}</p>}
    </div>
  );
}

function workspaceId(): string {
  try {
    const existing = window.localStorage.getItem(WS_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    let fresh = '';
    for (const b of bytes) fresh += abc[b % 64];
    window.localStorage.setItem(WS_KEY, fresh);
    return fresh;
  } catch {
    return 'browser-workspace';
  }
}

function CloudBackup() {
  const [id] = useState(workspaceId);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const snapshot = () => {
    const s = usePulse.getState();
    const r1 = useR1.getState();
    return { version: 3, businesses: s.businesses, activeBusinessId: s.activeBusinessId, contents: s.contents, runs: s.runs, campaigns: s.campaigns, trends: s.trends, usedTrends: s.usedTrends, media: s.media, hashtagGroups: s.hashtagGroups, templates: [...s.templates, ...r1.templates.map((t) => ({ id: t.id, businessId: t.businessId ?? '', name: t.name, pillar: t.pillar, format: t.format, channel: t.channel, angle: t.hook, createdAt: t.createdAt }))], approvals: s.approvals, activity: [...s.activity, ...r1.activity.map((a) => ({ id: a.id, businessId: a.businessId ?? '', kind: a.kind, summary: a.summary, contentIds: [] as string[], createdAt: a.createdAt }))], r1Media: r1.media, r1Approvals: r1.approvals, whiteLabel: r1.whiteLabel };
  };

  const backup = async () => {
    setBusy(true);
    setFailed(false);
    setNote('Backing up…');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch('/api/pulse/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: id, label: 'browser backup', payload: snapshot() }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setNote('Backed up to Neon. Open this workspace id on any device to restore.');
      } else {
        setFailed(true);
        setNote(data.error ?? 'Backup failed.');
      }
    } catch {
      setFailed(true);
      setNote('Backup failed — check your connection and try again.');
    }
    setBusy(false);
  };

  const restore = async () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      setFailed(false);
      setNote('Restore replaces this whole desk with the cloud copy. Tap again to confirm — or back up first.');
      setTimeout(() => setConfirmRestore(false), 6000);
      return;
    }
    setConfirmRestore(false);
    setBusy(true);
    setFailed(false);
    setNote('Fetching backup…');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(`/api/pulse/sync?workspaceId=${encodeURIComponent(id)}`, { signal: ctrl.signal });
      clearTimeout(timer);
      const data = (await res.json()) as { payload?: unknown; error?: string };
      if (!res.ok) {
        setFailed(true);
        setNote(data.error ?? 'Restore failed.');
      } else if (usePulse.getState().restoreSnapshot(data.payload)) {
        setNote('Restored from Neon. Your week is back.');
      } else {
        setFailed(true);
        setNote('That backup would not open — refusing to wipe your desk. Download your data first, then try again.');
      }
    } catch {
      setFailed(true);
      setNote('Restore failed — check your connection and try again.');
    }
    setBusy(false);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setFailed(false);
      setNote('Workspace id copied — keep it somewhere safe.');
    } catch {
      setFailed(true);
      setNote('Copy failed — write the id down manually.');
    }
  };

  return (
    <div className="mt-2 rounded-md border border-line bg-paper p-3">
      <p className="kicker">Cloud backup — Neon</p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-faint">
        Workspace <button onClick={copyId} className="font-bold text-ink underline" title="Copy workspace id">{id}</button> · same id on another device pulls the same desk.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={backup} disabled={busy} className="btn-ink min-h-[44px] px-3 py-1.5 text-xs disabled:opacity-50">
          {busy ? 'Working…' : 'Back up now'}
        </button>
        <button onClick={restore} disabled={busy} className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs disabled:opacity-50">
          {confirmRestore ? 'Tap again — replaces desk' : 'Restore'}
        </button>
      </div>
      {note && <p className={`mt-1.5 font-mono text-[11px] ${failed ? 'text-emberdeep' : 'text-moss'}`} role="status">{note}</p>}
    </div>
  );
}

export function SettingsPanel() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const runs = usePulse((s) => s.runs);
  const updateBusiness = usePulse((s) => s.updateBusiness);
  const setActive = usePulse((s) => s.setActive);
  const deleteBusiness = usePulse((s) => s.deleteBusiness);
  const setMode = usePulse((s) => s.setMode);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newPillar, setNewPillar] = useState('');
  const [connNote, setConnNote] = useState('');
  const [connBusy, setConnBusy] = useState(false);
  const whiteLabel = useR1((s) => s.whiteLabel);
  const setWhiteLabel = useR1((s) => s.setWhiteLabel);
  const resetDemo = usePulse((s) => s.resetDemo);
  if (!biz) return null;

  const myPosts = contents.filter((c) => c.businessId === biz.id).length;
  const myRuns = runs.filter((r) => !r.businessId || r.businessId === biz.id).length;

  const toggleChannel = (c: Channel) => {
    const has = biz.channels.includes(c);
    if (has && biz.channels.length === 1) return;
    updateBusiness(biz.id, { channels: has ? biz.channels.filter((x) => x !== c) : [...biz.channels, c] });
  };

  const addPillar = () => {
    const v = newPillar.trim().slice(0, 40);
    if (!v || biz.pillars.includes(v)) return;
    updateBusiness(biz.id, { pillars: [...biz.pillars, v] });
    setNewPillar('');
  };

  const downloadBackup = () => {
    try {
      const raw = window.localStorage.getItem('pulsepilot-v2') ?? '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFilename();
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const reconnectMock = async (channel: string) => {
    setConnBusy(true);
    setConnNote('');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch('/api/pulse/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caption: 'Connection check from Setup.', channels: [channel], dryRun: true }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = (await res.json()) as { results?: { ok: boolean }[] };
      const ok = data.results?.[0]?.ok ?? false;
      setConnNote(ok ? `${channel} dry run passed — still mock, connect later.` : `${channel} check failed — try again.`);
    } catch {
      setConnNote('Connection check failed — try again.');
    }
    setConnBusy(false);
    setTimeout(() => setConnNote(''), 5000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="pp-card p-4">
        <p className="kicker">The masthead</p>
        <h2 className="font-display text-lg font-bold">Businesses on the books</h2>
        <div className="mt-3 space-y-2">
          {businesses.map((b) => (
            <div key={b.id} className={`flex items-center justify-between gap-2 rounded-md border p-3 ${b.id === biz.id ? 'border-ink bg-blush' : 'border-line bg-paper'}`}>
              <div>
                <p className="font-display text-base font-bold leading-tight">{b.businessName}</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">{b.industry} · {b.channels.join(', ')} · {b.postsPerWeek}/wk · {b.mode}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {b.id !== biz.id && <button onClick={() => setActive(b.id)} className="btn-ghost min-h-[44px] px-2.5 py-1 text-xs">Open</button>}
                {confirmDelete === b.id ? (
                  <button onClick={() => { deleteBusiness(b.id); setConfirmDelete(null); }} className="min-h-[44px] rounded-md bg-ember px-2.5 py-1 text-xs font-bold text-white" aria-label={`Delete ${b.businessName} forever`}>
                    Delete forever?
                  </button>
                ) : (
                  <button onClick={() => setConfirmDelete(b.id)} className="min-h-[44px] rounded-md px-2 py-1 font-mono text-[11px] uppercase text-faint hover:text-ember" aria-label={`Delete ${b.businessName}`}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-line bg-paper p-3">
          <p className="kicker">House style — editable</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Business name</span>
              <input value={biz.businessName} onChange={(e) => updateBusiness(biz.id, { businessName: e.target.value })} maxLength={80} className="field mt-1 text-sm" aria-label="Business name" />
            </label>
            <label className="block">
              <span className="kicker">Trade</span>
              <input value={biz.industry} onChange={(e) => updateBusiness(biz.id, { industry: e.target.value })} maxLength={60} className="field mt-1 text-sm" aria-label="Trade" />
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Whereabouts</span>
              <input value={biz.location} onChange={(e) => updateBusiness(biz.id, { location: e.target.value })} maxLength={60} className="field mt-1 text-sm" aria-label="Location" />
            </label>
            <label className="block">
              <span className="kicker">Best customer</span>
              <input value={biz.idealCustomer} onChange={(e) => updateBusiness(biz.id, { idealCustomer: e.target.value })} maxLength={120} className="field mt-1 text-sm" aria-label="Ideal customer" />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="kicker">The offer</span>
            <input value={biz.offer} onChange={(e) => updateBusiness(biz.id, { offer: e.target.value })} maxLength={140} className="field mt-1 text-sm" aria-label="Offer" />
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">House voice</span>
              <select value={biz.voice.tones[0]} onChange={(e) => updateBusiness(biz.id, { voice: { ...biz.voice, tones: [e.target.value] } })} className="field mt-1 text-sm" aria-label="House voice">
                {['direct, warm, no fluff', 'bold and playful', 'premium and calm', 'cheeky challenger'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="kicker">Keeping score by</span>
              <select value={biz.goals.primary} onChange={(e) => updateBusiness(biz.id, { goals: { ...biz.goals, primary: e.target.value } })} className="field mt-1 text-sm" aria-label="Primary goal">
                {['leads', 'bookings', 'sales', 'followers'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-2">
            <span className="kicker">Channels</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => (
                <button key={c} onClick={() => toggleChannel(c)} aria-pressed={biz.channels.includes(c)} aria-label={`${biz.channels.includes(c) ? 'Remove' : 'Add'} ${c}`} className={`min-h-[44px] rounded-full border px-3 py-1 text-xs font-semibold capitalize ${biz.channels.includes(c) ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft hover:border-ink'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <span className="kicker">Pillars</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {biz.pillars.map((p) => (
                <span key={p} className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs">
                  {p}
                  {biz.pillars.length > 1 && (
                    <button onClick={() => updateBusiness(biz.id, { pillars: biz.pillars.filter((x) => x !== p) })} className="font-mono text-faint hover:text-ember" aria-label={`Remove pillar ${p}`}>×</button>
                  )}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              <label htmlFor="new-pillar" className="sr-only">Add a pillar</label>
              <input id="new-pillar" value={newPillar} onChange={(e) => setNewPillar(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPillar()} maxLength={40} placeholder="Add your own pillar" className="field text-sm" />
              <button onClick={addPillar} className="btn-ghost min-h-[44px] shrink-0 px-3 py-1 text-xs">Add</button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="kicker">Emoji appetite</p>
              <div className="mt-1 flex gap-1.5" role="group" aria-label="Emoji level">
                {(['None', 'A pinch', 'Generous'] as const).map((label, l) => (
                  <button
                    key={label}
                    onClick={() => updateBusiness(biz.id, { voice: { ...biz.voice, emojiLevel: l as 0 | 1 | 2 } })}
                    aria-pressed={biz.voice.emojiLevel === l}
                    className={`min-h-[44px] flex-1 rounded-lg border px-2 py-1 text-xs font-semibold ${biz.voice.emojiLevel === l ? 'border-ink bg-ink text-paper' : 'border-line bg-cream hover:border-ink'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="kicker">Never use (comma separated)</span>
              <input
                defaultValue={biz.voice.bannedWords.join(', ')}
                key={`banned-${biz.id}-${biz.voice.bannedWords.join('|')}`}
                onBlur={(e) => updateBusiness(biz.id, { voice: { ...biz.voice, bannedWords: e.target.value.split(',').map((w) => w.trim().slice(0, 30)).filter((w) => w.length > 0).slice(0, 20) } })}
                maxLength={300}
                placeholder="e.g. revolutionary, game-changer"
                className="field mt-1 text-sm"
                aria-label="Banned words, comma separated"
              />
            </label>
          </div>
          <p className="mt-2 font-mono text-[11px] text-faint">Anything touching a banned word waits for your review, even on Autopilot. New posts pick this up immediately.</p>
        </div>
      </div>

      <div className="pp-card p-4">
        <p className="kicker">The arrangement</p>
        <h2 className="font-display text-lg font-bold">Who holds the pen</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setMode(biz.id, 'copilot')} aria-pressed={biz.mode === 'copilot'} className={`min-h-[44px] rounded-lg border p-3 text-left ${biz.mode === 'copilot' ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}>
            <p className="font-display text-base font-bold">Copilot</p>
            <p className={`mt-0.5 text-xs ${biz.mode === 'copilot' ? 'opacity-70' : 'text-faint'}`}>You sign every post, twice</p>
          </button>
          <button onClick={() => setMode(biz.id, 'autopilot')} aria-pressed={biz.mode === 'autopilot'} className={`min-h-[44px] rounded-lg border p-3 text-left ${biz.mode === 'autopilot' ? 'border-moss bg-mossbg' : 'border-line hover:border-ink'}`}>
            <p className="font-display text-base font-bold">Autopilot</p>
            <p className={`mt-0.5 text-xs ${biz.mode === 'autopilot' ? 'text-moss' : 'text-faint'}`}>The crew runs the week</p>
          </button>
        </div>
        <div className="mt-3 rounded-md border border-dashed border-faint p-3">
          <p className="kicker">Autopilot guardrails, always on</p>
          <ul className="mt-1.5 space-y-1 text-xs text-inksoft">
            <li>— Your voice and banned words are locked into every draft.</li>
            <li>— Anything touching a banned word waits for your review.</li>
            <li>— Queued posts can be pulled back to drafts any time.</li>
            <li>— Switch back to Copilot mid-week; nothing breaks.</li>
          </ul>
        </div>
        <label className="mt-4 block border-t border-line pt-3">
          <span className="kicker">Pace — {biz.postsPerWeek} posts a week</span>
          <input type="range" min={2} max={7} value={Math.min(7, Math.max(2, biz.postsPerWeek))} onChange={(e) => updateBusiness(biz.id, { postsPerWeek: Number(e.target.value) })} className="mt-1.5 w-full" aria-label="Posts per week" />
        </label>
        <div className="mt-3">
          <ReminderToggle />
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="kicker">White label — light touch</p>
          <p className="mt-1 font-mono text-[11px] text-faint">Your logo on client-facing sheets. Saved in this browser.</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Workspace display name</span>
              <input value={whiteLabel.displayName} onChange={(e) => setWhiteLabel({ displayName: e.target.value })} maxLength={60} placeholder="e.g. Pulse Social Media" className="field mt-1 text-sm" aria-label="Workspace display name" />
            </label>
            <label className="block">
              <span className="kicker">Accent colour</span>
              <input value={whiteLabel.accent} onChange={(e) => setWhiteLabel({ accent: e.target.value })} maxLength={30} placeholder="#c2481b" className="field mt-1 text-sm" aria-label="Accent colour" />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="kicker">Logo URL</span>
            <input value={whiteLabel.logoUrl} onChange={(e) => setWhiteLabel({ logoUrl: e.target.value })} maxLength={500} placeholder="https://…" className="field mt-1 text-sm" aria-label="Logo URL" />
          </label>
          {(whiteLabel.displayName || whiteLabel.logoUrl) && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-paper p-2.5">
              {whiteLabel.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={whiteLabel.logoUrl} alt="Workspace logo" className="h-8 w-8 rounded-sm border border-line object-contain" loading="lazy" />
              )}
              <span className="font-display text-sm font-bold" style={whiteLabel.accent ? { color: whiteLabel.accent } : undefined}>
                {whiteLabel.displayName || 'Workspace'}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="kicker">Connections — 12 channels</p>
          <p className="mt-1 font-mono text-[11px] text-faint">Publishing adapters are mock for now. Dry-run validates copy without posting.</p>
          <ul className="mt-2 space-y-1.5">
            {ALL_CHANNELS_12.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
                <span className="flex-1 text-[13px] font-semibold capitalize">
                  {(['instagram', 'tiktok', 'facebook', 'linkedin'] as string[]).includes(c) ? channelName(c as Channel) : c}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint">Mock — connect later</span>
                <button onClick={() => reconnectMock(c)} disabled={connBusy} className="btn-ghost min-h-[44px] shrink-0 px-2.5 py-1 font-mono text-[11px] disabled:opacity-50">
                  Reconnect
                </button>
              </li>
            ))}
          </ul>
          {connNote && <p className="mt-1.5 font-mono text-[11px] text-moss" role="status">{connNote}</p>}
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="kicker">This workspace</p>
          <p className="mt-1 font-mono text-xs text-inksoft">{businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} · {myPosts} posts filed · {myRuns} crew jobs logged</p>
          <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">Work saves in this browser. Download a file, or back it up to Neon and open it on any device.</p>
          <CloudBackup />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={downloadBackup} className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs">Download my data</button>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="min-h-[44px] rounded-md px-3 py-1.5 font-mono text-[11px] uppercase text-faint hover:text-ink">Start over</button>
            ) : (
              <>
                <button onClick={() => { resetDemo(); setConfirmReset(false); }} className="min-h-[44px] rounded-md border border-ember bg-ember px-3 py-1.5 text-xs font-bold text-white">Yes, wipe everything</button>
                <button onClick={() => setConfirmReset(false)} className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs">Keep everything</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
