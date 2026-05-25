/**
 * Blue Hole Portal — Treasury Integration
 *
 * The BelizeChain runtime does NOT register `pallet_treasury`. Treasury funds
 * live in the sovereign account derived from `TreasuryPalletId = b"py/trsry"`
 * (runtime/src/lib.rs:660), and "treasury spend proposals" are governance
 * proposals of type `TreasurySpend` handled by `pallet_belize_governance`
 * (runtime index 22).
 *
 * This service exposes:
 *   - the deterministically-derived treasury SS58 address
 *   - a balance reader for that address
 *   - a list of treasury-typed governance proposals
 *   - a `proposeTreasurySpend` submitter mirroring Maya Wallet's pattern
 *
 * Voting on a treasury spend proposal is the same `governance.castVote` flow
 * as any other proposal; re-exported from the governance service to keep
 * call sites local.
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { stringToU8a, u8aConcat, u8aToHex } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';
import { connectionManager } from '@/lib/blockchain/connection';
import {
  getActiveProposals,
  voteOnProposal,
  type Proposal as GovernanceProposal,
} from './governance';

/** SS58 prefix configured on the BelizeChain runtime (runtime/src/lib.rs:262). */
export const BELIZECHAIN_SS58_PREFIX = 1981;

/** PalletId bytes for the main treasury (`b"py/trsry"`). */
const TREASURY_PALLET_ID = stringToU8a('py/trsry');

/**
 * Derive the treasury account SS58 address from its PalletId. Substrate
 * prefixes pallet-derived accounts with `b"modl"` and zero-pads to 32 bytes,
 * matching `PalletId::into_account_truncating` on the runtime side.
 */
function deriveTreasuryAddress(): string {
  const prefix = stringToU8a('modl');
  const seed = u8aConcat(prefix, TREASURY_PALLET_ID);
  const padded = new Uint8Array(32);
  padded.set(seed.subarray(0, Math.min(seed.length, 32)));
  return encodeAddress(padded, BELIZECHAIN_SS58_PREFIX);
}

/** Public so callers can show the address in the UI for transparency. */
export const TREASURY_ADDRESS = deriveTreasuryAddress();
/** Hex form retained for logging/debug. */
export const TREASURY_ADDRESS_HEX = u8aToHex(
  (() => {
    const padded = new Uint8Array(32);
    padded.set(u8aConcat(stringToU8a('modl'), TREASURY_PALLET_ID));
    return padded;
  })(),
);

export interface TreasuryBalance {
  /** Free balance in planck (raw). */
  freePlanck: string;
  /** Free balance converted to DALLA, two decimal places. */
  freeDalla: string;
  /** Reserved balance in planck (raw). */
  reservedPlanck: string;
}

/**
 * Read the treasury account's `system.account` entry. Returns zeros on any
 * error so the UI can keep rendering.
 */
export async function getTreasuryBalance(): Promise<TreasuryBalance> {
  try {
    const api = await connectionManager.connect();
    const accountRaw: unknown = await api.query.system.account(TREASURY_ADDRESS);
    const account = accountRaw as {
      data?: {
        free?: { toString(): string };
        reserved?: { toString(): string };
      };
    };
    const freePlanck = account?.data?.free?.toString?.() ?? '0';
    const reservedPlanck = account?.data?.reserved?.toString?.() ?? '0';
    const freeDalla = planckToDalla(freePlanck);
    return { freePlanck, freeDalla, reservedPlanck };
  } catch (error) {
    console.error('Failed to read treasury balance:', error);
    return { freePlanck: '0', freeDalla: '0', reservedPlanck: '0' };
  }
}

function planckToDalla(planck: string): string {
  try {
    const value = BigInt(planck);
    const whole = value / 1_000_000_000_000n;
    const frac = value % 1_000_000_000_000n;
    const fracStr = frac.toString().padStart(12, '0').slice(0, 2);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return '0';
  }
}

/**
 * Filter governance proposals down to the treasury-spend subset. Mirrors the
 * UI shape used by the treasury page; we keep this as a thin re-projection
 * rather than a brand-new fetch so we don't issue duplicate `entries()`
 * queries.
 */
