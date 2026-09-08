import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="kicker"><Link href="/" className="hover:text-ink">← PulsePilot</Link></p>
        <h1 className="mt-2 font-display text-4xl font-black">Privacy — your data stays yours</h1>
        <p className="kicker mt-2">Last updated September 2026</p>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-inksoft">
          <section>
            <h2 className="font-display text-xl font-bold text-ink">1. Where your work lives</h2>
            <p className="mt-1">Today, everything — businesses, drafts, schedules, scores — lives in your own browser&apos;s storage on your own device. We run no analytics, no trackers, and no account system yet, which means there is nothing of yours on our servers to lose.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">2. What leaves your device</h2>
            <p className="mt-1">Two things, only when you use them: chat messages and generation requests travel to our servers and, where configured, to our AI provider (Anthropic) to produce the reply — then they are gone. Downloads and copied text never leave your device at all.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">3. Backups and deletion</h2>
            <p className="mt-1">Download your data any time from Setup — it is a plain JSON file, yours to keep. Clearing your browser storage, or pressing “wipe everything”, deletes the local copy permanently. There is no shadow copy.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">4. When accounts arrive</h2>
            <p className="mt-1">Team sync and publishing integrations will need accounts. When they land, this page will say exactly what is stored, where, and for how long — before you are asked to sign up, not after.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-ink">5. Contact</h2>
            <p className="mt-1">Privacy questions go to will@jmcalder.com. A human replies — usually Will.</p>
          </section>
        </div>
        <p className="kicker mt-10">Pulse Social Media · Brisbane · will@jmcalder.com</p>
      </div>
    </div>
  );
}
