'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, TradeSuggestion } from '@/types';
import { usePrices } from '@/hooks/use-prices';

export function useCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { prices } = usePrices();
  // Keep refs so sendMessage has stable identity
  const pricesRef = useRef(prices);
  pricesRef.current = prices;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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
        // Build market context from ALL live prices, sorted by volume (top 20)
        const currentPrices = pricesRef.current;
        const allPrices = Array.from(currentPrices.entries())
          .sort((a, b) => parseFloat(b[1].volume_24h) - parseFloat(a[1].volume_24h))
          .slice(0, 20);
        const marketContext: Record<string, { mark: string; volume_24h: string; funding: string; change_24h?: string }> = {};
        for (const [sym, p] of allPrices) {
          const yp = parseFloat(p.yesterday_price);
          const change = yp > 0 ? (((parseFloat(p.mark) - yp) / yp) * 100).toFixed(2) : '0.00';
          marketContext[sym] = { mark: p.mark, volume_24h: p.volume_24h, funding: p.funding, change_24h: change + '%' };
        }

        // Send conversation history (last 10 messages) for context
        const messagesSnapshot = messagesRef.current;
        const history = messagesSnapshot.slice(-10).map(m => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, marketContext, history }),
        });
        if (!res.ok) throw new Error('Copilot unavailable');

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: data.content,
          tradeSuggestion: data.tradeSuggestion || undefined,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error('[copilot]', err);
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
    [],
  );

  return { messages, sendMessage, isLoading };
}
