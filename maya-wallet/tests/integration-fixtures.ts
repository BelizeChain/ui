import { test as base, expect } from '@playwright/test';
import { ApiPromise, WsProvider } from '@polkadot/api';

/**
 * Integration Test Fixtures
 * These tests require a running blockchain node at ws://127.0.0.1:9944
 * Tag tests with @integration to run them separately
 */

type IntegrationFixtures = {
  api: ApiPromise;
  blockchainConnected: boolean;
};

export const test = base.extend<IntegrationFixtures>({
  // Connect to blockchain node
  api: async ({}, use) => {
    const provider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider });
    
    // Wait for node to be ready
    await api.isReady;
    
    console.log(`✅ Connected to blockchain: ${await api.rpc.system.chain()}`);
    console.log(`✅ Node version: ${await api.rpc.system.version()}`);
    
    await use(api);
    
    // Cleanup
    await api.disconnect();
  },
  
  // Check if blockchain is connected
  blockchainConnected: async ({ api }, use) => {
    const health = await api.rpc.system.health();
    const isConnected = health.peers.toNumber() >= 0;
    await use(isConnected);
  },
});

export { expect };
