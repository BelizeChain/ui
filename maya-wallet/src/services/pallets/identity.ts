/**
 * BelizeChain Identity Pallet Integration
 * Handles BelizeID, SSN/Passport verification, and KYC status
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '../../lib/codec';

type AttestationItem = 'ssnAttestations' | 'passportAttestations';

/** Resolve an account to its u128 identity id, or null when unregistered. */
async function resolveIdentityId(api: any, address: string): Promise<any | null> {
  if (!api.query.identity?.identityOf) return null;
  const idOpt: any = await api.query.identity.identityOf(address);
  if (!idOpt || idOpt.isNone) return null;
  return idOpt.unwrap();
}

async function currentBlock(api: any): Promise<number> {
  try {
    return Number((await api.query.system.number()).toString());
  } catch {
    return 0;
  }
}

function toAttestation(raw: any, block: number): AttestationRecord | null {
  const a = raw?.toJSON?.();
  if (!a) return null;
  const status = String(a.status ?? '');
  const validUntil = Number(a.validUntil ?? 0);
  return {
    attrType: String(a.attrType ?? ''),
    issuer: String(a.issuer ?? ''),
    standardVersion: Number(a.standardVersion ?? 0),
    // The metadata aliases `hash_` to `hash`; accept either spelling.
    hash: String(a.hash ?? a.hash_ ?? ''),
    formatOk: Boolean(a.formatOk),
    issuedAt: Number(a.issuedAt ?? 0),
    validUntil,
    graceUntil: Number(a.graceUntil ?? 0),
    status,
    anchor: bytesToString(a.anchor),
    verified: status.toLowerCase() === 'active' && block <= validUntil,
  };
}

async function getAttestation(address: string, item: AttestationItem): Promise<AttestationRecord | null> {
  const api = await initializeApi();
  try {
    if (!api.query.identity?.[item]) return null;
    const identityId = await resolveIdentityId(api, address);
    if (!identityId) return null;
    const raw: any = await api.query.identity[item](identityId);
    if (!raw || raw.isNone) return null;
    return toAttestation(raw, await currentBlock(api));
  } catch (error) {
    console.error(`Failed to fetch ${item}:`, error);
    return null;
  }
}

/**
 * Mirrors `identity.identities: u128 -> IdentityRecord`.
 *
 * The pallet stores only a name, owner, linked accounts and an optional DID
 * document CID. There is no first name, last name, date of birth, nationality
 * or district on chain — an earlier version of this file invented all of them.
 */
export interface BelizeID {
  /** u128 identity id assigned by the pallet (the storage key). */
  id: string;
  name: string;
  owner: string;
  accounts: string[];
  didDocCid?: string;
  /** Derived: an active, unexpired SSN attestation exists. */
  ssnVerified: boolean;
  /** Derived: an active, unexpired passport attestation exists. */
  passportVerified: boolean;
}

/**
 * Mirrors an `identity.ssnAttestations` / `passportAttestations` entry.
 *
 * The pallet stores attestations keyed by **u128 identity id**, not by account
 * address, and never stores the raw document number — only a salted hash
 * anchored on chain. The old `ssnRecords`/`passportRecords` maps this file read
 * do not exist.
 */
export interface AttestationRecord {
  attrType: string;
  issuer: string;
  standardVersion: number;
  hash: string;
  formatOk: boolean;
  issuedAt: number;
  validUntil: number;
  graceUntil: number;
  status: string;
  anchor: string;
  /** Derived: status is Active and the current block is within `validUntil`. */
  verified: boolean;
}

export type SSNRecord = AttestationRecord;
export type PassportRecord = AttestationRecord;

export interface KYCStatus {
  level: 'None' | 'Basic' | 'Enhanced' | 'Full';
  status: 'None' | 'Pending' | 'Verified' | 'Rejected';
  verificationDate?: number;
  documents: string[];
  /**
   * The identity pallet records no transfer limits, so this is always null.
   * It used to return invented figures (25,000 / 10,000,000) that the UI then
   * rendered as an enforced spending cap.
   */
  limits: { dailyTransfer: string; monthlyTransfer: string } | null;
}

/**
 * Get BelizeID for an address
 */
