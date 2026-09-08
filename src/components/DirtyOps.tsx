'use client';
import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import type { DirtyOpType } from '@/lib/types';

const OPS: { id: DirtyOpType; name: string; desc: string; cost: string; risk: string; need: string }[] = [
  { id: 'sue', name: 'Sue for IP', desc: 'Need Legal. Win settlement, dent rival valuation.', cost: '$15k', risk: '22% base', need: 'Legal' },
  { id: 'spy', name: 'Plant Spy', desc: 'Need Legal/HR. Steal roadmap → +30% research.', cost: '$10k', risk: '35% base', need: 'HR/Legal' },
  { id: 'steal', name: 'Steal Patent', desc: 'Need Researcher+Legal. Unlock locked tech to 60%.', cost: '$20k', risk: '48% base', need: 'Researcher+Legal' },
  { id: 'hostile', name: 'Hostile Takeover', desc: 'Need $120k + $5M valuation. Absorb 35% users.', cost: '$120k', risk: '60% base', need: '$5M val' },
];

export default function DirtyOps() {
  const { competitors, reputation, cash, valuation, agents, dirtyOps, executeDirtyOp } = useGameStore();
  const [targetId, setTargetId] = useState(competitors[0]?.id || 'c0');
  const hasLegal = agents.some(a => a.role === 'legal');
  const hasResearcher = agents.some(a => a.role === 'researcher');
  const target = competitors.find(c => c.id === targetId) || competitors[0];

  const canDo = (op: DirtyOpType) => {
    if (op === 'sue' && !hasLegal) return false;
    if (op === 'spy' && !hasLegal && !agents.some(a => a.role === 'hr')) return false;
    if (op === 'steal' && (!hasLegal || !hasResearcher)) return false;
    if (op === 'hostile' && (cash < 120000 || valuation < 5000000)) return false;
    if (reputation < 20 && op !== 'spy') return false;
    return true;
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs tracking-widest">DIRTY OPS — ANYTHING GOES</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${reputation < 30 ? 'bg-red-900/30 text-red-300 border-red-800' : reputation < 60 ? 'bg-amber-900/30 text-amber-300 border-amber-800' : 'bg-emerald-900/30 text-emerald-300 border-emerald-800'}`}>Rep {reputation}%</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-zinc-400">Target:</label>
        <select value={targetId} onChange={e => setTargetId(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm">
          {competitors.slice(0, 10).map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.focus} • {new Intl.NumberFormat('en-AU', { notation: 'compact' }).format(c.valuation)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPS.map(op => {
          const enabled = canDo(op.id) && cash >= parseInt(op.cost.replace(/[^0-9]/g, '')) * 1000;
          return (
            <button
              key={op.id}
              disabled={!enabled}
              onClick={() => executeDirtyOp(op.id, targetId)}
              className={`p-3 rounded-xl border text-left transition ${enabled ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed'}`}
            >
              <div className="text-sm font-bold flex justify-between">{op.name} <span className="text-xs font-normal opacity-60">{op.cost} • {op.risk}</span></div>
              <div className="text-xs text-zinc-400 mt-1">{op.desc}</div>
              <div className="text-xs mt-1 text-zinc-500">Need: {op.need} {!enabled && ' — locked'}</div>
            </button>
          );
        })}
      </div>

      {!hasLegal && <div className="text-xs text-amber-400 mt-2">💡 Hire a Legal agent to unlock Sue/Steal. HR also enables Spy.</div>}

      {dirtyOps.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-bold text-zinc-400">RECENT OPS</div>
          {dirtyOps.slice(-4).reverse().map(op => (
            <div key={op.id} className={`text-xs px-2 py-1 rounded-lg flex justify-between ${op.status === 'success' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
              <span>{op.type.toUpperCase()} vs {op.targetName} — {op.status}</span><span>${(op.cost / 1000).toFixed(0)}k • {op.risk}% risk</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-zinc-500 mt-2">Risk reduced by Legal skill (legal 80+ → -10% risk) and stealth corps (-6%). Fail = cash loss + board pressure + reputation hit. Legal skill matters.</div>
    </div>
  );
}
