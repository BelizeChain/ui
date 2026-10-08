/**
 * BelizeChain BNS Pallet Integration
 * Handles .bz domain registration, resolution, marketplace, and DAG-based hosting
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface Domain {
  name: string; // e.g., "myname.bz"
  owner: string;
  resolvedAddress?: string; // Main address resolution
  resolution?: string; // Alias for resolvedAddress (UI compatibility)
  registrationDate: number;
  expiryDate: number;
  expires?: string; // Formatted expiry date (UI compatibility)
  isPremium: boolean;
  status?: 'active' | 'pending' | 'expired'; // Registration status
  price?: string; // If listed for sale
  hosting?: 'DAG' | 'None'; // Hosting provider (DAG storage)
  ssl?: boolean; // SSL enabled
  metadata?: {
    description?: string;
    avatar?: string; // DAG block hash
    website?: string; // DAG manifest hash for hosted site
    social?: {
      twitter?: string;
      github?: string;
      telegram?: string;
    };
  };
  /** Free-form text records stored on chain (email, url, social handles, ...). */
  textRecords?: Array<{ key: string; value: string }>;
  /** Content hash of the active hosted site, if hosting is enabled. */
  hostedContentHash?: string;
}

export interface DomainListing {
  domain: string;
  name?: string; // Alias for domain (UI compatibility)
  seller: string;
  price: string; // DALLA
  currency: 'DALLA' | 'bBZD';
  category?: string; // Premium, Short, Numeric, etc.
  views?: number; // Marketplace views
  offers?: number; // Number of offers received
  listedAt: number;
  expiresAt?: number;
}

export interface HostedWebsite {
  domain: string;
  contentHash: string; // DAG manifest block hash
  siteHash: string; // Content hash for verification
  updatedAt: number;
  sizeBytes: number;
  isActive: boolean;
}

/**
 * Check domain availability
 */
export async function isDomainAvailable(domain: string): Promise<boolean> {
  const api = await initializeApi();

  try {
    const normalizedDomain = normalizeDomain(domain);
    // `bns.domains` does not exist on this runtime; the registry is
    // `domainRegistry`, keyed by the domain name. The old name made this query
    // throw, which the catch turned into `false` — reporting every name as taken.
    const domainData: any = await api.query.bns.domainRegistry(normalizedDomain);

    return domainData.isNone;
  } catch (error) {
    console.error('Failed to check domain availability:', error);
    return false;
  }
}

/**
 * Get domain information
 */
