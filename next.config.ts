import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Mark esbuild as external to avoid webpack bundling issues
  serverExternalPackages: ['esbuild'],
}

export default nextConfig
