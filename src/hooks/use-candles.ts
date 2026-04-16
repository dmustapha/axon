'use client';

import { useEffect, useState, useRef } from 'react';
import { useWS } from '@/providers/ws-provider';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function useCandles(symbol: string | null) {
  const { subscribe, unsubscribe, addListener } = useWS();
  const [candles, setCandles] = useState<CandleData[] | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const hasRealDataRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!symbol) return;

    subscribe('candle');

    // Set a 5s timeout — if no data arrives, give up (use synthetic)
    timeoutRef.current = setTimeout(() => {
      if (!hasRealDataRef.current) setCandles(null);
    }, 5000);

    const unsub = addListener((msg) => {
      if (msg.channel !== 'candle') return;

      const raw = msg.data;
      if (!raw) return;

      // Try to parse incoming candle data (format may vary)
      try {
        const items = Array.isArray(raw) ? raw : [raw];
        const parsed: CandleData[] = [];

        for (const item of items) {
          const c = item as Record<string, unknown>;
          // Skip other symbols
          if (c.symbol && c.symbol !== symbol) continue;

          const candle: CandleData = {
            time: Number(c.time ?? c.timestamp ?? c.t ?? 0),
            open: Number(c.open ?? c.o ?? 0),
            high: Number(c.high ?? c.h ?? 0),
            low: Number(c.low ?? c.l ?? 0),
            close: Number(c.close ?? c.c ?? 0),
            volume: Number(c.volume ?? c.v ?? 0),
          };

          if (candle.time) {
            parsed.push(candle);
          }
        }

        if (parsed.length > 0) {
          hasRealDataRef.current = true;
          setHasRealData(true);
          setCandles((prev) => {
            const existing = prev || [];
            const merged = [...existing, ...parsed];
            // Deduplicate by time and keep latest 200
            const byTime = new Map(merged.map(c => [c.time, c]));
            return Array.from(byTime.values()).sort((a, b) => a.time - b.time).slice(-200);
          });
        }
      } catch {
        // Malformed data — ignore
      }
    });

    return () => {
      unsubscribe('candle');
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCandles(null);
      hasRealDataRef.current = false;
      setHasRealData(false);
    };
  }, [symbol, subscribe, unsubscribe, addListener]);

  return { candles, hasRealData };
}
