'use client';

// SYSTEM — Bannière d'installation « Ajouter System à l'écran d'accueil »
// (Doc 1 §7). Capture l'événement beforeinstallprompt et propose l'installation.

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne pas reproposer si déjà refusé récemment (7 jours)
    const dismissedAt = localStorage.getItem('system-install-dismissed');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 86_400_000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  async function install() {
    await deferred!.prompt();
    const { outcome } = await deferred!.userChoice;
    if (outcome === 'accepted') setVisible(false);
  }

  function dismiss() {
    localStorage.setItem('system-install-dismissed', String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="card flex items-center justify-between gap-3 border-ink">
      <p className="text-sm font-medium text-ink">Ajouter System à l’écran d’accueil</p>
      <div className="flex shrink-0 gap-2">
        <button onClick={install} className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-paper min-h-[36px]">
          Installer
        </button>
        <button onClick={dismiss} className="rounded-lg px-3 py-2 text-xs text-mist min-h-[36px]">
          Plus tard
        </button>
      </div>
    </div>
  );
}
