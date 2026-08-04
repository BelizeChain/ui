const { ApiPromise, WsProvider } = require('@polkadot/api');

async function main() {
  const wsUrl = process.env.WS_URL || 'ws://100.81.45.25:9944';
  console.log(`Connecting to Ceiba Testnet at ${wsUrl}...`);
  
  try {
    const provider = new WsProvider(wsUrl);
    const api = await ApiPromise.create({ provider });

    const [chain, nodeName, nodeVersion, properties] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
      api.rpc.system.properties()
    ]);

    console.log(`\n✅ Successfully connected to ${chain}!`);
    console.log(`Node: ${nodeName} v${nodeVersion}`);
    console.log(`Token Symbol: ${properties.tokenSymbol.toHuman()}`);
    console.log(`Token Decimals: ${properties.tokenDecimals.toHuman()}`);

    const header = await api.rpc.chain.getHeader();
    console.log(`\nCurrent Block Height: #${header.number.toNumber()}`);

    console.log('\nTesting complete. The UI is ready to interact with the Ceiba Testnet.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to connect to Ceiba Testnet:', error.message);
    console.log('Ensure you are connected to Tailscale and the node is running.');
    process.exit(1);
  }
}

main();
