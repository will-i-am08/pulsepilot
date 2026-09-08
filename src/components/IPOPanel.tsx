'use client';
import { useGameStore } from '@/lib/gameStore';

export default function IPOPanel() {
  const { valuation, products, prestige, cash } = useGameStore();
  const mrr = products.reduce((s, p) => s + p.mrr, 0);
  const canIPO = valuation >= 50_000_000 && mrr >= 80000;
  const unicorn = valuation >= 1_000_000_000;

  const doIPO = () => {
    if (!canIPO) return;
    const gain = Math.floor(valuation / 8) + 5000000;
    useGameStore.setState(s => ({
      cash: s.cash + gain,
      prestige: s.prestige + 1,
      reputation: Math.min(100, s.reputation + 8),
      valuation: s.valuation + gain,
      events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `🚀 IPO! Raised $${(gain / 1_000_000).toFixed(1)}M at $${(s.valuation / 1_000_000).toFixed(1)}M valuation — prestige +1`, effect: `Prestige now ${s.prestige + 1}`, type: 'opportunity' as const }, ...s.events].slice(0, 8),
    }));
  };

  const prestigeReset = () => {
    if (prestige === 0) return;
    useGameStore.setState({
      prestige: prestige,
      cash: 350000 + prestige * 50000,
      valuation: 3000000 + prestige * 800000,
      products: [{ id: `p${Date.now()}`, name: `Gen ${prestige + 1} — First Product`, companyId: 'co1', category: 'AI Tools', stage: 'building', progress: 0, quality: 50, bugs: 1, techDebt: 0, assignedAgents: [], users: 0, mrr: 0, rating: 0 }],
      events: [{ id: `e${Date.now()}`, date: new Date().toLocaleDateString('en-AU'), headline: `♻️ Prestige ${prestige + 1} — new run with +${prestige * 50000} starting cash & permanent +${prestige * 5}% valuation bonus`, effect: 'New holding reset', type: 'market' as const }],
    });
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <h3 className="font-bold text-xs tracking-widest mb-3">IPO & PRESTIGE — ENDGAME</h3>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-2.5 rounded-xl border text-center ${valuation >= 50_000_000 ? 'bg-emerald-900/30 border-emerald-700' : 'bg-zinc-800 border-zinc-700'}`}>
          <div className="text-xs text-zinc-400">Valuation</div>
          <div className="text-sm font-bold">${(valuation / 1_000_000).toFixed(1)}M / $50M</div>
          <div className="text-xs">{valuation >= 50_000_000 ? '✓ Ready' : `${Math.floor((valuation / 50_000_000) * 100)}%`}</div>
        </div>
        <div className={`p-2.5 rounded-xl border text-center ${mrr >= 80000 ? 'bg-emerald-900/30 border-emerald-700' : 'bg-zinc-800 border-zinc-700'}`}>
          <div className="text-xs text-zinc-400">MRR</div>
          <div className="text-sm font-bold">${(mrr / 1000).toFixed(0)}k / $80k</div>
          <div className="text-xs">{mrr >= 80000 ? '✓ Ready' : `${Math.floor((mrr / 80000) * 100)}%`}</div>
        </div>
      </div>

      <button onClick={doIPO} disabled={!canIPO} className={`w-full py-2 rounded-full font-bold text-sm ${canIPO ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
        {canIPO ? '🚀 IPO — Raise $' + (Math.floor(valuation / 8) / 1_000_000).toFixed(1) + 'M' : 'IPO Locked — hit both targets'}
      </button>

      {unicorn && <div className="mt-2 text-xs text-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-1.5 rounded-full font-bold">🦄 UNICORN — $1B! You’ve beaten the market.</div>}

      <div className="mt-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <div className="text-xs font-bold">Prestige {prestige} — New Game+</div>
        <div className="text-xs text-zinc-400">Each IPC/unicorn gives permanent +$50k start cash & +5% valuation. Reset run but keep prestige.</div>
        <button onClick={prestigeReset} disabled={prestige === 0 && !unicorn} className="mt-2 w-full py-1.5 rounded-full bg-zinc-700 text-zinc-300 text-xs font-bold disabled:opacity-40">♻️ Prestige Reset (keep prestige)</button>
      </div>

      <div className="text-xs text-zinc-500 mt-2">Endless sandbox: IPO doesn’t end game. Keep scaling to decacorn. Leaderboard is time-to-unicorn.</div>
    </div>
  );
}
