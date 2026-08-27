/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  // Disable PWA in development AND during production build (SSR issues)
  disable: process.env.NODE_ENV === 'development' || process.env.BUILDING === 'true',
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
  basePath: '/wallet',
  assetPrefix: '/wallet',
  output: 'standalone',
  transpilePackages: ['@belizechain/shared'],
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
  async rewrites() {
    return [
      {
        source: '/api/proxy/nawal/:path*',
        destination: 'http://100.81.45.25:8080/:path*',
      },
      {
        source: '/api/proxy/kinich/:path*',
        destination: 'http://100.81.45.25:8888/:path*',
      },
      {
        source: '/api/proxy/pakit/:path*',
        destination: 'http://100.81.45.25:8001/:path*',
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
