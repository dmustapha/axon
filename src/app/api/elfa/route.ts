import { NextRequest, NextResponse } from 'next/server';

const ELFA_BASE = 'https://api.elfa.ai';
const ELFA_KEY = process.env.ELFA_API_KEY || '';

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

  const cacheKey = `${endpoint}:${searchParams.toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Build query string excluding 'endpoint' param
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => { if (k !== 'endpoint') params.set(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${ELFA_BASE}${endpoint}${qs}`, {
      headers: {
        'x-elfa-api-key': ELFA_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (res.ok) {
      cache.set(cacheKey, { data, ts: Date.now() });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
