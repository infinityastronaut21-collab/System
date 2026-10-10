'use client';

// SYSTEM — Contrôle Count : compteur +/−, validation auto à l'objectif.
// v2 : un clic en trop peut être corrigé (chip verte cliquable → −1).

import { useState } from 'react';
import { decrementCount, incrementCount } from '@/lib/actions';
import type { Activity, Completion } from '@/lib/types';
import { IconCheck, IconMinus, IconPlus } from './Icons';

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

  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    // Objectif atteint : cliquer dé-fait d'une unité (correction possible)
    return (
      <button
        onClick={() => run(() => decrementCount(activity, completion))}
        disabled={busy}
        className="check-pop flex h-11 min-h-[44px] items-center gap-1.5 rounded-lg bg-go px-3 text-sm font-semibold text-paper transition-transform duration-page active:scale-95 disabled:opacity-40"
        aria-label={`Objectif atteint : ${target}. Appuyer pour retirer une répétition`}
      >
        <IconCheck width={16} height={16} />
        {target}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {value > 0 && (
        <button
          onClick={() => run(() => decrementCount(activity, completion))}
          disabled={busy}
          aria-label={`Retirer une répétition (${value}/${target})`}
          className="flex h-11 min-h-[44px] w-9 items-center justify-center rounded-lg border border-line text-mist transition-colors duration-page hover:bg-card disabled:opacity-40"
        >
          <IconMinus width={14} height={14} />
        </button>
      )}
      <button
        onClick={() => run(() => incrementCount(activity, completion))}
        disabled={busy}
        aria-label={`+1 répétition pour ${activity.title} (${value}/${target})`}
        className="flex h-11 min-h-[44px] items-center gap-1.5 rounded-lg border border-ink px-3 text-sm font-semibold tabular-nums text-ink transition-colors duration-page hover:bg-card active:scale-95 disabled:opacity-40"
      >
        <IconPlus width={14} height={14} />
        {value}
        <span className="font-normal text-fog">/{target}</span>
      </button>
    </div>
  );
}