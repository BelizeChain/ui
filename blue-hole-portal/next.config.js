/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@belizechain/shared'],
  typescript: {
    // Don't fail build on TypeScript errors during builds
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
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

module.exports = nextConfig;
