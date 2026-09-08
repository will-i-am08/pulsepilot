'use client';

import { useEffect, useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import AuthButton from './AuthButton';
import Onboarding from './Onboarding';
import Fleet from './Fleet';
import ContentBoard from './ContentBoard';
import CalendarView from './CalendarView';
import AnalyticsView from './AnalyticsView';
import { TrendsPanel, SettingsPanel } from './MorePanels';
import { reminderEnabled } from './MorePanels';

const NOTIFIED_KEY = 'pulsepilot-notified';

function checkDue() {
  try {
    if (!reminderEnabled() || Notification.permission !== 'granted') return;
    const { businesses, contents } = usePulse.getState();
    const now = Date.now();
    const today = new Date().toDateString();
    let seen: Record<string, string[]> = {};
    try {
      seen = JSON.parse(window.localStorage.getItem(NOTIFIED_KEY) ?? '{}') as Record<string, string[]>;
    } catch { seen = {}; }
    if (!Array.isArray(seen[today])) seen = { [today]: [] };
    const done = new Set(seen[today]);
    let changed = false;
    contents.forEach((c) => {
      if (c.state !== 'scheduled' || !c.scheduledFor || done.has(c.id)) return;
      const t = new Date(c.scheduledFor).getTime();
      if (Number.isNaN(t) || t < now - 60000 || t > now + 3600000) return;
      const biz = businesses.find((b) => b.id === c.businessId);
      new Notification(`${biz?.businessName ?? 'PulsePilot'} — post due`, {
        body: `${c.hook.slice(0, 100)} · ${c.channel}`,
      });
      done.add(c.id);
      changed = true;
    });
    if (changed) {
      try {
        window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ [today]: [...done] }));
      } catch { /* ignore */ }
    }
  } catch { /* notifications must never break the app */ }
}

type Tab = 'create' | 'calendar' | 'fleet' | 'analytics' | 'trends' | 'settings';

