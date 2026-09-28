'use client';

// SYSTEM — Contrôle Count (Doc 1 §2.1) : compteur de répétitions.
// Validation automatique dès que l'objectif est atteint (animation 200 ms).

import { useState } from 'react';
import { incrementCount } from '@/lib/actions';
import type { Activity, Completion } from '@/lib/types';
import { IconCheck, IconPlus } from './Icons';

export default function CountButton({
  activity,
  completion,
  onChange,
}: {
  activity: Activity;
  completion: Completion | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const target = activity.target_value ?? 1;
  const value = completion?.value ?? 0;
  const done = completion?.done === true;

  async function handleIncrement() {
    if (busy || done) return;
    setBusy(true);
    try {
      await incrementCount(activity, completion);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    // Objectif atteint : la carte se coche automatiquement
    return (
      <div
        className="check-pop flex h-11 min-h-[44px] items-center gap-1.5 rounded-lg bg-go px-3 text-sm font-semibold text-paper"
        aria-label={`Objectif atteint : ${target} répétitions`}
      >
        <IconCheck width={16} height={16} />
        {target}
      </div>
    );
  }

  return (
    <button
      onClick={handleIncrement}
      disabled={busy}
      aria-label={`+1 répétition pour ${activity.title} (${value}/${target})`}
      className="flex h-11 min-h-[44px] items-center gap-1.5 rounded-lg border border-ink px-3
        text-sm font-semibold tabular-nums text-ink transition-colors duration-page
        hover:bg-card active:bg-card disabled:opacity-40"
    >
      <IconPlus width={14} height={14} />
      {value}
      <span className="font-normal text-fog">/{target}</span>
    </button>
  );
}
