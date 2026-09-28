'use client';

// SYSTEM — Anneau d'avancement % (Doc 4 §6.4) : SVG monochrome.

export default function ProgressRing({
  pct,
  size = 120,
  stroke = 8,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`Avancement ${pct} %`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2F2F2" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#141414"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 200ms ease-out' }}
        />
      </svg>
      <span className="absolute text-lg font-semibold tabular-nums text-ink">{pct} %</span>
    </div>
  );
}
