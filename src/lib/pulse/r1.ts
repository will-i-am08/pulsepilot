// R1 helpers — per-platform versions, caption limits, threads, hashtags, best times.
// Australian English throughout. No dependencies.

import type { Channel, ContentItem } from './types';

export const CAPTION_LIMITS: Record<Channel, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
};

export interface CaptionCheck {
  ok: boolean;
  limit: number;
  length: number;
  overBy: number;
}

export function validateCaptionLength(text: string, channel: Channel): CaptionCheck {
  const limit = CAPTION_LIMITS[channel] ?? 2000;
  const length = (text ?? '').length;
  return { ok: length <= limit, limit, length, overBy: Math.max(0, length - limit) };
}

export function channelName(channel: Channel): string {
  switch (channel) {
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'linkedin':
      return 'LinkedIn';
    case 'tiktok':
      return 'TikTok';
    default:
      return channel;
  }
}

export const PLATFORM_TABS: { id: Channel; label: string }[] = [
  { id: 'instagram', label: 'IG' },
  { id: 'facebook', label: 'FB' },
  { id: 'linkedin', label: 'LI' },
  { id: 'tiktok', label: 'TT' },
];

export function masterCaption(item: ContentItem): string {
  return item.captions[item.selectedCaption] ?? item.captions[0] ?? '';
}

export function getPlatformVersion(item: ContentItem, channel: Channel): string {
  const v = item.versions?.[channel];
  if (typeof v === 'string') return v;
  if (v && typeof v.caption === 'string') return v.caption;
  return masterCaption(item);
}

/** Split long copy into ordered thread parts (default 280 chars, sentence-aware). */
export function splitThread(text: string, limit = 280): string[] {
  const clean = (text ?? '').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [clean];
  const parts: string[] = [];
  let current = '';
  const pushWordwise = (chunk: string) => {
    const words = chunk.split(/\s+/).filter(Boolean);
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (next.length > limit && current) {
        parts.push(current.trim());
        current = w;
      } else if (w.length > limit) {
        if (current) parts.push(current.trim());
        for (let i = 0; i < w.length; i += limit) parts.push(w.slice(i, i + limit));
        current = '';
      } else {
        current = next;
      }
    }
  };
  for (const s of sentences) {
    const chunk = s.trim();
    if (!chunk) continue;
    if ((current + ' ' + chunk).trim().length <= limit && current.length < limit * 0.7) {
      current = current ? `${current} ${chunk}` : chunk;
    } else if (chunk.length <= limit && (current + ' ' + chunk).trim().length <= limit * 1.6 && current) {
      // keep sentences together when only slightly over — prefer readability
      pushWordwise(chunk);
    } else {
      if (chunk.length > limit) {
        if (current) {
          parts.push(current.trim());
          current = '';
        }
        pushWordwise(chunk);
      } else {
        if (current) parts.push(current.trim());
        current = chunk;
      }
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean).slice(0, 12);
}

export interface HashtagGroup {
  name: string;
  tags: string[];
}

export const HASHTAG_GROUPS: HashtagGroup[] = [
  { name: 'Local reach', tags: ['#brisbane', '#brisbanelocal', '#shoplocal', '#smallbusinessau'] },
  { name: 'Offers', tags: ['#specialoffer', '#limitedtime', '#booknow', '#newcustomers'] },
  { name: 'Proof', tags: ['#results', '#testimonial', '#beforeandafter', '#trustedlocal'] },
  { name: 'Education', tags: ['#tips', '#howto', '#learnoninstagram', '#marketingtips'] },
];

export const EXTENDED_BEST_HOURS: Record<Channel, number[]> = {
  instagram: [7, 8, 12, 18, 20],
  tiktok: [7, 9, 12, 19, 20],
  facebook: [8, 9, 13, 17, 19],
  linkedin: [7, 8, 12, 17, 18],
};

export function bestTimeList(): { channel: Channel; label: string }[] {
  const fmt = (h: number): string => {
    const ap = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${ap}`;
  };
  return (Object.keys(EXTENDED_BEST_HOURS) as Channel[]).map((c) => ({
    channel: c,
    label: `${channelName(c)} — ${EXTENDED_BEST_HOURS[c].map(fmt).join(', ')} (AEST)`,
  }));
}

/** The 12 publish channels shown in Setup → Connections (all mock for now). */
export const ALL_CHANNELS_12: string[] = [
  'instagram',
  'tiktok',
  'facebook',
  'linkedin',
  'x',
  'threads',
  'youtube',
  'pinterest',
  'snapchat',
  'whatsapp',
  'telegram',
  'bluesky',
];