export async function getBelizeID(address: string): Promise<BelizeID | null> {
  const api = await initializeApi();

  try {
    const identityId = await resolveIdentityId(api, address);
    if (!identityId) return null;

    const raw: any = await api.query.identity.identities(identityId);
    if (!raw || raw.isNone) return null;
    const data = raw.toJSON() as any;

    const block = await currentBlock(api);
    const [ssn, passport] = await Promise.all([
      api.query.identity.ssnAttestations?.(identityId).then((r: any) => toAttestation(r, block)),
      api.query.identity.passportAttestations?.(identityId).then((r: any) => toAttestation(r, block)),
    ]);

    return {
      id: identityId.toString(),
      name: bytesToString(data.name),
      owner: String(data.owner ?? ''),
      accounts: Array.isArray(data.accounts) ? data.accounts.map(String) : [],
      didDocCid: data.didDocCid ? bytesToString(data.didDocCid) : undefined,
      ssnVerified: ssn?.verified ?? false,
      passportVerified: passport?.verified ?? false,
    };
  } catch (error) {
    console.error('Failed to fetch BelizeID:', error);
    return null;
  }
}

/**
 * Resolve a human-readable display name for an address from the Identity pallet.
 *
 * Reads the BelizeID record's `name`, which is a public display handle. Only the
 * first line is returned: names are single-line by construction now, but a record
 * written by an older or third-party client that packed extra fields into this
 * field must not surface them. Returns `undefined` when no on-chain identity
 * exists so callers can fall back to a shortened address.
 */
export async function getDisplayName(address: string): Promise<string | undefined> {
  try {
    const api = await initializeApi();
    const identityId = await resolveIdentityId(api, address);
    if (!identityId) return undefined;

    const raw: any = await api.query.identity.identities(identityId);
    if (!raw || raw.isNone) return undefined;

    const name = bytesToString((raw.toJSON() as any)?.name);
    return name?.split('\n')[0].trim() || undefined;
  } catch (error) {
    console.debug('getDisplayName lookup failed:', error);
    return undefined;
  }
}

/**
 * Register a BelizeID.
 *
 * `identity.register_identity(name)` takes **one** bounded display name
 * (`MaxNameLen = 64`) and stores it publicly and permanently in
 * `identity.identities`. It is a public handle, not a KYC record.
 *
 * This used to pack first name, middle name, last name, date of birth,
 * nationality, residence address and district into that single field, joined by
 * newlines. That was wrong twice over: the payload exceeded the 64-byte bound for
 * most real names (measured 78–99 bytes), and it published PII to a world-readable
 * map with no hashing.
 *
 * KYC does not need any of it. `KycLevel` is derived purely from attestations —
 * L1 = SSN, L2 = SSN + Passport, L3 = + Biometrics — and an `Attestation` stores
 * only `blake2_256(salt ++ plaintext)`, with the salt deliberately kept off chain.
 * The issuer holds the PII; the chain holds a hash. Date of birth, nationality and
 * address belong to that issuer's off-chain onboarding, never to this call.
 */
export async function registerBelizeID(
  address: string,
  displayName: string
): Promise<{ hash: string; blockHash?: string }> {
  const api = await initializeApi();

  const name = displayName.trim();
  if (!name) {
    throw new Error('A display name is required.');
  }
  // Measured in UTF-8 bytes, which is what the pallet bounds — not characters.
  if (new TextEncoder().encode(name).length > 64) {
    throw new Error(
      'Display name must be 64 bytes or fewer. Keep it to a short public handle.'
    );
  }

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.identity.registerIdentity(name);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          // Check for errors
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError]: any = event.data;
              let errorMessage = 'Registration failed';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              }

              reject(new Error(errorMessage));
            }
          });

          resolve({
            hash: txHash.toString(),
            blockHash: status.asInBlock.toString(),
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('BelizeID registration failed:', error);
    throw error;
  }
}

/**
 * Get SSN verification status
 */
export async function getSSNRecord(address: string): Promise<SSNRecord | null> {
  return getAttestation(address, 'ssnAttestations');
}

/**
 * Submit SSN for verification
 */
