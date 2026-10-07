/**
 * On-chain BelizeID lookup for the Portal's authorization check.
 *
 * Node runtime only — this talks to the chain over WebSocket.
 *
 * Mirrors `pallet_belize_identity::kyc_state`:
 *   L1 = SSN attestation Active and inside its validity window
 *   L2 = L1 AND Passport attestation likewise
 *   L3 = L2 AND Biometric attestation likewise
 *
 * An attestation counts when Active and inside `valid_until` (Valid) or
 * `grace_until` (Grace). That matches the pallet's own `is_kyc_verified`, which
 * accepts `Valid | Grace` — someone in the grace window still counts.
 */

import { ApiPromise, WsProvider } from '@polkadot/api';

/** Chain endpoint for server-side lookups. Internal address, not a browser one. */
const RPC_ENDPOINT = process.env.AUTH_CHAIN_RPC ?? 'ws://ceiba-node:9944';

/** Give up rather than hang the login form when the node is unreachable. */
const LOOKUP_TIMEOUT_MS = 10_000;

let apiPromise: Promise<ApiPromise> | null = null;

async function getApi(): Promise<ApiPromise> {
  if (!apiPromise) {
    apiPromise = ApiPromise.create({
      provider: new WsProvider(RPC_ENDPOINT),
      // The portal only reads; a full metadata/types build-up is wasted work here.
      noInitWarn: true,
    }).catch((error) => {
      // Don't cache a failed connection, or every later login fails too.
      apiPromise = null;
      throw error;
    });
  }
  return apiPromise;
}

type AttestationState = 'valid' | 'grace' | 'invalid';

function stateOf(attestation: unknown, now: bigint): AttestationState {
  const att = attestation as {
    isNone?: boolean;
    unwrap?: () => {
      status?: { toString?: () => string };
      validUntil?: { toString?: () => string };
      graceUntil?: { toString?: () => string };
    };
  } | null;

  if (!att || att.isNone === true || typeof att.unwrap !== 'function') {
    return 'invalid';
  }

  const data = att.unwrap();
  if (data?.status?.toString?.() !== 'Active') {
    return 'invalid';
  }

  const validUntil = BigInt(data.validUntil?.toString?.() ?? '0');
  if (now <= validUntil) {
    return 'valid';
  }

  const graceUntil = BigInt(data.graceUntil?.toString?.() ?? '0');
  if (now <= graceUntil) {
    return 'grace';
  }

  return 'invalid';
}

function isUsable(state: AttestationState): boolean {
  return state === 'valid' || state === 'grace';
}

export interface KycLookup {
  level: number;
  /** True when the lookup itself failed, as opposed to the account having no KYC. */
  degraded: boolean;
}

/**
 * Highest attestation-backed KYC level for an address, 0-3.
 *
 * `degraded` is set when the chain could not be reached. Callers must not treat
 * that as "no KYC" — it means "unknown", and the gate must refuse.
 */
export async function lookupKycLevel(address: string): Promise<KycLookup> {
  try {
    const api = await getApi();

    const result = await Promise.race([
      (async () => {
        const identityId = (await api.query.identity.identityOf(address)) as unknown as {
          isNone?: boolean;
          unwrap?: () => { toString: () => string };
        };

        if (!identityId || identityId.isNone === true || typeof identityId.unwrap !== 'function') {
          return 0;
        }

        const id = identityId.unwrap();
        const now = BigInt((await api.query.system.number()).toString());

        const [ssn, passport, biometric] = await Promise.all([
          api.query.identity.ssnAttestations(id),
          api.query.identity.passportAttestations(id),
          api.query.identity.biometricAttestations(id),
        ]);

        if (!isUsable(stateOf(ssn, now))) {
          return 0;
        }

        if (!isUsable(stateOf(passport, now))) {
          return 1;
        }

        if (!isUsable(stateOf(biometric, now))) {
          return 2;
        }

        return 3;
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('KYC lookup timed out')), LOOKUP_TIMEOUT_MS),
      ),
    ]);

    return { level: result, degraded: false };
  } catch (error) {
    console.error('[auth] on-chain KYC lookup failed:', error);
    return { level: 0, degraded: true };
  }
}
