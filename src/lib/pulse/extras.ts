'use client';

import { create } from 'zustand';
import { usePulse } from './store';
import type { Channel, ContentFormat } from './types';

export interface MediaAsset {
  id: string;
  businessId: string;
  dataUrl: string;
  createdAt: string;
}

export interface PostTemplate {
  id: string;
  businessId?: string;
  name: string;
  pillar: string;
  format: ContentFormat;
  channel: Channel;
  hook: string;
  captions: string[];
  hashtags: string[];
  createdAt: string;
}

export interface Approval {
  contentId: string;
  status: 'requested' | 'approved' | 'rejected';
  note: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  businessId?: string;
  kind: string;
  summary: string;
  createdAt: string;
}

export interface WhiteLabel {
  displayName: string;
  logoUrl: string;
  accent: string;
}

const MEDIA_KEY = 'pulsepilot-media-v1';
const TEMPLATE_KEY = 'pulsepilot-templates-v1';
const ACTIVITY_KEY = 'pulsepilot-activity-v1';
const APPROVAL_KEY = 'pulsepilot-approvals-v1';
const WL_KEY = 'pulsepilot-whitelabel-v1';

function uid(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  } catch { /* fall through */ }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota blocked — keep running in memory */ }
}

const BUILT_IN_WEEK: { pillar: string; format: ContentFormat; channel: Channel; hook: string }[] = [
  { pillar: 'Offers', format: 'reel', channel: 'instagram', hook: 'The offer most locals miss — until Friday' },
  { pillar: 'Proof & Results', format: 'carousel', channel: 'instagram', hook: 'Same street, same budget, different result' },
  { pillar: 'Education', format: 'carousel', channel: 'linkedin', hook: 'The 6-point checklist we run before anything goes out' },
  { pillar: 'Offers', format: 'story', channel: 'instagram', hook: 'Tap through — this week only at the shop' },
  { pillar: 'Education', format: 'text', channel: 'facebook', hook: 'The advice everyone repeats that quietly fails' },
];

interface R1State {
  media: MediaAsset[];
  templates: PostTemplate[];
  approvals: Approval[];
  activity: ActivityEvent[];
  whiteLabel: WhiteLabel;
  addMedia: (businessId: string, dataUrl: string) => string | null;
  removeMedia: (id: string) => void;
  saveTemplate: (t: Omit<PostTemplate, 'id' | 'createdAt'>) => string;
  saveCurrentAsTemplate: (businessId: string, contentId: string, name?: string) => string | null;
  deleteTemplate: (id: string) => void;
  applyTemplate: (businessId: string, templateId: string) => string[];
  setApproval: (contentId: string, status: Approval['status'], note: string, businessId?: string) => void;
  logActivity: (kind: string, summary: string, businessId?: string) => void;
  setWhiteLabel: (patch: Partial<WhiteLabel>) => void;
}