export async function getDomain(domain: string): Promise<Domain | null> {
  const api = await initializeApi();

  try {
    const normalizedDomain = normalizeDomain(domain);
    const [registryEntry, resolutionEntry]: any = await Promise.all([
      api.query.bns.domainRegistry(normalizedDomain),
      api.query.bns.domainResolution(normalizedDomain),
    ]);

    if (!registryEntry || registryEntry.isNone) {
      return null;
    }

    const record = registryEntry.unwrap();
    const resolution = resolutionEntry && !resolutionEntry.isNone ? resolutionEntry.unwrap() : null;
    const walletAddress = resolution?.walletAddress;

    return {
      name: normalizedDomain,
      owner: record.owner.toString(),
      resolvedAddress: walletAddress && !walletAddress.isNone ? walletAddress.unwrap().toString() : undefined,
      registrationDate: record.registeredAt?.toNumber() ?? 0,
      // The registry has no expiry field: a domain is held until `lockedUntil`,
      // which is optional. Report 0 when unset rather than inventing a date.
      expiryDate: record.lockedUntil?.isSome ? record.lockedUntil.unwrap().toNumber() : 0,
      isPremium: record.tier?.toString() === 'Premium',
      status: 'active',
      price: record.purchasePrice ? formatBalance(record.purchasePrice.toString()) : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch domain:', error);
    return null;
  }
}

/**
 * Register a new .bz domain
 */
export async function registerDomain(
  address: string,
  domain: string,
  years: number = 1
): Promise<{ hash: string; domain: string; cost: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);

    const tx = api.tx.bns.registerDomain(normalizedDomain, Math.min(255, Math.max(1, years)));

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let cost = '0.00';

          // Extract registration cost from events
          events.forEach(({ event }) => {
            if (api.events.bns?.DomainRegistered?.is(event)) {
              const [, , registrationCost] = event.data;
              cost = formatBalance(registrationCost.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            domain: normalizedDomain,
            cost,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Domain registration failed:', error);
    throw error;
  }
}

/**
 * Resolve domain to address
 */
export async function resolveDomain(domain: string): Promise<string | null> {
  const api = await initializeApi();

  try {
    // Resolution lives in its own map, not on the registry record.
    const normalizedDomain = normalizeDomain(domain);
    const entry: any = await api.query.bns.domainResolution(normalizedDomain);
    if (!entry || entry.isNone) {
      return null;
    }
    const wallet = entry.unwrap().walletAddress;
    return wallet && !wallet.isNone ? wallet.unwrap().toString() : null;
  } catch (error) {
    console.error('Failed to resolve domain:', error);
    return null;
  }
}

/**
 * Resolve address to primary domain
 */
export async function resolveAddress(address: string): Promise<string | null> {
  const api = await initializeApi();

  try {
    // There is no `primaryDomains` storage. `accountDomains` is the reverse index
    // (account -> domain names); there is no primary flag on record, so the first
    // entry is returned and no primary/preferred domain is implied.
    const owned: any = await api.query.bns.accountDomains(address);
    if (!owned || owned.isEmpty) {
      return null;
    }
    const names: any[] = owned.toArray ? owned.toArray() : [];
    return names.length > 0 ? names[0].toString() : null;
  } catch (error) {
    console.error('Failed to resolve address:', error);
    return null;
  }
}

/**
 * Set domain to resolve to an address
 */
export async function setDomainResolution(
  address: string,
  domain: string,
  targetAddress: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);

    // Real signature: setResolution(domainName, walletAddress?, contentHash?, metadata).
    const tx = api.tx.bns.setResolution(normalizedDomain, targetAddress, null, '0x');

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Set resolution failed:', error);
    throw error;
  }
}

/**
 * Set primary domain for an address (reverse resolution)
 */
export async function setPrimaryDomain(
  address: string,
  domain: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.setPrimaryDomain(normalizeDomain(domain));

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Set primary domain failed:', error);
    throw error;
  }
}

/** Clear the caller's reverse-resolution domain. */
export async function clearPrimaryDomain(address: string): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.clearPrimaryDomain();

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Clear primary domain failed:', error);
    throw error;
  }
}

/**
 * Read the reverse-resolution domain registered for an address, if any.
 *
 * `bns.primaryDomain` was added in the spec-110 `aa2b6ab` commit, so it is
 * absent from the runtime live today; the optional call yields `null` until the
 * upgrade ships.
 */
export async function getPrimaryDomain(address: string): Promise<string | null> {
  const api = await initializeApi();

  try {
    const entry: any = await api.query.bns.primaryDomain?.(address);
    if (!entry || entry.isNone) {
      return null;
    }
    return entry.unwrap().toString();
  } catch (error) {
    console.error('Failed to fetch primary domain:', error);
    return null;
  }
}

/**
 * Add or replace a text record on a domain you own.
 *
 * Real signature: setTextRecord(domainName, key, value). Keys are capped at 32
 * bytes and values at 128 bytes on chain.
 */
export async function setTextRecord(
  address: string,
  domain: string,
  key: string,
  value: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.setTextRecord(normalizeDomain(domain), key, value);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Set text record failed:', error);
    throw error;
  }
}

/** Remove a text record from a domain you own. */
export async function removeTextRecord(
  address: string,
  domain: string,
  key: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.removeTextRecord(normalizeDomain(domain), key);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Remove text record failed:', error);
    throw error;
  }
}

/** Read the text records stored against a domain. */
export async function getTextRecords(
  domain: string
): Promise<Array<{ key: string; value: string }>> {
  const api = await initializeApi();

  try {
    const entry: any = await api.query.bns.domainResolution(normalizeDomain(domain));
    if (!entry || entry.isNone) {
      return [];
    }
    const resolution = entry.unwrap();
    return (resolution.textRecords ?? []).map((record: any) => ({
      key: decodeText(record.key),
      value: decodeText(record.value),
    }));
  } catch (error) {
    console.error('Failed to fetch text records:', error);
    return [];
  }
}

