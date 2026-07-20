import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@crux/core'],
  // better-sqlite3 is a native addon — keep it external so webpack never bundles it.
  serverExternalPackages: ['better-sqlite3'],
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
