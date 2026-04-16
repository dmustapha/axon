'use client';

import { useEffect, useState, useRef } from 'react';
import { useWS } from '@/providers/ws-provider';

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread: number;
  spreadPct: number;
  midPrice: number;
}

const DEPTH_LEVELS = 12;

export function useOrderbook(symbol: string | null) {
  const { subscribe, unsubscribe, addListener } = useWS();
  const [data, setData] = useState<OrderbookData | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!symbol) return;

    subscribe('orderbook');

    const unsub = addListener((msg) => {
      if (msg.channel !== 'orderbook') return;

      const raw = msg.data as Record<string, unknown>;
      if (!raw) return;

      // Dev-only: log first orderbook message shape for WS format verification
      if (process.env.NODE_ENV === 'development' && !loggedRef.current) {
        loggedRef.current = true;
        console.info('[Orderbook] WS data shape:', JSON.stringify(raw).slice(0, 500));
      }

      // Require symbol match — skip data for other symbols
      if (raw.symbol && raw.symbol !== symbol) return;

      // Try multiple response shapes: array of [price, size], or objects with {price, size}
      const rawBids = (raw.bids || []) as Array<[string, string] | { price: string; size: string }>;
      const rawAsks = (raw.asks || []) as Array<[string, string] | { price: string; size: string }>;

      const parseLevels = (levels: typeof rawBids): OrderbookLevel[] => {
        const result: OrderbookLevel[] = [];
        let total = 0;
        for (const level of levels.slice(0, DEPTH_LEVELS)) {
          const p = Array.isArray(level) ? parseFloat(level[0]) : parseFloat(level.price);
          const s = Array.isArray(level) ? parseFloat(level[1]) : parseFloat(level.size);
          if (isNaN(p) || isNaN(s)) continue;
          total += s;
          result.push({ price: p, size: s, total });
        }
        return result;
      };

      const bids = parseLevels(rawBids);
      const asks = parseLevels(rawAsks);

      if (!bids.length && !asks.length) return;

      const bestBid = bids[0]?.price || 0;
      const bestAsk = asks[0]?.price || 0;
      const spread = bestAsk - bestBid;
      const midPrice = (bestBid + bestAsk) / 2;
      const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : 0;

      setData({ bids, asks, spread, spreadPct, midPrice });
    });

    return () => {
      unsubscribe('orderbook');
      unsub();
      setData(null);
    };
  }, [symbol, subscribe, unsubscribe, addListener]);

  return data;
}
