/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  swcMinify: true,
  transpilePackages: ['@belizechain/shared'],
  eslint: {
    // Don't fail build on ESLint warnings/errors (lint runs separately in CI)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors during builds
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Polkadot extension packages access `window` at module init time
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
};

module.exports = nextConfig;