export async function submitSSNVerification(
  address: string,
  ssn: string
): Promise<{ hash: string }> {
  // The identity pallet only exposes issuer-driven attestation
  // (`identity.issueSsn`). Self-submitted SSN proofs are not supported.
  void address; void ssn;
  await initializeApi();
  throw new Error(
    'SSN verification must be issued by an approved issuer (identity.issueSsn). ' +
      'Self-submission is not supported by the on-chain identity pallet.',
  );
}

/**
 * Get passport verification status
 */
export async function getPassportRecord(address: string): Promise<PassportRecord | null> {
  return getAttestation(address, 'passportAttestations');
}

/**
 * Submit passport for verification
 */
export async function submitPassportVerification(
  address: string,
  passportNumber: string,
  issuingCountry: string,
  issueDate: number,
  expiryDate: number
): Promise<{ hash: string }> {
  // Passport verification is issuer-driven on chain (`identity.issuePassport`).
  void address; void passportNumber; void issuingCountry; void issueDate; void expiryDate;
  await initializeApi();
  throw new Error(
    'Passport verification must be issued by an approved issuer (identity.issuePassport). ' +
      'Self-submission is not supported by the on-chain identity pallet.',
  );
}

/**
 * Get KYC status for an address
 */
export async function getKYCStatus(address: string): Promise<KYCStatus> {
  const api = await initializeApi();

  try {
    // Real chain path (verified against live spec-105 metadata):
    // identity.identityOf(AccountId) -> Option<IdentityId>
    // identity.ssnAttestations(IdentityId) -> Attestation { status, validUntil, graceUntil, ... }
    // KYC L1 = valid SSN attestation (pallet_belize_identity.kyc_state)
    const identityIdOpt = (await api.query.identity?.identityOf?.(address)) as any;
    if (identityIdOpt && identityIdOpt.isNone !== true) {
      const identityId = identityIdOpt.unwrap();
      const att = (await api.query.identity?.ssnAttestations?.(identityId)) as any;
      if (att && att.isNone !== true) {
        const data = att.unwrap();
        const statusStr = data.status?.toString() ?? '';
        const now = BigInt((await api.query.system.number()).toString());
        const validUntil = BigInt(data.validUntil?.toString?.() ?? '0');

        const isActive = statusStr.toLowerCase() === 'active';
        // kyc_state: Valid while now <= validUntil; Grace while now <= graceUntil
        const isWithinValidity = isActive && now <= validUntil;

        if (isActive) {
          return {
            level: isWithinValidity ? 'Full' : 'Basic',
            status: 'Verified',
            verificationDate: data.issuedAt?.toNumber?.() ?? Math.floor(Date.now() / 1000),
            documents: ['Social Security Attestation (on-chain)'],
            limits: null,
          };
        }
      }
    }
  } catch (error) {
    console.debug('Failed to fetch on-chain KYC status:', error);
  }

  return {
    level: 'None',
    status: 'None',
    documents: [],
    limits: null,
  };
}

/**
 * Resolve address to BelizeID name (for contact display)
 */
export async function resolveAddressToName(address: string): Promise<string | null> {
  const belizeID = await getBelizeID(address);
  return belizeID?.name || null;
}

/**
 * Check if address has completed KYC
 */
export async function isKYCVerified(address: string): Promise<boolean> {
  const kycStatus = await getKYCStatus(address);
  return kycStatus.status === 'Verified';
}

/**
 * Get account type from identity
 */
export async function getAccountType(address: string): Promise<'Citizen' | 'Business' | null> {
  const api = await initializeApi();

  try {
    // The chain has no account-type storage. Derive it from the registrations
    // that do exist rather than reading a non-existent `economy.accounts` map.
    if (api.query.payroll?.verifiedEmployers) {
      const employer: any = await api.query.payroll.verifiedEmployers(address);
      if (employer?.isTrue) return 'Business';
    }
    if (api.query.oracle?.merchantCategories) {
      const merchant: any = await api.query.oracle.merchantCategories(address);
      if (merchant && !merchant.isNone) return 'Business';
    }
    if (await resolveIdentityId(api, address)) return 'Citizen';

    return null;
  } catch (error) {
    console.error('Failed to derive account type:', error);
    return null;
  }
}
