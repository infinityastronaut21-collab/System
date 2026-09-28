'use client';

// SYSTEM — Work (Doc 4 §6.2) : recherche pleine largeur, filtres (projet,
// type, tag), liste des activités et projets, bouton « + » (choix du niveau),
// détail projet (anneau %, activités, échéance, ajout rapide).

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ActivityForm from '@/components/ActivityForm';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import EmptyState from '@/components/EmptyState';
import ProjectForm from '@/components/ProjectForm';
import ProgressRing from '@/components/ProgressRing';
import SuperProjectForm from '@/components/SuperProjectForm';
import {
  IconArchive,
  IconChevronRight,
  IconClose,
  IconEdit,
  IconPlus,
} from '@/components/Icons';
import { archiveActivity, archiveProject, archiveSuperProject } from '@/lib/actions';
import { getSupabase } from '@/lib/supabase';
import { completionMap, projectProgress, superProjectProgress } from '@/lib/stats';
import { useSystemData } from '@/lib/useData';
import type { Activity, Project, SuperProject } from '@/lib/types';

type Level = 'activity' | 'project' | 'super';
type Sheet =
  | { kind: 'chooser' }
  | { kind: Level; editing: Activity | Project | SuperProject | null }
  | { kind: 'project-detail'; project: Project }
  | null;

const TYPE_LABEL = { chrono: 'Chrono', count: 'Count', check: 'Check' } as const;

