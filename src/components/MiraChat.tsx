'use client';
import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';

export default function MiraChat() {
  const { products, cash, burnRate, agents } = useGameStore();
  const product = products[0];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'mira'; text: string }[]>([
    { role: 'mira', text: 'Mira Sol here, Sir. PulseAI is on my radar — ask me anything. Trade-offs, hiring, or whether we should beat Nexora to market? I have the live context.' }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages(m => [...m, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          gameContext: {
            productStage: product.stage,
            progress: product.progress,
            quality: product.quality,
            bugs: product.bugs,
            techDebt: product.techDebt,
            assignedCount: product.assignedAgents.length,
            cash, burnRate,
            agentCount: agents.length,
          }
        })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'mira', text: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'mira', text: 'Comms down, Sir — but my quick take: keep at least one designer on PulseAI or quality will stall. Try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-violet-950/30 border border-violet-900 rounded-xl overflow-hidden flex flex-col">
      <div className="px-3 py-2 bg-violet-900/30 border-b border-violet-900 flex items-center justify-between">
        <span className="text-xs font-bold text-violet-300">💬 MIRA SOL — CTO (Tier 1 • Real LLM)</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-700 text-white">LIVE</span>
      </div>
      <div className="h-[180px] overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm leading-relaxed p-2 rounded-xl max-w-[92%] ${m.role === 'mira' ? 'bg-zinc-800 border border-zinc-700 text-zinc-100' : 'bg-violet-600 text-white ml-auto'}`}>
            <span className="text-xs font-bold opacity-60 block mb-0.5">{m.role === 'mira' ? 'MIRA' : 'YOU'}</span>
            <span className="whitespace-pre-wrap">{m.text}</span>
          </div>
        ))}
        {loading && <div className="text-xs text-zinc-500">Mira is thinking…</div>}
      </div>
      <div className="p-2 flex gap-2 border-t border-zinc-800 bg-zinc-900/50">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Mira: Should we ship beta now or hold for quality?"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-600"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-1.5 rounded-full bg-violet-600 text-white text-sm font-bold disabled:opacity-40">Send</button>
      </div>
      <div className="px-3 pb-2 text-[11px] text-zinc-500">No API key? Uses smart mock. Add ANTHROPIC_API_KEY to .env.local for real Muse.</div>
    </div>
  );
}
