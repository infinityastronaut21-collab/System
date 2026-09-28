// SYSTEM — Logique du chrono sans timer persistant (Document 2, section 4)
//
// 1. [Démarrer] → INSERT session (started_at = now()) + fermer toute session ouverte
// 2. Fermer l'app → rien ne tourne
// 3. Rouvrir   → SELECT session WHERE ended_at IS NULL ; affiché = now() - started_at
// 4. [Stop]    → UPDATE session SET ended_at = now(), duration_sec = …

import { getSupabase } from './supabase';
import type { Session } from './types';

/** Session actuellement ouverte (ended_at IS NULL), ou null. */
export async function getOpenSession(): Promise<Session | null> {
  const { data, error } = await getSupabase()
    .from('sessions')
    .select('*')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Démarre le chrono d'une activité.
 * Sécurité (Doc 1 §4) : un seul chrono à la fois — toute session encore
 * ouverte est d'abord clôturée et payée (duration_sec calculé).
 */
export async function startChrono(activityId: string): Promise<Session> {
  const supabase = getSupabase();
  const now = new Date();

  // Ferme et paie toute session ouverte (peu importe l'activité)
  const { data: openSessions, error: openErr } = await supabase
    .from('sessions')
    .select('*')
    .is('ended_at', null);
  if (openErr) throw openErr;

  for (const s of openSessions ?? []) {
    const duration = Math.max(
      0,
      Math.floor((now.getTime() - new Date(s.started_at).getTime()) / 1000)
    );
    const { error } = await supabase
      .from('sessions')
      .update({ ended_at: now.toISOString(), duration_sec: duration })
      .eq('id', s.id);
    if (error) throw error;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ activity_id: activityId, started_at: now.toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Stoppe une session : horodatage de fin + durée en secondes. */
export async function stopChrono(session: Session): Promise<Session> {
  const now = new Date();
  const duration = Math.max(
    0,
    Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
  );
  const { data, error } = await getSupabase()
    .from('sessions')
    .update({ ended_at: now.toISOString(), duration_sec: duration })
    .eq('id', session.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Durée écoulée (secondes) d'une session ouverte, calculée à la réouverture. */
export function elapsedSec(session: Session): number {
  const end = session.ended_at ? new Date(session.ended_at) : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(session.started_at).getTime()) / 1000));
}
