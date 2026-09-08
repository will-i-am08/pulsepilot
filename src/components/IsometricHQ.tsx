'use client';
import { useGameStore } from '@/lib/gameStore';
import type { OfficeTileType } from '@/lib/types';
import { useState, useMemo } from 'react';

const TYPE_META: Record<OfficeTileType, { icon: string; fill: string; stroke: string; label: string; cost: string; height: number }> = {
  empty: { icon: '', fill: '#1f1f23', stroke: '#2a2a30', label: 'Empty', cost: 'refund $1.5k', height: 0 },
  desk: { icon: '💻', fill: '#4c1d95', stroke: '#7c3aed', label: 'Desk', cost: '$4k', height: 18 },
  meeting: { icon: '🤝', fill: '#1e3a5f', stroke: '#3b82f6', label: 'Meeting', cost: '$8k', height: 14 },
  break: { icon: '☕', fill: '#14532d', stroke: '#22c55e', label: 'Break', cost: '$6k', height: 10 },
  lab: { icon: '🧪', fill: '#7c2d12', stroke: '#f97316', label: 'Lab', cost: '$12k', height: 22 },
};

const TILE_W = 64;
const TILE_H = 32;
const COLS = 8;
const ROWS = 6;

export default function IsometricHQ() {
  const { office, hqs, placeTile, cash } = useGameStore();
  const activeHQ = hqs.find(h => h.id === office.hqId) || hqs[0];
  const [selectedType, setSelectedType] = useState<OfficeTileType>('desk');
  const [hover, setHover] = useState<string | null>(null);

  const desks = office.tiles.filter(t => t.type === 'desk').length;
  const morale = office.moraleBonus;

  const { svgW, svgH, offsetX, offsetY } = useMemo(() => {
    const w = (COLS + ROWS) * (TILE_W / 2) + 80;
    const h = (COLS + ROWS) * (TILE_H / 2) + 100;
    return { svgW: w, svgH: h, offsetX: w / 2, offsetY: 40 };
  }, []);

  const tileToScreen = (x: number, y: number) => {
    const sx = (x - y) * (TILE_W / 2) + offsetX;
    const sy = (x + y) * (TILE_H / 2) + offsetY;
    return { sx, sy };
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs tracking-widest">ISOMETRIC HQ — {activeHQ.city.toUpperCase()} • TRUE DIAMOND TILES</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${morale >= 0 ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800' : 'bg-red-900/30 text-red-300 border border-red-800'}`}>
          Morale {morale >= 0 ? '+' : ''}{morale}% • {desks} desks
        </span>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-3 overflow-hidden">
        <div className="flex gap-1 mb-3 flex-wrap">
          {(Object.keys(TYPE_META) as OfficeTileType[]).map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${selectedType === t ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
            >
              <span>{TYPE_META[t].icon || '·'}</span> {TYPE_META[t].label} <span className="opacity-60 text-[11px]">{TYPE_META[t].cost}</span>
            </button>
          ))}
          <span className="text-xs text-zinc-500 self-center ml-2">Click diamond to place {TYPE_META[selectedType].label} • Empty refunds</span>
        </div>

        <div className="bg-[#0a0a0f] rounded-xl border border-zinc-800 overflow-auto flex justify-center p-2">
          <svg width={svgW} height={svgH} className="select-none" viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* floor shadow */}
            <rect x={0} y={0} width={svgW} height={svgH} rx={12} fill="#0a0a0f" />
            {/* grid diamonds back-to-front for correct overlap */}
            {[...office.tiles]
              .sort((a, b) => a.x + a.y - (b.x + b.y))
              .map(tile => {
                const { sx, sy } = tileToScreen(tile.x, tile.y);
                const meta = TYPE_META[tile.type];
                const isHover = hover === `${tile.x}-${tile.y}`;
                const h = meta.height;
                // diamond points
                const points = `${sx},${sy - TILE_H / 2} ${sx + TILE_W / 2},${sy} ${sx},${sy + TILE_H / 2} ${sx - TILE_W / 2},${sy}`;
                // side walls for height (isometric block)
                const leftWall = `${sx - TILE_W / 2},${sy} ${sx},${sy + TILE_H / 2} ${sx},${sy + TILE_H / 2 + h} ${sx - TILE_W / 2},${sy + h}`;
                const rightWall = `${sx + TILE_W / 2},${sy} ${sx},${sy + TILE_H / 2} ${sx},${sy + TILE_H / 2 + h} ${sx + TILE_W / 2},${sy + h}`;
                return (
                  <g key={`${tile.x}-${tile.y}`} onMouseEnter={() => setHover(`${tile.x}-${tile.y}`)} onMouseLeave={() => setHover(null)} onClick={() => placeTile(tile.x, tile.y, selectedType)} style={{ cursor: 'pointer' }}>
                    {/* walls */}
                    {h > 0 && (
                      <>
                        <polygon points={leftWall} fill="#000" opacity={0.35} />
                        <polygon points={rightWall} fill="#000" opacity={0.22} />
                        <polygon points={leftWall} fill={meta.fill} opacity={0.9} stroke={meta.stroke} strokeWidth={0.8} />
                        <polygon points={rightWall} fill={meta.fill} opacity={0.75} stroke={meta.stroke} strokeWidth={0.8} />
                      </>
                    )}
                    {/* top diamond */}
                    <polygon
                      points={points}
                      fill={isHover ? '#2a2a35' : meta.fill}
                      stroke={isHover ? '#fff' : meta.stroke}
                      strokeWidth={isHover ? 1.6 : 1}
                      opacity={tile.type === 'empty' ? 0.9 : 1}
                    />
                    {/* icon */}
                    {meta.icon && (
                      <text x={sx} y={sy + 4} textAnchor="middle" fontSize={14} pointerEvents="none">
                        {meta.icon}
                      </text>
                    )}
                    {/* coords subtle */}
                    <text x={sx} y={sy + 14} textAnchor="middle" fontSize={7} fill="#9ca3af" opacity={0.5} pointerEvents="none">
                      {tile.x},{tile.y}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">Capacity {activeHQ.used}/{activeHQ.capacity} • Cash {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(cash)}</span>
          <span className="px-2 py-1 rounded-full bg-emerald-900/20 border border-emerald-800 text-emerald-300">Desks = capacity • Break/Meeting = morale • Lab = research speed (V2)</span>
        </div>
        <div className="text-xs text-zinc-500 mt-2">True isometric diamonds — SVG with depth walls. Tiles save as x,y,type so PixiJS/WebGL swap is direct. Hover highlights, click places.</div>
      </div>
    </div>
  );
}
