'use client';

// SYSTEM — Enregistrement du service worker au démarrage (Doc 1 §7)

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/notifications';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  return null;
}