function WorkContent() {
  const data = useSystemData();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTag, setFilterTag] = useState('');
  // ?create=1 (bouton « + » de la navigation) ouvre le choix du niveau
  const [sheet, setSheet] = useState<Sheet>(
    searchParams.get('create') === '1' ? { kind: 'chooser' } : null
  );

  const cmap = useMemo(() => completionMap(data.completions), [data.completions]);

  const allTags = useMemo(
    () => Array.from(new Set(data.activities.flatMap((a) => a.tags ?? []))).sort(),
    [data.activities]
  );

  const visibleActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.activities.filter((a) => {
      if (a.archived) return false;
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (filterProject && a.project_id !== filterProject) return false;
      if (filterType && a.type !== filterType) return false;
      if (filterTag && !(a.tags ?? []).includes(filterTag)) return false;
      return true;
    });
  }, [data.activities, search, filterProject, filterType, filterTag]);

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.projects.filter((p) => {
      if (p.status === 'archive') return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.projects, search]);

  const visibleSuperProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.superProjects.filter(
      (s) => !s.archived && (!q || s.title.toLowerCase().includes(q))
    );
  }, [data.superProjects, search]);

  const activitiesByProject = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of data.activities) {
      if (!a.project_id) continue;
      map.set(a.project_id, [...(map.get(a.project_id) ?? []), a]);
    }
    return map;
  }, [data.activities]);

  async function handleArchive(target: Activity | Project | SuperProject, kind: Level) {
    if (kind === 'activity') await archiveActivity(target.id);
    else if (kind === 'project') await archiveProject(target.id);
    else await archiveSuperProject(target.id);
    await data.refresh();
  }

  const hasFilters = filterProject || filterType || filterTag;

  return (
    <>
      <AppHeader title="Work" />
      <main className="page-enter space-y-4 p-4 pb-28">
        {/* Barre de recherche pleine largeur */}
        <input
          type="search"
          className="field"
          placeholder="Rechercher…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filtres : projet, type, tag */}
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filtrer par projet"
            className="chip appearance-none pr-6"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">Projet : tous</option>
            {visibleProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select
            aria-label="Filtrer par type"
            className="chip appearance-none pr-6"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Type : tous</option>
            <option value="chrono">Chrono</option>
            <option value="count">Count</option>
            <option value="check">Check</option>
          </select>
          {allTags.length > 0 && (
            <select
              aria-label="Filtrer par tag"
              className="chip appearance-none pr-6"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="">Tag : tous</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          {hasFilters && (
            <button
              className="chip"
              onClick={() => {
                setFilterProject('');
                setFilterType('');
                setFilterTag('');
              }}
            >
              Réinitialiser ×
            </button>
          )}
        </div>

        {/* Super-projets */}
        {visibleSuperProjects.length > 0 && (
          <section>
            <h2 className="section-title mb-2">Super-projets</h2>
            <ul className="space-y-2">
              {visibleSuperProjects.map((s) => {
                const children = visibleProjects.filter((p) => p.super_project_id === s.id);
                const prog = superProjectProgress(children, activitiesByProject, cmap);
                return (
                  <li key={s.id} className="card group flex items-center gap-3">
                    <ProgressRing pct={prog.pct} size={44} stroke={4} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                      <p className="meta">
                        {children.length} projet{children.length > 1 ? 's' : ''} · {prog.done}/{prog.total} activités
                      </p>
                    </div>
                    <RowActions
                      onEdit={() => setSheet({ kind: 'super', editing: s })}
                      onArchive={() => handleArchive(s, 'super')}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Projets */}
        {visibleProjects.length > 0 && (
          <section>
            <h2 className="section-title mb-2">Projets</h2>
            <ul className="space-y-2">
              {visibleProjects.map((p) => {
                const prog = projectProgress(activitiesByProject.get(p.id) ?? [], cmap);
                return (
                  <li key={p.id} className="card group flex items-center gap-3">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setSheet({ kind: 'project-detail', project: p })}
                    >
                      <ProgressRing pct={prog.pct} size={44} stroke={4} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                        <p className="meta">
                          {prog.done}/{prog.total} activités
                          {p.deadline && ` · échéance ${p.deadline}`}
                        </p>
                      </div>
                      <IconChevronRight width={16} height={16} className="shrink-0 text-fog" />
                    </button>
                    <RowActions
                      onEdit={() => setSheet({ kind: 'project', editing: p })}
                      onArchive={() => handleArchive(p, 'project')}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Activités */}
        <section>
          <h2 className="section-title mb-2">Activités</h2>
          {visibleActivities.length === 0 ? (
            <EmptyState
              title="Aucune activité"
              hint="Appuie sur + pour créer ta première activité."
            />
          ) : (
            <ul className="space-y-2">
              {visibleActivities.map((a) => {
                const project = data.projects.find((p) => p.id === a.project_id);
                return (
                  <li key={a.id} className="card group flex items-center gap-3">
                    {/* Vignette carrée : type */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-[10px] font-bold uppercase text-mist">
                      {a.type.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                      <p className="meta truncate">
                        {TYPE_LABEL[a.type]}
                        {a.type === 'count' && a.target_value ? ` · objectif ${a.target_value}` : ''}
                        {project ? ` · ${project.title}` : ' · libre'}
                        {a.recurrence !== 'none' ? ` · ${a.recurrence}` : ''}
                      </p>
                    </div>
                    <RowActions
                      onEdit={() => setSheet({ kind: 'activity', editing: a })}
                      onArchive={() => handleArchive(a, 'activity')}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />

      {/* Feuille modale */}
      {sheet && (
        <Sheet onClose={() => setSheet(null)}>
          {sheet.kind === 'chooser' && (
            <div className="space-y-2">
              <h2 className="section-title mb-3">Créer</h2>
              {(
                [
                  { kind: 'activity', label: 'Activité', hint: 'Chrono, count ou check' },
                  { kind: 'project', label: 'Projet', hint: 'Suite d’activités vers un but' },
                  { kind: 'super', label: 'Super-projet', hint: 'Regroupement de projets' },
                ] as const
              ).map((o) => (
                <button
                  key={o.kind}
                  onClick={() => setSheet({ kind: o.kind, editing: null })}
                  className="card flex w-full items-center justify-between text-left transition-colors duration-page hover:bg-card"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{o.label}</p>
                    <p className="meta">{o.hint}</p>
                  </div>
                  <IconChevronRight width={16} height={16} className="text-fog" />
                </button>
              ))}
            </div>
          )}

          {sheet?.kind === 'activity' && (
            <>
              <h2 className="section-title mb-4">
                {sheet.editing ? 'Modifier l’activité' : 'Nouvelle activité'}
              </h2>
              <ActivityForm
                initial={sheet.editing as Activity | null}
                projects={data.projects}
                onSaved={() => {
                  setSheet(null);
                  void data.refresh();
                }}
                onCancel={() => setSheet(null)}
              />
            </>
          )}

          {sheet?.kind === 'project' && (
            <>
              <h2 className="section-title mb-4">
                {sheet.editing ? 'Modifier le projet' : 'Nouveau projet'}
              </h2>
              <ProjectForm
                initial={sheet.editing as Project | null}
                superProjects={data.superProjects}
                onSaved={() => {
                  setSheet(null);
                  void data.refresh();
                }}
                onCancel={() => setSheet(null)}
              />
            </>
          )}

          {sheet?.kind === 'super' && (
            <>
              <h2 className="section-title mb-4">
                {sheet.editing ? 'Modifier le super-projet' : 'Nouveau super-projet'}
              </h2>
              <SuperProjectForm
                initial={sheet.editing as SuperProject | null}
                onSaved={() => {
                  setSheet(null);
                  void data.refresh();
                }}
                onCancel={() => setSheet(null)}
              />
            </>
          )}

          {/* Détail projet : anneau %, activités, échéance, ajout rapide */}
          {sheet?.kind === 'project-detail' && (
            <ProjectDetail
              project={sheet.project}
              data={data}
              onEditActivity={(a) => setSheet({ kind: 'activity', editing: a })}
              onClose={() => setSheet(null)}
            />
          )}
        </Sheet>
      )}
    </>
  );
}

/** Actions édit / archiver révélées au survol (PC), toujours visibles au tactile. */
function RowActions({ onEdit, onArchive }: { onEdit: () => void; onArchive: () => void }) {
  return (
    <div className="flex shrink-0 gap-1 opacity-100 transition-opacity duration-page sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
      <button
        onClick={onEdit}
        aria-label="Modifier"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-mist hover:bg-card hover:text-ink"
      >
        <IconEdit width={18} height={18} />
      </button>
      <button
        onClick={onArchive}
        aria-label="Archiver"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-mist hover:bg-card hover:text-ink"
      >
        <IconArchive width={18} height={18} />
      </button>
    </div>
  );
}

/** Feuille modale mobile-first (bottom sheet). */
function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative max-h-[88dvh] w-full max-w-app overflow-y-auto rounded-t-2xl border border-line bg-paper p-4 sm:rounded-2xl">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-mist"
        >
          <IconClose width={18} height={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ProjectDetail({
  project,
  data,
  onEditActivity,
  onClose,
}: {
  project: Project;
  data: ReturnType<typeof useSystemData>;
  onEditActivity: (a: Activity) => void;
  onClose: () => void;
}) {
  const cmap = completionMap(data.completions);
  const acts = data.activities.filter((a) => a.project_id === project.id && !a.archived);
  const prog = projectProgress(acts, cmap);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing pct={prog.pct} size={72} stroke={7} />
        <div className="min-w-0">
          <h2 className="section-title">{project.title}</h2>
          <p className="meta">
            {prog.done} / {prog.total} activités
            {project.deadline && ` · échéance ${project.deadline}`}
          </p>
          {project.description && (
            <p className="mt-1 text-xs text-mist">{project.description}</p>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {acts.length === 0 && (
          <p className="text-sm text-fog">Aucune activité — ajoute la première étape.</p>
        )}
        {acts.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => onEditActivity(a)}
              className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left transition-colors duration-page hover:bg-card"
            >
              <span className="truncate text-sm text-ink">{a.title}</span>
              <span className="meta shrink-0">{a.type}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Ajout rapide d'une activité au projet */}
      <QuickAdd projectId={project.id} onSaved={data.refresh} />

      <button onClick={onClose} className="btn-ghost w-full">Fermer</button>
    </div>
  );
}

/** Ajout rapide : titre + type, le reste par défaut (Doc 1 §5 « ajout rapide »). */
function QuickAdd({ projectId, onSaved }: { projectId: string; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('activities').insert({
        user_id: user.id,
        project_id: projectId,
        title: title.trim(),
        type: 'check',
      });
      setTitle('');
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="field"
        placeholder="Ajout rapide d’une activité…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
      />
      <button onClick={add} disabled={busy} className="btn-ghost shrink-0" aria-label="Ajouter l’activité">
        <IconPlus width={18} height={18} />
      </button>
    </div>
  );
}

export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <>
          <AppHeader title="Work" />
          <main className="p-4">
            <p className="text-sm text-fog">Chargement…</p>
          </main>
        </>
      }
    >
      <WorkContent />
    </Suspense>
  );
}
