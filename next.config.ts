import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  // Fix for Playwright/Crawlee bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from bundling
      config.externals.push({
        playwright: 'commonjs playwright',
        crawlee: 'commonjs crawlee',
        '@playwright/test': 'commonjs @playwright/test',
        browserslist: 'commonjs browserslist',
      });
    }
    return config;
  },
  // Ensure we're not trying to run this in edge runtime
  serverExternalPackages: ['playwright', 'crawlee'],
};

export default nextConfig;
