/**
 * BelizeChain LandLedger Pallet Integration
 * Handles land titles, property records, and document storage proofs
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '../../lib/codec';

/**
 * Mirrors `landLedger.properties: u32 -> Property`.
 *
 * The pallet stores a title number and description as byte strings and a raw
 * (latitude, longitude) pair. There is no district, village, area unit, title
 * type, status or document hash — an earlier version of this file invented
 * every one of those, and read a `titles` map that does not exist.
 */
export interface LandTitle {
  /** u32 property id, rendered as a string (the storage key). */
  titleId: string;
  propertyId: number;
  owner: string;
  titleNumber: string;
  description: string;
  coordinates?: { latitude: number; longitude: number };
  areaSqm: number;
  propertyType: string;
  assessedValue: string;
  zoning: string;
  registeredAt: number;
  lastTransferred?: number;
  governmentVerified: boolean;
  surveyed: boolean;
  environmentalClearance: boolean;
  isTourismProperty: boolean;
  encumbrances: Encumbrance[];
}

/** Mirrors `PalletBelizeLandledgerEncumbrance` — a nested field of a property. */
export interface Encumbrance {
  encumbranceType: string;
  holder: string;
  amount?: string;
  description: string;
  active: boolean;
}

/**
 * A property document. The landLedger pallet stores no per-property document
 * map, so nothing on chain currently produces one of these.
 */
export interface PropertyDocument {
  documentId: string;
  titleId: string;
  type: string;
  name: string;
  documentHash: string;
  uploadedBy: string;
  uploadedAt: number;
  sizeBytes: number;
  isVerified: boolean;
  verifiedBy?: string;
}

/** Mirrors `landLedger.transferRecords: u32 -> TransferRecord`. */
export interface PropertyTransfer {
  transferId: string;
  propertyId: number;
  from: string;
  to: string;
  price: string;
  taxPaid: string;
  transferType: string;
  transferredAt: number;
  governmentApproved: boolean;
}

/** The chain's `TransferType` variant order — index into it, do not guess. */
const TRANSFER_TYPE_INDEX: Record<string, number> = {
  Sale: 0,
  Gift: 1,
  Inheritance: 2,
  GovernmentAcquisition: 3,
  Foreclosure: 4,
  CourtOrder: 5,
};

function toEncumbrances(data: any): Encumbrance[] {
  const list = data?.encumbrances;
  if (!Array.isArray(list)) return [];
  return list.map((e: any) => ({
    encumbranceType: String(e.encumbranceType),
    holder: String(e.holder),
    amount: e.amount != null ? formatBalance(String(e.amount)) : undefined,
    description: bytesToString(e.description),
    active: Boolean(e.active),
  }));
}

function toLandTitle(propertyId: number, data: any): LandTitle {
  const coords = Array.isArray(data.coordinates) ? data.coordinates : null;
  return {
    titleId: String(propertyId),
    propertyId,
    owner: String(data.owner ?? ''),
    titleNumber: bytesToString(data.titleNumber),
    description: bytesToString(data.description),
    coordinates: coords
      ? { latitude: Number(coords[0]), longitude: Number(coords[1]) }
      : undefined,
    areaSqm: Number(data.areaSqm ?? 0),
    propertyType: String(data.propertyType),
    assessedValue: formatBalance(String(data.assessedValue ?? '0')),
    zoning: String(data.zoning),
    registeredAt: Number(data.registeredAt ?? 0),
    lastTransferred: data.lastTransferred != null ? Number(data.lastTransferred) : undefined,
    governmentVerified: Boolean(data.governmentVerified),
    surveyed: Boolean(data.surveyed),
    environmentalClearance: Boolean(data.environmentalClearance),
    isTourismProperty: Boolean(data.isTourismProperty),
    encumbrances: toEncumbrances(data),
  };
}

/**
 * Get land title information
 */
