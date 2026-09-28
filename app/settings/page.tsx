'use client';

// SYSTEM — Paramètres (Doc 4 §6.6) : profil, totaux globaux étendus,
// gestion des citations, export/import JSON, archives, notifications,
// déconnexion.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ArchiveList from '@/components/ArchiveList';
import BottomNav from '@/components/BottomNav';
import StreakBadge from '@/components/StreakBadge';
import {
  IconBell,
  IconDownload,
  IconLogout,
  IconUpload,
} from '@/components/Icons';
import { downloadExport, exportAll, importAll } from '@/lib/export';
import { formatDurationLong } from '@/lib/dates';
import { disablePush, enablePush, isPushEnabled, pushSupported } from '@/lib/notifications';
import { computeStreak, globalTotals } from '@/lib/stats';
import { getSupabase } from '@/lib/supabase';
import { useSystemData } from '@/lib/useData';
import type { SystemExport } from '@/lib/types';

export default function SettingsPage() {
  const data = useSystemData();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('Infinity');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data: u }) => setEmail(u.user?.email ?? ''));
    getSupabase()
      .from('profiles')
      .select('username')
      .maybeSingle()
      .then(({ data: p }) => {
        if (p?.username) setUsername(p.username);
      });
    void isPushEnabled().then(setPushOn);
  }, []);

  const totals = useMemo(
    () =>
      globalTotals(
        data.activities,
        data.sessions,
        data.completions,
        data.projects.filter((p) => p.status !== 'archive')
      ),
    [data.activities, data.sessions, data.completions, data.projects]
  );
  const streak = useMemo(
    () => computeStreak(data.activities, data.completions),
    [data.activities, data.completions]
  );

  async function saveProfile() {
    setBusy('profile');
    setProfileMsg(null);
    try {
      const { error } = await getSupabase()
        .from('profiles')
        .update({ username: username.trim() || 'Infinity' })
        .eq('id', (await getSupabase().auth.getUser()).data.user?.id ?? '');
      if (error) throw error;
      setProfileMsg('Profil enregistré.');
    } catch {
      setProfileMsg('Échec de l’enregistrement.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExport() {
    setBusy('export');
    try {
      downloadExport(await exportAll());
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    setBusy('import');
    setNotice(null);
    try {
      const payload = JSON.parse(await file.text()) as SystemExport;
      await importAll(payload);
      await data.refresh();
      setNotice('Restauration terminée.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Fichier invalide.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePushToggle() {
    setBusy('push');
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
      } else {
        const result = await enablePush();
        setPushOn(result === 'granted');
        if (result === 'denied') setNotice('Notifications refusées par le navigateur.');
        if (result === 'unsupported') setNotice('Notifications non supportées sur cet appareil.');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Échec de l’activation.');
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.replace('/login');
  }

  return (
    <>
      <AppHeader title="Paramètres" />
      <main className="page-enter space-y-4 p-4 pb-28">
        {/* Profil */}
        <section className="card space-y-3">
          <h2 className="section-title">Profil</h2>
          <div>
            <label htmlFor="username" className="label">Nom</label>
            <input
              id="username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <p className="meta">{email}</p>
          <button onClick={saveProfile} className="btn-ghost" disabled={busy === 'profile'}>
            Enregistrer le profil
          </button>
          {profileMsg && <p className="text-xs text-go">{profileMsg}</p>}
        </section>

        {/* Totaux globaux étendus */}
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Totaux globaux</h2>
            <StreakBadge days={streak} />
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Temps total" value={formatDurationLong(totals.totalSec)} />
            <Stat label="Cette semaine" value={formatDurationLong(totals.weekSec)} />
            <Stat label="Ce mois" value={formatDurationLong(totals.monthSec)} />
            <Stat label="Sessions chrono" value={String(totals.totalSessions)} />
            <Stat label="Activités validées" value={String(totals.totalCompletions)} />
            <Stat label="Streak record" value={`${totals.bestStreak} j`} />
          </dl>
          {totals.perProject.length > 0 && (
            <div>
              <h3 className="label mt-2">Par projet</h3>
              <ul className="space-y-1">
                {totals.perProject.map(({ project, seconds, completions }) => (
                  <li key={project.id} className="flex justify-between text-sm">
                    <span className="truncate text-ink">{project.title}</span>
                    <span className="meta shrink-0">
                      {formatDurationLong(seconds)} · {completions} faites
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Notifications push */}
        <section className="card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBell width={20} height={20} className="text-ink" />
            <div>
              <p className="text-sm font-medium text-ink">Notifications push</p>
              <p className="meta">Rappels d’activités et d’échéances, app fermée.</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={pushOn}
            onClick={handlePushToggle}
            disabled={busy === 'push' || !pushSupported()}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-page ${
              pushOn ? 'bg-ink' : 'bg-line'
            } disabled:opacity-40`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all duration-page ${
                pushOn ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </section>

        {/* Gestion des citations */}
        <section className="card space-y-3">
          <h2 className="section-title">Citations ({data.quotes.length})</h2>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {data.quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-mist">
                  <span className="text-ink">{q.author}</span> — {q.text}
                </span>
                <button
                  className="shrink-0 text-xs text-miss"
                  onClick={async () => {
                    await getSupabase().from('quotes').delete().eq('id', q.id);
                    await data.refresh();
                  }}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Export / import JSON */}
        <section className="card space-y-3">
          <h2 className="section-title">Sauvegarde</h2>
          <p className="meta">
            Export JSON complet (activités, projets, sessions, completions, citations).
            Recommandé : 1 fois/mois.
          </p>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-ghost flex-1" disabled={busy === 'export'}>
              <span className="inline-flex items-center gap-2">
                <IconDownload width={16} height={16} />
                Exporter
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost flex-1"
              disabled={busy === 'import'}
            >
              <span className="inline-flex items-center gap-2">
                <IconUpload width={16} height={16} />
                Restaurer
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </section>

        {/* Archives : restauration */}
        <section className="card space-y-3">
          <h2 className="section-title">Archives</h2>
          <ArchiveList
            activities={data.activities}
            projects={data.projects}
            superProjects={data.superProjects}
            onChange={() => void data.refresh()}
          />
        </section>

        {notice && <p className="text-center text-sm text-mist">{notice}</p>}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="btn-ghost w-full border-miss/40 text-miss"
        >
          <span className="inline-flex items-center gap-2">
            <IconLogout width={16} height={16} />
            Déconnexion
          </span>
        </button>
      </main>
      <BottomNav />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3">
      <dd className="text-lg font-semibold tabular-nums text-ink">{value}</dd>
      <dt className="meta">{label}</dt>
    </div>
  );
}
