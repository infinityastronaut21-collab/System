'use client';

// SYSTEM — Contrôle Check (Doc 1 §2.1) : case à cocher, fait ou pas fait.
// Case cochée : encoche blanche sur fond noir (Doc 4 §7).

import { useState } from 'react';
import { toggleCheck } from '@/lib/actions';
import type { Activity, Completion } from '@/lib/types';
import { IconCheck } from './Icons';

export default function CheckToggle({
  activity,
  completion,
  onChange,
}: {
  activity: Activity;
  completion: Completion | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const done = completion?.done === true;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      await toggleCheck(activity, completion);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `${activity.title} : fait` : `${activity.title} : à faire`}
      className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg
        border transition-all duration-page disabled:opacity-40 ${
          done ? 'border-ink bg-ink text-paper check-pop' : 'border-line bg-paper hover:bg-card'
        }`}
    >
      {done && <IconCheck width={18} height={18} />}
    </button>
  );
}
