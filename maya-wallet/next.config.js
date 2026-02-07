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
  // Note: output: 'export' disabled temporarily to debug location error
  // output: 'export',
  // images: {
  //   unoptimized: true,
  // },
};

module.exports = withPWA(nextConfig);
