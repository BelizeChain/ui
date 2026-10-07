const path = require('path');

/**
 * Path the wallet is mounted at. Defaults to the site root, which is how it is
 * deployed at wallet.belizechain.org. Set NEXT_PUBLIC_BASE_PATH=/wallet to build
 * the path-mounted variant instead (testnet.belizechain.org/wallet).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@belizechain/shared'],
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@polkadot/extension-dapp': false,
        '@polkadot/extension-inject': false,
      };
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/nawal/:path*',
        destination: 'http://ceiba-nawal:8080/:path*',
      },
      {
        source: '/api/proxy/kinich/:path*',
        destination: 'http://ceiba-kinich:8888/:path*',
      },
      {
        source: '/api/proxy/pakit/:path*',
        destination: 'http://ceiba-pakit:8001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
