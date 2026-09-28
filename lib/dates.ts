// SYSTEM — Helpers de dates et de récurrence (fuseau local de l'appareil)

import type { Activity } from './types';

/** Date locale au format YYYY-MM-DD (sans décalage UTC). */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export function addDays(key: string, n: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Jour de l'année (1…366) — utilisé pour la rotation des citations. */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** Une activité est-elle prévue ce jour-là ? (règles de récurrence, Doc 1 §9) */
export function isScheduledOn(activity: Activity, key: string): boolean {
  const d = new Date(key + 'T00:00:00');
  const dow = d.getDay(); // 0=dim … 6=sam
  switch (activity.recurrence) {
    case 'daily':
      return true;
    case 'weekdays':
      return dow >= 1 && dow <= 5;
    case 'weekly': {
      // Hebdo : même jour de semaine que la création
      const created = new Date(activity.created_at);
      return created.getDay() === dow;
    }
    case 'custom':
      return (activity.recurrence_days ?? []).includes(dow);
    case 'none':
    default:
      // Ponctuelle : prévue le jour de création, ou le jour de son échéance
      if (activity.deadline) return activity.deadline === key;
      return dayKey(new Date(activity.created_at)) === key;
  }
}

/** Formate une durée en secondes : "HH:MM:SS" ou "MM:SS" (chiffres tabulaires). */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Formate une durée longue en texte : "12 h 30" ou "45 min". */
export function formatDurationLong(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  return `${m} min`;
}

/** Libellé français d'une date ISO : "lun. 28 sept." */
export function formatDayLabel(key: string): string {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Clés des 7 derniers jours (aujourd'hui inclus), ordre chronologique. */
export function last7Days(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(addDays(todayKey(), -i));
  return out;
}

/** Grille du mois courant : semaines × 7 (null = hors mois), en commençant lundi. */
export function monthGrid(ref: Date = new Date()): (string | null)[][] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Décalage : lundi = 0 … dimanche = 6
  const offset = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(dayKey(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
