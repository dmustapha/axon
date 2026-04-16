import { NextRequest, NextResponse } from 'next/server';
import { ELFA_BASE, elfaHeaders } from '@/lib/elfa';

// Cache responses for 5 min to conserve credits
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint param' }, { status: 400 });
  }

  // Exact endpoint allowlist to prevent SSRF
  const ALLOWED_ENDPOINTS = [
    '/v2/aggregations/trending-tokens',
    '/v2/aggregations/smart-engagement',
    '/v2/data/top-mentions',
    '/v2/data/keyword-mentions',
    '/v2/data/token-news',
    '/v2/data/trending-narratives',
  ];
  const normalizedEndpoint = endpoint.split('?')[0];
  if (!ALLOWED_ENDPOINTS.includes(normalizedEndpoint)) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const cacheKey = `${normalizedEndpoint}:${searchParams.toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Build query string excluding 'endpoint' param
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => { if (k !== 'endpoint') params.set(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${ELFA_BASE}${normalizedEndpoint}${qs}`, {
      headers: {
        ...elfaHeaders(),
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (res.ok) {
      if (cache.size >= 200) {
        let oldestKey: string | undefined;
        let oldestTs = Infinity;
        for (const [k, v] of cache) {
          if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
        }
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { data, ts: Date.now() });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[elfa]', e);
    return NextResponse.json({ error: 'Elfa API request failed' }, { status: 500 });
  }
}
