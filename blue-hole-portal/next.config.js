/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@belizechain/shared'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'belizechain.org' },
      { protocol: 'https', hostname: 'www.belizechain.org' },
      { protocol: 'https', hostname: 'testnet.belizechain.org' },
      { protocol: 'https', hostname: 'portal.belizechain.org' },
      { protocol: 'https', hostname: 'ipfs.belizechain.org' },
      { protocol: 'https', hostname: 'explorer.belizechain.org' },
      { protocol: 'https', hostname: 'wallet.belizechain.org' },
    ],
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
  // Server-side only: these run inside the compose network, so they address the
  // sibling containers directly. They previously pointed at
  // https://belizechain.org/api/*, which sent every proxied call out to the public
  // internet and back through the edge proxy, and hard-coupled the portal to the
  // apex hostname.
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