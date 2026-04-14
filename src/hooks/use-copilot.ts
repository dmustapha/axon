'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, TradeSuggestion } from '@/types';
import { useMarketPrices } from '@/hooks/use-market-data';

export function useCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { prices } = useMarketPrices();

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build market context from live prices
        const topPrices: Record<string, string> = {};
        for (const [sym, p] of prices) {
          if (['BTC', 'ETH', 'SOL'].includes(sym)) {
            topPrices[sym] = p.mark;
          }
        }

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, marketContext: topPrices }),
        });

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: data.content,
          tradeSuggestion: data.tradeSuggestion || undefined,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uuid(),
            role: 'assistant',
            content: 'Failed to reach AI copilot. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [prices],
  );

  return { messages, sendMessage, isLoading };
}
