'use client';

// SYSTEM — Ligne d'activité (Doc 4 §6.1/§6.2) : titre, métadonnées,
// contrôle adapté au type (case, chrono, compteur).

import type { Activity, Completion, Project, Session } from '@/lib/types';
import ChronoButton from './ChronoButton';
import CheckToggle from './CheckToggle';
import CountButton from './CountButton';
import { formatDurationLong } from '@/lib/dates';

const TYPE_LABEL = { chrono: 'Chrono', count: 'Count', check: 'Check' } as const;

export default function ActivityRow({
  activity,
  completion,
  openSession,
  projects,
  onChange,
  missed = false,
}: {
  activity: Activity;
  completion: Completion | null;
  openSession: Session | null;
  projects: Project[];
  onChange: () => void;
  /** Activité manquée d'hier : ligne grisée, non cliquable (Doc 4 §6.1) */
  missed?: boolean;
}) {
  const project = projects.find((p) => p.id === activity.project_id);

  const meta: string[] = [TYPE_LABEL[activity.type]];
  if (activity.type === 'count' && activity.target_value)
    meta.push(`objectif ${activity.target_value}`);
  if (activity.type === 'chrono' && activity.target_duration)
    meta.push(`objectif ${formatDurationLong(activity.target_duration)}`);
  if (project) meta.push(project.title);
  if (activity.difficulty) meta.push('●'.repeat(activity.difficulty));

  return (
    <div
      className={`card flex items-center justify-between gap-3 ${
        missed ? 'border-dashed opacity-60' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            missed ? 'text-mist line-through' : 'text-ink'
          }`}
        >
          {activity.title}
        </p>
        <p className="meta mt-0.5 truncate">
          {missed ? <span className="font-medium text-miss">manquée</span> : meta.join(' · ')}
        </p>
      </div>

      {!missed && (
        <>
          {activity.type === 'check' && (
            <CheckToggle activity={activity} completion={completion} onChange={onChange} />
          )}
          {activity.type === 'count' && (
            <CountButton activity={activity} completion={completion} onChange={onChange} />
          )}
          {activity.type === 'chrono' && (
            <ChronoButton activity={activity} openSession={openSession} onChange={onChange} />
          )}
        </>
      )}
    </div>
  );
}
