/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Disable static error pages to avoid the Html import issue
    optimizePackageImports: ['react-icons'],
  },
};

export default nextConfig;
