/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@belizechain/shared'],
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Disable SSR for Polkadot.js packages that use browser APIs
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
