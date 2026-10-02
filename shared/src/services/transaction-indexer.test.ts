/**
 * Unit tests for the direct-RPC transaction indexer.
 *
 * The mocked tests are deterministic and run everywhere; the live test only
 * runs when BELIZECHAIN_LIVE_RPC is set (e.g. ws://100.81.45.25:9944).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiPromise } from '@polkadot/api';
import { TransactionIndexer } from './transaction-indexer';

const HEAD = 1000;

/** A prefix-1981-rendered address and its hex bytes (they must never be string-compared). */
const ACCOUNT = {
  rendered: 'r1RxrSmqLK3kZZZZzzzzFakePrefix1981Address',
  hex: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
};
const OTHER = {
  rendered: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  hex: '0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48',
};

interface FakeBlock {
  extrinsics: unknown[];
  events: unknown[];
}

function applyPhase(index: number) {
  return { isApplyExtrinsic: true, asApplyExtrinsic: { toNumber: () => index } };
}

function extrinsicsSuccess(index: number, feePlanck?: string): unknown[] {
  const events: unknown[] = [
    { phase: applyPhase(index), event: { section: 'system', method: 'ExtrinsicSuccess', data: [] } },
  ];
  if (feePlanck) {
    events.push({
      phase: applyPhase(index),
      event: {
        section: 'transactionPayment',
        method: 'TransactionFeePaid',
        data: [{}, { toString: () => feePlanck }],
      },
    });
  }
  return events;
}

function extrinsicFailed(index: number): unknown[] {
  return [{ phase: applyPhase(index), event: { section: 'system', method: 'ExtrinsicFailed', data: [] } }];
}

function signedExtrinsic(signer: string, section: string, method: string, args: unknown[] = []) {
  return { isSigned: true, signer, method: { section, method, args } };
}

const asString = (v: string) => ({ toString: () => v });

function makeApi(blocks: Record<number, FakeBlock>): ApiPromise {
  const bytesByRendered = new Map<string, string>([
    [ACCOUNT.rendered, ACCOUNT.hex],
    [OTHER.rendered, OTHER.hex],
  ]);
  const blockNumberFromHash = (hash: { toHex(): string }) =>
    Number(hash.toHex().replace('0xblock', ''));

  const api = {
    registry: { chainDecimals: [12] },
    createType: (_type: string, value: unknown) => {
      const hex = bytesByRendered.get(String(value));
      if (!hex) throw new Error(`unknown account: ${String(value)}`);
      return { toHex: () => hex };
    },
    rpc: {
      chain: {
        getHeader: async () => ({ number: { toNumber: () => HEAD } }),
        getBlockHash: async (n: number) => ({ toHex: () => `0xblock${n}` }),
        getBlock: async (hash: { toHex(): string }) => ({
          block: { extrinsics: blocks[blockNumberFromHash(hash)]?.extrinsics ?? [] },
        }),
      },
    },
    query: {
      system: {
        events: {
          at: async (hash: { toHex(): string }) => blocks[blockNumberFromHash(hash)]?.events ?? [],
        },
      },
    },
  };
  return api as unknown as ApiPromise;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TransactionIndexer direct-RPC scan', () => {
  it('matches the account by raw bytes and decodes a balances transfer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no indexer')));
    const api = makeApi({
      [HEAD]: {
        extrinsics: [
          signedExtrinsic(OTHER.rendered, 'timestamp', 'set'),
          signedExtrinsic(ACCOUNT.rendered, 'balances', 'transferKeepAlive', [
            asString(OTHER.rendered),
            asString('1500000000000'),
          ]),
        ],
        events: [...extrinsicsSuccess(0), ...extrinsicsSuccess(1, '2000000000')],
      },
    });

    const indexer = new TransactionIndexer(api, { scanBlocks: 3, cacheEnabled: false });
    const txs = await indexer.getAccountHistory(ACCOUNT.rendered, { limit: 10 });

    expect(txs).toHaveLength(1);
    const [tx] = txs;
    expect(tx.from).toBe(ACCOUNT.rendered);
    expect(tx.to).toBe(OTHER.rendered);
    expect(tx.type).toBe('transfer');
    expect(tx.asset).toBe('DALLA');
    expect(tx.amount).toBe('1.5000');
    expect(tx.fee).toBe('0.0020');
    expect(tx.status).toBe('success');
    expect(tx.blockNumber).toBe(HEAD);
    expect(tx.hash).toBe(`0xblock${HEAD}-1`);
    expect(tx.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('reports failed extrinsics and assets-pallet bBZD transfers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no indexer')));
    const api = makeApi({
      [HEAD]: {
        extrinsics: [
          signedExtrinsic(ACCOUNT.rendered, 'assets', 'transferKeepAlive', [
            asString('1'),
            asString(OTHER.rendered),
            asString('2500000000000'),
          ]),
        ],
        events: extrinsicFailed(0),
      },
    });

    const indexer = new TransactionIndexer(api, { scanBlocks: 1, cacheEnabled: false });
    const txs = await indexer.getAccountHistory(ACCOUNT.rendered, { limit: 10 });

    expect(txs).toHaveLength(1);
    expect(txs[0].asset).toBe('bBZD');
    expect(txs[0].amount).toBe('2.5000');
    expect(txs[0].status).toBe('failed');
    expect(txs[0].fee).toBe('0');
  });

  it('returns [] for an account with no signed extrinsics in range', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no indexer')));
    const api = makeApi({
      [HEAD]: {
        extrinsics: [signedExtrinsic(OTHER.rendered, 'timestamp', 'set')],
        events: extrinsicsSuccess(0),
      },
    });

    const indexer = new TransactionIndexer(api, { scanBlocks: 5, cacheEnabled: false });
    await expect(indexer.getAccountHistory(ACCOUNT.rendered)).resolves.toEqual([]);
  });

  it('returns [] instead of throwing when the address cannot be parsed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no indexer')));
    const api = makeApi({});

    const indexer = new TransactionIndexer(api, { scanBlocks: 2, cacheEnabled: false });
    await expect(indexer.getAccountHistory('not-an-address')).resolves.toEqual([]);
  });

  it('falls back to the RPC scan when the GraphQL indexer is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const api = makeApi({
      [HEAD]: {
        extrinsics: [
          signedExtrinsic(ACCOUNT.rendered, 'balances', 'transfer', [
            asString(OTHER.rendered),
            asString('1000000000000'),
          ]),
        ],
        events: extrinsicsSuccess(0),
      },
    });

    const indexer = new TransactionIndexer(api, { scanBlocks: 1, cacheEnabled: false });
    const txs = await indexer.getAccountHistory(ACCOUNT.rendered, { limit: 5 });

    expect(fetchMock).toHaveBeenCalled();
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe('1.0000');
  });

  it('propagates RPC failures instead of silently reporting no history', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no indexer')));
    const api = makeApi({});
    (
      api.rpc.chain as unknown as { getBlockHash: unknown }
    ).getBlockHash = async () => {
      throw new Error('node unreachable');
    };

    const indexer = new TransactionIndexer(api, { scanBlocks: 1, cacheEnabled: false });
    await expect(indexer.getAccountHistory(ACCOUNT.rendered, { limit: 5 })).rejects.toThrow(
      'node unreachable'
    );
  });
});

