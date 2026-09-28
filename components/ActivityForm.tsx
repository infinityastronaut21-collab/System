'use client';

// SYSTEM — Formulaire activité (Doc 4 §6.3) : titre → type → champs
// conditionnels → difficulté 1–5 → récurrence → rappel push → projet lié →
// échéance → tags → notes → Enregistrer.

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Activity, ActivityType, Project, Recurrence } from '@/lib/types';
import { DifficultyDots, TypeSelector } from './FormControls';

const WEEKDAYS = [
  { d: 1, label: 'Lun' },
  { d: 2, label: 'Mar' },
  { d: 3, label: 'Mer' },
  { d: 4, label: 'Jeu' },
  { d: 5, label: 'Ven' },
  { d: 6, label: 'Sam' },
  { d: 0, label: 'Dim' },
];

const RECURRENCES: { id: Recurrence; label: string }[] = [
  { id: 'none', label: 'Aucune' },
  { id: 'daily', label: 'Quotidien' },
  { id: 'weekdays', label: 'Lun–Ven' },
  { id: 'weekly', label: 'Hebdo' },
  { id: 'custom', label: 'Personnalisé' },
];

export default function ActivityForm({
  initial,
  projects,
  defaultProjectId,
  onSaved,
  onCancel,
}: {
  initial: Activity | null;
  projects: Project[];
  defaultProjectId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('check');
  const [targetValue, setTargetValue] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState('');
  const [estimatedMin, setEstimatedMin] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      return;
    }
    setTitle(initial.title);
    setType(initial.type);
    setTargetValue(initial.target_value?.toString() ?? '');
    setTargetDurationMin(
      initial.target_duration ? String(Math.round(initial.target_duration / 60)) : ''
    );
    setEstimatedMin(
      initial.estimated_duration ? String(Math.round(initial.estimated_duration / 60)) : ''
    );
    setDifficulty(initial.difficulty ?? 3);
    setRecurrence(initial.recurrence);
    setRecurrenceDays(initial.recurrence_days ?? []);
    setReminderEnabled(!!initial.reminder_time);
    setReminderTime(initial.reminder_time?.slice(0, 5) ?? '18:00');
    setProjectId(initial.project_id ?? '');
    setDeadline(initial.deadline ?? '');
    setTags(initial.tags ?? []);
    setNotes(initial.notes ?? '');
  }, [initial, defaultProjectId]);

  function toggleDay(d: number) {
    setRecurrenceDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée.');

      const payload = {
        title: title.trim(),
        type,
        target_value: type === 'count' ? parseInt(targetValue || '1', 10) : null,
        target_duration:
          type === 'chrono' && targetDurationMin ? parseInt(targetDurationMin, 10) * 60 : null,
        estimated_duration: estimatedMin ? parseInt(estimatedMin, 10) * 60 : null,
        difficulty,
        recurrence,
        recurrence_days: recurrence === 'custom' ? recurrenceDays : null,
        reminder_time: reminderEnabled ? reminderTime : null,
        project_id: projectId || null,
        deadline: deadline || null,
        tags: tags.length ? tags : null,
        notes: notes.trim() || null,
      };

      if (initial) {
        const { error } = await supabase.from('activities').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activities')
          .insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="label">Titre</label>
        <input
          id="title"
          className="field"
          required
          autoFocus
          placeholder="Ex. 30 pompes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <span className="label">Type</span>
        <TypeSelector value={type} onChange={setType} />
      </div>

      {/* Champs conditionnels selon le type */}
      {type === 'count' && (
        <div>
          <label htmlFor="target" className="label">Objectif (répétitions)</label>
          <input
            id="target"
            type="number"
            min={1}
            className="field"
            placeholder="30"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
        </div>
      )}
      {type === 'chrono' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="targetDuration" className="label">Objectif (min)</label>
            <input
              id="targetDuration"
              type="number"
              min={1}
              className="field"
              placeholder="45"
              value={targetDurationMin}
              onChange={(e) => setTargetDurationMin(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="estimated" className="label">Estimation (min)</label>
            <input
              id="estimated"
              type="number"
              min={1}
              className="field"
              placeholder="60"
              value={estimatedMin}
              onChange={(e) => setEstimatedMin(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <span className="label">Difficulté</span>
        <DifficultyDots value={difficulty} onChange={setDifficulty} />
      </div>

      <div>
        <span className="label">Récurrence</span>
        <div className="flex flex-wrap gap-2">
          {RECURRENCES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRecurrence(r.id)}
              className={`chip ${recurrence === r.id ? 'chip-active' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {recurrence === 'custom' && (
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map(({ d, label }) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`chip ${recurrenceDays.includes(d) ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label mb-0">Rappel push</span>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-page ${
              reminderEnabled ? 'bg-ink' : 'bg-line'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all duration-page ${
                reminderEnabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        {reminderEnabled && (
          <input
            type="time"
            aria-label="Heure du rappel"
            className="field mt-2"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="project" className="label">Projet lié</label>
          <select
            id="project"
            className="field"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Libre (sans projet)</option>
            {projects
              .filter((p) => p.status === 'active')
              .map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="deadline" className="label">Échéance</label>
          <input
            id="deadline"
            type="date"
            className="field"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="label">Tags</label>
        <div className="flex gap-2">
          <input
            id="tags"
            className="field"
            placeholder="Ajouter un tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button type="button" onClick={addTag} className="btn-ghost shrink-0">+</button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="chip"
                title="Retirer"
              >
                {t} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea
          id="notes"
          rows={3}
          className="field resize-y"
          placeholder="Détails, contexte…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-miss">{error}</p>}

      <div className="flex gap-2 pb-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost shrink-0">
          Annuler
        </button>
      </div>
    </form>
  );
}
