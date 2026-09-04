/**
 * Blue Hole Portal — Moderation Pallet Integration (Pallet 37)
 * Content safety registry, human moderator reviews, and Nawal AI automated risk intelligence.
 */

import { connectionManager } from '@/lib/blockchain/connection';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { FlagReason, ModerationRuling, ModerationItem } from '@belizechain/shared';

function parseRuling(raw: any): ModerationRuling | null {
  if (!raw || raw.isNone || raw.isEmpty) return null;
  const val = raw.unwrap ? raw.unwrap() : raw;
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (['Cleared', 'Removed', 'Escalated'].includes(str)) {
    return str as ModerationRuling;
  }
  return null;
}

/**
 * Fetch all moderation queue items, flag counts, Nawal scores, and rulings
 */
export async function getModerationItems(): Promise<ModerationItem[]> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeModeration) return [];

    const itemsMap = new Map<string, ModerationItem>();

    // 1. Queued items
    const queueEntries = await api.query.belizeModeration.moderationQueue.entries();
    for (const [key, isQueuedCodec] of queueEntries) {
      const isQueued = (isQueuedCodec as any).isTrue || isQueuedCodec.toString() === 'true';
      if (isQueued) {
        const hash = (key.args[0] as any).toHex();
        itemsMap.set(hash, {
          contentHash: hash,
          flagCount: 0,
          isQueued: true,
          reasons: [],
        });
      }
    }

    // 2. Flag counts
    const countEntries = await api.query.belizeModeration.flagCounts.entries();
    for (const [key, countCodec] of countEntries) {
      const hash = (key.args[0] as any).toHex();
      const count = Number(countCodec.toString());
      const existing = itemsMap.get(hash) || {
        contentHash: hash,
        flagCount: 0,
        isQueued: false,
        reasons: [],
      };
      existing.flagCount = count;
      itemsMap.set(hash, existing);
    }

    // 3. Ruled items
    const ruledEntries = await api.query.belizeModeration.ruledContent.entries();
    for (const [key, rulingOpt] of ruledEntries) {
      const hash = (key.args[0] as any).toHex();
      const ruling = parseRuling(rulingOpt);
      const existing: ModerationItem = itemsMap.get(hash) || {
        contentHash: hash,
        flagCount: 0,
        isQueued: false,
        reasons: [],
      };
      existing.ruling = ruling;
      itemsMap.set(hash, existing);
    }

    // 4. Nawal scores
    for (const [hash, item] of itemsMap.entries()) {
      try {
        const scoreOpt = await api.query.belizeModeration.nawalAssessments(hash);
        if ((scoreOpt as any).isSome) {
          item.nawalScore = Number((scoreOpt as any).unwrap().toString());
        }
      } catch {
        // Ignore
      }
    }

    return Array.from(itemsMap.values());
  } catch (error) {
    console.error('Failed to get moderation items:', error);
    return [];
  }
}

/**
 * Get active list of authorized moderators
 */
export async function getModeratorSet(): Promise<string[]> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeModeration?.moderatorSet) return [];

    const mods = await api.query.belizeModeration.moderatorSet();
    return (mods as any).map((account: any) => account.toString());
  } catch (error) {
    console.error('Failed to get moderator set:', error);
    return [];
  }
}

/**
 * Review a queued content item
 * rulingIndex: 0=Cleared, 1=Removed, 2=Escalated
 */
export async function reviewContent(
  signerAddress: string,
  contentHash: string,
  rulingIndex: 0 | 1 | 2
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
  const tx = api.tx.belizeModeration.reviewContent(formattedHash, rulingIndex);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toHex() });
      }
    }).catch(reject);
  });
}

/**
 * Submit Nawal AI Risk Score (Oracle action)
 */
export async function submitNawalAssessment(
  signerAddress: string,
  contentHash: string,
  score: number
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
  const tx = api.tx.belizeModeration.submitNawalAssessment(formattedHash, score);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toHex() });
      }
    }).catch(reject);
  });
}
