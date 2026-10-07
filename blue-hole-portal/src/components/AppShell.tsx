'use client';

/**
 * The Portal's authenticated chrome — sidebar, header, command palette.
 *
 * Split out of the root layout so that layout can stay a server component and
 * read the session cookie. Everything here only renders once a session exists.
 */

import { useState } from 'react';
import { Providers } from '@/app/providers';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/navigation/Header';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { WalletConnectGuide } from '@/components/WalletConnectGuide';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="transition-all duration-300 lg:pl-64">
          {/* Header */}
          <Header
            sidebarCollapsed={false}
            onMobileMenuOpen={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Page Content */}
          <main className="min-h-screen pt-16">{children}</main>
        </div>

        {/* Command Palette (Cmd+K) */}
        <CommandPalette />

        {/* Wallet Connect Prompt overlay */}
        <WalletConnectGuide />
      </div>
    </Providers>
  );
}
