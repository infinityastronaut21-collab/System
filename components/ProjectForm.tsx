'use client';

// SYSTEM — Formulaire projet (Doc 1 §2.2) : titre, description, super-projet,
// dates, échéance + rappel d'échéance automatique (toujours activé, X jours).

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Project, SuperProject } from '@/lib/types';

export default function ProjectForm({
  initial,
  superProjects,
  onSaved,
  onCancel,
}: {
  initial: Project | null;
  superProjects: SuperProject[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [superProjectId, setSuperProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reminderDays, setReminderDays] = useState('3');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setDescription(initial.description ?? '');
    setSuperProjectId(initial.super_project_id ?? '');
    setStartDate(initial.start_date ?? '');
    setDeadline(initial.deadline ?? '');
    setReminderDays(String(initial.reminder_days ?? 3));
  }, [initial]);

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
        description: description.trim() || null,
        super_project_id: superProjectId || null,
        start_date: startDate || null,
        deadline: deadline || null,
        reminder_days: Math.max(0, parseInt(reminderDays || '3', 10)),
      };

      if (initial) {
        const { error } = await supabase.from('projects').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({ ...payload, user_id: user.id, status: 'active' });
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
        <label htmlFor="p-title" className="label">Titre</label>
        <input
          id="p-title"
          className="field"
          required
          autoFocus
          placeholder="Ex. Refonte du portfolio"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="p-desc" className="label">Description</label>
        <textarea
          id="p-desc"
          rows={2}
          className="field resize-y"
          placeholder="But du projet…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="p-super" className="label">Super-projet</label>
        <select
          id="p-super"
          className="field"
          value={superProjectId}
          onChange={(e) => setSuperProjectId(e.target.value)}
        >
          <option value="">Aucun</option>
          {superProjects
            .filter((s) => !s.archived)
            .map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-start" className="label">Début</label>
          <input
            id="p-start"
            type="date"
            className="field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="p-deadline" className="label">Échéance</label>
          <input
            id="p-deadline"
            type="date"
            className="field"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      {/* Rappel d'échéance automatique — toujours activé (Doc 1 §4) */}
      <div>
        <label htmlFor="p-reminder" className="label">
          Rappel d’échéance <span className="text-fog">(automatique, toujours actif)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="p-reminder"
            type="number"
            min={0}
            className="field w-24"
            value={reminderDays}
            onChange={(e) => setReminderDays(e.target.value)}
          />
          <span className="text-sm text-mist">jours avant la deadline</span>
        </div>
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
