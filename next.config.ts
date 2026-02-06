import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during production builds (warnings won't block deploy)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled (important for type safety)
    ignoreBuildErrors: false,
  },
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['react-icons'],
  },
};

export default nextConfig;
