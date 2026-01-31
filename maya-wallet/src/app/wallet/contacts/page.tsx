'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  UserPlus,
  MagnifyingGlass,
  Star,
  Pencil,
  Trash,
  User
} from 'phosphor-react';
import { getContacts, addContact, deleteContact, type Contact } from '@/services/contacts';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    address: '', 
    notes: '', 
    category: 'other' as const 
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    setContacts(getContacts());
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.address) {
      addContact({
        name: newContact.name,
        address: newContact.address,
        category: newContact.category,
        favorite: false,
        notes: newContact.notes || undefined,
      });
      setNewContact({ name: '', address: '', notes: '', category: 'other' });
      setShowAddModal(false);
      loadContacts();
    }
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('Delete this contact?')) {
      deleteContact(id);
      loadContacts();
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">Contacts</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" weight="bold" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-700/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Add Contact Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <UserPlus size={24} weight="bold" />
          Add New Contact
        </button>

        {/* Contacts List */}
        <div className="space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <User size={64} className="mx-auto text-gray-300 mb-4" weight="thin" />
              <p className="text-gray-500 font-medium">
                {search ? 'No contacts found' : 'No contacts yet'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {search ? 'Try a different search term' : 'Add contacts for quick payments'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-caribbean-400 to-caribbean-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{contact.name}</h3>
                        {contact.favorite && (
                          <Star size={16} className="text-yellow-500" weight="fill" />
                        )}
                      </div>
                      <p className="text-gray-500 text-sm font-mono truncate">{contact.address}</p>
                      {contact.notes && (
                        <p className="text-gray-400 text-xs mt-1">{contact.notes}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {contact.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => router.push(`/send?to=${contact.address}&name=${contact.name}`)}
                      className="p-2 text-caribbean-400 hover:bg-caribbean-50 rounded-lg transition-colors"
                    >
                      <Pencil size={20} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-red-600 hover:bg-red-500/100/10 rounded-lg transition-colors"
                    >
                      <Trash size={20} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address *</label>
                <input
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Note (Optional)</label>
                <input
                  type="text"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="e.g., Friend, Landlord, Supplier..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewContact({ name: '', address: '', notes: '', category: 'other' });
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-300 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!newContact.name || !newContact.address}
                className="flex-1 py-3 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
