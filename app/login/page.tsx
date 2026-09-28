'use client';

// SYSTEM — Connexion par magic link (Document 3 §2)
// Aucun mot de passe : un lien de connexion est envoyé par email.

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’envoi du lien.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-enter flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <div className="mb-10 flex flex-col items-center">
          <Image src="/icons/icon-192.png" alt="System" width={72} height={72} priority />
          <h1 className="mt-4 text-xl font-semibold text-ink">System</h1>
          <p className="mt-1 text-sm text-mist">Suivi personnel d’activités et de projets.</p>
        </div>

        {sent ? (
          <div className="card text-center">
            <p className="text-sm font-medium text-ink">Lien envoyé.</p>
            <p className="mt-1 text-sm text-mist">
              Ouvre l’email reçu sur <span className="text-ink">{email}</span> et clique sur le
              lien de connexion. Le lien expire rapidement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ton@email.com"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-miss">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Envoi…' : 'Recevoir le lien de connexion'}
            </button>
            <p className="text-center text-xs text-fog">
              Aucun mot de passe — un lien magique te connecte.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
