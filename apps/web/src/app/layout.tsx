import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Bola Alta Comunidade',
  description: 'Organize as peladas de vôlei da turma: presença, vagas e rateio.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bola Alta',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B1120',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AppProviders>
          {children}
          <ServiceWorkerRegister />
        </AppProviders>
      </body>
    </html>
  );
}
