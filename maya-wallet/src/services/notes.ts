// Transaction Notes Service
// Extends blockchain.ts with note/memo functionality

import { walletLogger } from '@belizechain/shared';

export interface TransactionNote {
  txHash: string;
  note: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
}

const TRANSACTION_NOTES_KEY = 'maya-transaction-notes';
const MAX_NOTE_LENGTH = 500;

// Get all transaction notes
export function getTransactionNotes(): TransactionNote[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(TRANSACTION_NOTES_KEY);
    if (!stored) return [];
    
    const notes = JSON.parse(stored);
    return notes.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));
  } catch (error) {
    walletLogger.error('Failed to load transaction notes', error);
    return [];
  }
}

// Get note for specific transaction
export function getTransactionNote(txHash: string): TransactionNote | null {
  const notes = getTransactionNotes();
  return notes.find(n => n.txHash === txHash) || null;
}

// Add note to transaction
export function addTransactionNote(
  txHash: string,
  note: string,
  category?: string,
  tags?: string[]
): TransactionNote {
  // Validate note length
  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds maximum length of ${MAX_NOTE_LENGTH} characters`);
  }
  
  const notes = getTransactionNotes();
  
  // Check if note already exists
  const existingIndex = notes.findIndex(n => n.txHash === txHash);
  
  const newNote: TransactionNote = {
    txHash,
    note: note.trim(),
    category,
    tags: tags?.map(t => t.trim().toLowerCase()),
    createdAt: new Date(),
  };
  
  if (existingIndex >= 0) {
    // Update existing note
    notes[existingIndex] = newNote;
  } else {
    // Add new note
    notes.push(newNote);
  }
  
  saveTransactionNotes(notes);
  
  walletLogger.info('Transaction note added', { txHash, hasCategory: !!category, tagCount: tags?.length || 0 });
  return newNote;
}

// Update transaction note
export function updateTransactionNote(
  txHash: string,
  updates: Partial<Omit<TransactionNote, 'txHash' | 'createdAt'>>
): TransactionNote {
  const notes = getTransactionNotes();
  const index = notes.findIndex(n => n.txHash === txHash);
  
  if (index === -1) {
    throw new Error('Transaction note not found');
  }
  
  // Validate note length if updating note
  if (updates.note && updates.note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds maximum length of ${MAX_NOTE_LENGTH} characters`);
  }
  
  notes[index] = { 
    ...notes[index], 
    ...updates,
    tags: updates.tags?.map(t => t.trim().toLowerCase()),
  };
  
  saveTransactionNotes(notes);
  
  walletLogger.info('Transaction note updated', { txHash });
  return notes[index];
}

// Delete transaction note
export function deleteTransactionNote(txHash: string): void {
  const notes = getTransactionNotes();
  const filtered = notes.filter(n => n.txHash !== txHash);
  
  if (filtered.length === notes.length) {
    throw new Error('Transaction note not found');
  }
  
  saveTransactionNotes(filtered);
  walletLogger.info('Transaction note deleted', { txHash });
}

// Search notes by text
export function searchTransactionNotes(query: string): TransactionNote[] {
  const notes = getTransactionNotes();
  const lowerQuery = query.toLowerCase();
  
  return notes.filter(n => 
    n.note.toLowerCase().includes(lowerQuery) ||
    n.category?.toLowerCase().includes(lowerQuery) ||
    n.tags?.some(t => t.includes(lowerQuery))
  );
}

// Get notes by category
export function getNotesByCategory(category: string): TransactionNote[] {
  const notes = getTransactionNotes();
  return notes.filter(n => n.category?.toLowerCase() === category.toLowerCase());
}

// Get notes by tag
export function getNotesByTag(tag: string): TransactionNote[] {
  const notes = getTransactionNotes();
  const lowerTag = tag.toLowerCase();
  return notes.filter(n => n.tags?.includes(lowerTag));
}

// Get all unique categories
export function getAllCategories(): string[] {
  const notes = getTransactionNotes();
  const categories = notes
    .map(n => n.category)
    .filter((c): c is string => !!c);
  return Array.from(new Set(categories));
}

// Get all unique tags
export function getAllTags(): string[] {
  const notes = getTransactionNotes();
  const tags = notes.flatMap(n => n.tags || []);
  return Array.from(new Set(tags));
}

// Common categories for auto-suggestions
export const SUGGESTED_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent',
  'Transportation',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Dining',
  'Savings',
  'Investment',
  'Transfer',
  'Payment',
  'Gift',
  'Other',
];

// Common tags for auto-suggestions
export const SUGGESTED_TAGS = [
  'personal',
  'business',
  'family',
  'emergency',
  'recurring',
  'one-time',
  'reimbursement',
  'tax-deductible',
];

// Export notes as JSON
export function exportNotes(): string {
  const notes = getTransactionNotes();
  return JSON.stringify(notes, null, 2);
}

// Import notes from JSON
export function importNotes(jsonData: string): number {
  try {
    const imported = JSON.parse(jsonData);
    
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected array of notes');
    }
    
    const existingNotes = getTransactionNotes();
    
    // Merge imported notes (imported notes overwrite existing ones with same txHash)
    const merged = [...existingNotes];
    let importedCount = 0;
    
    for (const note of imported) {
      if (!note.txHash || !note.note) continue;
      
      const existingIndex = merged.findIndex(n => n.txHash === note.txHash);
      
      const parsedNote: TransactionNote = {
        txHash: note.txHash,
        note: note.note,
        category: note.category,
        tags: note.tags,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
      };
      
      if (existingIndex >= 0) {
        merged[existingIndex] = parsedNote;
      } else {
        merged.push(parsedNote);
      }
      
      importedCount++;
    }
    
    saveTransactionNotes(merged);
    
    walletLogger.info('Transaction notes imported', { count: importedCount });
    return importedCount;
  } catch (error) {
    walletLogger.error('Failed to import transaction notes', error);
    throw new Error('Failed to import notes: Invalid JSON format');
  }
}

// Save transaction notes to localStorage
function saveTransactionNotes(notes: TransactionNote[]): void {
  try {
    localStorage.setItem(TRANSACTION_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    walletLogger.error('Failed to save transaction notes', error);
    throw new Error('Failed to save transaction notes');
  }
}

// Utility: Attach note to transaction before sending
// This should be called from the send payment flow
export function prepareTransactionWithNote(note: string, category?: string, tags?: string[]): {
  note: string;
  category?: string;
  tags?: string[];
} {
  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds maximum length of ${MAX_NOTE_LENGTH} characters`);
  }
  
  return {
    note: note.trim(),
    category,
    tags: tags?.map(t => t.trim().toLowerCase()),
  };
}

// Utility: Get note statistics
export function getNoteStatistics(): {
  totalNotes: number;
  categorizedNotes: number;
  taggedNotes: number;
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
} {
  const notes = getTransactionNotes();
  
  const categoryCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  
  let categorizedNotes = 0;
  let taggedNotes = 0;
  
  for (const note of notes) {
    if (note.category) {
      categorizedNotes++;
      categoryCounts[note.category] = (categoryCounts[note.category] || 0) + 1;
    }
    
    if (note.tags && note.tags.length > 0) {
      taggedNotes++;
      for (const tag of note.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }
  
  return {
    totalNotes: notes.length,
    categorizedNotes,
    taggedNotes,
    categoryCounts,
    tagCounts,
  };
}
