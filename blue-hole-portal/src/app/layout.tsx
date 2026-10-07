import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { LoginGate } from '@/components/LoginGate';
import { readSession } from '@/lib/auth/session';

const inter = Inter({ subsets: ['latin'] });

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

