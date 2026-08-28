import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BottomNavigation } from '@/components/BottomNavigation';
import { AppHeader } from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Maya Wallet - Your Belizean Digital Wallet',
  description: 'Simple, secure, and easy way to manage your money in Belize',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Maya Wallet',
  },
};

export const viewport: Viewport = {
  themeColor: '#0066CC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) { r.unregister(); }
                  }).catch(function() {});
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var k of keys) { caches.delete(k); }
                  }).catch(function() {});
                }
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <AppHeader />
          {children}
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}
