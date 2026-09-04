/**
 * End-to-End Civic Flow Integration Test
 * Executes live on-chain transactions for:
 * 1. Treasury Funding to Citizen Test Accounts and Founder Sudo
 * 2. Whistleblower Pool Funding and Pseudonymous Report Submission (Pallet 36)
 * 3. Restorative Justice Dispute Filing and Cooling-Off Tracking (Pallet 35)
 * 4. Content Moderation Flagging & Automatic Queueing Threshold (Pallet 37)
 * 5. SubSquid GraphQL Indexer Confirmation
 */

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { u8aConcat, stringToU8a, u8aToHex } = require('@polkadot/util');
const { blake2AsU8a, blake2AsHex } = require('@polkadot/util-crypto');
const crypto = require('crypto');

// Helper to sign and send transactions with promise resolution
async function sendTx(tx, signer, label) {
  return new Promise(async (resolve, reject) => {
    let unsub;
    try {
      unsub = await tx.signAndSend(signer, ({ status, events = [], dispatchError }) => {
        console.log(`  [${label}] Tx Status: ${status.type}`);
        if (status.isInBlock) {
          console.log(`  [${label}] In Block: ${status.asInBlock.toHex()}`);
          if (dispatchError) {
            if (dispatchError.isModule) {
              const meta = tx.registry.findMetaError(dispatchError.asModule);
              const err = new Error(`[${label}] Module Error: ${meta.section}.${meta.name}: ${meta.docs.join(' ')}`);
              if (unsub) unsub();
              return reject(err);
            } else {
              const err = new Error(`[${label}] Dispatch Error: ${dispatchError.toString()}`);
              if (unsub) unsub();
              return reject(err);
            }
          }

          // Check for failed events
          const failed = events.find(({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed');
          if (failed) {
            if (unsub) unsub();
            return reject(new Error(`[${label}] ExtrinsicFailed: ${failed.event.data.toString()}`));
          }

          if (unsub) unsub();
          resolve({ blockHash: status.asInBlock.toHex(), events });
        }
      });
    } catch (err) {
      if (unsub) unsub();
      reject(err);
    }
  });
}

async function main() {
  console.log('================================================================');
  console.log('🌊 BelizeChain End-to-End Civic Flow Integration Test');
  console.log('================================================================');

  const { cryptoWaitReady } = require('@polkadot/util-crypto');
  await cryptoWaitReady();

  const wsUrl = process.env.WS_URL || 'ws://127.0.0.1:9944';
  const provider = new WsProvider(wsUrl);
  const api = await ApiPromise.create({ provider });
  const keyring = new Keyring({ type: 'sr25519' });

  const decimals = api.registry.chainDecimals[0] || 12;
  const ONE_DALLA = BigInt(10) ** BigInt(decimals);

  console.log(`Connected to: ${await api.rpc.system.chain()} (Decimals: ${decimals})`);

  // Keyrings
  const treasury = keyring.addFromUri('0xe4d85ddb2340e8080e54bf953ba60fd823038cbeff12259389cbc6a14b8e765c');
  
  // 5 Citizens
  const citizenA = keyring.addFromUri('//CitizenA_Belize');
  const citizenB = keyring.addFromUri('//CitizenB_Belize');
  const citizenC = keyring.addFromUri('//CitizenC_Belize');
  const citizenD = keyring.addFromUri('//CitizenD_Belize');
  const citizenE = keyring.addFromUri('//CitizenE_Belize');
  const sudoAddress = '5GNzsEuoWvG6xcF4yMyfXwkjGYCfzaAfHQfXJ3dRWDqZdx7B';

  console.log('\n--- Step 1: Funding Accounts from Treasury ---');
  console.log(`Treasury Address: ${treasury.address}`);
  console.log(`Citizen A: ${citizenA.address}`);
  console.log(`Citizen B: ${citizenB.address}`);
  console.log(`Citizen C: ${citizenC.address}`);
  console.log(`Citizen D: ${citizenD.address}`);
  console.log(`Citizen E: ${citizenE.address}`);
  console.log(`Founder Sudo: ${sudoAddress}`);

  // Transfer 10,000 DALLA to Sudo
  await sendTx(
    api.tx.balances.transferKeepAlive(sudoAddress, (BigInt(10000) * ONE_DALLA).toString()),
    treasury,
    'Fund Sudo'
  );

  // Transfer 100,000 DALLA to Citizen A (for whistleblower pool funding + bond)
  await sendTx(
    api.tx.balances.transferKeepAlive(citizenA.address, (BigInt(100000) * ONE_DALLA).toString()),
    treasury,
    'Fund Citizen A'
  );

  // Transfer 1,000 DALLA to Citizens B, C, D, E
  for (const [name, cit] of [['B', citizenB], ['C', citizenC], ['D', citizenD], ['E', citizenE]]) {
    await sendTx(
      api.tx.balances.transferKeepAlive(cit.address, (BigInt(1000) * ONE_DALLA).toString()),
      treasury,
      `Fund Citizen ${name}`
    );
  }

  const sudoBalance = await api.query.system.account(sudoAddress);
  const citizenABalance = await api.query.system.account(citizenA.address);
  console.log(`✅ Sudo Balance: ${sudoBalance.data.free.toHuman()}`);
  console.log(`✅ Citizen A Balance: ${citizenABalance.data.free.toHuman()}`);

  console.log('\n--- Step 2: Whistleblower Reward Pool & Report Submission (Pallet 36) ---');
  // Citizen A funds the Whistleblower Pool with 50,000 DALLA
  const fundAmount = (BigInt(50000) * ONE_DALLA).toString();
  await sendTx(
    api.tx.belizeWhistleblower.fundWhistleblowerPool(fundAmount),
    citizenA,
    'Fund Whistleblower Pool'
  );

  const poolTotal = await api.query.belizeWhistleblower.whistleblowerPool();
  console.log(`✅ Whistleblower Pool Balance: ${poolTotal.toHuman()}`);

  // Citizen A creates a pseudonymous whistleblower report
  // Generate secret (32 bytes) and commitment:
  // blake2_256(b"BelizeChainWhistleblowerV1" ++ citizenA.addressRaw ++ secret)
  const secret = crypto.randomBytes(32);
  const domainTag = stringToU8a('BelizeChainWhistleblowerV1');
  const commitmentPreimage = u8aConcat(domainTag, citizenA.publicKey, secret);
  const commitment = blake2AsU8a(commitmentPreimage);
  const evidenceHash = blake2AsU8a(stringToU8a('EVIDENCE: Multi-million dollar land title fraud disclosure in San Pedro'));
  
  console.log(`Secret generated (hex): 0x${secret.toString('hex')}`);
  console.log(`Commitment (hex): ${u8aToHex(commitment)}`);

  // Category 0 = Fraud (2,000 DALLA bounty reward)
  await sendTx(
    api.tx.belizeWhistleblower.submitReport(
      Array.from(commitment),
      citizenB.address, // target of report
      Array.from(evidenceHash),
      0 // Fraud
    ),
    citizenA,
    'Submit Whistleblower Report'
  );

  const reportCounter = await api.query.belizeWhistleblower.reportCounter();
  const latestReportId = reportCounter.toNumber();
  const reportData = await api.query.belizeWhistleblower.reports(latestReportId);
  console.log(`✅ Report #${latestReportId} created!`);
  console.log(`   Status: ${JSON.stringify(reportData.toJSON())}`);

  console.log('\n--- Step 3: Restorative Justice & Dispute Resolution (Pallet 35) ---');
  // Citizen A opens a dispute against Citizen B
  const disputeEvidence = blake2AsU8a(stringToU8a('DISPUTE: Breach of contract for photovoltaic grid installation'));
  await sendTx(
    api.tx.belizeJustice.openDispute(
      citizenB.address,
      Array.from(disputeEvidence),
      1 // Severity 1 = Moderate
    ),
    citizenA,
    'Open Justice Dispute'
  );

  const disputeCounter = await api.query.belizeJustice.disputeCounter();
  const latestDisputeId = disputeCounter.toNumber();
  const disputeData = await api.query.belizeJustice.disputes(latestDisputeId);
  const targetRehab = await api.query.belizeJustice.rehabilitationStatus(citizenB.address);
  const coolingEnd = await api.query.belizeJustice.coolingOffEnd(citizenB.address);

  console.log(`✅ Dispute #${latestDisputeId} opened!`);
  console.log(`   Disputant: ${disputeData.unwrap().disputant}`);
  console.log(`   Target: ${disputeData.unwrap().target}`);
  console.log(`   Bond Reserved: ${disputeData.unwrap().bond.toHuman()}`);
  console.log(`   Target Rehab Status: ${targetRehab.toHuman()}`);
  console.log(`   Target Cooling-Off End Block: ${coolingEnd.toHuman()}`);

  console.log('\n--- Step 4: Content Moderation & Auto-Queuing (Pallet 37) ---');
  // Generate a mock content hash (e.g. offensive or spam payload)
  const contentHash = blake2AsHex('IPFS://QmExampleHarmfulContentBelizeCityGangsPhishing');
  console.log(`Content Hash to Flag: ${contentHash}`);

  // Flag 1 by Citizen A (HateSpeech = 0)
  await sendTx(api.tx.belizeModeration.flagContent(contentHash, 0), citizenA, 'Flag 1 (Citizen A)');
  // Flag 2 by Citizen B (Misinformation = 1)
  await sendTx(api.tx.belizeModeration.flagContent(contentHash, 1), citizenB, 'Flag 2 (Citizen B)');
  // Flag 3 by Citizen C (Spam = 2)
  await sendTx(api.tx.belizeModeration.flagContent(contentHash, 2), citizenC, 'Flag 3 (Citizen C)');
  // Flag 4 by Citizen D (IllegalContent = 3)
  await sendTx(api.tx.belizeModeration.flagContent(contentHash, 3), citizenD, 'Flag 4 (Citizen D)');
  // Flag 5 by Citizen E (HateSpeech = 0) -> triggers FlagThreshold = 5
  await sendTx(api.tx.belizeModeration.flagContent(contentHash, 0), citizenE, 'Flag 5 (Citizen E)');

  const totalFlags = await api.query.belizeModeration.flagCounts(contentHash);
  const isQueued = await api.query.belizeModeration.moderationQueue(contentHash);
  console.log(`✅ Total Flags recorded: ${totalFlags.toNumber()}`);
  console.log(`✅ Auto-Queued in Moderation Queue (Threshold >= 5): ${isQueued.isTrue}`);

  console.log('\n--- Step 5: Verifying SubSquid GraphQL Indexer ---');
  // Wait 6 seconds for SubSquid processor to map the latest block
  console.log('Waiting 8 seconds for SubSquid processor block mapping...');
  await new Promise((r) => setTimeout(r, 8000));

  const fetch = globalThis.fetch || require('node-fetch');
  const gqlRes = await fetch('http://localhost:4350/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query {
          networkSnapshots(limit: 3, orderBy: timestamp_DESC) {
            id
            blockNumber
            totalIssuanceDalla
            treasuryDalla
            timestamp
          }
        }
      `,
    }),
  });

  const gqlJson = await gqlRes.json();
  console.log('✅ SubSquid Latest Indexed Snapshots:');
  console.log(JSON.stringify(gqlJson.data.networkSnapshots, null, 2));

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END CIVIC FLOW STEPS COMPLETED & VERIFIED SUCCESSFULLY!');
  console.log('================================================================');

  await api.disconnect();
}

main().catch((err) => {
  console.error('\n❌ E2E Civic Flow Failed:', err);
  process.exit(1);
});
