'use client';
import { useState, useEffect } from 'react';

const STEPS = [
  { title: 'Welcome to STEALTH MODE', body: 'You’re a 2026 founder with LLM agents as staff. Pausable real-time — build PulseAI, survive 15 aggressive rivals, and scale to unicorn.' },
  { title: '1. Assign Agents', body: 'Your agents live left. Assign at least 2 engineers + a designer to PulseAI (centre). Watch progress + quality climb. Hire more anytime.' },
  { title: '2. Talk to Mira', body: 'Mira Sol (purple) is a real LLM CTO. Ask her trade-offs: “Should we ship beta now?” She sees live cash/burn/quality.' },
  { title: '3. Survive the Market', body: 'Rivals (right) poach, copycat, and sue weekly if you’re a threat. Hire HR/Finance/Legal to defend. Leak risk matters for stealth corps.' },
  { title: '4. Scale Like a Founder', body: 'Raise Angel/Seed/Series A (board pressure!), run marketing channels, research tech, found stealth corps & new holding companies, expand HQs isometrically, and IPO at $50M/ $80k MRR. Dirty ops unlock with Legal.' },
];

export default function Tutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('stealth_tutorial_done')) setOpen(true);
  }, []);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="fixed bottom-3 right-3 z-30 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold shadow">? How to Play</button>
  );

  const dismiss = () => { localStorage.setItem('stealth_tutorial_done', '1'); setOpen(false); };

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-[560px] w-full p-6">
        <div className="text-xs tracking-widest text-violet-400 font-bold">STEP {step + 1} / {STEPS.length}</div>
        <h2 className="text-xl font-black mt-1">{STEPS[step].title}</h2>
        <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{STEPS[step].body}</p>

        <div className="flex gap-2 mt-5">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-200 text-sm">Back</button>}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2 rounded-full bg-violet-600 text-white font-bold text-sm">Next →</button>
          ) : (
            <button onClick={dismiss} className="flex-1 py-2 rounded-full bg-white text-black font-bold text-sm">Start Building — Pause with [P]</button>
          )}
        </div>
        <button onClick={dismiss} className="mt-3 text-xs text-zinc-500 w-full">Skip — don’t show again</button>
      </div>
    </div>
  );
}
