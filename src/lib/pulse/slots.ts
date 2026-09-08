// Single source of truth for best-time posting slots.
// Used by the store (scheduler), the calendar footer, and agent chat replies.

import type { Channel, ExtendedChannel } from './types';

export const BEST_HOURS: Record<Channel, number[]> = {
  instagram: [8, 12, 18],
  tiktok: [7, 12, 20],
  facebook: [9, 13, 19],
  linkedin: [8, 12, 17],
};

/** Best-posting hours for the extended channel set. Core channels mirror BEST_HOURS. */
export const EXTENDED_BEST_HOURS: Record<ExtendedChannel, number[]> = {
  instagram: [8, 12, 18],
  tiktok: [7, 12, 20],
  facebook: [9, 13, 19],
  linkedin: [8, 12, 17],
  x: [8, 12, 18],
  threads: [8, 12, 19],
  youtube: [12, 17, 20],
  pinterest: [13, 18, 21],
  mastodon: [8, 12, 18],
  bluesky: [8, 12, 18],
  pixelfed: [8, 12, 18],
  google_business: [9, 12, 17],
};

export function slotLabel(): string {
  return 'IG 8am, 12pm, 6pm · TikTok 7am, 12pm, 8pm · FB 9am, 1pm, 7pm · LinkedIn weekday mornings (AEST)';
}

export function nextSlot(dayOffset: number, channel: Channel): string {
  const hours = BEST_HOURS[channel] ?? [12];
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours[0], 0, 0, 0);
  return d.toISOString();
}

/** Next best-time slot for any extended channel. Falls back to [12] for unknown channels. */
export function nextSlotFor(ch: ExtendedChannel, dayOffset = 1): string {
  const hours = EXTENDED_BEST_HOURS[ch] ?? [12];
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours[0] ?? 12, 0, 0, 0);
  return d.toISOString();
}