export const useR1 = create<R1State>((set, get) => ({
  media: typeof window !== 'undefined' ? read<MediaAsset[]>(MEDIA_KEY, []) : [],
  templates: typeof window !== 'undefined' ? read<PostTemplate[]>(TEMPLATE_KEY, []) : [],
  approvals: typeof window !== 'undefined' ? read<Approval[]>(APPROVAL_KEY, []) : [],
  activity: typeof window !== 'undefined' ? read<ActivityEvent[]>(ACTIVITY_KEY, []) : [],
  whiteLabel: typeof window !== 'undefined' ? read<WhiteLabel>(WL_KEY, { displayName: '', logoUrl: '', accent: '#c2481b' }) : { displayName: '', logoUrl: '', accent: '#c2481b' },

  addMedia: (businessId, dataUrl) => {
    const count = get().media.filter((m) => m.businessId === businessId).length;
    if (count >= 20) return null;
    const asset: MediaAsset = { id: uid('media'), businessId, dataUrl: dataUrl.slice(0, 700000), createdAt: new Date().toISOString() };
    const next = [...get().media, asset].slice(-120);
    set({ media: next });
    write(MEDIA_KEY, next);
    return asset.id;
  },

  removeMedia: (id) => {
    const next = get().media.filter((m) => m.id !== id);
    set({ media: next });
    write(MEDIA_KEY, next);
  },

  saveTemplate: (t) => {
    const item: PostTemplate = { ...t, id: uid('tpl'), createdAt: new Date().toISOString() };
    const next = [...get().templates, item].slice(-40);
    set({ templates: next });
    write(TEMPLATE_KEY, next);
    get().logActivity('template', `Saved template “${item.name}” for reuse.`, item.businessId);
    return item.id;
  },

  saveCurrentAsTemplate: (businessId, contentId, name) => {
    const content = usePulse.getState().contents.find((c) => c.id === contentId);
    if (!content) return null;
    return get().saveTemplate({
      businessId,
      name: (name?.trim() || content.hook).slice(0, 60) || 'Untitled template',
      pillar: content.pillar,
      format: content.format,
      channel: content.channel,
      hook: content.hook,
      captions: content.captions.slice(0, 3),
      hashtags: content.hashtags.slice(0, 12),
    });
  },

  deleteTemplate: (id) => {
    const next = get().templates.filter((t) => t.id !== id);
    set({ templates: next });
    write(TEMPLATE_KEY, next);
  },

  applyTemplate: (businessId, templateId) => {
    const pulse = usePulse.getState();
    const ids: string[] = [];
    if (templateId === 'built-in-week') {
      for (const slot of BUILT_IN_WEEK) {
        const id = pulse.generateOne(businessId, slot.pillar, slot.format, slot.channel, slot.hook);
        if (id) {
          pulse.patchContent(id, { hook: slot.hook });
          ids.push(id);
        }
      }
      get().logActivity('template', `Applied “5-post week” — filed ${ids.length} drafts.`, businessId);
      return ids;
    }
    const t = get().templates.find((x) => x.id === templateId);
    if (!t) return [];
    const id = pulse.ingestDraft(businessId, {
      businessId,
      state: 'draft',
      pillar: t.pillar,
      format: t.format,
      channel: t.channel,
      hook: t.hook,
      hooks: [t.hook],
      captions: t.captions.length > 0 ? t.captions : ['New caption — rewrite in your voice.'],
      selectedCaption: 0,
      hashtags: t.hashtags,
      confidence: 0.8,
      agentNote: `Filed from template “${t.name}”.`,
    });
    if (id) {
      ids.push(id);
      get().logActivity('template', `Applied template “${t.name}” — filed 1 draft.`, businessId);
    }
    return ids;
  },

  setApproval: (contentId, status, note, businessId) => {
    const entry: Approval = { contentId, status, note: note.slice(0, 300), updatedAt: new Date().toISOString() };
    const rest = get().approvals.filter((a) => a.contentId !== contentId);
    const next = [...rest, entry].slice(-200);
    set({ approvals: next });
    write(APPROVAL_KEY, next);
    const label = status === 'requested' ? 'Approval requested' : status === 'approved' ? 'Approved' : 'Rejected — changes requested';
    get().logActivity('approval', `${label} for post ${contentId.slice(0, 12)}${note ? ` — ${note.slice(0, 80)}` : ''}`, businessId);
  },

  logActivity: (kind, summary, businessId) => {
    const ev: ActivityEvent = { id: uid('act'), kind, summary: summary.slice(0, 300), businessId, createdAt: new Date().toISOString() };
    const next = [...get().activity, ev].slice(-200);
    set({ activity: next });
    write(ACTIVITY_KEY, next);
  },

  setWhiteLabel: (patch) => {
    const next: WhiteLabel = {
      displayName: (patch.displayName ?? get().whiteLabel.displayName).slice(0, 60),
      logoUrl: (patch.logoUrl ?? get().whiteLabel.logoUrl).slice(0, 500),
      accent: (patch.accent ?? get().whiteLabel.accent).slice(0, 30),
    };
    set({ whiteLabel: next });
    write(WL_KEY, next);
  },
}));

/** How many queued/draft posts reference this asset. */
export function mediaUsage(contentMediaIds: (string[] | undefined)[], assetId: string): number {
  let n = 0;
  for (const ids of contentMediaIds) {
    if (ids?.includes(assetId)) n++;
  }
  return n;
}
