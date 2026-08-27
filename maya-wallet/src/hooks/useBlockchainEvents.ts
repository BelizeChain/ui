'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDallaBalance } from '@/services/gem';

const DALLA_PLANCK = 1_000_000_000_000n;
const BALANCE_POLL_MS = 15_000;

function formatPlanck(raw: string): string {
  try {
    const n = BigInt(raw.replace(/,/g, ''));
    const whole = n / DALLA_PLANCK;
    const frac = n % DALLA_PLANCK;
    if (frac === 0n) return whole.toLocaleString();
    const fracStr = frac.toString().padStart(12, '0').slice(0, 4).replace(/0+$/, '');
    return fracStr ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
  } catch {
    return '0.00';
  }
}

import { initializeApi } from '@/services/blockchain';

/**
 * Subscribe to staking reward events for a given address.
 * Listens for `staking.Rewarded` and `belizeStaking.PoUWRewardPaid` events.
 */
const subscribeToStakingRewards = async (
  address: string,
  callback: (reward: { amount: string; era: number; type: 'Staking' | 'PoUW' }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        // Standard staking rewards
        if (api.events.staking?.Rewarded?.is(event)) {
          const [stash, amount] = event.data;
          if (stash.toString() === address) {
            callback({ amount: amount.toString(), era: 0, type: 'Staking' });
          }
        }
        // PoUW rewards (custom BelizeChain pallet)
        if (api.events.belizeStaking?.PoUWRewardPaid?.is(event)) {
          const [account, reward] = event.data;
          if (account.toString() === address) {
            callback({ amount: reward.toString(), era: 0, type: 'PoUW' });
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

/**
 * Subscribe to tourism cashback events for a given address.
 * Listens for `oracle.CashbackIssued` events.
 */
const subscribeToTourismCashback = async (
  address: string,
  callback: (cashback: { merchant: string; amountSpent: string; cashbackAmount: string; cashbackRate: number }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        if (api.events.oracle?.CashbackIssued?.is(event)) {
          const [account, merchant, spent, cashback, rate] = event.data;
          if (account.toString() === address) {
            callback({
              merchant: merchant.toString(),
              amountSpent: spent.toString(),
              cashbackAmount: cashback.toString(),
              cashbackRate: (rate as any).toNumber?.() / 10000 || 0.05,
            });
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

// Governance proposals subscription is implemented inline in useGovernanceProposalsSubscription
// using polling via getActiveProposals() — no stub needed here.

/**
 * Subscribe to compliance alerts for a given address.
 * Listens for `compliance.KYCStatusChanged`, `compliance.AccountRestricted` events.
 */
const subscribeToComplianceAlerts = async (
  address: string,
  callback: (alert: { type: 'KYCApproved' | 'KYCRejected' | 'LimitExceeded' | 'AccountFrozen'; message: string; timestamp: number }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        if (api.events.compliance?.KYCStatusChanged?.is(event)) {
          const [account, , newStatus] = event.data;
          if (account.toString() === address) {
            const status = newStatus.toString();
            callback({
              type: status === 'Verified' ? 'KYCApproved' : 'KYCRejected',
              message: `KYC status changed to ${status}`,
              timestamp: Date.now(),
            });
          }
        }
        if (api.events.compliance?.AccountRestricted?.is(event)) {
          const [account, reason] = event.data;
          if (account.toString() === address) {
            callback({
              type: 'AccountFrozen',
              message: `Account restricted: ${reason?.toString() || 'Compliance review'}`,
              timestamp: Date.now(),
            });
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

/**
 * Subscribe to land title transfer events for a given address.
 */
const subscribeToLandTransfers = async (
  address: string,
  callback: (transfer: { titleId: string; from: string; to: string; type: 'Received' | 'Transferred' }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        if (api.events.landLedger?.TitleTransferred?.is(event)) {
          const [titleId, from, to] = event.data;
          const fromStr = from.toString();
          const toStr = to.toString();
          if (fromStr === address || toStr === address) {
            callback({
              titleId: titleId.toString(),
              from: fromStr,
              to: toStr,
              type: toStr === address ? 'Received' : 'Transferred',
            });
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

/**
 * Subscribe to BNS domain events for a given address.
 */
const subscribeToDomainEvents = async (
  address: string,
  callback: (event: { type: 'Registered' | 'Renewed' | 'Transferred' | 'Listed' | 'Sold'; domain: string; details?: any }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const eventMap: Record<string, 'Registered' | 'Renewed' | 'Transferred' | 'Listed' | 'Sold'> = {
      DomainRegistered: 'Registered',
      DomainRenewed: 'Renewed',
      DomainTransferred: 'Transferred',
      DomainListed: 'Listed',
      DomainSold: 'Sold',
    };
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        if (event.section === 'bns') {
          const type = eventMap[event.method];
          if (type) {
            // First arg is typically the account, second is the domain name
            const account = event.data[0]?.toString();
            if (account === address) {
              callback({
                type,
                domain: event.data[1]?.toString() || 'unknown',
                details: event.data.toHuman?.() || {},
              });
            }
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

/**
 * Subscribe to BelizeX DEX events for a given address.
 */
const subscribeToDEXEvents = async (
  address: string,
  callback: (event: { type: 'Swapped' | 'LiquidityAdded' | 'LiquidityRemoved'; details: any }) => void,
): Promise<() => void> => {
  try {
    const api = await initializeApi();
    const eventMap: Record<string, 'Swapped' | 'LiquidityAdded' | 'LiquidityRemoved'> = {
      Swapped: 'Swapped',
      LiquidityAdded: 'LiquidityAdded',
      LiquidityRemoved: 'LiquidityRemoved',
    };
    const unsub = await api.query.system.events((events: any[]) => {
      events.forEach(({ event }) => {
        if (event.section === 'belizex') {
          const type = eventMap[event.method];
          if (type) {
            const account = event.data[0]?.toString();
            if (account === address) {
              callback({ type, details: event.data.toHuman?.() || {} });
            }
          }
        }
      });
    });
    return unsub as unknown as () => void;
  } catch {
    return () => {};
  }
};

export function useBalanceSubscription(address: string | null) {
  const [balance, setBalance] = useState<{dalla: string; bBZD: string; total: string;} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || typeof window === 'undefined') {
      setBalance(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        const api = await initializeApi();

        // 1. Fetch Substrate Native Balance (Planck: 10^12)
        let nativePlanck = 0n;
        try {
          const accountInfo: any = await api.query.system.account(address);
          const rawFree = accountInfo?.data?.free?.toString() || '0';
          nativePlanck = BigInt(rawFree.replace(/,/g, ''));
        } catch (e) {
          console.warn('Failed to query system.account native balance:', e);
        }

        // 2. Fetch PSP22 Smart Contract Balance
        let contractPlanck = 0n;
        try {
          const rawContract = await getDallaBalance(address, address);
          contractPlanck = BigInt((rawContract || '0').replace(/,/g, ''));
        } catch (e) {
          console.warn('Failed to query DALLA contract balance:', e);
        }

        // Total DALLA balance
        const totalPlanck = nativePlanck + contractPlanck;
        if (cancelled) return;

        const dalla = formatPlanck(totalPlanck.toString());
        setBalance({ dalla, bBZD: '0.00', total: dalla });
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed');
        setIsLoading(false);
      }
    };
    setIsLoading(true);
    void fetchBalance();
    const interval = setInterval(() => { void fetchBalance(); }, BALANCE_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [address]);
  return { balance, isLoading, error };
}

export function useStakingRewardsSubscription(address: string | null) {
  const [rewards, setRewards] = useState<Array<{amount: string; era: number; type: 'Staking' | 'PoUW'; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToStakingRewards(address, (reward) => { setRewards(prev => [{...reward, timestamp: Date.now()}, ...prev].slice(0, 10)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return rewards;
}

export function useTourismCashbackSubscription(address: string | null) {
  const [cashbacks, setCashbacks] = useState<Array<{merchant: string; amountSpent: string; cashbackAmount: string; cashbackRate: number; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToTourismCashback(address, (cashback) => { setCashbacks(prev => [{...cashback, timestamp: Date.now()}, ...prev].slice(0, 10)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return cashbacks;
}

export function useGovernanceProposalsSubscription() {
  const [proposals, setProposals] = useState<Array<{proposalIndex: number; proposer: string; value: string; title: string; timestamp: number;}>>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const POLL_MS = 15_000;
    const refresh = async () => {
      try {
        // Lazy-import to keep the bundle slim and avoid pulling @polkadot/api
        // into the initial chunk when the hook is unused.
        const { getActiveProposals } = await import('@/services/pallets');
        const onChain = await getActiveProposals();
        if (cancelled) return;
        setProposals(
          onChain.map((p) => ({
            proposalIndex: p.index,
            proposer: p.proposer,
            value: p.value,
            title: p.title || `Proposal #${p.index}`,
            timestamp: Date.now(),
          })),
        );
      } catch {
        // Keep last successful snapshot on transient errors.
      }
    };
    void refresh();
    const interval = setInterval(() => { void refresh(); }, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  return proposals;
}

export function useComplianceAlertsSubscription(address: string | null) {
  const [alerts, setAlerts] = useState<Array<{type: 'KYCApproved' | 'KYCRejected' | 'LimitExceeded' | 'AccountFrozen'; message: string; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToComplianceAlerts(address, (alert) => { setAlerts(prev => [alert, ...prev].slice(0, 5)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return alerts;
}

export function useLandTransfersSubscription(address: string | null) {
  const [transfers, setTransfers] = useState<Array<{titleId: string; from: string; to: string; type: 'Received' | 'Transferred'; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToLandTransfers(address, (transfer) => { setTransfers(prev => [{...transfer, timestamp: Date.now()}, ...prev].slice(0, 10)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return transfers;
}

export function useDomainEventsSubscription(address: string | null) {
  const [events, setEvents] = useState<Array<{type: 'Registered' | 'Renewed' | 'Transferred' | 'Listed' | 'Sold'; domain: string; details?: any; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToDomainEvents(address, (event) => { setEvents(prev => [{...event, timestamp: Date.now()}, ...prev].slice(0, 10)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return events;
}

export function useDEXEventsSubscription(address: string | null) {
  const [events, setEvents] = useState<Array<{type: 'Swapped' | 'LiquidityAdded' | 'LiquidityRemoved'; details: any; timestamp: number;}>>([]);
  useEffect(() => {
    if (!address || typeof window === 'undefined') return;
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToDEXEvents(address, (event) => { setEvents(prev => [{...event, timestamp: Date.now()}, ...prev].slice(0, 10)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
  }, [address]);
  return events;
}

export function useAllEventsSubscription(address: string | null) {
  const balance = useBalanceSubscription(address);
  const stakingRewards = useStakingRewardsSubscription(address);
  const tourismCashback = useTourismCashbackSubscription(address);
  const governanceProposals = useGovernanceProposalsSubscription();
  const complianceAlerts = useComplianceAlertsSubscription(address);
  const landTransfers = useLandTransfersSubscription(address);
  const domainEvents = useDomainEventsSubscription(address);
  const dexEvents = useDEXEventsSubscription(address);
  return { balance, stakingRewards, tourismCashback, governanceProposals, complianceAlerts, landTransfers, domainEvents, dexEvents };
}

export function useNotifications(address: string | null) {
  const [notifications, setNotifications] = useState<Array<{id: string; type: 'info' | 'success' | 'warning' | 'error'; title: string; message: string; timestamp: number; read: boolean;}>>([]);
  const stakingRewards = useStakingRewardsSubscription(address);
  const tourismCashback = useTourismCashbackSubscription(address);
  const complianceAlerts = useComplianceAlertsSubscription(address);
  const landTransfers = useLandTransfersSubscription(address);

  useEffect(() => {
    if (stakingRewards.length > 0) {
      const latest = stakingRewards[0];
      setNotifications(prev => [{id: `reward-${latest.timestamp}`, type: 'success', title: `${latest.type} Reward Earned`, message: `You received ${latest.amount} DALLA`, timestamp: latest.timestamp, read: false}, ...prev]);
    }
  }, [stakingRewards]);

  useEffect(() => {
    if (tourismCashback.length > 0) {
      const latest = tourismCashback[0];
      setNotifications(prev => [{id: `cashback-${latest.timestamp}`, type: 'success', title: 'Tourism Cashback Earned', message: `${latest.cashbackRate * 100}% cashback: ${latest.cashbackAmount} DALLA`, timestamp: latest.timestamp, read: false}, ...prev]);
    }
  }, [tourismCashback]);

  useEffect(() => {
    if (complianceAlerts.length > 0) {
      const latest = complianceAlerts[0];
      setNotifications(prev => [{id: `alert-${latest.timestamp}`, type: latest.type === 'KYCApproved' ? 'success' : 'warning', title: latest.type, message: latest.message, timestamp: latest.timestamp, read: false}, ...prev]);
    }
  }, [complianceAlerts]);

  useEffect(() => {
    if (landTransfers.length > 0) {
      const latest = landTransfers[0];
      setNotifications(prev => [{id: `land-${latest.timestamp}`, type: 'info', title: `Land Title ${latest.type}`, message: `Title ${latest.titleId} was ${latest.type.toLowerCase()}`, timestamp: latest.timestamp, read: false}, ...prev]);
    }
  }, [landTransfers]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, read: true } : notif));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications: notifications.slice(0, 20), unreadCount, markAsRead, markAllAsRead };
}
