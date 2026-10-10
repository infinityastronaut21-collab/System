'use client';

// SYSTEM — Chargement central des données (client, protégé par RLS)
// v2 : erreurs toutes vérifiées, fenêtre d'historique bornée, bascule de
// jour à minuit, temps réel Supabase, réparation auto du profil.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabase';
import { ensureProfile } from './ensureProfile';
import { addDays, todayKey } from './dates';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Activity,
  Completion,
  Project,
  Quote,
  Session,
  SuperProject,
} from './types';

const HISTORY_DAYS = 800; // couvre streaks et records jusqu'à ~2 ans

export interface SystemData {
  loading: boolean;
  error: string | null;
  activities: Activity[];
  projects: Project[];
  superProjects: SuperProject[];
  sessions: Session[];
  completions: Completion[];
  quotes: Quote[];
  openSession: Session | null;
  refresh: () => Promise<void>;
}

export function useSystemData(): SystemData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [superProjects, setSuperProjects] = useState<SuperProject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const dayRef = useRef(todayKey());

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    const since = addDays(todayKey(), -HISTORY_DAYS);
    const [a, p, sp, s, c, q, open] = await Promise.all([
      supabase.from('activities').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('super_projects').select('*').order('created_at'),
      supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(1000),
      supabase.from('completions').select('*').gte('day', since).order('day'),
      supabase.from('quotes').select('*').order('author').order('text'),
      supabase
        .from('sessions')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    // AVANT : seul a.error était vérifié → échecs silencieux, app à moitié vide.
    const failed = [a, p, sp, s, c, q, open].find((r) => r.error);
    if (failed) {
      setError(failed.error!.message);
      setLoading(false);
      throw failed.error;
    }
    setError(null);
    setActivities(a.data ?? []);
    setProjects(p.data ?? []);
    setSuperProjects(sp.data ?? []);
    setSessions((s.data ?? []).reverse());
    setCompletions(c.data ?? []);
    setQuotes(q.data ?? []);
    setOpenSession(open.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureProfile().catch(() => {});
    refresh().catch((err) => {
      console.error('Chargement des données :', err);
      setLoading(false);
    });

    // Bascule de jour à minuit : les compteurs/date « aujourd'hui » doivent
    // se rafraîchir même si l'app reste ouverte (AVANT : figés jusqu'au reload).
    const dayCheck = setInterval(() => {
      const today = todayKey();
      if (today !== dayRef.current) {
        dayRef.current = today;
        refresh().catch(() => {});
      }
    }, 30_000);

    // Temps réel : toute écriture (même depuis un autre onglet/appareil)
    // déclenche un rechargement automatique.
    let channel: RealtimeChannel | null = null;
    try {
      channel = getSupabase()
        .channel('system-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          if (!cancelled) refresh().catch(() => {});
        })
        .subscribe();
    } catch {
      /* Realtime non activé sur le projet : le refresh manuel reste */
    }

    return () => {
      cancelled = true;
      clearInterval(dayCheck);
      if (channel) getSupabase().removeChannel(channel);
    };
  }, [refresh]);

  return {
    loading,
    error,
    activities,
    projects,
    superProjects,
    sessions,
    completions,
    quotes,
    openSession,
    refresh,
  };
}