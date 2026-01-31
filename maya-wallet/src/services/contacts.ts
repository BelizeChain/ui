// Contact Book Service
import { walletLogger } from '@belizechain/shared';

export interface Contact {
  id: string;
  name: string;
  address: string;
  nickname?: string;
  avatar?: string;
  category: 'family' | 'friend' | 'business' | 'other';
  favorite: boolean;
  notes?: string;
  addedAt: Date;
  lastUsed?: Date;
  transactionCount: number;
}

const CONTACTS_STORAGE_KEY = 'maya-contacts';

// Get all contacts
export function getContacts(): Contact[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!stored) return [];
    
    const contacts = JSON.parse(stored);
    // Convert date strings back to Date objects
    return contacts.map((c: any) => ({
      ...c,
      addedAt: new Date(c.addedAt),
      lastUsed: c.lastUsed ? new Date(c.lastUsed) : undefined,
    }));
  } catch (error) {
    walletLogger.error('Failed to load contacts', error);
    return [];
  }
}

// Add new contact
export function addContact(contact: Omit<Contact, 'id' | 'addedAt' | 'transactionCount'>): Contact {
  const contacts = getContacts();
  
  // Check if address already exists
  if (contacts.some(c => c.address === contact.address)) {
    throw new Error('Contact with this address already exists');
  }
  
  const newContact: Contact = {
    ...contact,
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    addedAt: new Date(),
    transactionCount: 0,
  };
  
  contacts.push(newContact);
  saveContacts(contacts);
  
  walletLogger.info('Contact added', { name: newContact.name, address: newContact.address });
  return newContact;
}

// Update contact
export function updateContact(id: string, updates: Partial<Contact>): Contact {
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Contact not found');
  }
  
  contacts[index] = { ...contacts[index], ...updates };
  saveContacts(contacts);
  
  walletLogger.info('Contact updated', { id });
  return contacts[index];
}

// Delete contact
export function deleteContact(id: string): void {
  const contacts = getContacts();
  const filtered = contacts.filter(c => c.id !== id);
  
  if (filtered.length === contacts.length) {
    throw new Error('Contact not found');
  }
  
  saveContacts(filtered);
  walletLogger.info('Contact deleted', { id });
}

// Get contact by address
export function getContactByAddress(address: string): Contact | undefined {
  const contacts = getContacts();
  return contacts.find(c => c.address === address);
}

// Update transaction count and last used
export function recordContactTransaction(address: string): void {
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.address === address);
  
  if (index !== -1) {
    contacts[index].transactionCount += 1;
    contacts[index].lastUsed = new Date();
    saveContacts(contacts);
  }
}

// Get frequent contacts
export function getFrequentContacts(limit: number = 5): Contact[] {
  const contacts = getContacts();
  return contacts
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, limit);
}

// Get favorite contacts
export function getFavoriteContacts(): Contact[] {
  const contacts = getContacts();
  return contacts.filter(c => c.favorite);
}

// Search contacts
export function searchContacts(query: string): Contact[] {
  const contacts = getContacts();
  const lowerQuery = query.toLowerCase();
  
  return contacts.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.nickname?.toLowerCase().includes(lowerQuery) ||
    c.address.toLowerCase().includes(lowerQuery) ||
    c.notes?.toLowerCase().includes(lowerQuery)
  );
}

// Save contacts to localStorage
function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    walletLogger.error('Failed to save contacts', error);
    throw new Error('Failed to save contacts');
  }
}

// Export contacts as JSON
export function exportContacts(): string {
  const contacts = getContacts();
  return JSON.stringify(contacts, null, 2);
}

// Import contacts from JSON
export function importContacts(jsonData: string): number {
  try {
    const imported = JSON.parse(jsonData) as Contact[];
    const existing = getContacts();
    
    let addedCount = 0;
    
    for (const contact of imported) {
      // Skip if address already exists
      if (!existing.some(c => c.address === contact.address)) {
        existing.push({
          ...contact,
          id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date(contact.addedAt),
          lastUsed: contact.lastUsed ? new Date(contact.lastUsed) : undefined,
        });
        addedCount++;
      }
    }
    
    saveContacts(existing);
    walletLogger.info('Contacts imported', { count: addedCount });
    
    return addedCount;
  } catch (error) {
    walletLogger.error('Failed to import contacts', error);
    throw new Error('Invalid contact data');
  }
}
