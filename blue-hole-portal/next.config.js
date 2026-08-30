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
      { protocol: 'https', hostname: 'api.belizechain.org' },
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
  async rewrites() {
    return [
      {
        source: '/api/proxy/nawal/:path*',
        destination: 'https://belizechain.org/api/nawal/:path*',
      },
      {
        source: '/api/proxy/kinich/:path*',
        destination: 'https://belizechain.org/api/kinich/:path*',
      },
      {
        source: '/api/proxy/pakit/:path*',
        destination: 'https://belizechain.org/api/pakit/:path*',
      },
    ];
  },
};

module.exports = nextConfig;