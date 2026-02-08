/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA in development AND during production build (SSR issues)
  disable: process.env.NODE_ENV === 'development' || process.env.BUILDING === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@belizechain/shared'],
  eslint: {
    // Don't fail build on ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors during builds (only show warnings)
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Polkadot extension packages access `window` / browser extension APIs at
      // module init time, which breaks Next.js SSR and static prerendering.
      // Replace them with empty stubs on the server side.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@polkadot/extension-dapp': false,
        '@polkadot/extension-inject': false,
      };
    }

    // Provide fallbacks for Node.js built-ins used by Polkadot libs
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

module.exports = withPWA(nextConfig);
