// Recurring Payments Service
import { walletLogger } from '@belizechain/shared';
import type { Transaction } from './blockchain';

export interface RecurringPayment {
  id: string;
  name: string;
  recipientAddress: string;
  recipientName?: string;
  amount: number;
  currency: 'DALLA' | 'bBZD';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: Date;
  nextPaymentDate: Date;
  endDate?: Date;
  active: boolean;
  category: 'rent' | 'utilities' | 'subscription' | 'loan' | 'savings' | 'other';
  notes?: string;
  createdAt: Date;
  lastPaymentDate?: Date;
  totalPayments: number;
  failedPayments: number;
}

const RECURRING_PAYMENTS_KEY = 'maya-recurring-payments';

// Get all recurring payments
export function getRecurringPayments(): RecurringPayment[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(RECURRING_PAYMENTS_KEY);
    if (!stored) return [];
    
    const payments = JSON.parse(stored);
    return payments.map((p: any) => ({
      ...p,
      startDate: new Date(p.startDate),
      nextPaymentDate: new Date(p.nextPaymentDate),
      endDate: p.endDate ? new Date(p.endDate) : undefined,
      createdAt: new Date(p.createdAt),
      lastPaymentDate: p.lastPaymentDate ? new Date(p.lastPaymentDate) : undefined,
    }));
  } catch (error) {
    walletLogger.error('Failed to load recurring payments', error);
    return [];
  }
}

