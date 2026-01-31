'use client';

import { useState } from 'react';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/navigation/Header';
import { CommandPalette } from '@/components/navigation/CommandPalette';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          </div>
        </Providers>
      </body>
    </html>
  );
}

