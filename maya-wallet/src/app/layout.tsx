import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BottomNavigation } from '@/components/BottomNavigation';
import { AppHeader } from '@/components/AppHeader';
import { LoginGate } from '@/components/LoginGate';
import { readSession } from '@/lib/auth/session';

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

/**
 * Force dynamic rendering — do NOT remove.
 *
 * Calling `cookies()` alone did not opt this route out of static generation. `/`
 * was prerendered at build time, when no cookie exists, so the frozen HTML
 * contained the login gate and was then served from cache (s-maxage=31536000) to
 * signed-in and anonymous visitors alike — both got an identical ETag. Sign-in
 * therefore succeeded, set a valid session, reloaded, and appeared to do
 * nothing.
 *
 * This also makes Next send `Cache-Control: private, no-cache, no-store`, which a
 * gated page requires so no browser or proxy can replay a previously rendered
 * response.
 */
export const dynamic = 'force-dynamic';

/**
 * Server component so the session cookie can be read here.
 *
 * The whole app is gated: without a valid session the wallet UI is never
 * rendered. Reading cookies makes every route dynamic, which is what a gated
 * app wants.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();

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
          {session ? (
            <>
              <AppHeader />
              {children}
              <BottomNavigation />
            </>
          ) : (
            <LoginGate />
          )}
        </Providers>
      </body>
    </html>
  );
}
