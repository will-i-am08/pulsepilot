'use client';
import { useGameStore } from '@/lib/gameStore';

export default function TeamHealth() {
  const { agents, office } = useGameStore();
  const hr = agents.filter(a => a.role === 'hr').length;
  const finance = agents.filter(a => a.role === 'finance').length;
  const legal = agents.filter(a => a.role === 'legal').length;
  const avgMorale = Math.round(agents.reduce((s, a) => s + a.morale, 0) / Math.max(1, agents.length));
  const avgLoyalty = Math.round(agents.reduce((s, a) => s + a.loyalty, 0) / Math.max(1, agents.length));
  const atRisk = agents.filter(a => !a.isPrincipal && (a.loyalty < 65 || a.morale < 40)).length;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <h3 className="font-bold text-xs tracking-widest mb-3">TEAM HEALTH — HR / FINANCE / LEGAL</h3>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`p-2.5 rounded-xl border text-center ${hr > 0 ? 'bg-emerald-900/20 border-emerald-800' : 'bg-zinc-800 border-zinc-700 opacity-60'}`}>
          <div className="text-xs font-bold">HR ×{hr}</div>
          <div className="text-xs text-zinc-400">+0.15 loyalty/day</div>
          <div className="text-xs text-zinc-500">Poach -2.5%/each</div>
          <div className="text-xs text-zinc-500">Morale + office</div>
        </div>
        <div className={`p-2.5 rounded-xl border text-center ${finance > 0 ? 'bg-emerald-900/20 border-emerald-800' : 'bg-zinc-800 border-zinc-700 opacity-60'}`}>
          <div className="text-xs font-bold">Finance ×{finance}</div>
          <div className="text-xs text-zinc-400">Burn -3%/each</div>
          <div className="text-xs text-zinc-500">Max -12%</div>
          <div className="text-xs text-zinc-500">Val +1% each</div>
        </div>
        <div className={`p-2.5 rounded-xl border text-center ${legal > 0 ? 'bg-emerald-900/20 border-emerald-800' : 'bg-zinc-800 border-zinc-700 opacity-60'}`}>
          <div className="text-xs font-bold">Legal ×{legal}</div>
          <div className="text-xs text-zinc-400">Dirty risk -12%/each</div>
          <div className="text-xs text-zinc-500">Suit defence</div>
          <div className="text-xs text-zinc-500">Lawsuit -1.5%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-zinc-800 rounded-xl p-2 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">Avg Morale</div>
          <div className={`text-lg font-black ${avgMorale < 40 ? 'text-red-400' : avgMorale < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{avgMorale}%</div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-2 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">Avg Loyalty</div>
          <div className={`text-lg font-black ${avgLoyalty < 60 ? 'text-red-400' : avgLoyalty < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{avgLoyalty}%</div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-2 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">At Risk</div>
          <div className={`text-lg font-black ${atRisk > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{atRisk}</div>
          <div className="text-xs text-zinc-500">loyalty&lt;65</div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Office morale {office.moraleBonus >= 0 ? '+' : ''}{office.moraleBonus}% {office.moraleBonus < 0 ? '— build break/meeting rooms or add desks' : '— HR amplifies this'}. Assigned agents lose 0.3 morale/3d, idle recover 0.2/d. Low morale erodes loyalty.
      </div>

      <div className="flex gap-2 mt-3">
        {(['hr', 'finance', 'legal'] as const).map(r => (
          <button key={r} onClick={() => useGameStore.getState().hireAgent(r)} className="flex-1 text-xs py-2 rounded-full bg-white text-black font-bold capitalize">+ Hire {r}</button>
        ))}
      </div>
    </div>
  );
}
