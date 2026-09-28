// SYSTEM — Manifeste PWA (Document 1 §7) : nom « System », thème noir,
// icônes 192/512, affichage standalone (sans barre du navigateur).

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'System',
    short_name: 'System',
    description: 'Suivi personnel d’activités et de projets.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#141414',
    background_color: '#141414', // splash noir
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
