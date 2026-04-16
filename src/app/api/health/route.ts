import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    has_private_key: !!process.env.PACIFICA_PRIVATE_KEY,
    has_public_key: !!process.env.PACIFICA_PUBLIC_KEY,
    has_anthropic: !!process.env.ANTHROPIC_API_KEY,
    has_elfa: !!process.env.ELFA_API_KEY,
    rest_url: process.env.NEXT_PUBLIC_PACIFICA_REST_URL || 'default',
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || 'none',
  });
}
