// SYSTEM — Mutations métier : validations check / count (Doc 1 §2.1)

import { getSupabase } from './supabase';
import { todayKey } from './dates';
import type { Activity, Completion } from './types';

/** Récupère la completion d'une activité pour un jour. */
export async function getCompletion(
  activityId: string,
  day: string
): Promise<Completion | null> {
  const { data, error } = await getSupabase()
    .from('completions')
    .select('*')
    .eq('activity_id', activityId)
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Check : bascule fait / pas fait pour aujourd'hui. */
export async function toggleCheck(activity: Activity, current: Completion | null): Promise<void> {
  const supabase = getSupabase();
  const day = todayKey();
  if (current) {
    const { error } = await supabase
      .from('completions')
      .update({ done: !current.done })
      .eq('id', current.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('completions')
      .insert({ activity_id: activity.id, day, value: 1, done: true });
    if (error) throw error;
  }
}

/**
 * Count : incrémente le compteur du jour. Validation automatique dès que
 * l'objectif est atteint (Doc 1 §4). Retourne la nouvelle valeur.
 */
export async function incrementCount(
  activity: Activity,
  current: Completion | null
): Promise<number> {
  const supabase = getSupabase();
  const day = todayKey();
  const target = activity.target_value ?? 1;
  const next = (current?.value ?? 0) + 1;
  const done = next >= target; // validation automatique à l'objectif

  if (current) {
    const { error } = await supabase
      .from('completions')
      .update({ value: next, done: current.done || done })
      .eq('id', current.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('completions')
      .insert({ activity_id: activity.id, day, value: next, done });
    if (error) throw error;
  }
  return next;
}

/** Archive (jamais de suppression définitive — Doc 1 §4). */
export async function archiveActivity(activityId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('activities')
    .update({ archived: true })
    .eq('id', activityId);
  if (error) throw error;
}

export async function restoreActivity(activityId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('activities')
    .update({ archived: false })
    .eq('id', activityId);
  if (error) throw error;
}

export async function archiveProject(projectId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('projects')
    .update({ status: 'archive' })
    .eq('id', projectId);
  if (error) throw error;
}

export async function restoreProject(projectId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('projects')
    .update({ status: 'active' })
    .eq('id', projectId);
  if (error) throw error;
}

export async function archiveSuperProject(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('super_projects')
    .update({ archived: true })
    .eq('id', id);
  if (error) throw error;
}

export async function restoreSuperProject(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('super_projects')
    .update({ archived: false })
    .eq('id', id);
  if (error) throw error;
}
