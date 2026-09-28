import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  applicationName: 'System',
  title: { default: 'System', template: '%s — System' },
  description: 'Suivi personnel d’activités et de projets.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'System',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#141414',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* Colonne centrée max 480 px — esprit application (Doc 4 §8) */}
        <div className="mx-auto min-h-dvh w-full max-w-app border-x border-line bg-paper">
          {children}
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
