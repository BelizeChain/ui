'use client';

/**
 * BelizeChain Event Subscription Service
 * Real-time WebSocket subscriptions for all pallet events
 */

import { ApiPromise } from '@polkadot/api';
import { initializeApi } from './blockchain';

export interface EventSubscription {
  unsubscribe: () => void;
}

export type EventCallback<T = any> = (event: T) => void;

/**
 * Subscribe to balance changes for an address
 */
export async function subscribeToBalanceChanges(
  address: string,
  callback: EventCallback<{
    dalla: string;
    bBZD: string;
    total: string;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.account(address, async (accountInfo: any) => {
    const balances = accountInfo.data;
    const dalla = formatBalance(balances.free.toString());
    
    // Get bBZD balance
    let bBZD = '0.00';
    try {
      const bBZDBalance = await api.query.economy?.bBzdBalances(address);
      if (bBZDBalance && !bBZDBalance.isEmpty) {
        bBZD = formatBalance(bBZDBalance.toString());
      }
    } catch (error) {
      console.debug('bBZD balance query failed:', error);
    }
    
    const total = (parseFloat(dalla) + parseFloat(bBZD)).toFixed(2);
    
    callback({ dalla, bBZD, total });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to new governance proposals
 */
export async function subscribeToGovernanceProposals(
  callback: EventCallback<{
    proposalIndex: number;
    proposer: string;
    value: string;
    title: string;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.governance?.Proposed?.is(event)) {
        const [proposalIndex, proposer, value, title] = event.data;
        
        callback({
          proposalIndex: Number((proposalIndex as any).toString()),
          proposer: proposer.toString(),
          value: formatBalance(value.toString()),
          title: title.toString(),
        });
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to staking rewards
 */
export async function subscribeToStakingRewards(
  address: string,
  callback: EventCallback<{
    amount: string;
    era: number;
    type: 'Staking' | 'PoUW';
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      // Standard staking rewards
      if (api.events.staking?.Reward?.is(event)) {
        const [rewardAddress, amount, era] = event.data;
        
        if (rewardAddress.toString() === address) {
          callback({
            amount: formatBalance(amount.toString()),
            era: era ? Number((era as any).toString()) : 0,
            type: 'Staking',
          });
        }
      }
      
      // PoUW rewards
      if (api.events.staking?.PoUWRewarded?.is(event)) {
        const [rewardAddress, amount, contributionId] = event.data;
        
        if (rewardAddress.toString() === address) {
          callback({
            amount: formatBalance(amount.toString()),
            era: 0,
            type: 'PoUW',
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to tourism cashback events
 */
export async function subscribeToTourismCashback(
  address: string,
  callback: EventCallback<{
    merchant: string;
    amountSpent: string;
    cashbackAmount: string;
    cashbackRate: number;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.oracle?.CashbackEarned?.is(event)) {
        const [user, merchant, amountSpent, cashbackAmount, cashbackRate] = event.data;
        
        if (user.toString() === address) {
          callback({
            merchant: merchant.toString(),
            amountSpent: formatBalance(amountSpent.toString()),
            cashbackAmount: formatBalance(cashbackAmount.toString()),
            cashbackRate: Number((cashbackRate as any).toString()) / 100,
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to KYC/compliance alerts
 */
export async function subscribeToComplianceAlerts(
  address: string,
  callback: EventCallback<{
    type: 'KYCApproved' | 'KYCRejected' | 'LimitExceeded' | 'AccountFrozen';
    message: string;
    timestamp: number;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.compliance?.KYCApproved?.is(event)) {
        const [approvedAddress, level] = event.data;
        
        if (approvedAddress.toString() === address) {
          callback({
            type: 'KYCApproved',
            message: `KYC verification approved: ${level.toString()} level`,
            timestamp: Date.now(),
          });
        }
      }
      
      if (api.events.compliance?.KYCRejected?.is(event)) {
        const [rejectedAddress, reason] = event.data;
        
        if (rejectedAddress.toString() === address) {
          callback({
            type: 'KYCRejected',
            message: `KYC verification rejected: ${reason.toString()}`,
            timestamp: Date.now(),
          });
        }
      }
      
      if (api.events.compliance?.LimitExceeded?.is(event)) {
        const [violatorAddress, limit] = event.data;
        
        if (violatorAddress.toString() === address) {
          callback({
            type: 'LimitExceeded',
            message: `Transaction limit exceeded: ${formatBalance(limit.toString())} DALLA`,
            timestamp: Date.now(),
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to land title transfers
 */
export async function subscribeToLandTransfers(
  address: string,
  callback: EventCallback<{
    titleId: string;
    from: string;
    to: string;
    type: 'Received' | 'Transferred';
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.landLedger?.TitleTransferred?.is(event)) {
        const [titleId, from, to] = event.data;
        
        if (from.toString() === address || to.toString() === address) {
          callback({
            titleId: titleId.toString(),
            from: from.toString(),
            to: to.toString(),
            type: to.toString() === address ? 'Received' : 'Transferred',
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to BNS domain events
 */
export async function subscribeToDomainEvents(
  address: string,
  callback: EventCallback<{
    type: 'Registered' | 'Renewed' | 'Transferred' | 'Listed' | 'Sold';
    domain: string;
    details?: any;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.bns?.DomainRegistered?.is(event)) {
        const [owner, domain] = event.data;
        
        if (owner.toString() === address) {
          callback({
            type: 'Registered',
            domain: domain.toString(),
          });
        }
      }
      
      if (api.events.bns?.DomainTransferred?.is(event)) {
        const [from, to, domain] = event.data;
        
        if (from.toString() === address || to.toString() === address) {
          callback({
            type: 'Transferred',
            domain: domain.toString(),
            details: { from: from.toString(), to: to.toString() },
          });
        }
      }
      
      if (api.events.bns?.DomainSold?.is(event)) {
        const [seller, buyer, domain, price] = event.data;
        
        if (seller.toString() === address || buyer.toString() === address) {
          callback({
            type: 'Sold',
            domain: domain.toString(),
            details: {
              price: formatBalance(price.toString()),
              buyer: buyer.toString(),
              seller: seller.toString(),
            },
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to BelizeX DEX events
 */
export async function subscribeToDEXEvents(
  address: string,
  callback: EventCallback<{
    type: 'Swapped' | 'LiquidityAdded' | 'LiquidityRemoved';
    details: any;
  }>
): Promise<EventSubscription> {
  const api = await initializeApi();
  
  const unsubscribe = (await api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (api.events.belizeX?.Swapped?.is(event)) {
        const [trader, tokenIn, tokenOut, amountIn, amountOut] = event.data;
        
        if (trader.toString() === address) {
          callback({
            type: 'Swapped',
            details: {
              tokenIn: tokenIn.toString(),
              tokenOut: tokenOut.toString(),
              amountIn: formatBalance(amountIn.toString()),
              amountOut: formatBalance(amountOut.toString()),
            },
          });
        }
      }
      
      if (api.events.belizeX?.LiquidityAdded?.is(event)) {
        const [provider, token0, token1, amount0, amount1, liquidity] = event.data;
        
        if (provider.toString() === address) {
          callback({
            type: 'LiquidityAdded',
            details: {
              token0: token0.toString(),
              token1: token1.toString(),
              amount0: formatBalance(amount0.toString()),
              amount1: formatBalance(amount1.toString()),
              liquidity: formatBalance(liquidity.toString()),
            },
          });
        }
      }
    });
  })) as unknown as () => void;

  return { unsubscribe };
}

/**
 * Subscribe to all events for an address (convenience function)
 */
export async function subscribeToAllEvents(
  address: string,
  callbacks: {
    onBalance?: EventCallback<any>;
    onStakingReward?: EventCallback<any>;
    onTourismCashback?: EventCallback<any>;
    onComplianceAlert?: EventCallback<any>;
    onGovernanceProposal?: EventCallback<any>;
    onLandTransfer?: EventCallback<any>;
    onDomainEvent?: EventCallback<any>;
    onDEXEvent?: EventCallback<any>;
  }
): Promise<EventSubscription> {
  const subscriptions: EventSubscription[] = [];
  
  if (callbacks.onBalance) {
    subscriptions.push(await subscribeToBalanceChanges(address, callbacks.onBalance));
  }
  
  if (callbacks.onStakingReward) {
    subscriptions.push(await subscribeToStakingRewards(address, callbacks.onStakingReward));
  }
  
  if (callbacks.onTourismCashback) {
    subscriptions.push(await subscribeToTourismCashback(address, callbacks.onTourismCashback));
  }
  
  if (callbacks.onComplianceAlert) {
    subscriptions.push(await subscribeToComplianceAlerts(address, callbacks.onComplianceAlert));
  }
  
  if (callbacks.onGovernanceProposal) {
    subscriptions.push(await subscribeToGovernanceProposals(callbacks.onGovernanceProposal));
  }
  
  if (callbacks.onLandTransfer) {
    subscriptions.push(await subscribeToLandTransfers(address, callbacks.onLandTransfer));
  }
  
  if (callbacks.onDomainEvent) {
    subscriptions.push(await subscribeToDomainEvents(address, callbacks.onDomainEvent));
  }
  
  if (callbacks.onDEXEvent) {
    subscriptions.push(await subscribeToDEXEvents(address, callbacks.onDEXEvent));
  }

  return {
    unsubscribe: () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    },
  };
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
