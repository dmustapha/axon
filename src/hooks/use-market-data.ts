'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWS } from '@/providers/ws-provider';
import { queryKeys } from '@/lib/query-client';
import type { MarketPrice, MarketSpec, MarketCategory } from '@/types';
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

/**
 * Real-time price data from Pacifica WebSocket.
 * Subscribes to "prices" source on mount, updates every ~3s.
 */
export function useMarketPrices() {
  const { subscribe, unsubscribe, addListener } = useWS();
  const [prices, setPrices] = useState<Map<string, MarketPrice>>(new Map());
  const prevRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    subscribe('prices');

    const unsub = addListener((msg) => {
      if (msg.channel !== 'prices') return;
      const arr = msg.data as MarketPrice[];
      if (!Array.isArray(arr)) return;

      setPrices((prev) => {
        const next = new Map(prev);
        for (const p of arr) {
          next.set(p.symbol, p);
        }
        return next;
      });

      // Track previous prices for flash animation
      for (const p of arr) {
        prevRef.current.set(p.symbol, p.mark);
      }
    });

    return () => {
      unsubscribe('prices');
      unsub();
    };
  }, [subscribe, unsubscribe, addListener]);

  const getPriceDirection = useCallback(
    (symbol: string, currentMark: string): 'up' | 'down' | 'none' => {
      const prev = prevRef.current.get(symbol);
      if (!prev) return 'none';
      const c = parseFloat(currentMark);
      const p = parseFloat(prev);
      if (c > p) return 'up';
      if (c < p) return 'down';
      return 'none';
    },
    [],
  );

  return { prices, getPriceDirection };
}
