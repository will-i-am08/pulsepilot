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
import OfficeMap from './OfficeMap';
import Tutorial from './Tutorial';

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.floor(n).toLocaleString()}`;
}

export default function GameDashboard() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editLayout, setEditLayout] = useState(false);
  const [freePrompt, setFreePrompt] = useState('');
  const [stealthFocus, setStealthFocus] = useState('AI Video');
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (store.isPaused) return;
    const ms = store.speed === 1 ? 650 : store.speed === 2 ? 320 : 160;
    const id = setInterval(() => store.advanceDay(), ms);
    return () => clearInterval(id);
  }, [store.isPaused, store.speed, store.advanceDay]);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setActiveModal(null); setEditLayout(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-zinc-500">Loading STEALTH MODE...</div>;

  // Fix: product respects selectedCompanyId
  const selectedCompany = store.companies.find(c => c.id === store.selectedCompanyId) || store.companies[0];
  const product = store.products.find(p => p.id === store.selectedProductId && p.companyId === selectedCompany?.id) || store.products.find(p => p.companyId === selectedCompany?.id) || store.products[0];
  const mrr = store.products.reduce((s, p) => s + p.mrr, 0);
  const marketingSpend = store.marketing.filter(m => m.active).reduce((s, m) => s + m.spend, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">SM</div>
            <div>
              <div className="font-bold tracking-tight leading-none">STEALTH MODE</div>
              <div className="text-[11px] tracking-widest text-zinc-400">AI STARTUP TYCOON • OFFICE MODE</div>
            </div>
            <span className="hidden sm:inline-flex ml-3 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              {store.date.toLocaleDateString('en-AU')} • Day {store.tickCount} • {selectedCompany?.name}
            </span>
            {store.board.lastRound && (
              <span className="hidden lg:inline-flex ml-2 px-2 py-1 rounded-full bg-amber-900/30 border border-amber-800 text-xs text-amber-300">
                {store.board.lastRound.toUpperCase()} • {store.board.equityGiven}% • Pressure {store.board.pressure}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <button onClick={store.togglePause} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${store.isPaused ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}>{store.isPaused ? 'PAUSED' : 'LIVE'}</button>
              <div className="flex gap-1 pr-1">
                {[1, 2, 4].map(s => (<button key={s} onClick={() => store.setSpeed(s as 1 | 2 | 4)} className={`w-8 h-7 rounded-full text-xs font-bold ${store.speed === s ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>{s}x</button>))}
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
        {/* Centre Office */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <OfficeMap onOpen={setActiveModal} onEditLayout={() => setEditLayout(true)} />

          {/* Quick product strip — always visible but clicking opens full modal */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-widest">NOW BUILDING — {product.name} @ {selectedCompany?.name}</h3>
              <button onClick={() => setActiveModal('product')} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-full">Open Build Wall →</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <MiniStat label="Progress" value={`${Math.floor(product.progress)}%`} sub={product.stage} />
              <MiniStat label="Quality" value={`${Math.floor(product.quality)}/100`} sub={`${product.bugs} bugs`} />
              <MiniStat label="Users/MRR" value={product.stage === 'launched' ? product.users.toLocaleString() : '—'} sub={product.stage === 'launched' ? formatMoney(product.mrr) : 'pre-launch'} />
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: `${product.progress}%` }} />
            </div>
            <div className="text-xs text-zinc-500 mt-1">Assigned: {product.assignedAgents.length ? store.agents.filter(a => product.assignedAgents.includes(a.id)).map(a => a.name.split(' ')[0]).join(', ') : 'None — go to Desks to assign'} • Tech Debt {product.techDebt}</div>
          </div>

          {/* Edit layout modal inline */}
          {editLayout && (
            <div>
              <IsometricHQ />
              <button onClick={() => setEditLayout(false)} className="mt-2 w-full py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm">Done — Back to Office</button>
            </div>
          )}
        </div>

        {/* Right: Market external */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm tracking-widest">MARKET — 15 RIVALS</h2>
              <span className="text-xs text-zinc-400">Aggressive</span>
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
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <h3 className="font-bold text-xs tracking-widest mb-2">WORLD NEWS — AI-DRIVEN</h3>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
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
            <div className="text-sm font-bold flex justify-between">Leaderboard <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Supabase Ready</span></div>
            <div className="mt-2 space-y-1 text-xs">
              {[{ rank: 1, name: 'Sarah K. — Nexora clone', val: 420000000 }, { rank: 2, name: 'You', val: store.valuation, you: true }, { rank: 3, name: 'Marcus — Tide', val: 18000000 }].sort((a,b)=>b.val-a.val).map(r=>(
                <div key={r.rank} className={`flex justify-between px-2 py-1 rounded-lg ${r.you ? 'bg-white text-black font-bold' : 'bg-white/15'}`}><span>#{r.rank} {r.name}</span><span>{formatMoney(r.val)}</span></div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur" onClick={() => setActiveModal(null)} />
          <div className="w-full max-w-[560px] bg-[#0a0a0f] border-l border-zinc-800 overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-[#0a0a0f] py-2">
              <h2 className="font-black tracking-widest text-sm">{activeModal.toUpperCase()}</h2>
              <button onClick={() => setActiveModal(null)} className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-sm">✕ Close (Esc)</button>
            </div>

            {activeModal === 'agents' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-3">YOUR AGENTS — {store.agents.length}</h3>
                  <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {store.agents.map(a => (
                      <div key={a.id} className={`p-3 rounded-xl border ${a.isPrincipal ? 'bg-violet-900/30 border-violet-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                        <div className="flex justify-between">
                          <div><div className="font-semibold text-sm">{a.name} {a.isPrincipal && <span className="text-[10px] bg-violet-600 px-1 py-0.5 rounded">LLM</span>}</div><div className="text-xs text-zinc-400 capitalize">{a.role} • ${a.salary.toLocaleString()}/mo</div></div>
                          <div className="text-xs">Morale {Math.round(a.morale)} • Loyalty {Math.round(a.loyalty)}</div>
                        </div>
                        <button onClick={() => store.assignAgent(a.id, a.currentTask === product.id ? null : product.id)} className={`mt-2 w-full text-xs py-1.5 rounded-lg border ${a.currentTask === product.id ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-200'}`}>{a.currentTask === product.id ? '✓ Building' : '+ Assign to ' + product.name}</button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(['engineer','researcher','marketer','designer','hr','legal'] as const).map(r=> <button key={r} onClick={()=>store.hireAgent(r)} className="text-xs py-2 rounded-xl bg-white text-black font-bold capitalize">+ Hire {r}</button>)}
                  </div>
                </div>
                <TeamHealth />
              </>
            )}

            {activeModal === 'lab' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-3">RESEARCH — HYBRID TREE</h3>
                  <div className="flex gap-2 overflow-auto pb-2">
                    {store.tech.map(n => (
                      <button key={n.id} onClick={() => store.startResearch(n.id)} className={`min-w-[120px] p-3 rounded-xl border text-center ${n.unlocked ? 'bg-emerald-900/30 border-emerald-800' : n.researching ? 'bg-violet-900/40 border-violet-600' : 'bg-zinc-800 border-zinc-700'}`}>
                        <div className="text-xs font-bold">{n.name}</div>
                        <div className="text-xs text-zinc-400 mt-1">{n.unlocked ? 'Unlocked' : n.researching ? `${Math.floor(n.progress)}%` : `$${(n.cost/1000).toFixed(0)}k`}</div>
                        {n.researching && <div className="w-full h-1 bg-zinc-700 rounded-full mt-2"><div className="h-full bg-violet-500" style={{width: `${n.progress}%`}}/></div>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input value={freePrompt} onChange={e=>setFreePrompt(e.target.value)} placeholder='Free: "cheaper inference"' className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm" />
                    <button onClick={()=>{ if(freePrompt.trim()){store.freeResearch(freePrompt); setFreePrompt('');}}} className="px-4 py-1.5 rounded-full bg-violet-600 text-white text-sm font-bold">Bet</button>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'product' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <div className="flex justify-between"><h3 className="font-bold text-xs tracking-widest">PRODUCT — {product.name}</h3><span className="text-xs px-2 py-1 rounded-full bg-zinc-700">{product.stage}</span></div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MiniStat label="Progress" value={`${Math.floor(product.progress)}%`} sub={`${product.assignedAgents.length} agents`} />
                    <MiniStat label="Quality" value={`${Math.floor(product.quality)}/100`} sub={`${product.bugs} bugs`} />
                    <MiniStat label="Users/MRR" value={product.stage==='launched'?product.users.toLocaleString():'—'} sub={product.stage==='launched'?formatMoney(product.mrr):'pre-launch'} />
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full mt-3"><div className="h-full bg-violet-600" style={{width: `${product.progress}%`}}/></div>
                  <div className="text-xs text-zinc-500 mt-1">Tech Debt {product.techDebt}</div>
                </div>
                <MiraChat />
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-2">SWITCH PRODUCT</h3>
                  <div className="space-y-1">
                    {store.products.filter(p=>p.companyId===selectedCompany?.id).map(p=>(
                      <button key={p.id} onClick={()=>useGameStore.setState({selectedProductId: p.id})} className={`w-full text-left p-2 rounded-xl border text-sm ${p.id===product.id?'bg-white text-black':'bg-zinc-800 border-zinc-700'}`}>{p.name} • {p.stage} • {Math.floor(p.progress)}%</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeModal === 'meeting' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-3">MARKETING — ACTIVE FUNNEL</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {store.marketing.map(ch=>(
                      <div key={ch.id} className={`p-3 rounded-xl border ${ch.active?'bg-violet-900/20 border-violet-800':'bg-zinc-800/50 border-zinc-700'}`}>
                        <div className="flex justify-between"><span className="text-sm font-bold">{ch.name}</span><button onClick={()=>store.toggleMarketing(ch.id)} className={`text-xs px-2 py-1 rounded-full ${ch.active?'bg-emerald-600 text-white':'bg-zinc-700'}`}>{ch.active?'ON':'OFF'}</button></div>
                        <input type="range" min={0} max={20000} step={1000} value={ch.spend} onChange={e=>store.setMarketingSpend(ch.id, parseInt(e.target.value))} className="w-full mt-2" />
                        <div className="text-xs text-zinc-400">${ch.spend.toLocaleString()}/mo • CAC ${ch.cac}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <SupportPanel />
              </>
            )}

            {activeModal === 'ceo' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-3">FUNDING</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={()=>store.raiseFunding('angel')} className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-left"><div className="text-xs font-bold">Angel $200k</div><div className="text-xs text-zinc-400">8% • 90d</div></button>
                    <button onClick={()=>store.raiseFunding('seed')} className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-left"><div className="text-xs font-bold">Seed $750k</div><div className="text-xs text-zinc-400">15% • 120d</div></button>
                    <button onClick={()=>store.raiseFunding('seriesA')} className="p-2 rounded-xl bg-violet-900/30 border border-violet-800 text-left"><div className="text-xs font-bold">Series A $3M</div><div className="text-xs text-zinc-400">20% • 180d</div></button>
                    <button onClick={()=>store.raiseFunding('loan')} className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-left"><div className="text-xs font-bold">Loan $150k</div><div className="text-xs text-zinc-400">0% • +burn</div></button>
                  </div>
                </div>
                <HoldingPanel />
                <IPOPanel />
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-2">HQs</h3>
                  {store.hqs.map(hq=>(
                    <div key={hq.id} className="flex justify-between p-2 rounded-xl bg-zinc-800/50 border border-zinc-700 mb-2">
                      <div><div className="text-sm font-bold">{hq.city}</div><div className="text-xs text-zinc-400">{hq.used}/{hq.capacity}</div></div>
                      {hq.id!=='sf' && hq.used===0 ? <button onClick={()=>store.unlockHQ(hq.id)} className="text-xs bg-white text-black px-2 py-1 rounded-full">Unlock $60k</button> : <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-full">Active</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeModal === 'back' && (
              <>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="font-bold text-xs tracking-widest mb-2">STEALTH</h3>
                  {store.stealth.length===0 ? <div className="text-xs text-zinc-400">No stealth corps.</div> : store.stealth.map(sc=>(
                    <div key={sc.id} className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 mb-2">
                      <div className="flex justify-between text-sm font-bold"><span>{sc.name} • {sc.focus}</span><span>{Math.floor(sc.progress)}%</span></div>
                      <div className="w-full h-1 bg-zinc-700 rounded-full mt-1"><div className="h-full bg-violet-500" style={{width: `${sc.progress}%`}}/></div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input value={stealthFocus} onChange={e=>setStealthFocus(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm" placeholder="Focus" />
                    <button onClick={()=>store.createStealth(stealthFocus)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">Launch $25k</button>
                  </div>
                </div>
                <DirtyOps />
              </>
            )}

          </div>
        </div>
      )}

      <Tutorial />
      <footer className="text-center text-xs text-zinc-600 py-4 border-t border-zinc-900 mt-2">STEALTH MODE — Office Mode • Click rooms to open menus • Esc to close • Build: {formatMoney(store.valuation)} • Day {store.tickCount}</footer>
    </div>
  );
}

function Stat({ label, value, tone='default' }: {label:string; value:string; tone?:string}) {
  const cls = tone==='danger'?'text-red-400':tone==='warn'?'text-amber-400':tone==='good'?'text-emerald-400':'text-white';
  return <div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 flex flex-col items-center leading-none"><span className="text-[10px] tracking-widest text-zinc-500">{label}</span><span className={`text-xs font-bold ${cls}`}>{value}</span></div>;
}
function MiniStat({label,value,sub}:{label:string;value:string;sub:string}) {
  return <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700"><div className="text-xs text-zinc-400">{label}</div><div className="text-lg font-black">{value}</div><div className="text-xs text-zinc-500">{sub}</div></div>;
}
