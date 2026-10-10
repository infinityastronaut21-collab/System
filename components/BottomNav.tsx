'use client';

// SYSTEM — Navigation basse : 4 colonnes (Accueil · Work · + · Progress).
// AVANT : bouton « + » positionné en absolute au centre → recouvrait le lien
// « Work » (icône invisible + zone de clic en conflit).

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
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-4">
        <Tab href={ITEMS[0].href} label={ITEMS[0].label} Icon={ITEMS[0].Icon} active={pathname === '/'} />
        <Tab href={ITEMS[1].href} label={ITEMS[1].label} Icon={ITEMS[1].Icon} active={pathname === '/work'} />

        {/* Bouton « + » : sa propre colonne, surélevé — aucun chevauchement */}
        <div className="flex items-start justify-center">
          <button
            onClick={() => router.push('/work?create=1')}
            aria-label="Ajouter : activité, projet ou super-projet"
            className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-transform duration-page hover:scale-105 active:scale-95"
          >
            <IconPlus width={24} height={24} />
          </button>
        </div>

        <Tab href={ITEMS[2].href} label={ITEMS[2].label} Icon={ITEMS[2].Icon} active={pathname === '/progress'} />
      </div>
    </nav>
  );
}

function Tab({ href, label, Icon, active }: { href: string; label: string; Icon: typeof IconHome; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-page ${active ? 'text-ink' : 'text-fog hover:text-mist'}`}
    >
      <Icon width={22} height={22} />
      {label}
    </Link>
  );
}