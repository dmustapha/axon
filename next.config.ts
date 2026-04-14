import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tweetnacl', 'bs58'],
};

export default nextConfig;
