'use client';

// SYSTEM — Accueil (Doc 4 §6.1) : citation du jour · badge streak ·
// calendrier de tracking · activités du jour (fait / non fait, barre 2/3) ·
// activité manquée d'hier grisée.

import { useMemo } from 'react';
import ActivityRow from '@/components/ActivityRow';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import CalendarGrid from '@/components/CalendarGrid';
import EmptyState from '@/components/EmptyState';
import InstallBanner from '@/components/InstallBanner';
import QuoteCard from '@/components/QuoteCard';
import StreakBadge from '@/components/StreakBadge';
import { todayKey, yesterdayKey } from '@/lib/dates';
import { quoteOfTheDay } from '@/lib/quotes';
import { completionMap, computeStreak, scheduledOn } from '@/lib/stats';
import { useSystemData } from '@/lib/useData';

export default function HomePage() {
  const data = useSystemData();
  const today = todayKey();
  const yesterday = yesterdayKey();

  const quote = useMemo(() => quoteOfTheDay(data.quotes), [data.quotes]);
  const cmap = useMemo(() => completionMap(data.completions), [data.completions]);

  const todayActivities = useMemo(
    () => scheduledOn(data.activities, today),
    [data.activities, today]
  );
  const doneCount = todayActivities.filter((a) => cmap.get(`${a.id}|${today}`)?.done).length;

  const missedYesterday = useMemo(
    () =>
      scheduledOn(data.activities, yesterday).filter(
        (a) => !cmap.get(`${a.id}|${yesterday}`)?.done
      ),
    [data.activities, cmap, yesterday]
  );

  const streak = useMemo(
    () => computeStreak(data.activities, data.completions),
    [data.activities, data.completions]
  );

  if (data.loading) {
    return (
      <>
        <AppHeader />
        <main className="p-4">
          <p className="text-sm text-fog">Chargement…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="page-enter space-y-5 p-4 pb-28">
        {/* Citation du jour (rotation automatique — Doc 5 §2) */}
        {quote && (
          <section aria-label="Citation du jour">
            <QuoteCard quote={quote} />
          </section>
        )}

        {/* Badge de streak sous la citation */}
        <section>
          <StreakBadge days={streak} />
        </section>

        {/* Calendrier de tracking */}
        <CalendarGrid sessions={data.sessions} completions={data.completions} />

        {/* Activités du jour */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Activités du jour</h2>
            <span className="text-sm font-semibold tabular-nums text-mist">
              {doneCount} / {todayActivities.length}
            </span>
          </div>

          {/* Barre de progression « 2 / 3 » */}
          {todayActivities.length > 0 && (
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-ink transition-all duration-page"
                style={{
                  width: `${todayActivities.length ? (doneCount / todayActivities.length) * 100 : 0}%`,
                }}
              />
            </div>
          )}

          {todayActivities.length === 0 ? (
            <EmptyState
              title="Aucune activité aujourd’hui"
              hint="Appuie sur + pour créer une activité, un projet ou un super-projet."
            />
          ) : (
            <ul className="space-y-2">
              {todayActivities.map((a) => (
                <li key={a.id}>
                  <ActivityRow
                    activity={a}
                    completion={cmap.get(`${a.id}|${today}`) ?? null}
                    openSession={data.openSession}
                    projects={data.projects}
                    onChange={data.refresh}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activités manquées d'hier : grisées, non cliquables (Doc 1 §4) */}
        {missedYesterday.length > 0 && (
          <section>
            <h2 className="section-title mb-2 text-mist">Manquées hier</h2>
            <ul className="space-y-2">
              {missedYesterday.map((a) => (
                <li key={a.id}>
                  <ActivityRow
                    activity={a}
                    completion={null}
                    openSession={null}
                    projects={data.projects}
                    onChange={() => {}}
                    missed
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <InstallBanner />
      </main>
      <BottomNav />
    </>
  );
}
