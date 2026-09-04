/**
 * BelizeChain Moderation Pallet Service (Pallet 37)
 * Decentralized community content moderation, Nawal AI telemetry risk scoring,
 * and transparent content safety flags.
 */

import { initializeApi } from '../blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { FlagReason, ModerationRuling, ModerationItem } from '@belizechain/shared';

export const FLAG_REASON_LABELS: Record<number, { label: string; desc: string; key: FlagReason }> = {
  0: { label: 'Hate Speech', desc: 'Harassment, slurs, or discriminatory vitriol', key: 'HateSpeech' },
  1: { label: 'Misinformation', desc: 'Fabricated public claims or deceitful facts', key: 'Misinformation' },
  2: { label: 'Spam', desc: 'Unsolicited advertising, flood, or bot activity', key: 'Spam' },
  3: { label: 'Illegal Content', desc: 'Copyright violation, illicit material, or contraband', key: 'IllegalContent' },
  4: { label: 'Addictive Pattern', desc: 'Predatory engagement, dark patterns, or scam loops', key: 'AddictivePattern' },
};

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
 * Flag an on-chain content item (by 32-byte Blake2b hash).
 */
export async function flagContent(
  signerAddress: string,
  contentHash: string,
  reasonIndex: 0 | 1 | 2 | 3 | 4
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(signerAddress);

  const formattedHash = contentHash.startsWith('0x') ? contentHash : `0x${contentHash}`;
  const tx = api.tx.belizeModeration.flagContent(formattedHash, reasonIndex);

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
 * Fetch all items in the moderation queue and recently ruled content
 */
export async function getModerationItems(): Promise<ModerationItem[]> {
  try {
    const api = await initializeApi();
    if (!api.query.belizeModeration) return [];

    const itemsMap = new Map<string, ModerationItem>();

    // 1. Fetch queued items
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

    // 2. Fetch flag counts
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

    // 3. Fetch Nawal scores and rulings
    for (const [hash, item] of itemsMap.entries()) {
      try {
        const [scoreOpt, rulingOpt] = await Promise.all([
          api.query.belizeModeration.nawalAssessments(hash),
          api.query.belizeModeration.ruledContent(hash),
        ]);

        if ((scoreOpt as any).isSome) {
          item.nawalScore = Number((scoreOpt as any).unwrap().toString());
        }
        item.ruling = parseRuling(rulingOpt);
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
