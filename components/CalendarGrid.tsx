'use client';

// SYSTEM — Calendrier du mois (Doc 4 §6.1) : 7 × 5 cases.
// Case : carré 14 px rayon 3 px ; vide = #F2F2F2, rempli = dégradés d'encre
// selon l'intensité du travail du jour.

import { monthGrid, todayKey } from '@/lib/dates';
import { dayIntensity } from '@/lib/stats';
import type { Completion, Session } from '@/lib/types';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Intensité 0…1 → fond de case (dégradés d'encre). */
function cellColor(intensity: number): string {
  if (intensity <= 0) return '#F2F2F2';
  if (intensity < 0.34) return '#9A9A9A';
  if (intensity < 0.67) return '#6B6B6B';
  return '#141414';
}

export default function CalendarGrid({
  sessions,
  completions,
}: {
  sessions: Session[];
  completions: Completion[];
}) {
  const weeks = monthGrid();
  const today = todayKey();
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <section className="card">
      <h2 className="section-title mb-3 capitalize">{monthLabel}</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-medium text-fog">
            {d}
          </div>
        ))}
        {weeks.flat().map((key, i) => {
          if (!key) return <div key={i} className="h-3.5" />;
          const intensity = key <= today ? dayIntensity(key, sessions, completions) : 0;
          const future = key > today;
          return (
            <div key={i} className="flex justify-center">
              <div
                title={`${key} — intensité ${Math.round(intensity * 100)} %`}
                className={`h-3.5 w-3.5 rounded-[3px] ${
                  key === today ? 'ring-1 ring-ink ring-offset-1' : ''
                  } ${future ? 'opacity-30' : ''}`}
                style={{ backgroundColor: future ? '#F2F2F2' : cellColor(intensity) }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-fog">
        <span>Moins</span>
        {['#F2F2F2', '#9A9A9A', '#6B6B6B', '#141414'].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span>Plus</span>
      </div>
    </section>
  );
}
