// Plain-text exports: client sign-off sheets, week reports, data backup.
// No dependencies — works from any component with store state.

import type { BusinessProfile, ContentItem } from './types';

function captionOf(c: ContentItem): string {
  return c.captions[c.selectedCaption] ?? c.captions[0] ?? '';
}

export function signoffSheet(biz: BusinessProfile, items: ContentItem[]): string {
  const lines = [
    `${biz.businessName} — posts for sign-off`,
    `Prepared ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    '',
  ];
  const open = items.filter((c) => c.state === 'draft' || c.state === 'pending_approval');
  if (open.length === 0) lines.push('Nothing awaiting sign-off. The desk is clear.');
  open.forEach((c, i) => {
    lines.push(
      `— ${i + 1}. [${c.channel} / ${c.format}] ${c.hook}`,
      captionOf(c),
      c.hashtags.join(' '),
      c.link ? `Link: ${c.link}` : '',
      c.scheduledFor ? `Queued: ${new Date(c.scheduledFor).toLocaleString('en-AU')}` : 'Not queued yet.',
      ''
    );
  });
  lines.push('Reply APPROVED and we will queue the lot. Changes? List them by number.');
  return lines.filter((l) => l !== '').join('\n');
}

export function weekReport(biz: BusinessProfile, items: ContentItem[]): string {
  const scored = items.filter((c) => c.metrics && c.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const reach = scored.reduce((n, c) => n + (c.metrics?.reach ?? 0), 0);
  const lines = [
    `${biz.businessName} — week in review`,
    `${scored.length} posts scored · ${reach.toLocaleString()} total reach`,
    '',
  ];
  scored.slice(0, 5).forEach((c, i) => {
    lines.push(`#${i + 1} — ${c.score}/100 · ${c.hook}`, `${c.insight ?? ''}`, '');
  });
  if (scored.length === 0) lines.push('No scored posts yet.');
  return lines.join('\n');
}

export function backupFilename(): string {
  return `pulsepilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

export function download(filename: string, text: string, mime = 'text/plain'): void {
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch { /* ignore — clipboard paths remain */ }
}

function icsDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

const icsEscape = (s: string): string => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n').slice(0, 2000);

/** Calendar file of the queue — import into Google/Apple Calendar. */
export function queueICS(bizName: string, items: ContentItem[]): string {
  const queued = items.filter((c) => c.scheduledFor && (c.state === 'scheduled' || c.state === 'published'));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//PulsePilot//${bizName}//EN`, 'CALSCALE:GREGORIAN'];
  queued.forEach((c) => {
    const stamp = icsDate(c.scheduledFor as string).replace('T', 'T');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.id}@pulsepilot`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${stamp}`,
      `SUMMARY:${icsEscape(`[${c.channel}] ${c.hook}`)}`,
      `DESCRIPTION:${icsEscape(`${captionOf(c)}\n\n${c.hashtags.join(' ')}${c.link ? `\n${c.link}` : ''}`)}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

const csvCell = (s: string): string => `"${s.replace(/"/g, '""')}"`;

/** Spreadsheet of the queue — open in Sheets/Excel, hand to a VA. */
export function queueCSV(items: ContentItem[]): string {
  const rows = [['hook', 'channel', 'format', 'pillar', 'state', 'scheduled_for', 'score']];
  items.forEach((c) => {
    rows.push([c.hook, c.channel, c.format, c.pillar, c.state, c.scheduledFor ?? '', String(c.score ?? '')]);
  });
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

/** One post, fully written out — archive, brief a designer, or paste anywhere. */
export function postTXT(item: ContentItem): string {
  const parts = [
    item.hook,
    '',
    captionOf(item),
    '',
    item.hashtags.join(' '),
  ];
  if (item.link) parts.push('', `Link: ${item.link}`);
  if (item.slides) {
    parts.push('', '— SLIDES —');
    item.slides.forEach((s, i) => parts.push(`${i + 1}. ${s.headline}`, `   ${s.body}`, `   [${s.visual}]`));
  }
  if (item.frames) {
    parts.push('', '— STORY FRAMES —');
    item.frames.forEach((f, i) => parts.push(`F${i + 1}. ${f.text}${f.sticker ? ` [${f.sticker}]` : ''}${f.cta ? ` (${f.cta})` : ''}`));
  }
  if (item.poll) parts.push('', '— POLL —', item.poll.question, ...item.poll.options.map((o) => `· ${o}`), `Runs ${item.poll.duration}`, item.poll.followUp);
  if (item.livePlan) {
    parts.push('', '— SHOW PLAN —');
    item.livePlan.forEach((s) => parts.push(`${s.time} · ${s.title}`, `   ${s.detail}`));
  }
  if (item.newsletter) {
    parts.push('', '— NEWSLETTER —', item.newsletter.subject, item.newsletter.preview);
    item.newsletter.sections.forEach((s) => parts.push('', s.heading, s.body));
    parts.push('', item.newsletter.cta);
  }
  if (item.script) parts.push('', '— SCRIPT —', item.script);
  if (item.collabWith) parts.push('', `Collaborators: ${item.collabWith}`);
  if (item.isTrialReel) parts.push('', 'Trial reel: test to non-followers first.');
  return parts.join('\n');
}
