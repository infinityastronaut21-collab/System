'use client';

// SYSTEM — Liste des archives avec restauration (Doc 1 §4 : jamais de
// suppression définitive ; Doc 4 §6.6 : Paramètres → Archives).

import {
  restoreActivity,
  restoreProject,
  restoreSuperProject,
} from '@/lib/actions';
import type { Activity, Project, SuperProject } from '@/lib/types';
import { IconRestore } from './Icons';

export default function ArchiveList({
  activities,
  projects,
  superProjects,
  onChange,
}: {
  activities: Activity[];
  projects: Project[];
  superProjects: SuperProject[];
  onChange: () => void;
}) {
  const archivedActivities = activities.filter((a) => a.archived);
  const archivedProjects = projects.filter((p) => p.status === 'archive');
  const archivedSuper = superProjects.filter((s) => s.archived);
  const empty =
    archivedActivities.length === 0 &&
    archivedProjects.length === 0 &&
    archivedSuper.length === 0;

  async function restore(kind: 'activity' | 'project' | 'super', id: string) {
    if (kind === 'activity') await restoreActivity(id);
    else if (kind === 'project') await restoreProject(id);
    else await restoreSuperProject(id);
    onChange();
  }

  if (empty) {
    return <p className="text-sm text-fog">Aucune archive — rien n’est jamais supprimé, tout se restaure ici.</p>;
  }

  return (
    <ul className="space-y-2">
      {archivedSuper.map((s) => (
        <ArchiveRow
          key={s.id}
          title={s.title}
          kind="Super-projet"
          onRestore={() => restore('super', s.id)}
        />
      ))}
      {archivedProjects.map((p) => (
        <ArchiveRow
          key={p.id}
          title={p.title}
          kind="Projet"
          onRestore={() => restore('project', p.id)}
        />
      ))}
      {archivedActivities.map((a) => (
        <ArchiveRow
          key={a.id}
          title={a.title}
          kind="Activité"
          onRestore={() => restore('activity', a.id)}
        />
      ))}
    </ul>
  );
}

function ArchiveRow({
  title,
  kind,
  onRestore,
}: {
  title: string;
  kind: string;
  onRestore: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-mist line-through">{title}</p>
        <p className="text-[11px] text-fog">{kind} archivé</p>
      </div>
      <button
        onClick={onRestore}
        className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink hover:bg-line/60"
      >
        <IconRestore width={16} height={16} />
        Restaurer
      </button>
    </li>
  );
}
