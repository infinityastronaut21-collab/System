'use client';

// SYSTEM — Tiroir gauche (Doc 4 §5) : avatar + « Infinity », items de
// navigation, Paramètres en bas.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconClose,
  IconHome,
  IconProgress,
  IconQuote,
  IconSettings,
  IconWork,
} from './Icons';

const ITEMS = [
  { href: '/', label: 'Accueil', Icon: IconHome },
  { href: '/work', label: 'Work', Icon: IconWork },
  { href: '/progress', label: 'Progress', Icon: IconProgress },
  { href: '/citations', label: 'Citations', Icon: IconQuote },
];

export default function Drawer({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Voile */}
      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity duration-page ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      {/* Tiroir */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-paper shadow-xl
          transition-transform duration-page ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
              {username.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-[15px] font-semibold text-ink">{username}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-mist"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 p-2">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium
                  transition-colors duration-page ${
                    active ? 'bg-card text-ink' : 'text-mist hover:bg-card hover:text-ink'
                  }`}
              >
                <Icon width={20} height={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-2">
          <Link
            href="/settings"
            onClick={onClose}
            className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium
              transition-colors duration-page ${
                pathname === '/settings' ? 'bg-card text-ink' : 'text-mist hover:bg-card hover:text-ink'
              }`}
          >
            <IconSettings width={20} height={20} />
            Paramètres
          </Link>
        </div>
      </aside>
    </>
  );
}
