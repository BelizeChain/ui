/**
 * Unit tests for the localStorage-backed budgeting service.
 * Runs in the node environment with a stubbed window/localStorage.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeBudgetAlert,
  addBudgetCategory,
  BUDGET_CATEGORIES_KEY,
  clearAcknowledgedAlerts,
  deleteBudgetCategory,
  getBudgetAlerts,
  getBudgetCategories,
  getTotalLimits,
  getTotalSpent,
  getUnacknowledgedAlertsCount,
  recordSpending,
  updateBudgetCategory,
} from './budgeting';

function makeStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => (entries.has(key) ? entries.get(key)! : null),
    setItem: (key: string, value: string) => void entries.set(key, String(value)),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    get length() {
      return entries.size;
    },
  } as Storage;
}

beforeEach(() => {
  const storage = makeStorage();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', { localStorage: storage });
});

describe('budgeting service', () => {
  it('seeds five default categories on first load and persists them', () => {
    const categories = getBudgetCategories();

    expect(categories).toHaveLength(5);
    expect(categories.map(c => c.name)).toEqual([
      'Groceries',
      'Utilities',
      'Transportation',
      'Entertainment',
      'Healthcare',
    ]);
    expect(categories.every(c => c.currency === 'DALLA' && c.spent === 0)).toBe(true);
    expect(JSON.parse(localStorage.getItem(BUDGET_CATEGORIES_KEY)!)).toHaveLength(5);
  });

  it('adds, updates, and deletes categories', () => {
    const added = addBudgetCategory({
      name: 'Duty Free',
      color: '#123456',
      monthlyLimit: 250,
      currency: 'bBZD',
      alertThreshold: 70,
      active: true,
    });

    expect(added.id).toMatch(/^budget-cat-/);
    expect(getBudgetCategories()).toHaveLength(6);

    updateBudgetCategory(added.id, { monthlyLimit: 300 });
    expect(getBudgetCategories().find(c => c.id === added.id)?.monthlyLimit).toBe(300);

    deleteBudgetCategory(added.id);
    expect(getBudgetCategories()).toHaveLength(5);
    expect(() => updateBudgetCategory('missing', { monthlyLimit: 1 })).toThrow(
      'Budget category not found'
    );
    expect(() => deleteBudgetCategory('missing')).toThrow('Budget category not found');
  });

  it('fires a warning at the threshold and an exceeded alert at 100%, without duplicates', () => {
    const groceries = getBudgetCategories().find(c => c.name === 'Groceries')!;

    // 400 of 500 with an 80% threshold crosses the warning line.
    recordSpending(groceries.id, 400);
    let alerts = getBudgetAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('warning');
    expect(alerts[0].currentSpent).toBe(400);

    // 100 more crosses 100% and fires only the exceeded alert.
    recordSpending(groceries.id, 100);
    alerts = getBudgetAlerts();
    expect(alerts.map(a => a.type)).toEqual(['warning', 'exceeded']);

    // Further spending stays over both thresholds with no new alerts.
    recordSpending(groceries.id, 50);
    expect(getBudgetAlerts()).toHaveLength(2);
    expect(getBudgetCategories().find(c => c.id === groceries.id)?.spent).toBe(550);
  });

  it('acknowledges and clears alerts', () => {
    const groceries = getBudgetCategories().find(c => c.name === 'Groceries')!;
    recordSpending(groceries.id, 500);

    const alerts = getBudgetAlerts();
    expect(alerts).toHaveLength(2);

    acknowledgeBudgetAlert(alerts[0].id);
    expect(getUnacknowledgedAlertsCount()).toBe(1);

    clearAcknowledgedAlerts();
    const remaining = getBudgetAlerts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].acknowledged).toBe(false);
    expect(remaining[0].timestamp).toBeInstanceOf(Date);
  });

  it('aggregates totals per currency and ignores inactive categories', () => {
    addBudgetCategory({
      name: 'Duty Free',
      color: '#123456',
      monthlyLimit: 100,
      currency: 'bBZD',
      alertThreshold: 80,
      active: true,
    });
    addBudgetCategory({
      name: 'Disabled',
      color: '#654321',
      monthlyLimit: 9999,
      currency: 'DALLA',
      alertThreshold: 80,
      active: false,
    });

    const groceries = getBudgetCategories().find(c => c.name === 'Groceries')!;
    const bbzd = getBudgetCategories().find(c => c.name === 'Duty Free')!;
    recordSpending(groceries.id, 500);
    recordSpending(bbzd.id, 25);

    expect(getTotalLimits()).toEqual({ dalla: 1250, bbzd: 100 });
    expect(getTotalSpent()).toEqual({ dalla: 500, bbzd: 25 });
  });
});
