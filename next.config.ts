import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tweetnacl', 'bs58', '@anthropic-ai/sdk'],
};

export default nextConfig;
