'use client';

// SYSTEM — Courbes d'évolution (Doc 4 §6.4) : SVG monochrome, sans dépendance.
// Deux variantes : barres (temps / activités par jour) et ligne (cumul).

import { formatDayLabel, formatDurationLong } from '@/lib/dates';

function Bars({
  values,
  labels,
  format,
}: {
  values: number[];
  labels: string[];
  format: (v: number) => string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex h-28 items-end gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-mist">{v > 0 ? format(v) : ''}</span>
            <div
              className="w-full max-w-[28px] rounded-[3px] bg-ink transition-all duration-page"
              style={{ height: `${(v / max) * 72}px`, minHeight: v > 0 ? 4 : 2, opacity: v > 0 ? 1 : 0.15 }}
            />
            <span className="text-[10px] text-fog">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Line({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 320;
  const h = 96;
  const pad = 8;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const points = values.map(
    (v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`
  );

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#141414"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number);
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#141414" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-fog">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProgressChart({
  kind,
  values,
  days,
  title,
  formatValue,
}: {
  kind: 'bars-time' | 'bars-count' | 'line';
  values: number[];
  days: string[];
  title: string;
  formatValue?: (v: number) => string;
}) {
  const labels = days.map((d) => formatDayLabel(d).split(' ')[0]); // lun., mar.…
  const format = formatValue ?? ((v: number) => String(v));

  return (
    <section className="card">
      <h3 className="section-title mb-3">{title}</h3>
      {kind === 'line' ? (
        <Line values={values} labels={labels} />
      ) : (
        <Bars
          values={values}
          labels={labels}
          format={kind === 'bars-time' ? (v) => formatDurationLong(v) : format}
        />
      )}
    </section>
  );
}
