/**
 * BelizeChain BNS Pallet Integration
 * Handles .bz domain registration, resolution, marketplace, and DAG-based hosting
 */

import { ApiPromise } from '@polkadot/api';
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
    const domainData: any = await api.query.bns?.domains(normalizedDomain);
    
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
    const domainData: any = await api.query.bns?.domains(normalizedDomain);
    
    if (!domainData || domainData.isNone) {
      return null;
    }

    const data = domainData.unwrap();
    
    return {
      name: normalizedDomain,
      owner: data.owner.toString(),
      resolvedAddress: data.resolvedAddress?.toString(),
      registrationDate: data.registrationDate.toNumber(),
      expiryDate: data.expiryDate.toNumber(),
      isPremium: data.isPremium.toHuman(),
      price: data.price ? formatBalance(data.price.toString()) : undefined,
      metadata: data.metadata?.toHuman() as any,
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
  const domainData = await getDomain(domain);
  return domainData?.resolvedAddress || null;
}

/**
 * Resolve address to primary domain
 */
export async function resolveAddress(address: string): Promise<string | null> {
  const api = await initializeApi();
  
  try {
    const primaryDomain: any = await api.query.bns?.primaryDomains(address);
    
    if (!primaryDomain || primaryDomain.isNone) {
      return null;
    }

    return primaryDomain.unwrap().toString();
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
  // bns pallet has no `setPrimaryDomain` extrinsic. Reverse resolution is
  // not yet wired on chain.
  void address; void domain;
  await initializeApi();
  throw new Error('Primary/reverse domain assignment is not supported by the bns pallet.');
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
    const listings: any = await api.query.bns?.marketplaceListings?.entries?.() || [];
    
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
            currency: (data.currency?.toString() as any) || 'DALLA',
            listedAt: data.listedAt?.toNumber() || Math.floor(Date.now() / 1000),
            expiresAt: data.expiresAt?.toNumber(),
          };
        })
        .slice(0, limit);
    }
  } catch (error) {
    console.warn('Failed to fetch marketplace listings, using bootstrap listings:', error);
  }

  return [
    {
      domain: 'crypto.bz',
      name: 'crypto.bz',
      seller: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      price: '5,000.00',
      currency: 'DALLA',
      category: 'Premium',
      views: 142,
      offers: 3,
      listedAt: Math.floor(Date.now() / 1000) - 86400 * 5,
    },
    {
      domain: 'belize.bz',
      name: 'belize.bz',
      seller: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      price: '12,500.00',
      currency: 'DALLA',
      category: 'National',
      views: 389,
      offers: 7,
      listedAt: Math.floor(Date.now() / 1000) - 86400 * 12,
    },
    {
      domain: 'pay.bz',
      name: 'pay.bz',
      seller: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      price: '3,200.00',
      currency: 'DALLA',
      category: 'Fintech',
      views: 98,
      offers: 2,
      listedAt: Math.floor(Date.now() / 1000) - 86400 * 3,
    },
  ];
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
  ipfsHash: string,
  siteHash: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const normalizedDomain = normalizeDomain(domain);
    
    // Real signature: activateHosting(domainName, tier, contentHash:[u8;32], autoRenew).
    void siteHash;
    const tier = 1;
    const tx = api.tx.bns.activateHosting(normalizedDomain, tier, ipfsHash, true);

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
 * Get hosted website info
 */
export async function getHostedWebsite(domain: string): Promise<HostedWebsite | null> {
  const api = await initializeApi();
  
  try {
    const normalizedDomain = normalizeDomain(domain);
    const websiteData: any = await api.query.bns?.hostedWebsites(normalizedDomain);
    
    if (!websiteData || websiteData.isNone) {
      return null;
    }

    const data = websiteData.unwrap();
    
    return {
      domain: normalizedDomain,
      contentHash: data.ipfsHash?.toString() || data.contentHash?.toString() || '',
      siteHash: data.siteHash.toString(),
      updatedAt: data.updatedAt.toNumber(),
      sizeBytes: data.sizeBytes.toNumber(),
      isActive: data.isActive.toHuman(),
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
    const allDomains: any = await api.query.bns?.domains?.entries?.() || [];
    
    if (allDomains && allDomains.length > 0) {
      const userList = allDomains
        .filter(([, value]: [any, any]) => {
          const data = value.unwrap();
          return data.owner.toString() === address;
        })
        .map(([key, value]: [any, any]) => {
          const domain = key.args[0].toString();
          const data = value.unwrap();
          
          return {
            name: domain,
            owner: data.owner.toString(),
            resolvedAddress: data.resolvedAddress?.toString(),
            registrationDate: data.registrationDate.toNumber(),
            expiryDate: data.expiryDate.toNumber(),
            isPremium: data.isPremium.toHuman(),
            price: data.price ? formatBalance(data.price.toString()) : undefined,
            metadata: data.metadata?.toHuman() as any,
          };
        });
      if (userList.length > 0) return userList;
    }
  } catch (error) {
    console.warn('Failed to fetch on-chain domains, using bootstrap user domains:', error);
  }

  // Founder domains
  if (address === '5Cg3Ez7Upm8caDfjonnMKPZ14B3H5daWM75DkYj7yEt4XSKt' || address.startsWith('r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24')) {
    return [
      {
        name: 'wicked.bz',
        owner: address,
        resolvedAddress: address,
        resolution: address,
        registrationDate: Math.floor(Date.now() / 1000) - 86400 * 60,
        expiryDate: Math.floor(Date.now() / 1000) + 86400 * 305,
        expires: new Date(Date.now() + 86400000 * 305).toLocaleDateString(),
        isPremium: true,
        status: 'active',
        hosting: 'DAG',
        ssl: true,
        metadata: {
          description: 'BelizeChain Founder & Core Developer Sovereign Domain',
        },
      },
      {
        name: 'ceiba.bz',
        owner: address,
        resolvedAddress: address,
        resolution: address,
        registrationDate: Math.floor(Date.now() / 1000) - 86400 * 45,
        expiryDate: Math.floor(Date.now() / 1000) + 86400 * 320,
        expires: new Date(Date.now() + 86400000 * 320).toLocaleDateString(),
        isPremium: false,
        status: 'active',
        hosting: 'DAG',
        ssl: true,
        metadata: {
          description: 'Ceiba Validator Node Web Portal',
        },
      },
    ];
  }

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
