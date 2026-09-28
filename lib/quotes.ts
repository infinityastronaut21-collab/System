// SYSTEM — Citations : rotation quotidienne déterministe (Document 5, §2)
//
// index_du_jour = jour_de_l_année mod nombre_de_citations
// citation = quotes triées par (author, text), prise à la position index.
// Même résultat que la fonction SQL quote_of_the_day(), calculé côté client
// pour fonctionner hors connexion (cache PWA).

import type { Quote } from './types';
import { dayOfYear } from './dates';

export function quoteOfTheDay(quotes: Quote[], date: Date = new Date()): Quote | null {
  if (quotes.length === 0) return null;
  const sorted = [...quotes].sort(
    (a, b) => a.author.localeCompare(b.author, 'fr') || a.text.localeCompare(b.text, 'fr')
  );
  const index = dayOfYear(date) % sorted.length;
  return sorted[index];
}

/** Liste des auteurs présents dans la base, triés (chips de filtre). */
export function quoteAuthors(quotes: Quote[]): string[] {
  return Array.from(new Set(quotes.map((q) => q.author))).sort((a, b) => a.localeCompare(b, 'fr'));
}
