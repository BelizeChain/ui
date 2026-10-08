'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui';
import Link from 'next/link';
import { getContacts, type Contact } from '@/services/contacts';
import {
  ArrowLeft,
  UserList,
  MagnifyingGlass,
  Plus,
  Star,
  StarFour,
  CheckCircle,
  PaperPlaneTilt,
} from 'phosphor-react';

/** Row shape this screen renders, derived from a stored contact. */
interface ContactRow {
  id: string;
  name: string;
  address: string;
  avatar: string;
  favorite: boolean;
  lastSeen: string;
  lastUsed?: Date;
  verified: boolean;
}

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Two-letter initials for the avatar bubble. */
function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return letters.toUpperCase() || '?';
}

function describeLastUsed(lastUsed?: Date): string {
  if (!lastUsed) return 'Not used yet';
  const seconds = Math.floor((Date.now() - new Date(lastUsed).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Adapt a stored contact to the row this screen renders.
 *
 * `verified` is always false — the contact record carries no verification field,
 * and this list previously asserted "verified" for eight invented people at
 * addresses that were not even valid SS58.
 */
function toContactRow(contact: Contact): ContactRow {
  return {
    id: contact.id,
    name: contact.nickname || contact.name,
    address: contact.address,
    avatar: initialsOf(contact.name),
    favorite: contact.favorite,
    lastSeen: describeLastUsed(contact.lastUsed),
    lastUsed: contact.lastUsed,
    verified: false,
  };
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [contacts, setContacts] = useState<ContactRow[]>([]);

  // Contacts are stored in local storage, so they can only be read on the client.
  useEffect(() => {
    setContacts(getContacts().map(toContactRow));
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = contact.name.toLowerCase().includes(query) ||
                         contact.address.toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'all' ||
                         (activeFilter === 'favorites' && contact.favorite) ||
                         (activeFilter === 'recent' &&
                           !!contact.lastUsed &&
                           Date.now() - new Date(contact.lastUsed).getTime() < RECENT_WINDOW_MS);
    return matchesSearch && matchesFilter;
  });

  const gradients = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-red-400',
    'from-indigo-500 to-purple-400',
    'from-amber-500 to-orange-400',
    'from-teal-500 to-cyan-400',
    'from-rose-500 to-pink-400'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-300" weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Contacts</h1>
              <p className="text-xs text-gray-400">{contacts.length} connections</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-emerald-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
            <Plus size={24} className="text-white" weight="bold" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 backdrop-blur-sm border border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 gap-2 pb-2">
          {[
            { id: 'all', label: 'All', count: contacts.length },
            { id: 'favorites', label: 'Favorites', count: contacts.filter(c => c.favorite).length },
            { id: 'recent', label: 'Recent', count: contacts.filter(c => c.lastUsed && Date.now() - new Date(c.lastUsed).getTime() < RECENT_WINDOW_MS).length }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeFilter === filter.id
                  ? 'bg-forest-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredContacts.length === 0 ? (
          <GlassCard variant="dark" blur="md" className="p-8 text-center">
            <UserList size={48} className="text-gray-300 mx-auto mb-3" weight="fill" />
            <p className="text-gray-400 font-medium">No contacts found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </GlassCard>
        ) : (
          filteredContacts.map((contact, index) => (
            <GlassCard key={index} variant="dark" blur="sm" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-white font-bold shadow-md`}>
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{contact.name}</h3>
                      {contact.verified && (
                        <CheckCircle size={16} className="text-blue-500" weight="fill" />
                      )}
                      {contact.favorite && (
                        <StarFour size={16} className="text-amber-500" weight="fill" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{contact.address}</p>
                    {/* Presence is not tracked, so no "Online" state is claimed. */}
                    <p className="text-xs mt-1 text-gray-400">
                      {contact.lastUsed ? `Last used ${contact.lastSeen}` : 'No activity yet'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <PaperPlaneTilt size={20} className="text-forest-400" weight="fill" />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle favorite
                    }}
                  >
                    <Star size={20} className={contact.favorite ? 'text-amber-500' : 'text-gray-400'} weight={contact.favorite ? 'fill' : 'regular'} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <GlassCard variant="gradient" blur="lg" className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{contacts.length}</p>
              <p className="text-xs text-white/80">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{contacts.filter(c => c.favorite).length}</p>
              <p className="text-xs text-white/80">Favorites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{contacts.filter(c => c.verified).length}</p>
              <p className="text-xs text-white/80">Verified</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