export default function PulseApp() {
  const businesses = usePulse((s) => s.businesses);
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const setActive = usePulse((s) => s.setActive);
  const setMode = usePulse((s) => s.setMode);
  const autopilotTick = usePulse((s) => s.autopilotTick);
  const focusContentId = usePulse((s) => s.focusContentId);
  const biz = businesses.find((b) => b.id === activeBusinessId) ?? null;

  const [tab, setTab] = useState<Tab>('create');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Autopilot background tick every 45s
  useEffect(() => {
    if (!biz || biz.mode !== 'autopilot') return;
    const t = setInterval(() => usePulse.getState().autopilotTick(biz.id), 45000);
    return () => clearInterval(t);
  }, [biz?.id, biz?.mode]);

  // Due-date nudges every 60s (only if enabled in Setup)
  useEffect(() => {
    checkDue();
    const t = setInterval(checkDue, 60000);
    return () => clearInterval(t);
  }, []);

  // Deep-link from Trends ("filed" → open it in Create)
  useEffect(() => {
    if (focusContentId) setTab('create');
  }, [focusContentId]);

  if (businesses.length === 0 && !showOnboarding) {
    return <Landing onStart={() => setShowOnboarding(true)} />;
  }

  if (businesses.length === 0 && showOnboarding) {
    return (
      <div className="min-h-screen px-4 py-10">
        <Onboarding onDone={() => setShowOnboarding(false)} />
      </div>
    );
  }

  if (!biz) return null;

  const pending = contents.filter((c) => c.businessId === biz.id && (c.state === 'draft' || c.state === 'pending_approval')).length;
  const scheduled = contents.filter((c) => c.businessId === biz.id && c.state === 'scheduled').length;

  const tabs: { id: Tab; label: string; index: string; badge?: number; badgeLabel?: string }[] = [
    { id: 'create', label: 'Create', index: '01', badge: pending, badgeLabel: `${pending} awaiting sign-off` },
    { id: 'calendar', label: 'Calendar', index: '02', badge: scheduled, badgeLabel: `${scheduled} queued` },
    { id: 'fleet', label: 'Agents', index: '03' },
    { id: 'analytics', label: 'Results', index: '04' },
    { id: 'trends', label: 'Trends', index: '05' },
    { id: 'settings', label: 'Setup', index: '06' },
  ];

  return (
    <div className="min-h-screen">
      <a href="#workspace" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to workspace
      </a>
      <h1 className="sr-only">PulsePilot workspace — {biz.businessName}</h1>
      <header className="border-b border-ink bg-paper/95 backdrop-blur sm:sticky sm:top-0 sm:z-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <span className="font-display text-xl font-black tracking-tight">PulsePilot</span>
          <span className="kicker hidden sm:inline">The marketing crew</span>
          <label htmlFor="biz-switch" className="sr-only">Business on the desk</label>
          <select id="biz-switch" value={biz.id} onChange={(e) => setActive(e.target.value)} className="field ml-2 w-auto max-w-44 truncate py-1.5 text-sm font-medium sm:max-w-64">
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.businessName}</option>)}
          </select>
          <span className={`rounded border px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-widest ${biz.mode === 'autopilot' ? 'border-moss bg-mossbg text-moss' : 'border-ember bg-blush text-emberdeep'}`}>
            {biz.mode === 'autopilot' ? 'Autopilot · on' : 'Copilot · on'}
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => setMode(biz.id, biz.mode === 'autopilot' ? 'copilot' : 'autopilot')}
              className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs"
              title={biz.mode === 'autopilot' ? 'Hand sign-off back to yourself' : 'Let the crew queue the week alone'}
            >
              Switch to {biz.mode === 'autopilot' ? 'Copilot' : 'Autopilot'}
            </button>
            <button onClick={() => setShowOnboarding(true)} className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs">+ Business</button>
            <AuthButton compact />
            {biz.mode === 'autopilot' && (
              <button onClick={() => autopilotTick(biz.id)} className="btn-ember min-h-[44px] px-3 py-1.5 text-xs">Run tick</button>
            )}
          </span>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-line px-4" aria-label="Workspace sections">
          <div role="tablist" aria-label="Workspace sections" className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex min-h-[44px] items-baseline gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-semibold ${tab === t.id ? 'tab-active' : 'tab-idle'}`}
              >
                <span className="font-mono text-[10px] opacity-60" aria-hidden="true">{t.index}</span>
                {t.label}
                {t.badge ? <span className="rounded-sm bg-ember px-1.5 font-mono text-[11px] font-bold text-white" aria-label={t.badgeLabel}>{t.badge}</span> : null}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="workspace" className="mx-auto max-w-7xl px-4 py-6" role="tabpanel">
        {showOnboarding && (
          <div className="mb-6"><Onboarding onDone={() => setShowOnboarding(false)} /></div>
        )}
        {tab === 'create' && <ContentBoard />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'fleet' && <Fleet />}
        {tab === 'analytics' && <AnalyticsView />}
        {tab === 'trends' && <TrendsPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </main>

      <footer className="border-t border-ink py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-2 px-4">
          <p className="font-display text-sm font-bold">PulsePilot — set in Fraunces & Space Grotesk.</p>
          <p className="flex gap-3">
            <a href="/terms" className="kicker hover:text-ink">Terms</a>
            <a href="/privacy" className="kicker hover:text-ink">Privacy</a>
            <span className="kicker">Pulse Social Media, Brisbane</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  const loadSample = usePulse((s) => s.loadSample);
  const [annual, setAnnual] = useState(false);

  const tiers = [
    { name: 'Pulse', monthly: '$19', annual: '$190', desc: '1 brand · unlimited words · 60 queued posts · email support', hero: false },
    { name: 'Pilot', monthly: '$29', annual: '$290', desc: '3 brands · trend radar · client sign-off sheets · week reports', hero: true },
    { name: 'Studio', monthly: '$49', annual: '$490', desc: '10 brands · priority support · quarterly voice tune-up with us', hero: false },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <p className="font-display text-lg font-black">PulsePilot</p>
          <span className="flex items-center gap-3">
            <p className="kicker hidden text-right sm:block">Est. 2026 · Brisbane, AU · by Pulse Social Media</p>
            <AuthButton compact />
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-12">
        <p className="kicker">For owners, not marketing departments</p>
        <h1 className="mt-3 font-display text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-7xl">
          The socials, handled. <span className="italic font-light">You sign off — or hand over the keys.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-inksoft">
          Five posts a week, approved in ten minutes — across Instagram, TikTok, Facebook and LinkedIn.
          Six agents plan the week, write the copy, set the visuals, queue the posts and report what worked.
          Copilot keeps you in charge. Autopilot runs the whole thing while you run the business.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={onStart} className="btn-ember min-h-[44px] px-8 py-3 text-base">Start 14-day free trial</button>
          <button onClick={() => loadSample()} className="btn-ghost min-h-[44px] px-8 py-3 text-base">See a sample week first</button>
        </div>
        <p className="kicker mt-4">No card · Your work saves in this browser · Cancel by email, no dark patterns</p>

        <div className="rule mt-10 pt-2">
          <p className="kicker">Who stands behind it</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-inksoft">
            PulsePilot is built by <strong className="text-ink">Pulse Social Media</strong>, Brisbane — the crew that runs
            socials for paying clients every week. The agents do what our strategists do: plan, write, direct, queue, measure.
            If the crew does not save you five hours in week one, month one is refunded. Write to will@jmcalder.com and a human answers.
          </p>
        </div>

        <div className="rule mt-10 pt-2">
          <p className="kicker">How one week works</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['01', 'Monday — Nova plans', 'A week of posts across your pillars, matched to your offer and what converted last week. A plan, not a pile of ideas.'],
              ['02', 'Midweek — Pen & Frame produce', 'Every post arrives with hooks, captions, hashtags, scripts and visual notes, in your voice. Your job: tap approve.'],
              ['03', 'Friday — Clock & Lens close the loop', 'Posts queue at best times. Lens scores each one out of 100 and tells you what to repeat and what to drop.'],
            ].map(([n, h, body]) => (
              <div key={n} className="pp-card p-5">
                <p className="font-mono text-xs font-bold text-emberdeep">{n}</p>
                <h2 className="mt-1 font-display text-xl font-bold">{h}</h2>
                <p className="mt-2 text-sm leading-relaxed text-inksoft">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rule mt-10 pt-2">
          <p className="kicker">Two ways to run it</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="pp-card-raised p-5">
              <p className="kicker">Copilot — start here</p>
              <h2 className="mt-1 font-display text-2xl font-bold">You sign off. Nothing moves without you.</h2>
              <p className="mt-2 text-sm leading-relaxed text-inksoft">Agents draft everything; posts queue only when you tap twice. For new brands, agencies with clients, and anyone tired of tools that post without asking.</p>
            </div>
            <div className="pp-card p-5">
              <p className="kicker">Autopilot — the done-for-you tier</p>
              <h2 className="mt-1 font-display text-2xl font-bold">They run it. You read the report.</h2>
              <p className="mt-2 text-sm leading-relaxed text-inksoft">Agents draft, queue and publish the week alone. Anything touching your banned words waits for review. Guardrails stay on either way.</p>
            </div>
          </div>
        </div>

        <div id="pricing" className="rule mt-10 pt-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="kicker">Pricing — flat per brand, in Australian dollars</p>
            <div className="flex gap-1.5" role="group" aria-label="Billing period">
              <button onClick={() => setAnnual(false)} aria-pressed={!annual} className={`min-h-[44px] rounded border px-3 py-1 font-mono text-xs font-bold ${!annual ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft'}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} aria-pressed={annual} className={`min-h-[44px] rounded border px-3 py-1 font-mono text-xs font-bold ${annual ? 'border-ink bg-ink text-paper' : 'border-line text-inksoft'}`}>Annual — 2 months free</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.name} className={t.hero ? 'pp-card-raised p-5' : 'pp-card p-5'}>
                {t.hero ? <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-emberdeep">Most chosen</p> : <p className="kicker">{t.name} plan</p>}
                <p className="mt-1 font-display text-4xl font-black">{annual ? t.annual : t.monthly}<span className="font-sans text-sm font-normal text-faint">{annual ? '/yr AUD' : '/mo AUD'}</span></p>
                {t.hero && <p className="font-display text-lg font-bold">{t.name}</p>}
                <p className="mt-2 text-sm text-inksoft">{t.desc}</p>
                <button onClick={onStart} className={t.hero ? 'btn-ember mt-4 min-h-[44px] w-full px-4 py-2 text-sm' : 'btn-ghost mt-4 min-h-[44px] w-full px-4 py-2 text-sm'}>
                  Start 14-day free trial
                </button>
              </div>
            ))}
          </div>
          <p className="kicker mt-3">Prices include GST · Invoices on every plan · Full terms below</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-ink pt-4">
          <a href="/terms" className="text-sm font-semibold underline">Terms, refunds & AI disclosure</a>
          <a href="/privacy" className="text-sm font-semibold underline">Privacy — your data stays yours</a>
          <span className="kicker ml-auto">Pulse Social Media · Brisbane · will@jmcalder.com</span>
        </div>
      </div>
    </div>
  );
}
