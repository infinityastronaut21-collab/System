'use client';

// SYSTEM — Citations (Doc 4 §6.5, Doc 5 §6) : citation du jour en haut,
// filtre par auteur (chips), liste complète, ajout de citations.

import { useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import EmptyState from '@/components/EmptyState';
import QuoteCard from '@/components/QuoteCard';
import { IconClose, IconPlus } from '@/components/Icons';
import { quoteAuthors, quoteOfTheDay } from '@/lib/quotes';
import { getSupabase } from '@/lib/supabase';
import { useSystemData } from '@/lib/useData';

export default function CitationsPage() {
  const data = useSystemData();
  const [author, setAuthor] = useState<string>('Tous');
  const [adding, setAdding] = useState(false);

  const quote = useMemo(() => quoteOfTheDay(data.quotes), [data.quotes]);
  const authors = useMemo(() => quoteAuthors(data.quotes), [data.quotes]);

  const filtered = useMemo(() => {
    const sorted = [...data.quotes].sort(
      (a, b) => a.author.localeCompare(b.author, 'fr') || a.text.localeCompare(b.text, 'fr')
    );
    return author === 'Tous' ? sorted : sorted.filter((q) => q.author === author);
  }, [data.quotes, author]);

  return (
    <>
      <AppHeader title="Citations" />
      <main className="page-enter space-y-4 p-4 pb-28">
        {/* Citation du jour */}
        {quote && (
          <section className="card" aria-label="Citation du jour">
            <QuoteCard quote={quote} />
          </section>
        )}

        {/* Filtre par auteur : chips */}
        <div className="flex flex-wrap gap-2">
          {['Tous', ...authors].map((a) => (
            <button
              key={a}
              className={`chip ${author === a ? 'chip-active' : ''}`}
              onClick={() => setAuthor(a)}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Liste des citations */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Aucune citation"
            hint="Ajoute ta première citation avec le bouton ci-dessous."
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((q) => (
              <li key={q.id} className="card">
                <QuoteCard quote={q} />
              </li>
            ))}
          </ul>
        )}

        <button onClick={() => setAdding(true)} className="btn-primary">
          <span className="inline-flex items-center gap-2">
            <IconPlus width={16} height={16} />
            Ajouter une citation
          </span>
        </button>
      </main>
      <BottomNav />

      {adding && (
        <QuoteForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            void data.refresh();
          }}
        />
      )}
    </>
  );
}

/** Formulaire d'ajout : texte + auteur + source optionnelle (Doc 5 §6). */
function QuoteForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !author.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await getSupabase()
        .from('quotes')
        .insert({ text: text.trim(), author: author.trim(), source: source.trim() || null });
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative w-full max-w-app rounded-t-2xl border border-line bg-paper p-4 sm:rounded-2xl">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-mist"
        >
          <IconClose width={18} height={18} />
        </button>
        <h2 className="section-title mb-4">Ajouter une citation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="q-text" className="label">Texte</label>
            <textarea
              id="q-text"
              rows={3}
              required
              autoFocus
              className="field resize-y"
              placeholder="« … »"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="q-author" className="label">Auteur</label>
            <input
              id="q-author"
              required
              className="field"
              placeholder="Ex. Sun Tzu"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="q-source" className="label">Source (optionnel)</label>
            <input
              id="q-source"
              className="field"
              placeholder="Ex. L’Art de la guerre, III"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-miss">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