/** Decode a `BoundedVec<u8>` text record field into a string. */
function decodeText(raw: unknown): string {
  const bytes = (raw as { toU8a?: () => Uint8Array })?.toU8a?.();
  if (!bytes) return String(raw ?? '');
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/**
 * Create a subdomain beneath a domain you own.
 *
 * Real signature: createSubdomain(parentDomain, subdomain, delegateTo).
 */
export async function createSubdomain(
  address: string,
  parentDomain: string,
  subdomain: string,
  delegateTo?: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.createSubdomain(
      normalizeDomain(parentDomain),
      subdomain,
      delegateTo ?? null,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Create subdomain failed:', error);
    throw error;
  }
}

/**
 * List domain for sale
 */
export async function listDomainForSale(
  address: string,
  domain: string,
  price: string,
  currency: 'DALLA' | 'bBZD' = 'DALLA',
  expiryDays?: number
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);
    const priceInPlanck = BigInt(Math.floor(parseFloat(price) * 1e12));
    // Real signature: listDomain(domainName, price, minOffer?, durationBlocks).
    // Translate expiryDays ≈ expiryDays * 14400 blocks (6s blocks). Currency
    // selection is not represented on chain (always native unit).
    void currency;
    const durationBlocks = (expiryDays ?? 30) * 14400;
    const tx = api.tx.bns.listDomain(
      normalizedDomain,
      priceInPlanck.toString(),
      null,
      durationBlocks,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('List domain failed:', error);
    throw error;
  }
}

/**
 * Get marketplace listings
 */
export async function getMarketplaceListings(limit: number = 100): Promise<DomainListing[]> {
  const api = await initializeApi();

  try {
    // Real storage is `domainListings` (the old `marketplaceListings` name does
    // not exist, so this always threw and fell through to the fabricated list).
    const listings: any = await api.query.bns.domainListings.entries();

    if (listings && listings.length > 0) {
      return listings
        .map(([key, value]: [any, any]) => {
          const domain = key.args[0].toString();
          const data = value.unwrap();

          return {
            domain,
            name: domain,
            seller: data.seller.toString(),
            price: formatBalance(data.price.toString()),
            currency: 'DALLA',
            listedAt: data.listedAt?.toNumber() || 0,
            expiresAt: data.expiresAt?.toNumber(),
          };
        })
        .slice(0, limit);
    }
  } catch (error) {
    console.warn('Failed to fetch marketplace listings:', error);
  }

  // No fabricated listings. This returned three invented domains with made-up
  // prices, view counts and offer counts, so an empty marketplace appeared busy.
  return [];
}

/**
 * Purchase domain from marketplace
 */
export async function purchaseDomain(
  address: string,
  domain: string,
  price: string
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);
    const priceInPlanck = BigInt(Math.floor(parseFloat(price) * 1e12));
    const tx = api.tx.bns.buyDomain(normalizedDomain, priceInPlanck.toString());

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Purchase domain failed:', error);
    throw error;
  }
}

/**
 * Host website on IPFS for a domain
 */
export async function hostWebsite(
  address: string,
  domain: string,
  contentHash: string,
  autoRenew: boolean = true
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);

    // Real signature: activateHosting(domainName, tier, contentHash:[u8;32], autoRenew).
    // The content hash is a raw 32-byte digest, not a CID string.
    const tier = 1;
    const tx = api.tx.bns.activateHosting(
      normalizedDomain,
      tier,
      toContentHash(contentHash),
      autoRenew,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Host website failed:', error);
    throw error;
  }
}

/**
 * Update the content hash of an already-active hosted site.
 *
 * Real signature: updateHostingContent(domainName, contentHash:[u8;32], description, sizeBytes).
 * Requires an active hosting subscription.
 */
export async function updateHostingContent(
  address: string,
  domain: string,
  contentHash: string,
  description: string = ''
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.bns.updateHostingContent(
      normalizeDomain(domain),
      toContentHash(contentHash),
      description,
      0,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Update hosting content failed:', error);
    throw error;
  }
}

/**
 * Convert a `0x`-prefixed 64-character hex string into the 32-byte array the
 * hosting extrinsics expect.
 */
