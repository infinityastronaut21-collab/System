'use client';

// SYSTEM — Carte de citation (Doc 4 §6.1) : italique, filet gris à gauche,
// auteur en dessous.

import type { Quote } from '@/lib/types';

export default function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <blockquote className="border-l-2 border-line pl-4">
      <p className="text-[15px] italic leading-relaxed text-ink">« {quote.text} »</p>
      <footer className="mt-2 text-xs text-mist">
        — {quote.author}
        {quote.source && <span className="text-fog">, {quote.source}</span>}
      </footer>
    </blockquote>
  );
}
