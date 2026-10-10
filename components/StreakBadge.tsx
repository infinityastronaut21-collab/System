'use client';

import { useEffect, useRef, useState } from 'react';
import { IconFlame } from './Icons';

export default function StreakBadge({ days }: { days: number }) {
  const [pop, setPop] = useState(false);
  const prev = useRef(days);
  useEffect(() => {
    if (days > prev.current) setPop(true);
    prev.current = days;
  }, [days]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 ${pop ? 'streak-pop' : ''}`}
      onAnimationEnd={() => setPop(false)}
      aria-label={`Série de ${days} jour${days > 1 ? 's' : ''}`}
    >
      <IconFlame width={16} height={16} className="text-go" />
      <span className="text-sm font-semibold tabular-nums text-go">{days} j</span>
    </div>
  );
}