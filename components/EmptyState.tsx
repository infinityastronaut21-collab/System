'use client';

// SYSTEM — État vide (Doc 4 §7) : illustration ligne simple + texte d'aide.

export default function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      {/* Illustration ligne simple : cible de précision (rappel du logo) */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
        <circle cx="28" cy="28" r="18" stroke="#DDDDDD" strokeWidth="1.5" />
        <circle cx="28" cy="28" r="4" fill="#DDDDDD" />
        <path d="M28 4v6M28 46v6M4 28h6M46 28h6" stroke="#DDDDDD" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium text-mist">{title}</p>
      <p className="max-w-[240px] text-xs text-fog">{hint}</p>
    </div>
  );
}
