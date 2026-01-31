import { test as base } from '@playwright/test';

/**
 * Test Fixtures for BelizeChain Blockchain Integration
 * Provides utilities for mocking wallet connections and blockchain state
 */

export interface BlockchainFixtures {
  /**
   * Mock Polkadot.js wallet connection
   */
  mockWallet: () => Promise<void>;
  
  /**
   * Mock blockchain API responses
   */
  mockBlockchainAPI: (responses: Record<string, any>) => Promise<void>;
  
  /**
   * Wait for blockchain connection
   */
  waitForBlockchain: () => Promise<void>;
  
  /**
   * Mock account with balance
   */
  mockAccount: (address: string, balance: string) => Promise<void>;
}

export const test = base.extend<BlockchainFixtures>({
  /**
   * Mock wallet connection for testing without Polkadot.js extension
   */
  mockWallet: async ({ page }, use) => {
    await use(async () => {
      await page.addInitScript(() => {
        // Mock window.injectedWeb3
        (window as any).injectedWeb3 = {
          'polkadot-js': {
            enable: async () => ({
              accounts: {
                get: async () => [
                  {
                    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice
                    name: 'Alice (Test)',
                    type: 'sr25519',
                  },
                ],
              },
              signer: {},
            }),
            version: '0.44.1',
          },
        };
      });
    });
  },

  /**
   * Mock blockchain API for deterministic testing
   */
  mockBlockchainAPI: async ({ page }, use) => {
    await use(async (responses: Record<string, any>) => {
      await page.route('**/api/**', async (route) => {
        const url = route.request().url();
        const path = new URL(url).pathname;
        
        if (responses[path]) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(responses[path]),
          });
        } else {
          await route.continue();
        }
      });
    });
  },

  /**
   * Wait for blockchain connection indicator
   */
  waitForBlockchain: async ({ page }, use) => {
    await use(async () => {
      // Wait for connection status or timeout
      await page.waitForSelector('[data-testid="blockchain-connected"]', {
        timeout: 15000,
        state: 'visible',
      }).catch(() => {
        // Fallback: just wait a few seconds
        return page.waitForTimeout(3000);
      });
    });
  },

  /**
   * Mock account with specific balance
   */
  mockAccount: async ({ page }, use) => {
    await use(async (address: string, balance: string) => {
      await page.addInitScript(
        ({ addr, bal }) => {
          (window as any).__mockAccount = { address: addr, balance: bal };
        },
        { addr: address, bal: balance }
      );
    });
  },
});

export { expect } from '@playwright/test';
