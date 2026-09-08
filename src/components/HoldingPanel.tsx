'use client';
import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';

const INDUSTRIES = ['AI Tools', 'SaaS', 'Social', 'Fintech', 'Hardware', 'Games', 'Biotech', 'Climate', 'Marketplace', 'Enterprise'];

export default function HoldingPanel() {
  const { companies, selectedCompanyId, products, selectCompany, createCompany, createProduct } = useGameStore();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('SaaS');
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('AI Tools');
  const selected = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const companyProducts = products.filter(p => selected && p.companyId === selected.id);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs tracking-widest">HOLDING — {companies.length} COMPANIES</h3>
        <span className="text-xs bg-violet-600 text-white px-2 py-1 rounded-full">Unlimited</span>
      </div>

      <div className="flex gap-1.5 overflow-auto pb-2">
        {companies.map(c => (
          <button
            key={c.id}
            onClick={() => selectCompany(c.id)}
            className={`px-3 py-2 rounded-xl border text-left min-w-[130px] ${selectedCompanyId === c.id ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
          >
            <div className="text-sm font-bold leading-none truncate">{c.name}</div>
            <div className="text-xs opacity-70">{c.industry} • {c.productIds.length} products</div>
          </button>
        ))}
      </div>

      <div className="mt-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <div className="text-sm font-bold">Selected: {selected?.name} — {selected?.industry}</div>
        <div className="text-xs text-zinc-400">HQ: {selected?.hqId} • Founded day {selected?.foundedDay} • Products: {companyProducts.length || 'none'}</div>
        {companyProducts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {companyProducts.map(p => (
              <span key={p.id} className={`text-xs px-2 py-1 rounded-full border ${p.stage === 'launched' ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300' : 'bg-zinc-700 border-zinc-600 text-zinc-300'}`}>{p.name} • {p.stage}</span>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="New product name" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1.5 text-sm" />
          <select value={prodCat} onChange={e => setProdCat(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-full px-2 py-1.5 text-sm">
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <button onClick={() => { if (prodName.trim() && selected) { createProduct(selected.id, prodName.trim(), prodCat); setProdName(''); } }} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">+ $12k</button>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New company name" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm" />
        <select value={industry} onChange={e => setIndustry(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-full px-2 py-1.5 text-sm">
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </select>
        <button onClick={() => { if (name.trim()) { createCompany(name.trim(), industry); setName(''); } }} className="px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-bold">Found $45k</button>
      </div>
      <div className="text-xs text-zinc-500 mt-1">Any Business — from SaaS to Biotech. Each company has own products & HQ. Holding view = your empire.</div>
    </div>
  );
}
