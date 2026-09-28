'use client';

// SYSTEM — Sélecteurs de formulaire (Doc 4 §5) :
// - Type segmenté 3 options (actif = fond encre, texte blanc)
// - Difficulté : 5 pastilles (remplies = encre, vides = contour)

import type { ActivityType } from '@/lib/types';

export function TypeSelector({
  value,
  onChange,
}: {
  value: ActivityType;
  onChange: (t: ActivityType) => void;
}) {
  const options: { id: ActivityType; label: string }[] = [
    { id: 'chrono', label: 'Chrono' },
    { id: 'count', label: 'Count' },
    { id: 'check', label: 'Check' },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-card p-1" role="radiogroup" aria-label="Type d'activité">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[40px] rounded-md text-sm font-medium transition-colors duration-page ${
            value === o.id ? 'bg-ink text-paper' : 'text-mist hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DifficultyDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Difficulté de 1 à 5">
      {[1, 2, 3, 4, 5].map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          aria-label={`Difficulté ${d} sur 5`}
          onClick={() => onChange(d)}
          className={`h-6 w-6 min-h-[24px] rounded-full border transition-colors duration-page ${
            d <= value ? 'border-ink bg-ink' : 'border-line bg-paper hover:border-fog'
          }`}
        />
      ))}
    </div>
  );
}
