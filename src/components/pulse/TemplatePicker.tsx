'use client';

import { useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { useR1 } from '@/lib/pulse/extras';

export default function TemplatePicker({ onApplied }: { onApplied?: (ids: string[]) => void }) {
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const templates = useR1((s) => s.templates);
  const applyTemplate = useR1((s) => s.applyTemplate);
  const deleteTemplate = useR1((s) => s.deleteTemplate);
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const bizId = activeBusinessId ?? '';
  const mine = templates.filter((t) => !t.businessId || t.businessId === bizId);
  const queuedCount = contents.filter((c) => c.businessId === bizId && ['draft', 'idea', 'pending_approval'].includes(c.state)).length;

  const apply = (id: string, label: string) => {
    if (!bizId) return;
    const ids = applyTemplate(bizId, id);
    setNote(ids.length > 0 ? `Filed ${ids.length} ${ids.length === 1 ? 'draft' : 'drafts'} from “${label}”.` : 'Nothing filed — try again.');
    onApplied?.(ids);
    setTimeout(() => setNote(''), 5000);
  };

  const remove = (id: string, name: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((v) => (v === id ? null : v)), 4000);
      return;
    }
    deleteTemplate(id);
    setConfirmId(null);
    setNote(`Deleted template “${name}”.`);
  };

  return (
    <div className="rounded-md border border-dashed border-faint bg-cream p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="kicker">Templates — skip the blank page</p>
        <span className="font-mono text-[11px] text-faint">{queuedCount} open drafts</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={() => apply('built-in-week', '5-post week')} className="btn-ink min-h-[44px] px-4 py-2 text-sm" title="Files five drafts across pillars and channels">
          Apply 5-post week
        </button>
      </div>
      <p className="mt-1 font-mono text-[11px] text-faint">Built-in “5-post week” files five drafts in one tap. Your saved templates land below.</p>
      {mine.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {mine.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{t.name}</p>
                <p className="font-mono text-[10px] uppercase text-faint">{t.pillar} · {t.format} · {t.channel}</p>
              </div>
              <button onClick={() => apply(t.id, t.name)} className="btn-ghost min-h-[44px] shrink-0 px-3 py-1 text-xs">Apply</button>
              <button
                onClick={() => remove(t.id, t.name)}
                className={`min-h-[44px] shrink-0 rounded border px-2.5 py-1 font-mono text-[11px] ${confirmId === t.id ? 'border-ember bg-ember text-white' : 'border-line text-faint'}`}
                aria-label={`Delete template ${t.name}`}
              >
                {confirmId === t.id ? 'Sure?' : '×'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-1.5 font-mono text-xs text-moss" role="status">{note}</p>}
    </div>
  );
}
