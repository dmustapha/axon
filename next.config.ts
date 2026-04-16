import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tweetnacl', 'bs58', '@anthropic-ai/sdk'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://test-ws.pacifica.fi https://test-api.pacifica.fi https://api.elfa.ai https://api.devnet.solana.com; img-src 'self' data:; font-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
