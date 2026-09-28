'use client';

// SYSTEM — Contrôle Chrono (Doc 4 §7) : bouton rond « play » ; en cours,
// le bouton devient carré « stop » et la durée s'affiche en temps réel.
// La durée affichée est calculée depuis started_at (aucun timer persistant).

import { useEffect, useState } from 'react';
import { elapsedSec, startChrono, stopChrono } from '@/lib/chrono';
import { formatDuration } from '@/lib/dates';
import type { Activity, Session } from '@/lib/types';
import { IconPlay, IconStop } from './Icons';

export default function ChronoButton({
  activity,
  openSession,
  onChange,
  compact = false,
}: {
  activity: Activity;
  openSession: Session | null;
  onChange: () => void;
  compact?: boolean;
}) {
  const running = openSession?.activity_id === activity.id;
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);

  // Affichage temps réel : simple rafraîchissement visuel, la source de
  // vérité reste l'horodatage (survit à la fermeture de l'app — Doc 1 §2.1)
  useEffect(() => {
    if (!running || !openSession) return;
    const tick = () => setElapsed(elapsedSec(openSession));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, openSession]);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (running && openSession) {
        await stopChrono(openSession);
      } else {
        await startChrono(activity.id); // ferme/paie tout chrono ouvert
      }
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {running && (
        <span className="text-sm font-semibold tabular-nums text-ink">
          {formatDuration(elapsed)}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={busy}
        aria-label={running ? `Stopper ${activity.title}` : `Démarrer ${activity.title}`}
        className={`flex items-center justify-center transition-all duration-page
          disabled:opacity-40 ${compact ? 'h-10 w-10' : 'h-11 w-11'} min-h-[44px] min-w-[44px]
          ${running ? 'rounded-lg bg-ink text-paper' : 'rounded-full border border-ink text-ink hover:bg-card'}`}
      >
        {running ? <IconStop width={16} height={16} /> : <IconPlay width={16} height={16} />}
      </button>
    </div>
  );
}
