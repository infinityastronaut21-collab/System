'use client';

// SYSTEM — Badge streak (Doc 4 §5) : flamme discrète + compteur en vert.

import { IconFlame } from './Icons';

export default function StreakBadge({ days }: { days: number }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5"
      aria-label={`Série de ${days} jour${days > 1 ? 's' : ''}`}
    >
      <IconFlame width={16} height={16} className="text-go" />
      <span className="text-sm font-semibold tabular-nums text-go">{days} j</span>
    </div>
  );
}
