// Budget Tracking Service
import { walletLogger } from '@belizechain/shared';
import type { Transaction } from './blockchain';

export interface BudgetCategory {
  id: string;
  name: string;
  icon?: string;
  color: string;
  monthlyLimit: number;
  currency: 'DALLA' | 'bBZD';
  spent: number;
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
  active: boolean;
}

export interface BudgetAlert {
  id: string;
  categoryId: string;
  categoryName: string;
  type: 'warning' | 'exceeded';
  threshold: number;
  currentSpent: number;
  limit: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  categories: BudgetCategory[];
  totalLimit: { dalla: number; bbzd: number };
  totalSpent: { dalla: number; bbzd: number };
}

const BUDGET_CATEGORIES_KEY = 'maya-budget-categories';
const BUDGET_ALERTS_KEY = 'maya-budget-alerts';
const BUDGET_HISTORY_KEY = 'maya-budget-history';

// Default budget categories
const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'id' | 'spent'>[] = [
  { name: 'Groceries', color: '#10b981', monthlyLimit: 500, currency: 'DALLA', alertThreshold: 80, active: true },
  { name: 'Utilities', color: '#3b82f6', monthlyLimit: 200, currency: 'DALLA', alertThreshold: 90, active: true },
  { name: 'Transportation', color: '#f59e0b', monthlyLimit: 150, currency: 'DALLA', alertThreshold: 80, active: true },
  { name: 'Entertainment', color: '#ec4899', monthlyLimit: 100, currency: 'DALLA', alertThreshold: 75, active: true },
  { name: 'Healthcare', color: '#ef4444', monthlyLimit: 300, currency: 'DALLA', alertThreshold: 90, active: true },
];

// Get budget categories
export function getBudgetCategories(): BudgetCategory[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(BUDGET_CATEGORIES_KEY);
    if (!stored) {
      // Initialize with defaults
      const defaults = DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `budget-cat-${Date.now()}-${index}`,
        spent: 0,
      }));
      saveBudgetCategories(defaults);
      return defaults;
    }
    
    return JSON.parse(stored);
  } catch (error) {
    walletLogger.error('Failed to load budget categories', error);
    return [];
  }
}

// Add budget category
export function addBudgetCategory(
  category: Omit<BudgetCategory, 'id' | 'spent'>
): BudgetCategory {
  const categories = getBudgetCategories();
  
  const newCategory: BudgetCategory = {
    ...category,
    id: `budget-cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    spent: 0,
  };
  
  categories.push(newCategory);
  saveBudgetCategories(categories);
  
  walletLogger.info('Budget category added', { name: newCategory.name });
  return newCategory;
}

// Update budget category
export function updateBudgetCategory(id: string, updates: Partial<BudgetCategory>): void {
  const categories = getBudgetCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Budget category not found');
  }
  
  categories[index] = { ...categories[index], ...updates };
  saveBudgetCategories(categories);
  
  walletLogger.info('Budget category updated', { id });
}

// Delete budget category
export function deleteBudgetCategory(id: string): void {
  const categories = getBudgetCategories();
  const filtered = categories.filter(c => c.id !== id);
  
  if (filtered.length === categories.length) {
    throw new Error('Budget category not found');
  }
  
  saveBudgetCategories(filtered);
  walletLogger.info('Budget category deleted', { id });
}

// Record spending for category
export function recordSpending(categoryId: string, amount: number): void {
  const categories = getBudgetCategories();
  const category = categories.find(c => c.id === categoryId);
  
  if (!category) {
    throw new Error('Budget category not found');
  }
  
  const previousSpent = category.spent;
  category.spent += amount;
  saveBudgetCategories(categories);
  
  // Check for alerts
  checkBudgetAlert(category, previousSpent);
  
  walletLogger.info('Spending recorded', { categoryId, amount });
}

// Check and create budget alert if threshold exceeded
function checkBudgetAlert(category: BudgetCategory, previousSpent: number): void {
  if (!category.active) return;
  
  const previousPercentage = (previousSpent / category.monthlyLimit) * 100;
  const currentPercentage = (category.spent / category.monthlyLimit) * 100;
  
  // Warning alert (threshold reached)
  if (previousPercentage < category.alertThreshold && currentPercentage >= category.alertThreshold) {
    createBudgetAlert({
      categoryId: category.id,
      categoryName: category.name,
      type: 'warning',
      threshold: category.alertThreshold,
      currentSpent: category.spent,
      limit: category.monthlyLimit,
    });
  }
  
  // Exceeded alert (100% reached)
  if (previousPercentage < 100 && currentPercentage >= 100) {
    createBudgetAlert({
      categoryId: category.id,
      categoryName: category.name,
      type: 'exceeded',
      threshold: 100,
      currentSpent: category.spent,
      limit: category.monthlyLimit,
    });
  }
}

// Create budget alert
function createBudgetAlert(
  alert: Omit<BudgetAlert, 'id' | 'timestamp' | 'acknowledged'>
): void {
  const alerts = getBudgetAlerts();
  
  const newAlert: BudgetAlert = {
    ...alert,
    id: `budget-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    acknowledged: false,
  };
  
  alerts.push(newAlert);
  saveBudgetAlerts(alerts);
  
  walletLogger.info('Budget alert created', { type: alert.type, category: alert.categoryName });
}

// Get budget alerts
export function getBudgetAlerts(): BudgetAlert[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(BUDGET_ALERTS_KEY);
    if (!stored) return [];
    
    const alerts = JSON.parse(stored);
    return alerts.map((a: any) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  } catch (error) {
    walletLogger.error('Failed to load budget alerts', error);
    return [];
  }
}

