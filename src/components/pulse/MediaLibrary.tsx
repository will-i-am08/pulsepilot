'use client';

import { useMemo, useRef, useState } from 'react';
import { usePulse } from '@/lib/pulse/store';
import { mediaUsage, useR1 } from '@/lib/pulse/extras';

const MAX_MB = 5;
const MAX_PER_BIZ = 20;
const MAX_ATTACH = 4;

export default function MediaLibrary({ selectedId }: { selectedId: string | null }) {
  const activeBusinessId = usePulse((s) => s.activeBusinessId);
  const contents = usePulse((s) => s.contents);
  const patchContent = usePulse((s) => s.patchContent);
  const media = useR1((s) => s.media);
  const addMedia = useR1((s) => s.addMedia);
  const removeMedia = useR1((s) => s.removeMedia);
  const logActivity = useR1((s) => s.logActivity);
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const bizId = activeBusinessId ?? '';
  const assets = useMemo(() => media.filter((m) => m.businessId === bizId).slice().reverse(), [media, bizId]);
  const selected = contents.find((c) => c.id === selectedId) ?? null;
  const attached = selected?.mediaIds ?? [];

  const upload = (files: FileList | null) => {
    setNote('');
    if (!files || !bizId) return;
    if (assets.length >= MAX_PER_BIZ) {
      setNote(`Library is full — ${MAX_PER_BIZ} per business. Delete one first.`);
      return;
    }
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNote('Images only for now — JPG or PNG.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setNote(`Too big — keep images under ${MAX_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const id = addMedia(bizId, dataUrl);
      if (id) {
        setNote('Added to the library.');
        logActivity('media', 'Uploaded one image to the library.', bizId);
      } else {
        setNote(`Library is full — ${MAX_PER_BIZ} per business.`);
      }
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleAttach = (assetId: string) => {
    if (!selected) return;
    const has = attached.includes(assetId);
    if (!has && attached.length >= MAX_ATTACH) {
      setNote(`Four images max per post — detach one first.`);
      return;
    }
    patchContent(selected.id, { mediaIds: has ? attached.filter((a) => a !== assetId) : [...attached, assetId] });
  };

  const remove = (assetId: string) => {
    if (confirmId !== assetId) {
      setConfirmId(assetId);
      setTimeout(() => setConfirmId((v) => (v === assetId ? null : v)), 4000);
      return;
    }
    // Detach everywhere first so no post points at a missing file.
    contents.forEach((c) => {
      if (c.mediaIds?.includes(assetId)) patchContent(c.id, { mediaIds: c.mediaIds.filter((a) => a !== assetId) });
    });
    removeMedia(assetId);
    setConfirmId(null);
    setNote('Deleted from the library.');
  };

  return (
    <div className="pp-card mt-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="kicker">Media library</p>
          <h3 className="font-display text-base font-bold">Images for {assets.length}/{MAX_PER_BIZ}</h3>
        </div>
        <label className="btn-ghost min-h-[44px] cursor-pointer px-4 py-2 text-sm">
          Upload image
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload image" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      <p className="mt-1 font-mono text-[11px] text-faint">JPG/PNG · under {MAX_MB}MB · attach up to {MAX_ATTACH} per post. Thumbnails show on the kanban cards.</p>
      {note && <p className="mt-1.5 font-mono text-xs text-moss" role="status">{note}</p>}
      {!selected && <p className="mt-2 text-xs text-faint">Pick a post on the desk to attach images to it.</p>}
      {assets.length === 0 ? (
        <p className="mt-2 rounded-md border border-dashed border-faint p-3 text-center text-xs text-faint">Nothing filed yet — upload the first image.</p>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {assets.map((a) => {
            const used = mediaUsage(contents.map((c) => c.mediaIds), a.id);
            const isAttached = attached.includes(a.id);
            return (
              <div key={a.id} className={`overflow-hidden rounded-md border ${isAttached ? 'border-ink' : 'border-line'} bg-paper`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.dataUrl} alt="Library upload" className="h-20 w-full object-cover" loading="lazy" />
                <div className="p-1.5">
                  <p className="font-mono text-[10px] text-faint">{used > 0 ? `used in ${used} queued ${used === 1 ? 'post' : 'posts'}` : 'unused'}</p>
                  <div className="mt-1 flex gap-1">
                    <button
                      onClick={() => toggleAttach(a.id)}
                      disabled={!selected}
                      className={`min-h-[44px] flex-1 rounded border px-1 font-mono text-[10px] font-bold disabled:opacity-40 ${isAttached ? 'border-ink bg-ink text-paper' : 'border-line'}`}
                      aria-pressed={isAttached}
                      aria-label={isAttached ? 'Detach image from post' : 'Attach image to post'}
                    >
                      {isAttached ? 'Attached' : 'Attach'}
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className={`min-h-[44px] rounded border px-1.5 font-mono text-[10px] ${confirmId === a.id ? 'border-ember bg-ember text-white' : 'border-line text-faint'}`}
                      aria-label={used > 0 ? `Delete image, used in ${used} queued ${used === 1 ? 'post' : 'posts'}` : 'Delete image'}
                      title={used > 0 ? `used in ${used} queued ${used === 1 ? 'post' : 'posts'}` : 'Delete'}
                    >
                      {confirmId === a.id ? 'Sure?' : '×'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
