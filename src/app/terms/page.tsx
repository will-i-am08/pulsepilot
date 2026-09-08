import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="kicker"><Link href="/" className="hover:text-ink">← PulsePilot</Link></p>
        <h1 className="mt-2 font-display text-4xl font-black">Terms, refunds & AI disclosure</h1>
        <p className="kicker mt-2">Last updated September 2026 · Plain English, on purpose</p>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-inksoft">
          <section>
            <h2 className="font-display text-xl font-bold text-ink">1. What PulsePilot is</h2>
            <p className="mt-1">An AI drafting and scheduling desk for your social media. It writes, organises and queues posts. It does not post to Instagram, TikTok, Facebook or LinkedIn for you yet — publishing happens when you take the copy, images and schedule into those apps or your scheduler of choice.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">2. AI disclosure</h2>
            <p className="mt-1">Captions, hooks, scores and trend suggestions are machine-generated starting points, not professional advice. Read everything before it represents your business. Anything the crew flags — banned words, risky claims — waits for your sign-off, in either mode.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">3. Autopilot liability</h2>
            <p className="mt-1">Autopilot queues and organises, but you remain the publisher of record for anything posted under your name. Keep your banned-word list current, review the weekly report, and switch to Copilot any week you want your hands back on the wheel.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">4. Trials, billing, refunds</h2>
            <p className="mt-1">Fourteen days free, no card. Paid plans are monthly or annual in Australian dollars, GST included, with an invoice on every payment. Cancel by email any time; annual plans are refunded pro-rata in the first 30 days. Our promise stands: if the crew does not save you five hours in your first paid week, month one is refunded — write to will@jmcalder.com.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">5. Fair use</h2>
            <p className="mt-1">Unlimited words means human-scale use: your brands, your clients, your weeks. Automated scraping, reselling the engine, or hammering generation endpoints gets a warning, then a closed account.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">6. Your content</h2>
            <p className="mt-1">Everything you file, and everything the crew drafts for you, belongs to you. We claim no rights over your posts, your brand, or your customer lists.</p>
          </section>
        </div>
        <p className="kicker mt-10">Pulse Social Media · Brisbane · will@jmcalder.com</p>
      </div>
    </div>
  );
}