export interface TreasurySpendProposalView {
  id: number;
  title: string;
  description: string;
  proposer: string;
  beneficiary: string;
  amountDalla: string;
  status: GovernanceProposal['status'];
  createdAt: number;
  voteEnd: number;
  voteCount: GovernanceProposal['voteCount'];
}

export async function getTreasurySpendProposals(): Promise<TreasurySpendProposalView[]> {
  const all = await getActiveProposals();
  return all
    .filter((p) => p.category === 'Treasury' || p.value !== '0' || p.beneficiary !== '')
    .map((p) => ({
      id: p.index,
      title: p.title,
      description: p.description,
      proposer: p.proposer,
      beneficiary: p.beneficiary,
      amountDalla: p.value,
      status: p.status,
      createdAt: p.createdAt,
      voteEnd: p.voteEnd,
      voteCount: p.voteCount,
    }));
}

/**
 * Submit `governance.proposeTreasurySpend(recipient, amount, description,
 * districtIndex?)`. `amountDalla` is the human-readable DALLA amount (string
 * to avoid float drift); we convert to planck (`* 1e12`) using BigInt.
 *
 * Resolves once the extrinsic is included in a block. Rejects on
 * `dispatchError` or signer cancellation.
 */
export async function proposeTreasurySpend(
  signerAddress: string,
  params: {
    beneficiary: string;
    amountDalla: string;
    title: string;
    description: string;
    districtIndex?: number | null;
  },
): Promise<{ hash: string; proposalIndex: number }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const planck = dallaToPlanck(params.amountDalla);
  if (planck <= 0n) {
    throw new Error('Amount must be greater than zero.');
  }
  const combinedDescription = params.title
    ? `${params.title}\n\n${params.description ?? ''}`.trim()
    : (params.description ?? '');

  const tx = api.tx.governance.proposeTreasurySpend(
    params.beneficiary,
    planck.toString(),
    combinedDescription,
    params.districtIndex ?? null,
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(
      signerAddress,
      { signer: injector.signer },
      ({ status, txHash, events, dispatchError }: {
        status: { isInBlock: boolean };
        txHash: { toString(): string };
        events: { event: unknown }[];
        dispatchError?: unknown;
      }) => {
        if (dispatchError) {
          reject(new Error(formatDispatchError(api, dispatchError)));
          return;
        }
        if (!status.isInBlock) return;
        let proposalIndex = -1;
        for (const record of events) {
          try {
            const event = (record as { event: { section?: string; method?: string; data?: unknown[] } }).event;
            if (event.section === 'governance' && event.method === 'Proposed') {
              const idCodec = event.data?.[0] as { toString?: () => string } | undefined;
              proposalIndex = Number(idCodec?.toString?.() ?? -1);
            }
          } catch {
            // Ignore decode errors on unrelated events.
          }
        }
        resolve({ hash: txHash.toString(), proposalIndex });
      },
    ).catch(reject);
  });
}

function dallaToPlanck(amount: string): bigint {
  const trimmed = (amount ?? '').trim();
  if (!trimmed) return 0n;
  const [wholePart = '0', fracPartRaw = ''] = trimmed.split('.');
  const fracPart = (fracPartRaw + '000000000000').slice(0, 12);
  try {
    return BigInt(wholePart) * 1_000_000_000_000n + BigInt(fracPart);
  } catch {
    return 0n;
  }
}

function formatDispatchError(api: unknown, err: unknown): string {
  try {
    const e = err as {
      isModule?: boolean;
      asModule?: unknown;
      toString?: () => string;
    };
    const registry = (api as { registry?: { findMetaError?: (m: unknown) => { section: string; name: string; docs: string[] } } })
      .registry;
    if (e.isModule && registry?.findMetaError) {
      const decoded = registry.findMetaError(e.asModule);
      return `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`.trim();
    }
    return e.toString?.() ?? 'Dispatch error';
  } catch {
    return 'Dispatch error';
  }
}

export { voteOnProposal };
