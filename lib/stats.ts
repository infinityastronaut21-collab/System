// SYSTEM — Agrégations : streaks, courbes, totaux (Document 1 §4, Doc 4 §6.4)

import type { Activity, Completion, Project, Session } from './types';
import { addDays, dayKey, isScheduledOn, todayKey } from './dates';

type CompletionMap = Map<string, Completion>; // clé : `${activity_id}|${day}`

export function completionMap(completions: Completion[]): CompletionMap {
  const map: CompletionMap = new Map();
  for (const c of completions) map.set(`${c.activity_id}|${c.day}`, c);
  return map;
}

/** Activités prévues un jour donné (créées au plus tard ce jour, non archivées). */
export function scheduledOn(activities: Activity[], key: string): Activity[] {
  return activities.filter(
    (a) => !a.archived && dayKey(new Date(a.created_at)) <= key && isScheduledOn(a, key)
  );
}

/** Toutes les activités prévues ce jour sont-elles faites ? */
export function isDayComplete(
  activities: Activity[],
  key: string,
  cmap: CompletionMap
): boolean | null {
  const planned = scheduledOn(activities, key);
  if (planned.length === 0) return null; // jour neutre : rien de prévu
  return planned.every((a) => cmap.get(`${a.id}|${key}`)?.done === true);
}

/**
 * Série (streak) : jours consécutifs avec toutes les activités du jour
 * réalisées (Doc 1 §4). Aujourd'hui compte si déjà complet ; les jours sans
 * activité prévue sont neutres (ne cassent pas la série).
 */
export function computeStreak(activities: Activity[], completions: Completion[]): number {
  const cmap = completionMap(completions);
  let streak = 0;
  let key = todayKey();

  // Si aujourd'hui n'est pas encore complet, la série se mesure depuis hier
  const todayComplete = isDayComplete(activities, key, cmap);
  if (todayComplete !== true) key = addDays(key, -1);

  const earliest = activities.reduce<string | null>((min, a) => {
    const k = dayKey(new Date(a.created_at));
    return min === null || k < min ? k : min;
  }, null);
  if (!earliest) return 0;

  for (let i = 0; i < 3660; i++) {
    if (key < earliest) break;
    const complete = isDayComplete(activities, key, cmap);
    if (complete === false) break;
    if (complete === true) streak++;
    key = addDays(key, -1);
  }
  return streak;
}

/** Record de série sur tout l'historique (Paramètres). */
export function computeBestStreak(activities: Activity[], completions: Completion[]): number {
  const cmap = completionMap(completions);
  const earliest = activities.reduce<string | null>((min, a) => {
    const k = dayKey(new Date(a.created_at));
    return min === null || k < min ? k : min;
  }, null);
  if (!earliest) return 0;

  let best = 0;
  let current = 0;
  let key = earliest;
  const today = todayKey();
  while (key <= today) {
    const complete = isDayComplete(activities, key, cmap);
    if (complete === true) {
      current++;
      best = Math.max(best, current);
    } else if (complete === false) {
      current = 0;
    }
    key = addDays(key, 1);
  }
  return best;
}

/** Temps de chrono par jour (somme des duration_sec, jour = started_at). */
export function timeByDay(sessions: Session[], days: string[]): number[] {
  const sums = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.started_at));
    sums.set(k, (sums.get(k) ?? 0) + (s.duration_sec ?? 0));
  }
  return days.map((d) => sums.get(d) ?? 0);
}

/** Nombre d'activités complétées par jour. */
export function completionsByDay(completions: Completion[], days: string[]): number[] {
  const sums = new Map<string, number>();
  for (const c of completions) {
    if (!c.done) continue;
    sums.set(c.day, (sums.get(c.day) ?? 0) + 1);
  }
  return days.map((d) => sums.get(d) ?? 0);
}

/**
 * Avancement d'un projet : une activité est « faite » si sa dernière
 * occurrence prévue (≤ aujourd'hui) est validée. Retourne done/total/%.
 */
export function projectProgress(
  activities: Activity[],
  cmap: CompletionMap
): { done: number; total: number; pct: number } {
  const today = todayKey();
  const relevant = activities.filter((a) => !a.archived);
  let done = 0;
  for (const a of relevant) {
    // Cherche la dernière occurrence prévue ≤ aujourd'hui (max 370 jours en arrière)
    for (let i = 0; i <= 370; i++) {
      const key = addDays(today, -i);
      if (key < dayKey(new Date(a.created_at))) break;
      if (isScheduledOn(a, key)) {
        if (cmap.get(`${a.id}|${key}`)?.done) done++;
        break;
      }
    }
  }
  const total = relevant.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Avancement agrégé d'un super-projet (moyenne de ses projets). */
export function superProjectProgress(
  projects: Project[],
  activitiesByProject: Map<string, Activity[]>,
  cmap: CompletionMap
): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  for (const p of projects) {
    const r = projectProgress(activitiesByProject.get(p.id) ?? [], cmap);
    done += r.done;
    total += r.total;
  }
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Intensité d'un jour pour le calendrier (0…1) : travail mesuré ce jour. */
export function dayIntensity(
  key: string,
  sessions: Session[],
  completions: Completion[]
): number {
  let work = 0;
  for (const c of completions) if (c.day === key && c.done) work += 1;
  for (const s of sessions) {
    if (dayKey(new Date(s.started_at)) === key) work += (s.duration_sec ?? 0) / 1800; // 30 min = 1 unité
  }
  // Échelle douce : 0 → 0, 1 → 0.33, 3 → 0.66, 6+ → 1
  return Math.min(1, work / 6);
}

/** Totaux globaux étendus (Paramètres, Doc 4 §6.6). */
export function globalTotals(
  activities: Activity[],
  sessions: Session[],
  completions: Completion[],
  projects: Project[]
) {
  const totalSec = sessions.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);
  const today = todayKey();
  const weekStart = addDays(today, -((new Date().getDay() + 6) % 7)); // lundi
  const monthStart = today.slice(0, 8) + '01';

  const secSince = (from: string) =>
    sessions
      .filter((s) => dayKey(new Date(s.started_at)) >= from)
      .reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);

  const doneCompletions = completions.filter((c) => c.done);
  const byType = { chrono: 0, count: 0, check: 0 } as Record<string, number>;
  for (const c of doneCompletions) {
    const a = activities.find((x) => x.id === c.activity_id);
    if (a) byType[a.type]++;
  }

  const perProject = projects.map((p) => {
    const acts = activities.filter((a) => a.project_id === p.id);
    const actIds = new Set(acts.map((a) => a.id));
    const secs = sessions
      .filter((s) => actIds.has(s.activity_id))
      .reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);
    const done = doneCompletions.filter((c) => actIds.has(c.activity_id)).length;
    return { project: p, seconds: secs, completions: done };
  });

  return {
    totalSec,
    weekSec: secSince(weekStart),
    monthSec: secSince(monthStart),
    totalCompletions: doneCompletions.length,
    totalSessions: sessions.length,
    byType,
    perProject,
    bestStreak: computeBestStreak(activities, completions),
  };
}
