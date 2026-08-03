import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  await cryptoWaitReady();
  const wsProvider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({ provider: wsProvider });

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');
  
  console.log('Seeding local blockchain for Maya Wallet E2E tests...');

  try {
    // We only need some mock state so that UI pages load without 'empty' text
    const call = api.tx.system.remark('Test Proposal');
    const deposit = 1000000000000n; // 1 DALLA
    console.log('Submitting proposal...');
    await new Promise((resolve) => {
        api.tx.democracy.propose(call.toHex(), deposit)
        .signAndSend(alice, ({ status }) => {
            if (status.isInBlock) resolve(true);
        });
    });

    console.log('✅ Local chain seeded successfully!');
  } catch (error) {
    console.error('Failed to seed:', error);
  } finally {
    process.exit(0);
  }
}

main();
