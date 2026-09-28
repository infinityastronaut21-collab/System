// SYSTEM — Export / import JSON complet (Document 3, section 6)

import { getSupabase } from './supabase';
import type { SystemExport } from './types';

/** Exporte toutes les données du compte en un objet JSON téléchargeable. */
export async function exportAll(): Promise<SystemExport> {
  const supabase = getSupabase();
  const [profile, superProjects, projects, activities, sessions, completions, quotes] =
    await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('super_projects').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('activities').select('*').order('created_at'),
      supabase.from('sessions').select('*').order('started_at'),
      supabase.from('completions').select('*').order('day'),
      supabase.from('quotes').select('*').order('author').order('text'),
    ]);

  for (const r of [superProjects, projects, activities, sessions, completions, quotes]) {
    if (r.error) throw r.error;
  }

  return {
    app: 'system',
    version: 1,
    exported_at: new Date().toISOString(),
    profile: profile.data ?? null,
    super_projects: superProjects.data ?? [],
    projects: projects.data ?? [],
    activities: activities.data ?? [],
    sessions: sessions.data ?? [],
    completions: completions.data ?? [],
    quotes: quotes.data ?? [],
  };
}

/** Déclenche le téléchargement du fichier JSON (navigateur). */
export function downloadExport(data: SystemExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = data.exported_at.slice(0, 10);
  a.href = url;
  a.download = `system-export-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Restaure un export JSON : réinsère les données dans l'ordre des
 * dépendances (upsert sur les id pour être idempotent).
 */
export async function importAll(payload: SystemExport): Promise<void> {
  if (payload.app !== 'system') throw new Error('Fichier invalide : ce n’est pas un export System.');
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Session expirée : reconnecte-toi.');

  // Force l'appartenance au compte courant
  const own = <T extends { user_id?: string }>(rows: T[]): T[] =>
    rows.map((r) => ({ ...r, user_id: uid }));

  const steps: { table: string; rows: object[] }[] = [
    { table: 'super_projects', rows: own(payload.super_projects) },
    { table: 'projects', rows: own(payload.projects) },
    { table: 'activities', rows: own(payload.activities) },
    { table: 'sessions', rows: payload.sessions },
    { table: 'completions', rows: payload.completions },
    { table: 'quotes', rows: payload.quotes },
  ];

  for (const step of steps) {
    if (step.rows.length === 0) continue;
    const { error } = await supabase.from(step.table).upsert(step.rows);
    if (error) throw new Error(`Import ${step.table} : ${error.message}`);
  }
}
