'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import MiraChat from './MiraChat';
import IsometricHQ from './IsometricHQ';
import DirtyOps from './DirtyOps';
import HoldingPanel from './HoldingPanel';
import SupportPanel from './SupportPanel';
import IPOPanel from './IPOPanel';
import TeamHealth from './TeamHealth';
import Tutorial from './Tutorial';

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.floor(n).toLocaleString()}`;
}

export default function GameDashboard() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [freePrompt, setFreePrompt] = useState('');
  const [stealthFocus, setStealthFocus] = useState('AI Video');
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (store.isPaused) return;
    const ms = store.speed === 1 ? 650 : store.speed === 2 ? 320 : 160;
    const id = setInterval(() => store.advanceDay(), ms);
    return () => clearInterval(id);
  }, [store.isPaused, store.speed, store.advanceDay]);

  // AI-driven news every ~3 weeks (20 ticks) via /api/events
  useEffect(() => {
    if (store.isPaused) return;
    if (store.tickCount > 0 && store.tickCount % 20 === 0) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gameContext: { tickCount: store.tickCount, cash: store.cash, mrr: store.products.reduce((s, p) => s + p.mrr, 0), quality: store.products[0]?.quality } }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.headline) {
            const { events } = useGameStore.getState();
            useGameStore.setState({
              events: [{ id: `e${Date.now()}`, date: new Date().toLocaleDateString('en-AU'), headline: data.headline, effect: data.effect, type: data.type }, ...events].slice(0, 8),
            });
          }
        })
        .catch(() => {});
    }
  }, [store.tickCount, store.isPaused, store.cash, store.products]);

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-zinc-500">Loading STEALTH MODE...</div>;

  const product = store.products.find(p => p.id === store.selectedProductId) || store.products[0];
  const mrr = store.products.reduce((s, p) => s + p.mrr, 0);
  const marketingSpend = store.marketing.filter(m => m.active).reduce((s, m) => s + m.spend, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">SM</div>
            <div>
              <div className="font-bold tracking-tight leading-none">STEALTH MODE</div>
              <div className="text-[11px] tracking-widest text-zinc-400">AI STARTUP TYCOON • V1</div>
            </div>
            <span className="hidden sm:inline-flex ml-3 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              {store.date.toLocaleDateString('en-AU')} • Day {store.tickCount}
            </span>
            {store.board.lastRound && (
              <span className="hidden lg:inline-flex ml-2 px-2 py-1 rounded-full bg-amber-900/30 border border-amber-800 text-xs text-amber-300">
                {store.board.lastRound.toUpperCase()} • {store.board.equityGiven}% equity • Pressure {store.board.pressure}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <button onClick={store.togglePause} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${store.isPaused ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                {store.isPaused ? 'PAUSED' : 'LIVE'}
              </button>
              <div className="flex gap-1 pr-1">
                {[1, 2, 4].map(s => (
                  <button key={s} onClick={() => store.setSpeed(s as 1 | 2 | 4)} className={`w-8 h-7 rounded-full text-xs font-bold ${store.speed === s ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>{s}x</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Stat label="CASH" value={formatMoney(store.cash)} tone={store.cash < 50000 ? 'danger' : 'default'} />
              <Stat label="BURN" value={formatMoney(store.burnRate + marketingSpend) + '/mo'} />
              <Stat label="MRR" value={formatMoney(mrr)} tone={mrr > 10000 ? 'good' : 'default'} />
              <Stat label="RUNWAY" value={`${store.runway.toFixed(1)}mo`} tone={store.runway < 3 ? 'danger' : store.runway < 6 ? 'warn' : 'default'} />
              <Stat label="VALUATION" value={formatMoney(store.valuation)} tone="good" />
            </div>
          </div>
        </div>
        {store.board.deadlineDays !== null && store.board.targetMRR !== null && (
          <div className="bg-amber-950/40 border-t border-amber-900/50 px-4 py-1.5 flex justify-center gap-4 text-xs">
            <span className="text-amber-300 font-semibold">BOARD: Hit {formatMoney(store.board.targetMRR)} MRR in {store.board.deadlineDays}d or pressure +25%</span>
            <span className="text-zinc-400">Current MRR {formatMoney(mrr)} • Pressure {store.board.pressure}%</span>
          </div>
        )}
      </header>

      <div className="max-w-[1600px] mx-auto w-full flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left: Agents + Funding */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm tracking-widest">YOUR AGENTS</h2>
              <span className="text-xs bg-violet-600 text-white px-2 py-1 rounded-full">{store.agents.length} / ∞</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">Tier 1 LLM principals you chat to. Tier 2 simulated. Assign to product, research, or stealth.</p>
            <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
              {store.agents.map(a => (
                <div key={a.id} className={`p-3 rounded-xl border ${a.isPrincipal ? 'bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border-violet-800' : 'bg-zinc-800/50 border-zinc-700'} flex flex-col gap-2`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {a.name} {a.isPrincipal && <span className="text-[10px] bg-violet-600 px-1.5 py-0.5 rounded">LLM</span>}
                      </div>
                      <div className="text-xs text-zinc-400 capitalize">{a.role} • ${a.salary.toLocaleString()}/mo</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-300">Morale {a.morale}</div>
                      <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-500" style={{ width: `${a.morale}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.traits.map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{t}</span>)}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => store.assignAgent(a.id, a.currentTask ? null : product.id)}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border ${a.currentTask === product.id ? 'bg-emerald-600 border-emerald-500 text-white' : a.currentTask ? 'bg-amber-600 border-amber-500 text-white' : 'bg-zinc-700 border-zinc-600 text-zinc-200 hover:bg-zinc-600'}`}
                    >
                      {a.currentTask === product.id ? '✓ Building' : a.currentTask ? `→ ${a.currentTask.slice(0, 8)}` : '+ Assign to PulseAI'}
                    </button>
                    {store.stealth.length > 0 && (
                      <button onClick={() => store.assignAgent(a.id, store.stealth[0].id)} className="text-xs px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hidden sm:block">Stealth</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {(['engineer', 'researcher', 'marketer', 'designer'] as const).map(role => (
                <button key={role} onClick={() => store.hireAgent(role)} className="text-xs py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 capitalize">+ Hire {role}</button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-3">FUNDING — ANY ROUND</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => store.raiseFunding('angel')} className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-left">
                <div className="text-xs font-bold">Angel $200k</div><div className="text-xs text-zinc-400">8% • 90d → $8k MRR</div>
              </button>
              <button onClick={() => store.raiseFunding('seed')} className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-left">
                <div className="text-xs font-bold">Seed $750k</div><div className="text-xs text-zinc-400">15% • 120d → $40k MRR</div>
              </button>
              <button onClick={() => store.raiseFunding('seriesA')} className="p-2.5 rounded-xl bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-800 hover:bg-violet-900/40 text-left">
                <div className="text-xs font-bold">Series A $3M</div><div className="text-xs text-zinc-400">20% • 180d → $150k MRR</div>
              </button>
              <button onClick={() => store.raiseFunding('loan')} className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-left">
                <div className="text-xs font-bold">Loan $150k</div><div className="text-xs text-zinc-400">0% • +$4.5k burn</div>
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-2">Equity given: {store.board.equityGiven}% • Miss board target and pressure spikes. High equity = weekly pressure.</div>
          </div>

          <TeamHealth />

          <IsometricHQ />

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-2">HQs — MULTIPLE</h3>
            <div className="space-y-2">
              {store.hqs.map(hq => (
                <div key={hq.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  <div>
                    <div className="text-sm font-semibold">{hq.city} • {hq.country}</div>
                    <div className="text-xs text-zinc-400">{hq.used}/{hq.capacity} • {hq.costModifier < 1 ? `${Math.round((1 - hq.costModifier) * 100)}% cheaper` : 'HQ'} • +{hq.talentBonus}% talent</div>
                  </div>
                  {hq.id !== 'sf' && hq.used === 0 ? (
                    <button onClick={() => store.unlockHQ(hq.id)} className="text-xs bg-white text-black px-2.5 py-1 rounded-full font-bold">Unlock $60k</button>
                  ) : (
                    <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Product + Mira + Tech + Marketing */}
        <main className="col-span-12 lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm tracking-widest">PRODUCT — {product.name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${product.stage === 'launched' ? 'bg-emerald-600 text-white' : product.stage === 'beta' ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-200'}`}>{product.stage}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat label="Progress" value={`${Math.floor(product.progress)}%`} sub={product.stage === 'building' ? `${product.assignedAgents.length} agents` : '—'} />
              <MiniStat label="Quality" value={`${Math.floor(product.quality)}/100`} sub={`${product.bugs} bugs`} />
              <MiniStat label="Users / MRR" value={product.stage === 'launched' ? product.users.toLocaleString() : '—'} sub={product.stage === 'launched' ? formatMoney(product.mrr) : 'pre-launch'} />
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all" style={{ width: `${product.progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mb-4">
              <span>Assigned: {product.assignedAgents.length ? store.agents.filter(a => product.assignedAgents.includes(a.id)).map(a => a.name.split(' ')[0]).join(', ') : 'None — assign agents'}</span>
              <span className="text-zinc-500">Tech Debt {product.techDebt}/100</span>
            </div>

            {product.stage === 'launched' && (
              <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl p-3 flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-emerald-300">LIVE — ⭐ {product.rating.toFixed(1)} rating</div>
                  <div className="text-xs text-zinc-400">Marketing spend ${marketingSpend.toLocaleString()}/mo driving growth</div>
                </div>
                <button onClick={() => {
                  const s = useGameStore.getState();
                  useGameStore.setState({
                    products: [...s.products, { id: `p${Date.now()}`, name: `Stealth Project ${s.products.length}`, companyId: 'co1', category: 'AI Tools', stage: 'building', progress: 0, quality: 50, bugs: 0, techDebt: 0, assignedAgents: [], users: 0, mrr: 0, rating: 0 }],
                  });
                }} className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-bold">+ New Product</button>
              </div>
            )}

            <MiraChat />
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-3">RESEARCH — HYBRID TREE + FREE BETS</h3>
            <div className="flex gap-2 overflow-auto pb-2">
              {store.tech.map(n => (
                <button key={n.id} onClick={() => store.startResearch(n.id)} className={`min-w-[120px] p-3 rounded-xl border text-center transition ${n.unlocked ? 'bg-emerald-900/30 border-emerald-800' : n.researching ? 'bg-violet-900/40 border-violet-600 animate-pulse' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}>
                  <div className="text-xs font-bold">{n.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {n.unlocked ? 'Unlocked' : n.researching ? `${Math.floor(n.progress)}% — ${store.agents.filter(a => a.currentTask === n.id).length} researchers` : `$${(n.cost / 1000).toFixed(0)}k • Click to start`}
                  </div>
                  {n.researching && <div className="w-full h-1 bg-zinc-700 rounded-full mt-2"><div className="h-full bg-violet-500" style={{ width: `${n.progress}%` }} /></div>}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input value={freePrompt} onChange={e => setFreePrompt(e.target.value)} placeholder='Free research: "cheaper video inference" or "viral growth hack"' className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm placeholder:text-zinc-500" />
              <button onClick={() => { if (freePrompt.trim()) { store.freeResearch(freePrompt); setFreePrompt(''); } }} className="px-4 py-1.5 rounded-full bg-violet-600 text-white text-sm font-bold">Bet Research</button>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Assign researchers to the node for 6x speed. Free research is risky (32% breakthrough) but can discover outside the tree.</div>
          </div>

          <HoldingPanel />

          <SupportPanel />

          <IPOPanel />

          <DirtyOps />

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-3">MARKETING — ACTIVE FUNNEL</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {store.marketing.map(ch => (
                <div key={ch.id} className={`p-3 rounded-xl border ${ch.active ? 'bg-violet-900/20 border-violet-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">{ch.name}</div>
                    <button onClick={() => store.toggleMarketing(ch.id)} className={`text-xs px-2 py-1 rounded-full font-bold ${ch.active ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>{ch.active ? 'ON' : 'OFF'}</button>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">CAC ${ch.cac} • Churn {ch.churnImpact > 0 ? '+' : ''}{ch.churnImpact}%</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="range" min={0} max={20000} step={1000} value={ch.spend} onChange={e => store.setMarketingSpend(ch.id, parseInt(e.target.value))} className="flex-1" />
                    <span className="text-xs font-mono w-16 text-right">${ch.spend.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-zinc-500 mt-2">Total spend ${marketingSpend.toLocaleString()}/mo added to burn. Launched products grow faster with marketing, but paid ads increase churn.</div>
          </div>
        </main>

        {/* Right: Market + Stealth + News */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm tracking-widest">MARKET — 15 RIVALS</h2>
              <span className="text-xs text-zinc-400">Headline Sim</span>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {store.competitors.slice(0, 8).map(c => (
                <div key={c.id} className={`p-2.5 rounded-xl border flex justify-between items-center ${c.lastAction ? 'bg-red-900/20 border-red-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">{c.name} <span className={`w-2 h-2 rounded-full ${c.trend === 'up' ? 'bg-emerald-500' : c.trend === 'down' ? 'bg-red-500' : 'bg-zinc-500'}`} /> {c.lastAction && <span className="text-[10px] bg-red-600 text-white px-1 py-0.5 rounded">{c.lastAction}</span>}</div>
                    <div className="text-xs text-zinc-400">{c.focus} • {formatMoney(c.valuation)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold">{c.users.toLocaleString()} users</div>
                    <div className="text-xs text-zinc-500">Q {Math.floor(c.productQuality)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500">Aggressive: they copy if overlap &gt;60%. V1→100, V2→500+ via Supabase Edge Function.</div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-2">STEALTH COMPANIES</h3>
            {store.stealth.length === 0 ? (
              <div className="text-xs text-zinc-400">No stealth corps yet. Launch one to research a rival's space without them noticing.</div>
            ) : (
              <div className="space-y-2 mb-3">
                {store.stealth.map(sc => (
                  <div key={sc.id} className={`p-2.5 rounded-xl border ${sc.detected ? 'bg-red-900/30 border-red-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{sc.name} • {sc.focus}</span>
                      <span className="text-xs text-zinc-400">{Math.floor(sc.progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full mt-1"><div className="h-full bg-violet-500" style={{ width: `${sc.progress}%` }} /></div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span className={sc.leakRisk > 70 ? 'text-red-400' : 'text-zinc-500'}>Leak {Math.floor(sc.leakRisk)}%</span>
                      {sc.detected ? <span className="text-red-400 font-bold">DETECTED!</span> : <span className="text-zinc-500">{store.agents.filter(a => a.currentTask === sc.id).length} agents</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={stealthFocus} onChange={e => setStealthFocus(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm" placeholder="Focus: AI Video, Fintech..." />
              <button onClick={() => store.createStealth(stealthFocus)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">Launch $25k</button>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Assign agents to stealth ID to progress faster. High leak = rivals find out.</div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-2">WORLD NEWS — AI-DRIVEN</h3>
            <div className="space-y-2">
              {store.events.map(e => (
                <div key={e.id} className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  <div className="text-xs text-zinc-500">{e.date} • {e.type}</div>
                  <div className="text-sm font-semibold leading-tight mt-0.5">{e.headline}</div>
                  <div className="text-xs text-zinc-400 mt-1">{e.effect}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="text-sm font-bold flex justify-between">Leaderboard — Top Founders <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Supabase Ready</span></div>
            <div className="mt-2 space-y-1 text-xs">
              {[
                { rank: 1, name: 'Sarah K. — Nexora clone', val: 420000000 },
                { rank: 2, name: 'You (current)', val: store.valuation, you: true },
                { rank: 3, name: 'Marcus — Tide Labs', val: 18000000 },
                { rank: 4, name: 'Ava — Blip AI', val: 12500000 },
              ].sort((a,b)=>b.val-a.val).map(r=>(
                <div key={r.rank} className={`flex justify-between px-2 py-1 rounded-lg ${r.you ? 'bg-white text-black font-bold' : 'bg-white/15'}`}>
                  <span>#{r.rank} {r.name}</span><span>{formatMoney(r.val)}</span>
                </div>
              ))}
            </div>
            <div className="text-xs opacity-90 mt-2">Run <code>supabase-schema.sql</code> + set .env.local to enable global saves. V1 adds time-to-unicorn speedrun.</div>
          </div>
        </aside>
      </div>

      <Tutorial />

      <footer className="text-center text-xs text-zinc-600 py-4 border-t border-zinc-900 mt-2">
        STEALTH MODE — V1 Build • Tick: 1 day = 650ms at 1x • Pause / 2x / 4x • Real LLM via /api/chat • Supabase schema ready • GDD v0.1
      </footer>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' | 'warn' | 'good' }) {
  const toneCls = tone === 'danger' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : tone === 'good' ? 'text-emerald-400' : 'text-white';
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 flex flex-col items-center leading-none">
      <span className="text-[10px] tracking-widest text-zinc-500">{label}</span>
      <span className={`text-xs font-bold ${toneCls}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
      <div className="text-[11px] tracking-widest text-zinc-400">{label}</div>
      <div className="text-lg font-black leading-none mt-1">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}