const liveEndpoint = process.env.BELIZECHAIN_LIVE_RPC;

describe.runIf(Boolean(liveEndpoint))('TransactionIndexer against a live chain', () => {
  it('walks real chain state without throwing and decodes active signers', async () => {
    const { ApiPromise, WsProvider } = await import('@polkadot/api');
    const api = await ApiPromise.create({ provider: new WsProvider(liveEndpoint) });
    try {
      const head = await api.rpc.chain.getHeader();
      const headNumber = head.number.toNumber();

      // Find any signed extrinsic in the last 10 blocks — a quiet chain carries
      // only the unsigned timestamp.set inherent per block.
      let activeSigner: string | null = null;
      for (let i = 0; i < 10 && !activeSigner; i++) {
        const hash = await api.rpc.chain.getBlockHash(headNumber - i);
        const { block } = await api.rpc.chain.getBlock(hash);
        const signed = block.extrinsics.find(e => e.isSigned);
        if (signed) activeSigner = signed.signer.toString();
      }

      const indexer = new TransactionIndexer(api, { scanBlocks: 10, cacheEnabled: false });

      // An account that never signed must resolve to [] against live state.
      const unknown = api.createType('AccountId', `0x${'ab'.repeat(32)}`).toString();
      await expect(indexer.getAccountHistory(unknown, { limit: 5 })).resolves.toEqual([]);

      if (!activeSigner) {
        console.log(
          'Live chain idle: no signed extrinsics in the last 10 blocks — decode paths are covered by the mocked suites.'
        );
        return;
      }

      const txs = await indexer.getAccountHistory(activeSigner, { limit: 5 });
      expect(txs.length).toBeGreaterThan(0);
      expect(txs[0].status).toBe('success');
      expect(txs[0].blockNumber).toBeLessThanOrEqual(headNumber);

      // Same 32 bytes, possibly different SS58 rendering — must match identically.
      const rerendered = api.createType('AccountId', activeSigner).toString();
      await expect(indexer.getAccountHistory(rerendered, { limit: 5 })).resolves.toHaveLength(
        txs.length
      );
    } finally {
      await api.disconnect();
    }
  }, 90000);
});
