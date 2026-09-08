'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

// Session-aware account control. When Neon Auth is unconfigured the hook
// yields no session and this renders a plain Sign in link (the sign-in form
// itself explains what to configure).
export default function AuthButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <span className="font-mono text-[11px] text-faint">Checking…</span>;
  }

  const email = session?.user?.email as string | undefined;
  if (email) {
    const signOut = async () => {
      setBusy(true);
      try {
        await authClient.signOut({
          fetchOptions: { onSuccess: () => router.refresh() },
        });
      } finally {
        setBusy(false);
      }
    };
    return (
      <span className="flex items-center gap-2">
        <span className={`truncate font-mono text-[11px] text-inksoft ${compact ? 'max-w-28' : 'max-w-44'}`} title={email}>
          {email}
        </span>
        <button
          onClick={signOut}
          disabled={busy}
          className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs disabled:opacity-50"
        >
          Sign out
        </button>
      </span>
    );
  }

  return (
    <a href="/auth/sign-in" className="btn-ghost min-h-[44px] px-3 py-1.5 text-xs">
      Sign in
    </a>
  );
}
