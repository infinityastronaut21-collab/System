'use client';

// SYSTEM — Navigation basse (Doc 4 §5) : 3 icônes (Accueil, Work, Progress)
// + bouton « + » flottant circulaire noir au centre.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconPlus, IconProgress, IconWork } from './Icons';

const ITEMS = [
  { href: '/', label: 'Accueil', Icon: IconHome },
  { href: '/work', label: 'Work', Icon: IconWork },
  { href: '/progress', label: 'Progress', Icon: IconProgress },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-line bg-paper"
      aria-label="Navigation principale"
    >
      <div className="relative grid grid-cols-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5
                text-[11px] font-medium transition-colors duration-page ${
                  active ? 'text-ink' : 'text-fog hover:text-mist'
                }`}
            >
              <Icon width={22} height={22} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Bouton « + » flottant circulaire noir — création (Doc 1 §3) */}
      <button
        onClick={() => router.push('/work?create=1')}
        aria-label="Ajouter : activité, projet ou super-projet"
        className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center
          justify-center rounded-full bg-ink text-paper shadow-lg transition-transform
          duration-page active:scale-95"
      >
        <IconPlus width={24} height={24} />
      </button>
    </nav>
  );
}
