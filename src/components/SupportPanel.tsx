'use client';
import { useGameStore } from '@/lib/gameStore';

export default function SupportPanel() {
  const { support, assignSupport, products } = useGameStore();
  const totalUsers = products.filter(p => p.stage === 'launched').reduce((s, p) => s + p.users, 0);
  const ticketsPerK = totalUsers > 0 ? (support.tickets / totalUsers) * 1000 : 0;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs tracking-widest">SUPPORT — REVIEWS & CHURN</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${support.rating >= 4.3 ? 'bg-emerald-600 text-white' : support.rating >= 3.7 ? 'bg-amber-500 text-black' : 'bg-red-600 text-white'}`}>⭐ {support.rating.toFixed(1)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-800 rounded-xl p-2.5 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">Tickets</div>
          <div className="text-lg font-black">{support.tickets}</div>
          <div className="text-xs text-zinc-500">{ticketsPerK.toFixed(1)}/k users</div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-2.5 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">Staff</div>
          <div className="text-lg font-black">{support.staff}/8</div>
          <div className="text-xs text-zinc-500">$5.2k each</div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-2.5 border border-zinc-700 text-center">
          <div className="text-xs text-zinc-400">Users</div>
          <div className="text-lg font-black">{totalUsers.toLocaleString()}</div>
          <div className="text-xs text-zinc-500">{products.filter(p=>p.stage==='launched').length} live</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Support staff:</span>
        <input type="range" min={0} max={8} value={support.staff} onChange={e => assignSupport(parseInt(e.target.value))} className="flex-1" />
        <span className="text-xs font-mono w-8 text-right">{support.staff}</span>
      </div>
      <div className="text-xs text-zinc-500 mt-1">Tickets grow with users × bugs, shrink with staff (8/day each). Low rating adds churn (+0.8% if &lt;3.5★). Keep rating &gt;4.0 or growth stalls.</div>

      <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{ width: `${(support.rating / 5) * 100}%` }} />
      </div>
    </div>
  );
}
