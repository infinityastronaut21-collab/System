'use client';

// SYSTEM — Chargement central des données (client, protégé par RLS)

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import type {
  Activity,
  Completion,
  Project,
  Quote,
  Session,
  SuperProject,
} from './types';

export interface SystemData {
  loading: boolean;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [superProjects, setSuperProjects] = useState<SuperProject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [openSession, setOpenSession] = useState<Session | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    const [a, p, sp, s, c, q, open] = await Promise.all([
      supabase.from('activities').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('super_projects').select('*').order('created_at'),
      supabase.from('sessions').select('*').order('started_at'),
      supabase.from('completions').select('*').order('day'),
      supabase.from('quotes').select('*').order('author').order('text'),
      supabase
        .from('sessions')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (a.error) throw a.error;
    setActivities(a.data ?? []);
    setProjects(p.data ?? []);
    setSuperProjects(sp.data ?? []);
    setSessions(s.data ?? []);
    setCompletions(c.data ?? []);
    setQuotes(q.data ?? []);
    setOpenSession(open.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch((err) => {
      console.error('Chargement des données :', err);
      setLoading(false);
    });
  }, [refresh]);

  return {
    loading,
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