function toContentHash(value: string): number[] {
  const hex = value.trim().replace(/^0x/, '');
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Content hash must be 32 bytes (0x followed by 64 hex characters).');
  }
  const bytes: number[] = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Get hosted website info
 */
export async function getHostedWebsite(domain: string): Promise<HostedWebsite | null> {
  const api = await initializeApi();

  try {
    const normalizedDomain = normalizeDomain(domain);
    const websiteData: any = await api.query.bns.hostedWebsites(normalizedDomain);

    if (!websiteData || websiteData.isNone) {
      return null;
    }

    const data = websiteData.unwrap();

    return {
      domain: normalizedDomain,
      contentHash: data.contentHash?.toHex?.() ?? data.contentHash?.toString() ?? '',
      siteHash: data.contentHash?.toHex?.() ?? '',
      updatedAt: data.lastPaymentAt?.toNumber() ?? 0,
      sizeBytes: data.dataSize?.toNumber() ?? 0,
      isActive: data.expiresAt?.toNumber?.() > 0,
    };
  } catch (error) {
    console.error('Failed to fetch hosted website:', error);
    return null;
  }
}

/**
 * Get domains owned by an address
 */
export async function getUserDomains(address: string): Promise<Domain[]> {
  const api = await initializeApi();

  try {
    // `bns.domains` does not exist. The reverse index is `accountDomains`
    // (account -> domain names); each name is then read from `domainRegistry`.
    const owned: any = await api.query.bns.accountDomains(address);
    if (!owned || owned.isEmpty) {
      return [];
    }

    const names: string[] = owned.toArray ? owned.toArray().map((n: any) => n.toString()) : [];
    const userList = await Promise.all(
      names.map(async (name): Promise<Domain | null> => {
        const entry: any = await api.query.bns.domainRegistry(name);
        if (!entry || entry.isNone) {
          return null;
        }
        const record = entry.unwrap();

        // Resolution is a separate map; read it so the UI can show the real
        // wallet address and text records rather than an empty shell.
        let resolvedAddress: string | undefined;
        let textRecords: Array<{ key: string; value: string }> = [];
        try {
          const resolutionEntry: any = await api.query.bns.domainResolution(name);
          if (resolutionEntry && resolutionEntry.isSome) {
            const resolution = resolutionEntry.unwrap();
            resolvedAddress = resolution.walletAddress?.isSome
              ? resolution.walletAddress.unwrap().toString()
              : undefined;
            textRecords = (resolution.textRecords ?? []).map((item: any) => ({
              key: decodeText(item.key),
              value: decodeText(item.value),
            }));
          }
        } catch {
          // Resolution is optional; ownership data is still valid without it.
        }

        // Hosting is yet another map; only an active subscription has an entry.
        let hostedContentHash: string | undefined;
        try {
          const hostingEntry: any = await api.query.bns.hostedWebsites(name);
          if (hostingEntry && hostingEntry.isSome) {
            const hosting = hostingEntry.unwrap();
            hostedContentHash = hosting.contentHash?.toHex?.() ?? undefined;
          }
        } catch {
          // Hosting is optional.
        }

        // `status` is intentionally omitted: the on-chain record carries no
        // status field, so reporting 'active' here would be a guess.
        return {
          name,
          owner: record.owner.toString(),
          resolvedAddress,
          registrationDate: record.registeredAt?.toNumber() ?? 0,
          expiryDate: record.lockedUntil?.isSome ? record.lockedUntil.unwrap().toNumber() : 0,
          isPremium: record.tier?.toString() === 'Premium',
          price: record.purchasePrice ? formatBalance(record.purchasePrice.toString()) : undefined,
          textRecords,
          hostedContentHash,
        };
      }),
    );

    return userList.filter((d): d is Domain => d !== null);
  } catch (error) {
    console.warn('Failed to fetch on-chain domains:', error);
  }

  // No fabricated domains. Two "Founder" domains (wicked.bz, ceiba.bz) used to be
  // returned for two hardcoded addresses.
  return [];
}

/**
 * Normalize domain name (lowercase, add .bz if missing)
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase().trim();
  if (!normalized.endsWith('.bz')) {
    normalized += '.bz';
  }
  return normalized;
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