// Acknowledge budget alert
export function acknowledgeBudgetAlert(id: string): void {
  const alerts = getBudgetAlerts();
  const alert = alerts.find(a => a.id === id);
  
  if (!alert) return;
  
  alert.acknowledged = true;
  saveBudgetAlerts(alerts);
  
  walletLogger.info('Budget alert acknowledged', { id });
}

// Clear all acknowledged alerts
export function clearAcknowledgedAlerts(): void {
  const alerts = getBudgetAlerts();
  const unacknowledged = alerts.filter(a => !a.acknowledged);
  saveBudgetAlerts(unacknowledged);
  
  walletLogger.info('Acknowledged alerts cleared');
}

// Get unacknowledged alerts count
export function getUnacknowledgedAlertsCount(): number {
  const alerts = getBudgetAlerts();
  return alerts.filter(a => !a.acknowledged).length;
}

// Reset monthly budgets (call at start of new month)
export function resetMonthlyBudgets(): void {
  const categories = getBudgetCategories();
  
  // Save current month's data to history
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyBudget: MonthlyBudget = {
    month: currentMonth,
    categories: JSON.parse(JSON.stringify(categories)),
    totalLimit: getTotalLimits(),
    totalSpent: getTotalSpent(),
  };
  
  saveBudgetHistory(monthlyBudget);
  
  // Reset all spent amounts
  categories.forEach(cat => cat.spent = 0);
  saveBudgetCategories(categories);
  
  // Clear old alerts
  saveBudgetAlerts([]);
  
  walletLogger.info('Monthly budgets reset', { month: currentMonth });
}

// Get total limits across all categories
export function getTotalLimits(): { dalla: number; bbzd: number } {
  const categories = getBudgetCategories().filter(c => c.active);
  
  return categories.reduce(
    (totals, cat) => {
      if (cat.currency === 'DALLA') {
        totals.dalla += cat.monthlyLimit;
      } else {
        totals.bbzd += cat.monthlyLimit;
      }
      return totals;
    },
    { dalla: 0, bbzd: 0 }
  );
}

// Get total spent across all categories
export function getTotalSpent(): { dalla: number; bbzd: number } {
  const categories = getBudgetCategories().filter(c => c.active);
  
  return categories.reduce(
    (totals, cat) => {
      if (cat.currency === 'DALLA') {
        totals.dalla += cat.spent;
      } else {
        totals.bbzd += cat.spent;
      }
      return totals;
    },
    { dalla: 0, bbzd: 0 }
  );
}

// Get budget history
export function getBudgetHistory(): MonthlyBudget[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(BUDGET_HISTORY_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored);
  } catch (error) {
    walletLogger.error('Failed to load budget history', error);
    return [];
  }
}

// Save budget history
function saveBudgetHistory(monthlyBudget: MonthlyBudget): void {
  try {
    const history = getBudgetHistory();
    
    // Replace if month already exists, otherwise add
    const existingIndex = history.findIndex(h => h.month === monthlyBudget.month);
    if (existingIndex >= 0) {
      history[existingIndex] = monthlyBudget;
    } else {
      history.push(monthlyBudget);
    }
    
    // Keep only last 12 months
    const sorted = history.sort((a, b) => b.month.localeCompare(a.month));
    const trimmed = sorted.slice(0, 12);
    
    localStorage.setItem(BUDGET_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    walletLogger.error('Failed to save budget history', error);
  }
}

// Save budget categories
function saveBudgetCategories(categories: BudgetCategory[]): void {
  try {
    localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    walletLogger.error('Failed to save budget categories', error);
    throw new Error('Failed to save budget categories');
  }
}

// Save budget alerts
function saveBudgetAlerts(alerts: BudgetAlert[]): void {
  try {
    localStorage.setItem(BUDGET_ALERTS_KEY, JSON.stringify(alerts));
  } catch (error) {
    walletLogger.error('Failed to save budget alerts', error);
  }
}

/**
 * Update budget spending from blockchain transactions
 * Call this periodically or after transactions to keep budgets in sync
 */
export async function updateBudgetFromTransactions(address: string): Promise<void> {
  try {
    const { fetchTransactionHistory } = await import('./blockchain');
    
    // Get transactions for current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Fetch recent transactions
    const transactions = await fetchTransactionHistory(address, 500);
    
    // Filter for current month and sent transactions
    const monthlySpending = transactions.filter(tx => 
      tx.type === 'send' && tx.timestamp >= monthStart
    );
    
    // Calculate total spending by currency
    const spending = {
      DALLA: 0,
      bBZD: 0,
    };
    
    monthlySpending.forEach(tx => {
      const amount = parseFloat(tx.amount);
      if (!isNaN(amount)) {
        spending[tx.currency] += amount;
      }
    });
    
    // Update categories with spending (distribute proportionally for now)
    // In production, you'd categorize each transaction
    const categories = getBudgetCategories();
    const activeCategories = categories.filter(c => c.active);
    
    if (activeCategories.length > 0) {
      activeCategories.forEach(category => {
        const totalSpent = spending[category.currency];
        // Simple equal distribution - in production, use AI categorization
        category.spent = totalSpent / activeCategories.filter(c => c.currency === category.currency).length;
      });
      
      saveBudgetCategories(categories);
      
      // Check alerts for each category
      activeCategories.forEach(category => {
        checkBudgetAlert(category, 0);
      });
      
      walletLogger.info('Budget updated from blockchain', { 
        month: currentMonth, 
        spending,
        transactionCount: monthlySpending.length 
      });
    }
  } catch (error) {
    walletLogger.error('Failed to update budget from transactions', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}
