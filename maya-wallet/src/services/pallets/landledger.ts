/**
 * BelizeChain LandLedger Pallet Integration
 * Handles land titles, property records, and document storage proofs
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface LandTitle {
  titleId: string;
  id?: string; // Alias for titleId (UI compatibility)
  parcelNumber: string;
  owner: string;
  name?: string; // Property name/description (UI compatibility)
  location: {
    district: string;
    village?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  area: number; // Square meters
  areaUnit: 'sqm' | 'acre' | 'hectare';
  titleType: 'Freehold' | 'Leasehold' | 'Government' | 'Crown';
  type?: string; // Alias for titleType (UI compatibility)
  value?: string; // Assessed property value (UI compatibility)
  environmental?: string; // Environmental status (UI compatibility)
  registrationDate: number;
  lastTransferDate?: number;
  encumbrances: Encumbrance[];
  documentHash: string; // Pakit storage proof
  status: 'Active' | 'Pending' | 'Disputed' | 'Transferred';
}

export interface Encumbrance {
  type: 'Mortgage' | 'Lien' | 'Easement' | 'Covenant' | 'Other';
  holder: string;
  amount?: string; // For mortgages/liens
  description: string;
  registeredDate: number;
  expiryDate?: number;
  status: 'Active' | 'Released';
}

export interface PropertyDocument {
  documentId: string;
  titleId: string;
  type: 'Title' | 'Survey' | 'Deed' | 'Mortgage' | 'Plan' | 'Other';
  name: string;
  documentHash: string; // Pakit IPFS/Arweave hash
  storageProof: string; // On-chain proof
  uploadedBy: string;
  uploaded?: string; // Formatted upload date (UI compatibility)
  uploadedAt: number;
  sizeBytes: number;
  size?: string; // Formatted size (UI compatibility)
  isVerified: boolean;
  verifiedBy?: string;
  metadata?: {
    description?: string;
    surveyor?: string;
    surveyDate?: number;
  };
}

export interface PropertyTransfer {
  transferId: string;
  id?: string; // Alias for transferId (UI compatibility)
  titleId: string;
  property?: string; // Property description (UI compatibility)
  from: string;
  to: string;
  price?: string; // DALLA or bBZD
  currency?: 'DALLA' | 'bBZD';
  transferDate: number;
  date?: string; // Formatted date (UI compatibility)
  registrationDate: number;
  stampDuty: string;
  transferType: 'Sale' | 'Gift' | 'Inheritance' | 'Partition' | 'Other';
  status: 'Pending' | 'Completed' | 'Rejected';
}

/**
 * Get land title information
 */
export async function getLandTitle(titleId: string): Promise<LandTitle | null> {
  const api = await initializeApi();
  
  try {
    const titleData: any = await api.query.landLedger?.titles(titleId);
    
    if (!titleData || titleData.isNone) {
      return null;
    }

    const data = titleData.unwrap();
    const encumbrances: any = await api.query.landLedger?.encumbrances(titleId);
    
    return {
      titleId,
      parcelNumber: data.parcelNumber.toString(),
      owner: data.owner.toString(),
      location: {
        district: data.district.toString(),
        village: data.village?.toString(),
        coordinates: data.coordinates?.toHuman() as any,
      },
      area: data.area.toNumber(),
      areaUnit: data.areaUnit.toString() as any,
      titleType: data.titleType.toString() as any,
      registrationDate: data.registrationDate.toNumber(),
      lastTransferDate: data.lastTransferDate?.toNumber(),
      encumbrances: encumbrances?.toHuman() as Encumbrance[] || [],
      documentHash: data.documentHash.toString(),
      status: data.status.toString() as any,
    };
  } catch (error) {
    console.error('Failed to fetch land title:', error);
    return null;
  }
}

/**
 * Get all land titles owned by an address
 */
export async function getUserLandTitles(address: string): Promise<LandTitle[]> {
  const api = await initializeApi();
  
  try {
    const allTitles: any = await api.query.landLedger?.titles.entries();
    
    if (!allTitles || allTitles.length === 0) {
      return [];
    }

    const userTitles = [];
    
    for (const [key, value] of allTitles) {
      const titleId = key.args[0].toString();
      const data = value.unwrap();
      
      if (data.owner.toString() === address) {
        const encumbrances: any = await api.query.landLedger?.encumbrances(titleId);
        
        userTitles.push({
          titleId,
          parcelNumber: data.parcelNumber.toString(),
          owner: data.owner.toString(),
          location: {
            district: data.district.toString(),
            village: data.village?.toString(),
            coordinates: data.coordinates?.toHuman() as any,
          },
          area: data.area.toNumber(),
          areaUnit: data.areaUnit.toString() as any,
          titleType: data.titleType.toString() as any,
          registrationDate: data.registrationDate.toNumber(),
          lastTransferDate: data.lastTransferDate?.toNumber(),
          encumbrances: encumbrances?.toHuman() as Encumbrance[] || [],
          documentHash: data.documentHash.toString(),
          status: data.status.toString() as any,
        });
      }
    }

    return userTitles;
  } catch (error) {
    console.error('Failed to fetch user land titles:', error);
    return [];
  }
}

/**
 * Get property documents for a title
 */