export async function getLandTitle(titleId: string): Promise<LandTitle | null> {
  const api = await initializeApi();

  try {
    if (!api.query.landLedger?.properties) return null;
    const propertyId = Number.parseInt(titleId, 10);
    if (!Number.isFinite(propertyId)) return null;

    const raw: any = await api.query.landLedger.properties(propertyId);
    if (!raw || raw.isNone) return null;

    return toLandTitle(propertyId, raw.toJSON());
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
    if (!api.query.landLedger?.properties) return [];
    const entries = await api.query.landLedger.properties.entries();

    const userTitles: LandTitle[] = [];
    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data || String(data.owner) !== address) continue;
      const propertyId = Number(key?.args?.[0] ?? data.propertyId ?? 0);
      userTitles.push(toLandTitle(propertyId, data));
    }

    return userTitles;
  } catch (error) {
    console.warn('Failed to fetch on-chain land titles:', error);
  }

  // No fabricated titles. A bootstrap block used to return two "Founder" parcels
  // (2,500,000 and 4,200,000 DALLA, with invented document hashes) for two
  // hardcoded addresses. Land titles are a property claim and must never be
  // invented; an empty list is the honest answer for an address with no titles.
  return [];
}

/**
 * Get property documents for a title
 */
export async function getPropertyDocuments(titleId: string): Promise<PropertyDocument[]> {
  // The landLedger pallet has no per-property document map (`documents` does
  // not exist). Documents are pinned to Pakit and referenced off-chain; until
  // an on-chain index exists there is nothing to read here.
  void titleId;
  return [];
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
  await initializeApi();  // connection init; result unused

  try {
    const injector = await web3FromAddress(address);
    // No `registerDocument` extrinsic; per-document attachments are not
    // stored on chain. Use Pakit (IPFS) and pin the CID to the property's
    // off-chain metadata index.
    void titleId; void data; void injector;
    throw new Error(
      'Per-document registration is not supported by landLedger. Persist via Pakit and link off-chain.',
    );
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
    const priceInPlanck = price ? BigInt(Math.floor(parseFloat(price) * 1e12)) : 0n;
    // Real signature: transferProperty(propertyId:u32, newOwner, transferPrice:u128, transferTypeIndex:u8).
    // Currency selection is not represented on chain. The chain's TransferType
    // order is Sale, Gift, Inheritance, GovernmentAcquisition, Foreclosure,
    // CourtOrder — mapping 'Court' to 3 would have sent GovernmentAcquisition.
    void currency;
    const transferTypeIndex = TRANSFER_TYPE_INDEX[transferType] ?? 0;
    const propertyIdNum = Number.parseInt(titleId, 10);
    const tx = api.tx.landLedger.transferProperty(
      propertyIdNum,
      to,
      priceInPlanck.toString(),
      transferTypeIndex,
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
    if (!api.query.landLedger?.transferRecords) return [];
    const propertyId = Number.parseInt(titleId, 10);
    const entries = await api.query.landLedger.transferRecords.entries();

    const transfers: PropertyTransfer[] = [];
    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data) continue;
      if (Number.isFinite(propertyId) && Number(data.propertyId) !== propertyId) continue;

      transfers.push({
        transferId: String(data.transferId ?? key?.args?.[0] ?? ''),
        propertyId: Number(data.propertyId ?? 0),
        from: String(data.fromOwner ?? ''),
        to: String(data.toOwner ?? ''),
        price: formatBalance(String(data.transferPrice ?? '0')),
        taxPaid: formatBalance(String(data.taxPaid ?? '0')),
        transferType: String(data.transferType),
        transferredAt: Number(data.transferredAt ?? 0),
        governmentApproved: Boolean(data.governmentApproved),
      });
    }

    return transfers.sort((a, b) => b.transferredAt - a.transferredAt);
  } catch (error) {
    console.error('Failed to fetch transfer history:', error);
    return [];
  }
}

/**
 * Search land titles by location
 */
export async function searchLandByLocation(district: string, village?: string): Promise<LandTitle[]> {
  // `properties` stores a raw (latitude, longitude) pair and a zoning code.
  // It has no district or village field, so a location search cannot be
  // answered from chain state — the previous implementation compared fields
  // that never existed and therefore always returned an empty list.
  void district;
  void village;
  return [];
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
