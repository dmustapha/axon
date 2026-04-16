'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import type { MarketSpec } from '@/types';
import { getCategory, MARKET_CACHE_TIME } from '@/lib/constants';

/**
 * Fetch market specs once from /api/info (cached 5min).
 */
export function useMarketSpecs() {
  return useQuery({
    queryKey: queryKeys.markets.specs,
    queryFn: async (): Promise<MarketSpec[]> => {
      const res = await fetch('/api/info');
      if (!res.ok) throw new Error('Failed to fetch market specs');
      const data = await res.json();
      return (data.markets || data).map((m: Record<string, unknown>) => ({
        symbol: m.symbol as string,
        category: getCategory(m.symbol as string),
        max_leverage: m.max_leverage as number,
        tick_size: String(m.tick_size),
        min_order_size: String(m.min_order_size),
        status: (m.status as string) || 'active',
      }));
    },
    staleTime: MARKET_CACHE_TIME,
    gcTime: MARKET_CACHE_TIME * 2,
  });
}
