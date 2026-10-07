import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { LoginGate } from '@/components/LoginGate';
import { readSession } from '@/lib/auth/session';

const inter = Inter({ subsets: ['latin'] });

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
 * This is the authorization boundary for the whole Portal: when there is no
 * valid session the dashboard is never rendered at all, rather than rendered
 * and hidden client-side. Reading cookies makes every route dynamic, which is
 * what a gated app wants.
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
        <title>Blue Hole Portal - BelizeChain Government Dashboard</title>
        <meta
          name="description"
          content="Government administration portal for managing BelizeChain infrastructure"
        />
      </head>
      <body className={inter.className}>
        {session ? <AppShell>{children}</AppShell> : <LoginGate />}
      </body>
    </html>
  );
}

