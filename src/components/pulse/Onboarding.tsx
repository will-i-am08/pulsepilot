'use client';

import { useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import type { Channel, OperatingMode } from '@/lib/pulse/types';

const CHANNELS: { v: Channel; note: string }[] = [
  { v: 'instagram', note: 'Reels + carousels' },
  { v: 'tiktok', note: 'Raw video reach' },
  { v: 'facebook', note: 'Community + groups' },
  { v: 'linkedin', note: 'Business authority' },
];
const PILLAR_SUGGESTIONS = ['Offers', 'Proof & Results', 'Education', 'Behind the Scenes', 'Testimonials', 'Myth-busting'];

export default function Onboarding({ onDone }: { onDone?: () => void }) {
  const createBusiness = usePulse((s) => s.createBusiness);
  const runWeeklyPlan = usePulse((s) => s.runWeeklyPlan);
  const hasBusinesses = usePulse((s) => s.businesses.length > 0);
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [idealCustomer, setIdealCustomer] = useState('');
  const [offer, setOffer] = useState('');
  const [channels, setChannels] = useState<Channel[]>(['instagram', 'tiktok', 'facebook']);
  const [mode, setMode] = useState<OperatingMode>('copilot');
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [pillars, setPillars] = useState<string[]>(['Offers', 'Proof & Results', 'Education']);
  const [customPillar, setCustomPillar] = useState('');
  const [goal, setGoal] = useState('bookings');
  const [tone, setTone] = useState('direct, warm, no fluff');
  const [emojiLevel, setEmojiLevel] = useState<0 | 1 | 2>(1);
  const [busy, setBusy] = useState(false);

  const toggleChannel = (c: Channel) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const togglePillar = (p: string) =>
    setPillars((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const addCustomPillar = () => {
    const v = customPillar.trim().slice(0, 40);
    if (!v || pillars.includes(v)) return;
    setPillars((prev) => [...prev, v]);
    setCustomPillar('');
  };

  const nameOk = businessName.trim().length >= 2;
  const step1Ok = channels.length > 0 && pillars.length > 0;
  const canNext = step === 0 ? nameOk : step === 1 ? step1Ok : true;

  const finish = () => {
    if (!nameOk || busy) return;
    setBusy(true);
    const id = createBusiness({
      businessName: businessName.trim(),
      industry: industry.trim() || 'Local services',
      location: location.trim() || 'Brisbane QLD',
      idealCustomer: idealCustomer.trim() || 'local customers',
      offer: offer.trim() || 'New-customer offer',
      voice: { tones: [tone], emojiLevel, bannedWords: ['revolutionary', 'game-changer', 'synergy'] },
      channels: channels.length ? channels : ['instagram'],
      mode,
      postsPerWeek,
      pillars: pillars.length ? pillars : ['Offers', 'Education', 'Proof'],
      goals: { primary: goal, targetMonthly: goal === 'followers' ? 1000 : 30 },
    });
    if (id) runWeeklyPlan(id);
    setBusy(false);
    if (id) onDone?.();
  };

  const titles = ['Who is the crew working for?', 'Where do they publish?', 'Who holds the pen?'];

  return (
    <div className="pp-card-raised mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <p className="kicker">Setup · {step + 1} of 3</p>
        <p className="font-mono text-xs text-faint" aria-hidden="true">{['— — ·', '— · —', '· — —'][step]}</p>
      </div>
      <h2 className="mt-4 font-display text-3xl font-black tracking-tight">{titles[step]}</h2>

      {step === 0 && (
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="kicker">Business name</span>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={80} placeholder="e.g. Harbour Café" className="field mt-1.5 font-display text-lg font-bold" aria-label="Business name" />
            {!nameOk && <span className="mt-1 block font-mono text-[11px] text-emberdeep">Give the business a name to continue.</span>}
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Trade</span>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={60} placeholder="e.g. Plumbing, café, coaching" className="field mt-1.5" aria-label="Trade" />
            </label>
            <label className="block">
              <span className="kicker">Whereabouts</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} placeholder="e.g. Brisbane QLD" className="field mt-1.5" aria-label="Location" />
            </label>
          </div>
          <label className="block">
            <span className="kicker">Best customer, in a sentence</span>
            <input value={idealCustomer} onChange={(e) => setIdealCustomer(e.target.value)} maxLength={120} placeholder="e.g. time-poor parents nearby" className="field mt-1.5" aria-label="Ideal customer" />
          </label>
          <label className="block">
            <span className="kicker">The offer — one plain line</span>
            <input value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={140} placeholder="e.g. Free first consult this month" className="field mt-1.5" aria-label="Offer" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Keeping score by</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="field mt-1.5" aria-label="Primary goal">
                <option value="leads">Enquiries</option>
                <option value="bookings">Bookings</option>
                <option value="sales">Sales</option>
                <option value="followers">Followers</option>
              </select>
            </label>
            <label className="block">
              <span className="kicker">House voice</span>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="field mt-1.5" aria-label="House voice">
                <option>direct, warm, no fluff</option>
                <option>bold and playful</option>
                <option>premium and calm</option>
                <option>cheeky challenger</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 space-y-6">
          <div>
            <p className="kicker">Channels — pick at least one</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.v}
                  onClick={() => toggleChannel(c.v)}
                  aria-pressed={channels.includes(c.v)}
                  aria-label={`${channels.includes(c.v) ? 'Remove' : 'Add'} ${c.v}`}
                  className={`flex min-h-[44px] items-baseline justify-between rounded-lg border px-4 py-2.5 text-left ${channels.includes(c.v) ? 'border-ink bg-ink text-paper' : 'border-line bg-cream hover:border-ink'}`}
                >
                  <span className="font-semibold capitalize">{c.v}</span>
                  <span className={`font-mono text-[11px] ${channels.includes(c.v) ? 'opacity-70' : 'text-faint'}`}>{c.note}</span>
                </button>
              ))}
            </div>
            {channels.length === 0 && <span className="mt-1 block font-mono text-[11px] text-emberdeep">Pick at least one channel.</span>}
          </div>
          <div>
            <p className="kicker">Pillars — what you post about</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PILLAR_SUGGESTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePillar(p)}
                  aria-pressed={pillars.includes(p)}
                  className={`min-h-[44px] rounded-full border px-4 py-1.5 text-sm font-medium ${pillars.includes(p) ? 'border-moss bg-mossbg text-moss' : 'border-line bg-cream text-inksoft hover:border-ink'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <label htmlFor="ob-pillar" className="sr-only">Add your own pillar</label>
              <input id="ob-pillar" value={customPillar} onChange={(e) => setCustomPillar(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomPillar()} maxLength={40} placeholder="Or write your own pillar" className="field text-sm" />
              <button onClick={addCustomPillar} className="btn-ghost min-h-[44px] shrink-0 px-3 py-1 text-xs">Add</button>
            </div>
            {pillars.filter((p) => !PILLAR_SUGGESTIONS.includes(p)).length > 0 && (
              <p className="mt-1 font-mono text-[11px] text-faint">Yours: {pillars.filter((p) => !PILLAR_SUGGESTIONS.includes(p)).join(', ')}</p>
            )}
            {pillars.length === 0 && <span className="mt-1 block font-mono text-[11px] text-emberdeep">Keep at least one pillar.</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Posts per week — {postsPerWeek}</span>
              <input type="range" min={2} max={7} value={postsPerWeek} onChange={(e) => setPostsPerWeek(Number(e.target.value))} className="mt-2 w-full" aria-label="Posts per week" />
            </label>
            <div>
              <p className="kicker">Emoji appetite</p>
              <div className="mt-2 flex gap-2" role="group" aria-label="Emoji level">
                {([0, 1, 2] as const).map((l) => (
                  <button key={l} onClick={() => setEmojiLevel(l)} aria-pressed={emojiLevel === l} className={`min-h-[44px] flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${emojiLevel === l ? 'border-ink bg-ink text-paper' : 'border-line bg-cream hover:border-ink'}`}>
                    {l === 0 ? 'None' : l === 1 ? 'A pinch' : 'Generous'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => setMode('copilot')} aria-pressed={mode === 'copilot'} className={`rounded-lg border p-5 text-left ${mode === 'copilot' ? 'pp-card-raised' : 'pp-card'}`}>
            <p className="kicker">Copilot</p>
            <p className="mt-1 font-display text-xl font-bold">You sign off. Nothing moves without you.</p>
            <p className="mt-2 text-sm leading-relaxed text-inksoft">The crew drafts the week. Posts queue only on your tap, twice. Control without the grind — minutes, not weekends.</p>
          </button>
          <button onClick={() => setMode('autopilot')} aria-pressed={mode === 'autopilot'} className={`rounded-lg border p-5 text-left ${mode === 'autopilot' ? 'pp-card-raised' : 'pp-card'}`}>
            <p className="kicker">Autopilot</p>
            <p className="mt-1 font-display text-xl font-bold">They run it. You read the report.</p>
            <p className="mt-2 text-sm leading-relaxed text-inksoft">The crew drafts, queues and publishes alone. Anything risky still waits for you. Banned words are locked in either way.</p>
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
        <span className="flex gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="min-h-[44px] px-2 py-2 font-mono text-xs uppercase tracking-widest text-faint hover:text-ink disabled:opacity-30">
            ← Back
          </button>
          {hasBusinesses && (
            <button onClick={() => onDone?.()} className="min-h-[44px] px-2 py-2 font-mono text-xs uppercase tracking-widest text-faint hover:text-ink">
              Cancel
            </button>
          )}
        </span>
        {step < 2 ? (
          <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn-ink min-h-[44px] px-6 py-2.5 text-sm disabled:opacity-40">
            Continue →
          </button>
        ) : (
          <button onClick={finish} disabled={busy} className="btn-ember min-h-[44px] px-6 py-2.5 text-sm disabled:opacity-50">
            {busy ? 'Opening…' : 'Open the newsroom'}
          </button>
        )}
      </div>
    </div>
  );
}
