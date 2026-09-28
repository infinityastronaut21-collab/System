'use client';

// SYSTEM — Progress (Doc 4 §6.4) : sélecteur de projet + « Vue globale ».
// Par projet : anneau %, « 12 / 18 activités », échéance, courbes (temps par
// jour 7 j, activités complétées par jour, cumul d'avancement).
// Vue globale : temps total, totaux par type, comparatif projets.

import { useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import EmptyState from '@/components/EmptyState';
import ProgressChart from '@/components/ProgressChart';
import ProgressRing from '@/components/ProgressRing';
import { formatDurationLong, last7Days } from '@/lib/dates';
import {
  completionMap,
  completionsByDay,
  globalTotals,
  projectProgress,
  timeByDay,
} from '@/lib/stats';
import { useSystemData } from '@/lib/useData';

export default function ProgressPage() {
  const data = useSystemData();
  const [selected, setSelected] = useState<string>('global'); // 'global' | project id
  const days = useMemo(() => last7Days(), []);
  const cmap = useMemo(() => completionMap(data.completions), [data.completions]);

  const activeProjects = data.projects.filter((p) => p.status === 'active');
  const project = activeProjects.find((p) => p.id === selected);

  // Données du projet sélectionné
  const projectActs = project
    ? data.activities.filter((a) => a.project_id === project.id && !a.archived)
    : [];
  const projectActIds = new Set(projectActs.map((a) => a.id));
  const projectSessions = project
    ? data.sessions.filter((s) => projectActIds.has(s.activity_id))
    : [];
  const projectCompletions = project
    ? data.completions.filter((c) => projectActIds.has(c.activity_id))
    : [];

  const prog = project ? projectProgress(projectActs, cmap) : null;

  // Cumul d'avancement sur 7 jours (activités complétées cumulées)
  const dailyDone = completionsByDay(
    project ? projectCompletions : data.completions,
    days
  );
  const cumulative = dailyDone.reduce<number[]>((acc, v, i) => {
    acc.push((acc[i - 1] ?? 0) + v);
    return acc;
  }, []);

  const totals = useMemo(
    () => globalTotals(data.activities, data.sessions, data.completions, activeProjects),
    [data.activities, data.sessions, data.completions, activeProjects]
  );

  return (
    <>
      <AppHeader title="Progress" />
      <main className="page-enter space-y-4 p-4 pb-28">
        {/* Sélecteur de projet + Vue globale */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`chip ${selected === 'global' ? 'chip-active' : ''}`}
            onClick={() => setSelected('global')}
          >
            Vue globale
          </button>
          {activeProjects.map((p) => (
            <button
              key={p.id}
              className={`chip ${selected === p.id ? 'chip-active' : ''}`}
              onClick={() => setSelected(p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>

        {selected !== 'global' && project && prog ? (
          <>
            {/* Anneau d'avancement + compteur + échéance */}
            <section className="card flex items-center gap-4">
              <ProgressRing pct={prog.pct} />
              <div>
                <h2 className="section-title">{project.title}</h2>
                <p className="meta mt-1">
                  {prog.done} / {prog.total} activités
                </p>
                {project.deadline && (
                  <p className="meta">Échéance : {project.deadline}</p>
                )}
              </div>
            </section>

            {/* Courbes */}
            <ProgressChart
              kind="bars-time"
              title="Temps par jour (7 jours)"
              values={timeByDay(projectSessions, days)}
              days={days}
            />
            <ProgressChart
              kind="bars-count"
              title="Activités complétées par jour"
              values={dailyDone}
              days={days}
            />
            <ProgressChart
              kind="line"
              title="Cumul d’avancement"
              values={cumulative}
              days={days}
            />
          </>
        ) : selected === 'global' ? (
          <>
            {/* Vue globale : temps total + totaux par type */}
            <section className="card">
              <h2 className="section-title mb-3">Temps total (7 derniers jours)</h2>
              <p className="text-2xl font-semibold tabular-nums text-ink">
                {formatDurationLong(
                  timeByDay(data.sessions, days).reduce((a, b) => a + b, 0)
                )}
              </p>
            </section>

            <section className="card">
              <h2 className="section-title mb-3">Totaux par type</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(['chrono', 'count', 'check'] as const).map((t) => (
                  <div key={t} className="rounded-lg bg-card p-3">
                    <p className="text-lg font-semibold tabular-nums text-ink">
                      {totals.byType[t]}
                    </p>
                    <p className="meta capitalize">{t}</p>
                  </div>
                ))}
              </div>
            </section>

            <ProgressChart
              kind="bars-time"
              title="Temps par jour (7 jours)"
              values={timeByDay(data.sessions, days)}
              days={days}
            />
            <ProgressChart
              kind="line"
              title="Cumul d’avancement (activités complétées)"
              values={cumulative}
              days={days}
            />

            {/* Comparatif projets */}
            {totals.perProject.length > 0 && (
              <section className="card">
                <h2 className="section-title mb-3">Comparatif projets</h2>
                <ul className="space-y-3">
                  {totals.perProject.map(({ project: p, seconds, completions }) => (
                    <li key={p.id}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-sm font-medium text-ink">{p.title}</span>
                        <span className="meta shrink-0">
                          {formatDurationLong(seconds)} · {completions} faites
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-card">
                        <div
                          className="h-full rounded-full bg-ink"
                          style={{
                            width: `${
                              totals.totalSec > 0
                                ? Math.min(100, (seconds / totals.totalSec) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucun projet actif"
            hint="Crée un projet depuis Work pour suivre son avancement ici."
          />
        )}
      </main>
      <BottomNav />
    </>
  );
}