// Add new recurring payment
export function addRecurringPayment(
  payment: Omit<RecurringPayment, 'id' | 'createdAt' | 'nextPaymentDate' | 'totalPayments' | 'failedPayments'>
): RecurringPayment {
  const payments = getRecurringPayments();
  
  const newPayment: RecurringPayment = {
    ...payment,
    id: `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    nextPaymentDate: calculateNextPaymentDate(payment.startDate, payment.frequency),
    totalPayments: 0,
    failedPayments: 0,
  };
  
  payments.push(newPayment);
  saveRecurringPayments(payments);
  
  walletLogger.info('Recurring payment added', { name: newPayment.name, frequency: newPayment.frequency });
  return newPayment;
}

// Update recurring payment
export function updateRecurringPayment(id: string, updates: Partial<RecurringPayment>): RecurringPayment {
  const payments = getRecurringPayments();
  const index = payments.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Recurring payment not found');
  }
  
  payments[index] = { ...payments[index], ...updates };
  saveRecurringPayments(payments);
  
  walletLogger.info('Recurring payment updated', { id });
  return payments[index];
}

// Delete recurring payment
export function deleteRecurringPayment(id: string): void {
  const payments = getRecurringPayments();
  const filtered = payments.filter(p => p.id !== id);
  
  if (filtered.length === payments.length) {
    throw new Error('Recurring payment not found');
  }
  
  saveRecurringPayments(filtered);
  walletLogger.info('Recurring payment deleted', { id });
}

// Toggle recurring payment active status
export function toggleRecurringPayment(id: string): void {
  const payments = getRecurringPayments();
  const payment = payments.find(p => p.id === id);
  
  if (!payment) {
    throw new Error('Recurring payment not found');
  }
  
  payment.active = !payment.active;
  saveRecurringPayments(payments);
  
  walletLogger.info('Recurring payment toggled', { id, active: payment.active });
}

// Get payments due soon (within next 7 days)
export function getPaymentsDueSoon(): RecurringPayment[] {
  const payments = getRecurringPayments();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return payments.filter(p => 
    p.active && 
    p.nextPaymentDate >= now && 
    p.nextPaymentDate <= sevenDaysFromNow
  );
}

// Get payments due today
export function getPaymentsDueToday(): RecurringPayment[] {
  const payments = getRecurringPayments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  return payments.filter(p => 
    p.active && 
    p.nextPaymentDate >= today && 
    p.nextPaymentDate < tomorrow
  );
}

// Record payment execution
export function recordPaymentExecution(id: string, success: boolean): void {
  const payments = getRecurringPayments();
  const payment = payments.find(p => p.id === id);
  
  if (!payment) return;
  
  if (success) {
    payment.totalPayments += 1;
    payment.lastPaymentDate = new Date();
    payment.nextPaymentDate = calculateNextPaymentDate(new Date(), payment.frequency);
    
    // Check if end date reached
    if (payment.endDate && payment.nextPaymentDate > payment.endDate) {
      payment.active = false;
    }
  } else {
    payment.failedPayments += 1;
  }
  
  saveRecurringPayments(payments);
  walletLogger.info('Payment execution recorded', { id, success });
}

// Calculate next payment date
function calculateNextPaymentDate(fromDate: Date, frequency: RecurringPayment['frequency']): Date {
  const next = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

// Get total monthly commitment
export function getMonthlyCommitment(): { dalla: number; bbzd: number } {
  const payments = getRecurringPayments().filter(p => p.active);
  
  let dalla = 0;
  let bbzd = 0;
  
  for (const payment of payments) {
    // Convert to monthly amount
    let monthlyAmount = payment.amount;
    
    switch (payment.frequency) {
      case 'daily':
        monthlyAmount *= 30;
        break;
      case 'weekly':
        monthlyAmount *= 4.33;
        break;
      case 'biweekly':
        monthlyAmount *= 2.17;
        break;
      case 'yearly':
        monthlyAmount /= 12;
        break;
    }
    
    if (payment.currency === 'DALLA') {
      dalla += monthlyAmount;
    } else {
      bbzd += monthlyAmount;
    }
  }
  
  return { dalla, bbzd };
}

/**
 * Execute a recurring payment on the blockchain
 * Should be called automatically based on nextPaymentDate
 */
export async function executeRecurringPayment(
  paymentId: string,
  fromAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const payments = getRecurringPayments();
  const payment = payments.find(p => p.id === paymentId);
  
  if (!payment) {
    return { success: false, error: 'Payment not found' };
  }
  
  if (!payment.active) {
    return { success: false, error: 'Payment is paused' };
  }
  
  try {
    // Import blockchain service
    const { submitTransfer } = await import('./blockchain');
    
    // Execute the transfer
    const result = await submitTransfer(
      fromAddress,
      payment.recipientAddress,
      payment.amount.toString(),
      payment.currency.toLowerCase() as 'dalla' | 'bBZD'
    );
    
    // Update payment record
    payment.lastPaymentDate = new Date();
    payment.totalPayments += 1;
    payment.nextPaymentDate = calculateNextPaymentDate(new Date(), payment.frequency);
    
    // Check if payment should end
    if (payment.endDate && payment.nextPaymentDate > payment.endDate) {
      payment.active = false;
    }
    
    saveRecurringPayments(payments);
    
    walletLogger.info('Recurring payment executed', {
      id: paymentId,
      amount: payment.amount,
      currency: payment.currency,
      txHash: result.hash,
    });
    
    return { success: true, txHash: result.hash };
  } catch (error) {
    // Update failed payments count
    payment.failedPayments += 1;
    saveRecurringPayments(payments);
    
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    walletLogger.error('Recurring payment failed', {
      id: paymentId,
      error: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Check for due payments and return those ready to execute
 */
export function getDuePayments(): RecurringPayment[] {
  const payments = getRecurringPayments();
  const now = new Date();
  
  return payments.filter(p => 
    p.active && 
    p.nextPaymentDate <= now &&
    (!p.endDate || p.endDate > now)
  );
}

// Save recurring payments to localStorage
function saveRecurringPayments(payments: RecurringPayment[]): void {
  try {
    localStorage.setItem(RECURRING_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (error) {
    walletLogger.error('Failed to save recurring payments', error);
    throw new Error('Failed to save recurring payments');
  }
}
