'use client';

type Room = { id: string; label: string; sub: string; icon: string; color: string; hint: string };

const ROOMS: Room[] = [
  { id: 'agents', label: 'Desks', sub: 'Team & Hiring', icon: '💻', color: 'from-violet-900/40 to-indigo-900/40 border-violet-700', hint: 'Assign • Hire • Morale' },
  { id: 'lab', label: 'Lab', sub: 'Research & Tech', icon: '🧪', color: 'from-amber-900/30 to-orange-900/30 border-amber-700', hint: 'Tree • Free bets • Steal' },
  { id: 'product', label: 'Build Wall', sub: 'Product & Mira', icon: '📦', color: 'from-zinc-800 to-zinc-900 border-zinc-700', hint: 'Progress • Chat CTO' },
  { id: 'meeting', label: 'Meeting Room', sub: 'Marketing & Support', icon: '📈', color: 'from-emerald-900/20 to-teal-900/20 border-emerald-800', hint: 'Ads • Tickets • Rating' },
  { id: 'ceo', label: 'CEO Office', sub: 'Funding • IPO • Holding', icon: '🏢', color: 'from-slate-800 to-slate-900 border-slate-700', hint: 'Raise • Companies • Unicorn' },
  { id: 'back', label: 'Back Room', sub: 'Stealth & Dirty Ops', icon: '🕵️', color: 'from-red-950/30 to-zinc-900 border-red-900', hint: 'Spy • Sue • Hostile' },
];

export default function OfficeMap({ onOpen, onEditLayout }: { onOpen: (id: string) => void; onEditLayout: () => void }) {
  return (
    <div className="bg-[#0f0f14] rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black tracking-widest text-sm">SF HQ — CLICK A ROOM</h2>
        <button onClick={onEditLayout} className="text-xs bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-700">✏️ Edit Layout</button>
      </div>

      {/* Isometric-ish office floor */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-black rounded-xl border border-zinc-800 p-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #333 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, #333 0 1px, transparent 1px 40px)' }} />
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-3">
          {ROOMS.map(r => (
            <button
              key={r.id}
              onClick={() => onOpen(r.id)}
              className={`relative h-[128px] rounded-2xl border bg-gradient-to-br ${r.color} p-3 text-left hover:scale-[1.02] hover:border-white/40 transition group`}
            >
              <div className="text-3xl">{r.icon}</div>
              <div className="font-bold text-sm mt-1">{r.label}</div>
              <div className="text-xs text-zinc-300">{r.sub}</div>
              <div className="text-xs text-zinc-500 mt-1">{r.hint}</div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50 group-hover:animate-pulse" />
              <div className="absolute bottom-2 right-2 text-xs bg-black/60 px-2 py-0.5 rounded-full border border-white/10">Open →</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">Tip: Assign engineers at Desks before Build Wall moves</span>
          <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">Edit Layout = place desks/break rooms for morale bonus</span>
        </div>
      </div>
    </div>
  );
}
