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
    
    const tx = api.tx.bns.registerDomain(normalizedDomain, years);

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
    
    const tx = api.tx.bns.setResolution(normalizedDomain, targetAddress);

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
    const normalizedDomain = normalizeDomain(domain);
    
    const tx = api.tx.bns.setPrimaryDomain(normalizedDomain);

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
    const priceInPlanck = parseFloat(price) * Math.pow(10, 12);
    
    const tx = api.tx.bns.listForSale(
      normalizedDomain,
      priceInPlanck,
      currency,
      expiryDays
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
    const listings: any = await api.query.bns?.marketplaceListings.entries();
    
    if (!listings || listings.length === 0) {
      return [];
    }

    return listings
      .map(([key, value]: [any, any]) => {
        const domain = key.args[0].toString();
        const data = value.unwrap();
        
        return {
          domain,
          seller: data.seller.toString(),
          price: formatBalance(data.price.toString()),
          currency: data.currency.toString() as any,
          listedAt: data.listedAt.toNumber(),
          expiresAt: data.expiresAt?.toNumber(),
        };
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch marketplace listings:', error);
    return [];
  }
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
    const priceInPlanck = parseFloat(price) * Math.pow(10, 12);
    
    const tx = api.tx.bns.purchaseDomain(normalizedDomain, priceInPlanck);

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
    
    const tx = api.tx.bns.setWebsiteHosting(normalizedDomain, ipfsHash, siteHash);

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
    const allDomains: any = await api.query.bns?.domains.entries();
    
    if (!allDomains || allDomains.length === 0) {
      return [];
    }

    return allDomains
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
  } catch (error) {
    console.error('Failed to fetch user domains:', error);
    return [];
  }
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