export async function getPropertyDocuments(titleId: string): Promise<PropertyDocument[]> {
  const api = await initializeApi();
  
  try {
    const documents: any = await api.query.landLedger?.documents.entries(titleId);
    
    if (!documents || documents.length === 0) {
      return [];
    }

    return documents.map(([key, value]: [any, any]) => {
      const documentId = key.args[1].toString();
      const data = value.unwrap();
      
      return {
        documentId,
        titleId,
        type: data.docType.toString() as any,
        name: data.name.toString(),
        documentHash: data.documentHash.toString(),
        storageProof: data.storageProof.toString(),
        uploadedBy: data.uploadedBy.toString(),
        uploadedAt: data.uploadedAt.toNumber(),
        sizeBytes: data.sizeBytes.toNumber(),
        isVerified: data.isVerified.toHuman(),
        verifiedBy: data.verifiedBy?.toString(),
        metadata: data.metadata?.toHuman() as any,
      };
    });
  } catch (error) {
    console.error('Failed to fetch property documents:', error);
    return [];
  }
}

/**
 * Register a property document with storage proof
 */
export async function registerDocument(
  address: string,
  titleId: string,
  data: {
    type: string;
    name: string;
    documentHash: string;
    storageProof: string;
    sizeBytes: number;
  }
): Promise<{ hash: string; documentId: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.landLedger.registerDocument(
      titleId,
      data.type,
      data.name,
      data.documentHash,
      data.storageProof,
      data.sizeBytes
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let documentId = '';
          
          // Extract document ID from events
          events.forEach(({ event }) => {
            if (api.events.landLedger?.DocumentRegistered?.is(event)) {
              const [, docId] = event.data;
              documentId = docId.toString();
            }
          });

          resolve({
            hash: txHash.toString(),
            documentId,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Register document failed:', error);
    throw error;
  }
}

/**
 * Initiate property transfer
 */
export async function initiatePropertyTransfer(
  address: string,
  titleId: string,
  to: string,
  price?: string,
  currency: 'DALLA' | 'bBZD' = 'DALLA',
  transferType: string = 'Sale'
): Promise<{ hash: string; transferId: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const priceInPlanck = price ? parseFloat(price) * Math.pow(10, 12) : 0;
    
    const tx = api.tx.landLedger.initiateTransfer(
      titleId,
      to,
      priceInPlanck,
      currency,
      transferType
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let transferId = '';
          
          // Extract transfer ID from events
          events.forEach(({ event }) => {
            if (api.events.landLedger?.TransferInitiated?.is(event)) {
              const [, id] = event.data;
              transferId = id.toString();
            }
          });

          resolve({
            hash: txHash.toString(),
            transferId,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Initiate transfer failed:', error);
    throw error;
  }
}

/**
 * Get property transfer history
 */
export async function getPropertyTransferHistory(titleId: string): Promise<PropertyTransfer[]> {
  const api = await initializeApi();
  
  try {
    const transfers: any = await api.query.landLedger?.transfers.entries(titleId);
    
    if (!transfers || transfers.length === 0) {
      return [];
    }

    return transfers.map(([key, value]: [any, any]) => {
      const transferId = key.args[1].toString();
      const data = value.unwrap();
      
      return {
        transferId,
        titleId,
        from: data.from.toString(),
        to: data.to.toString(),
        price: data.price ? formatBalance(data.price.toString()) : undefined,
        currency: data.currency?.toString() as any,
        transferDate: data.transferDate.toNumber(),
        registrationDate: data.registrationDate.toNumber(),
        stampDuty: formatBalance(data.stampDuty.toString()),
        transferType: data.transferType.toString() as any,
        status: data.status.toString() as any,
      };
    });
  } catch (error) {
    console.error('Failed to fetch transfer history:', error);
    return [];
  }
}

/**
 * Search land titles by location
 */
export async function searchLandByLocation(district: string, village?: string): Promise<LandTitle[]> {
  const api = await initializeApi();
  
  try {
    const allTitles: any = await api.query.landLedger?.titles.entries();
    
    if (!allTitles || allTitles.length === 0) {
      return [];
    }

    const matchingTitles = [];
    
    for (const [key, value] of allTitles) {
      const titleId = key.args[0].toString();
      const data = value.unwrap();
      
      const districtMatch = data.district.toString().toLowerCase() === district.toLowerCase();
      const villageMatch = !village || data.village?.toString().toLowerCase() === village.toLowerCase();
      
      if (districtMatch && villageMatch) {
        const encumbrances: any = await api.query.landLedger?.encumbrances(titleId);
        
        matchingTitles.push({
          titleId,
          parcelNumber: data.parcelNumber.toString(),
          owner: data.owner.toString(),
          location: {
            district: data.district.toString(),
            village: data.village?.toString(),
            coordinates: data.coordinates?.toHuman() as any,
          },
          area: data.area.toNumber(),
          areaUnit: data.areaUnit.toString() as any,
          titleType: data.titleType.toString() as any,
          registrationDate: data.registrationDate.toNumber(),
          lastTransferDate: data.lastTransferDate?.toNumber(),
          encumbrances: encumbrances?.toHuman() as Encumbrance[] || [],
          documentHash: data.documentHash.toString(),
          status: data.status.toString() as any,
        });
      }
    }

    return matchingTitles;
  } catch (error) {
    console.error('Failed to search land titles:', error);
    return [];
  }
}

/**
 * Download document from Pakit storage
 * Returns IPFS/Arweave gateway URL
 */
export function getDocumentDownloadUrl(documentHash: string, storage: 'ipfs' | 'arweave' = 'ipfs'): string {
  if (storage === 'ipfs') {
    return `https://ipfs.io/ipfs/${documentHash}`;
  } else {
    return `https://arweave.net/${documentHash}`;
  }
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
