'use client';

import { useEffect, useState, useCallback } from 'react';

const subscribeToStakingRewards = async (address: string, callback: (reward: any) => void) => {
  return () => {};
};

const subscribeToTourismCashback = async (address: string, callback: (cashback: any) => void) => {
  return () => {};
};

const subscribeToGovernanceProposals = async (callback: (proposal: any) => void) => {
  return () => {};
};

const subscribeToComplianceAlerts = async (address: string, callback: (alert: any) => void) => {
  return () => {};
};

const subscribeToBalanceChanges = async (address: string, callback: (balance: any) => void) => {
  return () => {};
};

const subscribeToLandTransfers = async (address: string, callback: (transfer: any) => void) => {
  return () => {};
};

const subscribeToDomainEvents = async (address: string, callback: (event: any) => void) => {
  return () => {};
};

const subscribeToDEXEvents = async (address: string, callback: (event: any) => void) => {
  return () => {};
};

export function useBalanceSubscription(address: string | null) {
  const [balance, setBalance] = useState<{dalla: string; bBZD: string; total: string;} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!address || typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try {
        setIsLoading(true);
        unsub = await subscribeToBalanceChanges(address, (newBalance) => {
          setBalance(newBalance);
          setIsLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
        setIsLoading(false);
      }
    };
    sub();
    return () => { if (unsub) unsub(); };
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
    let unsub: (() => void) | null = null;
    const sub = async () => {
      try { unsub = await subscribeToGovernanceProposals((proposal) => { setProposals(prev => [{...proposal, timestamp: Date.now()}, ...prev].slice(0, 20)); }); } catch (err) {}
    };
    sub();
    return () => { if (unsub) unsub(); };
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
