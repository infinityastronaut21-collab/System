'use client';

// SYSTEM — Formulaire super-projet (Doc 1 §2.3) : regroupement thématique
// de projets (ex. « École », « Business »).

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { SuperProject } from '@/lib/types';

export default function SuperProjectForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: SuperProject | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setDescription(initial.description ?? '');
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

      const payload = { title: title.trim(), description: description.trim() || null };

      if (initial) {
        const { error } = await supabase
          .from('super_projects')
          .update(payload)
          .eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('super_projects')
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
        <label htmlFor="sp-title" className="label">Titre</label>
        <input
          id="sp-title"
          className="field"
          required
          autoFocus
          placeholder="Ex. École, Business…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="sp-desc" className="label">Description</label>
        <textarea
          id="sp-desc"
          rows={2}
          className="field resize-y"
          placeholder="Thème du regroupement…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
